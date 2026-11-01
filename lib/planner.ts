import type { Project, Plan, Assignment, Garment, Look } from "./model";
import { pairKey, money } from "./model";

function overlap(p: Project, a: string[], b: string[]) {
  return a.some((sa) =>
    b.some((sb) => {
      const x = p.scenes.find((s) => s.id === sa)!;
      const y = p.scenes.find((s) => s.id === sb)!;
      return x.start < y.end && y.start < x.end;
    }),
  );
}
export function conflict(
  p: Project,
  garment: Garment,
  a: Assignment,
  b: Assignment,
) {
  if (a.actorId === b.actorId) return false;
  return !garment.allowHandoff || overlap(p, a.scenes, b.scenes);
}
export function exclusion(p: Project, look: Look, g: Garment): string | null {
  if (!g.available) return "Item is unavailable";
  if (!g.eligibleActors.includes(look.actorId))
    return "Wearer eligibility has not been confirmed";
  if (!look.scenes.every((s) => g.availableScenes.includes(s)))
    return "Item is unavailable for a required scene";
  const decision = p.decisions[pairKey(look.id, g.id)];
  if (decision?.status === "rejected") return "Look was rejected";
  if (decision?.status === "flagged")
    return "Preview needs review; garment decision is unresolved";
  if (decision?.status !== "approved") return "Appearance review is pending";
  return null;
}
export function solve(p: Project): Plan {
  const excluded: Plan["excluded"] = [];
  const candidates = p.looks.map((look) => ({
    look,
    garments: look.candidates
      .map((id) => p.garments.find((g) => g.id === id)!)
      .filter((g) => {
        const reason = exclusion(p, look, g);
        if (reason) excluded.push({ lookId: look.id, garmentId: g.id, reason });
        return !reason;
      }),
  }));
  const preferredConflicts: string[] = [];
  for (let i = 0; i < p.looks.length; i++)
    for (let j = i + 1; j < p.looks.length; j++) {
      const a = p.looks[i],
        b = p.looks[j];
      if (a.preferred !== b.preferred) continue;
      const g = p.garments.find((x) => x.id === a.preferred)!;
      if (
        conflict(
          p,
          g,
          {
            lookId: a.id,
            actorId: a.actorId,
            garmentId: g.id,
            scenes: a.scenes,
          },
          {
            lookId: b.id,
            actorId: b.actorId,
            garmentId: g.id,
            scenes: b.scenes,
          },
        )
      ) {
        const shared = a.scenes
          .filter((x) => b.scenes.includes(x))
          .map((id) => p.scenes.find((s) => s.id === id)!.name);
        preferredConflicts.push(
          `${g.name} is preferred for both ${p.actors.find((x) => x.id === a.actorId)!.name} and ${p.actors.find((x) => x.id === b.actorId)!.name}${shared.length ? ` in ${shared.join(", ")}` : "; a handoff has not been authorized"}. There is only one physical item.`,
        );
      }
    }
  const blockers = candidates
    .filter((x) => !x.garments.length)
    .map(
      (x) =>
        `${p.actors.find((a) => a.id === x.look.actorId)!.name} has no approved, available garment for ${x.look.name.toLowerCase()}.`,
    );
  let best: Assignment[] | null = null;
  let bestCents = Infinity;
  let bestPenalty = Infinity;
  let evaluated = 0;
  const sorted = [...candidates].sort(
    (a, b) => a.garments.length - b.garments.length,
  );
  function visit(
    i: number,
    assignments: Assignment[],
    cost: number,
    penalty: number,
  ) {
    if (cost > bestCents) return;
    if (i === sorted.length) {
      evaluated++;
      if (cost < bestCents || (cost === bestCents && penalty < bestPenalty)) {
        best = [...assignments];
        bestCents = cost;
        bestPenalty = penalty;
      }
      return;
    }
    const { look, garments } = sorted[i];
    for (const g of garments) {
      const assignment = {
        lookId: look.id,
        actorId: look.actorId,
        garmentId: g.id,
        scenes: look.scenes,
      };
      const existing = assignments.filter((a) => a.garmentId === g.id);
      if (existing.some((a) => conflict(p, g, assignment, a))) continue;
      visit(
        i + 1,
        [...assignments, assignment],
        cost + (existing.length ? 0 : Math.round(g.cost * 100)),
        penalty + (look.preferred === g.id ? 0 : 1),
      );
    }
  }
  if (!blockers.length) visit(0, [], 0, 0);
  const assignments: Assignment[] = best ?? [];
  const sourceItems = p.garments.filter((g) =>
    assignments.some((a) => a.garmentId === g.id),
  );
  if (!best && !blockers.length)
    blockers.push(
      "The approved looks compete for the same physical stock. Review another garment or authorize a feasible handoff.",
    );
  const bestCost = bestCents / 100;
  const over = best !== null && bestCents > Math.round(p.budget * 100);
  if (over)
    blockers.push(
      `The least-cost approved plan is ${money(bestCost)}, which exceeds the budget by ${money(bestCost - p.budget)}. Review an owned alternative or change the budget.`,
    );
  return {
    status: best === null ? "incomplete" : over ? "over_budget" : "ready",
    assignments,
    cost: best === null ? null : bestCost,
    remaining:
      best === null ? null : (Math.round(p.budget * 100) - bestCents) / 100,
    sourceItems,
    blockers,
    excluded,
    preferredConflicts,
    evaluated,
    ownedCount: sourceItems.filter((g) => g.source === "Owned").length,
    rentalCount: sourceItems.filter((g) => g.source === "Rental").length,
  };
}

export function assertPlan(p: Project, plan: Plan): string[] {
  const errors: string[] = [];
  if (
    plan.assignments.length !== p.looks.length ||
    new Set(plan.assignments.map((a) => a.lookId)).size !== p.looks.length
  )
    errors.push("Every look must be assigned exactly once");
  for (const a of plan.assignments) {
    const l = p.looks.find((x) => x.id === a.lookId);
    const g = p.garments.find((x) => x.id === a.garmentId);
    if (!l || !g || !l.candidates.includes(g.id)) {
      errors.push("Unknown assignment");
      continue;
    }
    if (
      a.actorId !== l.actorId ||
      JSON.stringify([...a.scenes].sort()) !==
        JSON.stringify([...l.scenes].sort())
    )
      errors.push("Assignment does not match the look performer and scenes");
    const reason = exclusion(p, l, g);
    if (reason) errors.push(reason);
  }
  for (let i = 0; i < plan.assignments.length; i++)
    for (let j = i + 1; j < plan.assignments.length; j++) {
      const a = plan.assignments[i],
        b = plan.assignments[j];
      if (
        a.garmentId === b.garmentId &&
        conflict(p, p.garments.find((g) => g.id === a.garmentId)!, a, b)
      )
        errors.push("Physical item is double-booked");
    }
  const trueCost =
    p.garments
      .filter((g) => plan.assignments.some((a) => a.garmentId === g.id))
      .reduce((n, g) => n + Math.round(g.cost * 100), 0) / 100;
  if (trueCost !== plan.cost) errors.push("Acquisition cost is incorrect");
  if (trueCost > p.budget) errors.push("Plan exceeds budget");
  return errors;
}
