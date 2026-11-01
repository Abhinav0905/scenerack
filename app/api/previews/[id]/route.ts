import {
  db,
  identity,
  json,
  failure,
  AppError,
  getProject,
  fingerprint,
} from "@/lib/server";
import { serialize, refreshJob, type Job } from "@/lib/preview-jobs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { owner, cookie } = await identity(request),
      { id } = await context.params;
    const original = await db()
      .prepare("SELECT * FROM preview_jobs WHERE id = ? AND owner = ?")
      .bind(id, owner)
      .first<Job>();
    if (!original)
      throw new AppError("Preview not found in this workspace.", 404);
    // Settle the provider job even when its source is no longer displayable.
    const job = await refreshJob(original, owner);
    const { project } = await getProject(owner);
    if (
      job.fingerprint !==
      (await fingerprint(project, job.actor_id, job.garment_id).catch(() => ""))
    )
      throw new AppError(
        "The source photos changed. Open the current preview from the workroom.",
        409,
      );
    return json({ preview: serialize(job, project) }, 200, cookie);
  } catch (e) {
    return failure(e);
  }
}
