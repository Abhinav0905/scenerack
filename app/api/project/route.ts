import {
  db,
  identity,
  getProject,
  json,
  sameOrigin,
  failure,
  AppError,
  projectResponse,
  fingerprint,
} from "@/lib/server";
import { projectSchema } from "@/lib/validation";
import { seedProject } from "@/lib/seed";
import { recordedPreviews } from "@/lib/recordings";
import type { Project } from "@/lib/model";

export async function GET(request: Request) {
  try {
    const { owner, cookie } = await identity(request);
    const { project, version } = await getProject(owner);
    return json(projectResponse(project, version), 200, cookie);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (Number(request.headers.get("content-length") ?? 0) > 100000)
      throw new AppError("Project is too large.", 413);
    const { owner, cookie } = await identity(request);
    const old = await getProject(owner);
    const body = (await request.json()) as {
      project?: unknown;
      version?: number;
      reset?: boolean;
    };
    if (body.version !== old.version)
      throw new AppError(
        "This plan changed in another tab. Reload before saving.",
        409,
      );
    const checked = projectSchema.safeParse(
      body.reset ? seedProject() : body.project,
    );
    if (!checked.success)
      throw new AppError(
        checked.error.issues[0]?.message ?? "Invalid production data.",
      );
    const project = checked.data as Project;
    for (const actor of project.actors)
      if (actor.image.startsWith("/api/media/")) {
        const row = await db()
          .prepare("SELECT id FROM media WHERE id = ? AND owner = ?")
          .bind(actor.image.split("/").pop(), owner)
          .first();
        if (!row)
          throw new AppError(
            "The performer photo does not belong to this project.",
            403,
          );
      }
    for (const garment of project.garments)
      if (garment.image.startsWith("/api/media/")) {
        const row = await db()
          .prepare("SELECT id FROM media WHERE id = ? AND owner = ?")
          .bind(garment.image.split("/").pop(), owner)
          .first();
        if (!row)
          throw new AppError(
            "The garment photo does not belong to this project.",
            403,
          );
      }
    for (const [key, decision] of Object.entries(project.decisions)) {
      const [lookId, garmentId] = key.split(":");
      const look = project.looks.find((x) => x.id === lookId)!;
      const prevLook = old.project.looks.find((x) => x.id === lookId);
      const sameInput =
        prevLook &&
        prevLook.actorId === look.actorId &&
        prevLook.name === look.name &&
        (await fingerprint(project, look.actorId, garmentId)) ===
          (await fingerprint(old.project, prevLook.actorId, garmentId).catch(
            () => "",
          ));
      if (!body.reset && !sameInput) {
        delete project.decisions[key];
        continue;
      }
      if (decision.basis === "youcam") {
        const saved = recordedPreviews(project).find(
          (p) =>
            p.id === decision.previewId &&
            p.actorId === look.actorId &&
            p.garmentId === garmentId,
        );
        if (saved) continue;
        const job = await db()
          .prepare(
            "SELECT fingerprint FROM preview_jobs WHERE id = ? AND owner = ? AND status = 'success'",
          )
          .bind(decision.previewId ?? "", owner)
          .first<{ fingerprint: string }>();
        if (
          !job ||
          job.fingerprint !==
            (await fingerprint(project, look.actorId, garmentId))
        )
          throw new AppError(
            "This review needs a completed preview for the current inputs.",
          );
      }
    }
    const version = old.version + 1;
    const result = await db()
      .prepare(
        "UPDATE projects SET body = ?, version = ?, updated_at = ? WHERE owner = ? AND version = ?",
      )
      .bind(
        JSON.stringify(project),
        version,
        new Date().toISOString(),
        owner,
        old.version,
      )
      .run();
    if (!result.meta.changes)
      throw new AppError(
        "The plan changed before this save. Reload and try again.",
        409,
      );
    return json(projectResponse(project, version), 200, cookie);
  } catch (e) {
    return failure(e);
  }
}
