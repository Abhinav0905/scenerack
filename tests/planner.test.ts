import test from "node:test";
import assert from "node:assert/strict";
import { seedProject } from "../lib/seed";
import { solve, assertPlan, conflict } from "../lib/planner";
import { projectSchema } from "../lib/validation";
import type { Project } from "../lib/model";
const approve = (p: Project, k: string) =>
  (p.decisions[k] = {
    status: "approved",
    basis: "reference",
    note: "Controlled test input",
    updatedAt: "2026-10-31",
  });

test("sample starts with one rental and no double-booked physical item", () => {
  const p = seedProject(),
    r = solve(p);
  assert.equal(r.cost, 65);
  assert.equal(r.rentalCount, 1);
  assert.deepEqual(assertPlan(p, r), []);
  assert.equal(
    r.assignments.find((a) => a.actorId === "leo")?.garmentId,
    "burgundy",
  );
});
test("one approval removes the rental, veto restores it", () => {
  const p = seedProject();
  approve(p, "archivist:brown");
  assert.equal(solve(p).cost, 0);
  assert.deepEqual(assertPlan(p, solve(p)), []);
  p.decisions["archivist:brown"].status = "rejected";
  assert.equal(solve(p).cost, 65);
});
test("bad preview stays unresolved and does not approve the look", () => {
  const p = seedProject();
  approve(p, "archivist:brown");
  p.decisions["archivist:brown"].status = "flagged";
  const r = solve(p);
  assert.equal(r.cost, 65);
  assert.match(
    r.excluded.find((x) => x.garmentId === "brown")!.reason,
    /unresolved/,
  );
});
test("stock withdrawal restores rental after brown approval", () => {
  const p = seedProject();
  approve(p, "archivist:brown");
  p.garments.find((g) => g.id === "brown")!.available = false;
  assert.equal(solve(p).cost, 65);
});
test("wearer eligibility is independent of appearance approval", () => {
  const p = seedProject();
  approve(p, "archivist:brown");
  p.garments.find((g) => g.id === "brown")!.eligibleActors = ["leo"];
  assert.equal(solve(p).cost, 65);
});
test("scene-specific availability is enforced", () => {
  const p = seedProject();
  approve(p, "archivist:brown");
  p.garments.find((g) => g.id === "brown")!.availableScenes = ["scene-1"];
  assert.equal(solve(p).cost, 65);
});
test("budget cannot be silently exceeded", () => {
  const p = seedProject();
  p.budget = 40;
  const r = solve(p);
  assert.equal(r.status, "over_budget");
  assert.equal(r.remaining, -25);
  assert.match(r.blockers.join(" "), /exceeds/);
});
test("decimal prices are compared in cents", () => {
  const p = seedProject();
  p.budget = 0.3;
  p.garments.find((g) => g.id === "navy")!.cost = 0.1;
  p.garments.find((g) => g.id === "burgundy")!.cost = 0.2;
  const r = solve(p);
  assert.equal(r.status, "ready");
  assert.equal(r.cost, 0.3);
  assert.equal(r.remaining, 0);
});
test("a veto can make the entire plan incomplete", () => {
  const p = seedProject();
  p.decisions["visitor:burgundy"].status = "rejected";
  const r = solve(p);
  assert.equal(r.status, "incomplete");
  assert.equal(r.cost, null);
  assert.equal(r.assignments.length, 0);
  assert.match(r.blockers[0], /compete/);
});
test("a missing appearance decision produces an explicit blocker", () => {
  const p = seedProject();
  delete p.decisions["courier:charcoal"];
  assert.match(solve(p).blockers[0], /Imani/);
});
test("handoff permission never permits overlapping use", () => {
  const p = seedProject(),
    g = p.garments[0];
  g.allowHandoff = true;
  const a = {
      lookId: "archivist",
      actorId: "maya",
      garmentId: "navy",
      scenes: ["scene-1"],
    },
    b = {
      lookId: "visitor",
      actorId: "leo",
      garmentId: "navy",
      scenes: ["scene-1"],
    };
  assert.equal(conflict(p, g, a, b), true);
});
test("different scene IDs with overlapping times still conflict", () => {
  const p = seedProject(),
    g = p.garments[0];
  g.allowHandoff = true;
  p.scenes[1].start = 5;
  assert.equal(
    conflict(
      p,
      g,
      {
        lookId: "archivist",
        actorId: "maya",
        garmentId: "navy",
        scenes: ["scene-1"],
      },
      {
        lookId: "visitor",
        actorId: "leo",
        garmentId: "navy",
        scenes: ["scene-2"],
      },
    ),
    true,
  );
});
test("nonoverlapping scenes require explicit handoff authorization", () => {
  const p = seedProject(),
    g = p.garments[0],
    a = {
      lookId: "archivist",
      actorId: "maya",
      garmentId: "navy",
      scenes: ["scene-1"],
    },
    b = {
      lookId: "visitor",
      actorId: "leo",
      garmentId: "navy",
      scenes: ["scene-3"],
    };
  assert.equal(conflict(p, g, a, b), true);
  g.allowHandoff = true;
  assert.equal(conflict(p, g, a, b), false);
});
test("a physical garment shared in authorized separate scenes is paid for once", () => {
  const p = seedProject();
  p.looks = p.looks.slice(0, 2);
  p.looks[0].scenes = ["scene-1"];
  p.looks[1].scenes = ["scene-3"];
  p.garments[0].allowHandoff = true;
  p.garments[0].cost = 20;
  const r = solve(p);
  assert.equal(r.cost, 20);
  assert.equal(r.sourceItems.length, 1);
  assert.deepEqual(assertPlan(p, r), []);
});
test("borrowed pieces are not counted as owned", () => {
  const p = seedProject();
  p.garments.find((g) => g.id === "charcoal")!.source = "Borrowed";
  const r = solve(p);
  assert.equal(r.ownedCount, 1);
  assert.equal(r.sourceItems.filter((g) => g.source === "Borrowed").length, 1);
});
test("verifier rejects corrupted performer, scenes and repeated looks", () => {
  const p = seedProject(),
    r = solve(p);
  r.assignments[0].actorId = "nonexistent";
  r.assignments[0].scenes = [];
  assert.ok(assertPlan(p, r).length);
  const r2 = solve(p);
  r2.assignments[1] = r2.assignments[0];
  assert.match(assertPlan(p, r2).join(" "), /exactly once/);
});
test("seed and intended cents-valued input satisfy schema", () => {
  assert.equal(projectSchema.safeParse(seedProject()).success, true);
  const p = seedProject();
  p.garments[0].cost = 0.29;
  assert.equal(projectSchema.safeParse(p).success, true);
});
test("invalid references and duplicate IDs are rejected before solving", () => {
  const p = seedProject();
  p.looks[0].candidates.push("missing");
  assert.equal(projectSchema.safeParse(p).success, false);
  const q = seedProject();
  q.actors[1].id = q.actors[0].id;
  assert.equal(projectSchema.safeParse(q).success, false);
});
test("prototype rejects extra simultaneous looks for one actor", () => {
  const p = seedProject();
  p.looks[1].actorId = "maya";
  assert.equal(projectSchema.safeParse(p).success, false);
});
test("deterministic 200-case perturbation checks feasible plans against independent invariants", () => {
  let state = 7271;
  const rnd = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  let feasible = 0;
  for (let i = 0; i < 200; i++) {
    const p = seedProject();
    for (const l of p.looks)
      for (const g of l.candidates)
        if (rnd() > 0.35) approve(p, `${l.id}:${g}`);
    for (const g of p.garments) {
      g.available = rnd() > 0.12;
      g.cost = Math.round(rnd() * 2000) / 100;
    }
    p.budget = 200;
    const r = solve(p);
    if (r.status === "ready") {
      feasible++;
      assert.deepEqual(assertPlan(p, r), []);
      for (const a of r.assignments) {
        assert.equal(
          p.decisions[`${a.lookId}:${a.garmentId}`].status,
          "approved",
        );
        assert.ok(p.garments.find((g) => g.id === a.garmentId)!.available);
      }
    } else assert.equal(r.status, "incomplete");
  }
  assert.ok(feasible > 80);
});
