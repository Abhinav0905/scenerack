import { db, bucket, AppError } from "./server";
import { youcam, parseTask, providerUrl, friendlyError } from "./youcam";
import type { Preview, Project } from "./model";
export type Job = {
  id: string;
  actor_id: string;
  garment_id: string;
  status: string;
  image_key: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  units: number;
  task_id: string | null;
  fingerprint: string;
};
export function serialize(j: Job, p: Project): Preview {
  return {
    actorImage: p.actors.find((a) => a.id === j.actor_id)?.image,
    garmentImage: p.garments.find((g) => g.id === j.garment_id)?.image,
    category: p.garments.find((g) => g.id === j.garment_id)?.category,
    id: j.id,
    actorId: j.actor_id,
    garmentId: j.garment_id,
    status: j.status as Preview["status"],
    image: j.image_key ? `/api/previews/${j.id}/image` : undefined,
    message: j.error ?? undefined,
    createdAt: j.created_at,
    completedAt: j.status === "success" ? j.updated_at : undefined,
    units: j.units,
    source: "live",
    provider: "YouCam cloth-v4",
    elapsedMs:
      j.status === "success"
        ? Date.parse(j.updated_at) - Date.parse(j.created_at)
        : undefined,
  };
}
export async function refreshJob(current: Job, owner: string): Promise<Job> {
  const id = current.id;
  let job: Job | null = current;
  if (
    !job.task_id &&
    ["queued", "processing"].includes(job.status) &&
    Date.now() - Date.parse(job.updated_at) > 180000
  ) {
    const status = job.status === "queued" ? "error" : "uncertain";
    const message =
      status === "error"
        ? "The upload did not finish. You can deliberately retry this preview."
        : "Task confirmation was lost. No automatic retry will spend units again.";
    await db()
      .prepare(
        "UPDATE preview_jobs SET status = ?, error = ?, updated_at = ? WHERE id = ? AND status = ? AND task_id IS NULL",
      )
      .bind(status, message, new Date().toISOString(), id, job.status)
      .run();
    return (await db()
      .prepare("SELECT * FROM preview_jobs WHERE id = ? AND owner = ?")
      .bind(id, owner)
      .first<Job>())!;
  }
  if (
    job.status === "processing" &&
    job.task_id &&
    Date.now() - Date.parse(job.updated_at) >= 8000
  ) {
    const claimed = await db()
      .prepare(
        "UPDATE preview_jobs SET updated_at = ? WHERE id = ? AND updated_at = ? AND status = 'processing'",
      )
      .bind(new Date().toISOString(), id, job.updated_at)
      .run();
    if (claimed.meta.changes) {
      const task = parseTask(
        await youcam(
          `/s2s/v2.0/task/cloth-v4/${encodeURIComponent(job.task_id)}`,
        ),
      );
      if (task.status === "success") {
        const result = await fetch(providerUrl(task.url!), {
          redirect: "manual",
          signal: AbortSignal.timeout(25000),
        });
        if (
          !result.ok ||
          !result.headers.get("content-type")?.startsWith("image/")
        )
          throw new AppError(
            "The generated image could not be retrieved yet.",
            502,
          );
        const bytes = await result.arrayBuffer();
        if (bytes.byteLength > 16000000)
          throw new AppError("The generated image is too large to store.", 502);
        const key = `previews/${id}.jpg`;
        await bucket().put(key, bytes, {
          httpMetadata: {
            contentType: result.headers.get("content-type") ?? "image/jpeg",
          },
        });
        await db()
          .prepare(
            "UPDATE preview_jobs SET status = 'success', image_key = ?, updated_at = ? WHERE id = ?",
          )
          .bind(key, new Date().toISOString(), id)
          .run();
      } else if (task.status === "error")
        await db()
          .prepare(
            "UPDATE preview_jobs SET status = 'error', error = ?, updated_at = ? WHERE id = ?",
          )
          .bind(friendlyError(task.code), new Date().toISOString(), id)
          .run();
    }
    job = await db()
      .prepare("SELECT * FROM preview_jobs WHERE id = ? AND owner = ?")
      .bind(id, owner)
      .first<Job>();
  }
  return job!;
}
export async function refreshOwnerJobs(owner: string) {
  const rows = await db()
    .prepare(
      "SELECT * FROM preview_jobs WHERE owner = ? AND status IN ('queued','processing') LIMIT 10",
    )
    .bind(owner)
    .all<Job>();
  await Promise.all(
    rows.results.map((row) => refreshJob(row, owner).catch(() => row)),
  );
}
