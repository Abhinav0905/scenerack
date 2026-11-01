import {
  db,
  bucket,
  identity,
  getProject,
  json,
  sameOrigin,
  failure,
  AppError,
  fingerprint,
  runtime,
} from "@/lib/server";
import { balance, currentCost, upload, youcam } from "@/lib/youcam";
import type { Preview, Project } from "@/lib/model";
import { recordedPreviews } from "@/lib/recordings";
import {
  serialize,
  refreshJob,
  refreshOwnerJobs,
  type Job,
} from "@/lib/preview-jobs";
export async function GET(request: Request) {
  try {
    const { owner, cookie } = await identity(request);
    const rows = await db()
      .prepare(
        "SELECT * FROM preview_jobs WHERE owner = ? ORDER BY created_at DESC LIMIT 100",
      )
      .bind(owner)
      .all<Job>();
    const { project } = await getProject(owner);
    const valid = await Promise.all(
      rows.results.map(async (original) => {
        const row = await refreshJob(original, owner).catch(() => original);
        const current = await fingerprint(
          project,
          row.actor_id,
          row.garment_id,
        ).catch(() => "");
        return row.fingerprint === current ? serialize(row, project) : null;
      }),
    );
    const live = valid.filter((p): p is Preview => !!p);
    const recorded = recordedPreviews(project).filter(
      (r) =>
        !live.some(
          (p) => p.actorId === r.actorId && p.garmentId === r.garmentId,
        ),
    );
    return json({ previews: [...live, ...recorded] }, 200, cookie);
  } catch (e) {
    return failure(e);
  }
}
async function assetBytes(request: Request, path: string, owner: string) {
  if (path.startsWith("/api/media/")) {
    const row = await db()
      .prepare("SELECT storage_key FROM media WHERE id = ? AND owner = ?")
      .bind(path.split("/").pop(), owner)
      .first<{ storage_key: string }>();
    if (!row) throw new AppError("Photo is unavailable.", 404);
    const item = await bucket().get(row.storage_key);
    if (!item) throw new AppError("Photo has expired.", 404);
    return item.arrayBuffer();
  }
  if (!/^\/assets\/(actor|garment)-[a-z]+\.jpg$/.test(path))
    throw new AppError("This sample image is not available for generation.");
  // Read exact bundled JPEG bytes without making an authenticated HTTP request
  // back through the private Site's login gate.
  const samples = (await import("@/lib/server-sample-jpegs.json"))
    .default as Record<string, string>;
  const encoded = samples[path];
  if (!encoded) throw new AppError("Sample photo not found.", 404);
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)).buffer;
}
export async function POST(request: Request) {
  let createdId: string | null = null;
  let createAttempted = false;
  try {
    sameOrigin(request);
    const { actorId, garmentId, consent, retry } = (await request.json()) as {
      actorId: string;
      garmentId: string;
      consent: boolean;
      retry?: boolean;
    };
    if (consent !== true)
      throw new AppError(
        "Confirm that these two images may be sent to YouCam.",
      );
    const { owner, cookie } = await identity(request);
    const { project } = await getProject(owner);
    const mark = await fingerprint(project, actorId, garmentId);
    const existing = await db()
      .prepare("SELECT * FROM preview_jobs WHERE owner = ? AND fingerprint = ?")
      .bind(owner, mark)
      .first<Job>();
    if (existing && !(existing.status === "error" && retry === true))
      return json(
        { preview: serialize(existing, project), reused: true },
        200,
        cookie,
      );
    if (existing?.status === "error" && retry === true)
      await db()
        .prepare(
          "UPDATE preview_jobs SET fingerprint = ? WHERE id = ? AND status = 'error' AND fingerprint = ?",
        )
        .bind(`${mark}:failed:${existing.id}`, existing.id, mark)
        .run();
    const e = runtime();
    if (!e.YOUCAM_API_KEY || e.YOUCAM_LIVE_ENABLED !== "true")
      throw new AppError(
        "New YouCam previews are paused. You can review saved previews or the original garments.",
        503,
      );
    await refreshOwnerJobs(owner);
    const price = await currentCost();
    // Freeze settled reservations BEFORE reading the account balance. A job
    // that finishes during this request must remain counted at admission.
    const settled = await db()
      .prepare(
        "SELECT COALESCE(SUM(units),0) AS units FROM preview_jobs WHERE status IN ('success','error')",
      )
      .first<{ units: number }>();
    const remaining = await balance();
    if (!Number.isFinite(remaining) || remaining - price < 12)
      throw new AppError(
        "Generation is paused to preserve the remaining demo units.",
        429,
      );
    const active = await db()
      .prepare(
        "SELECT COUNT(*) AS n FROM preview_jobs WHERE owner = ? AND status IN ('queued','processing')",
      )
      .bind(owner)
      .first<{ n: number }>();
    if ((active?.n ?? 0) >= 2)
      throw new AppError(
        "Two previews are already running. Let one finish first.",
        429,
      );
    const actor = project.actors.find((a) => a.id === actorId)!;
    const garment = project.garments.find((g) => g.id === garmentId)!;
    const [actorBytes, garmentBytes] = await Promise.all([
      assetBytes(request, actor.image, owner),
      assetBytes(request, garment.image, owner),
    ]);
    const id = crypto.randomUUID(),
      now = new Date().toISOString();
    const limit = Math.min(200, Math.max(0, Number(e.YOUCAM_MAX_UNITS ?? 192)));
    const inserted = await db()
      .prepare(
        "INSERT OR IGNORE INTO preview_jobs (id, owner, actor_id, garment_id, fingerprint, status, created_at, updated_at, units) SELECT ?, ?, ?, ?, ?, 'queued', ?, ?, ? WHERE (SELECT COALESCE(SUM(units),0) FROM preview_jobs) + ? <= ? AND (SELECT COALESCE(SUM(units),0) FROM preview_jobs WHERE owner = ?) + ? <= 60 AND (SELECT COUNT(*) FROM preview_jobs WHERE owner = ? AND status IN ('queued','processing')) < 2 AND (SELECT COALESCE(SUM(units),0) FROM preview_jobs) - ? + ? <= ?",
      )
      .bind(
        id,
        owner,
        actorId,
        garmentId,
        mark,
        now,
        now,
        price,
        price,
        limit,
        owner,
        price,
        owner,
        settled?.units ?? 0,
        price,
        remaining - 12,
      )
      .run();
    if (!inserted.meta.changes) {
      const duplicate = await db()
        .prepare(
          "SELECT * FROM preview_jobs WHERE owner = ? AND fingerprint = ?",
        )
        .bind(owner, mark)
        .first<Job>();
      if (duplicate)
        return json(
          { preview: serialize(duplicate, project), reused: true },
          200,
          cookie,
        );
      throw new AppError(
        "The preview allowance or active-job limit has been reached. Let running previews finish; existing results remain available.",
        429,
      );
    }
    createdId = id;
    const source = await upload(actorBytes, "performer.jpg");
    const reference = await upload(garmentBytes, "garment.jpg");
    const claimed = await db()
      .prepare(
        "UPDATE preview_jobs SET status = 'processing', updated_at = ? WHERE id = ? AND status = 'queued'",
      )
      .bind(new Date().toISOString(), id)
      .run();
    if (!claimed.meta.changes)
      throw new AppError(
        "This upload expired before task creation. Retry from the current workroom.",
        409,
      );
    createAttempted = true;
    const response = await youcam("/s2s/v2.0/task/cloth-v4", {
      src_file_id: source,
      ref_file_id: reference,
      garment_category: garment.category,
      filter_multi_person: "strict",
      change_shoes: false,
    });
    if (typeof response.data?.task_id !== "string")
      throw new Error("Task identifier missing");
    await db()
      .prepare(
        "UPDATE preview_jobs SET task_id = ?, updated_at = ? WHERE id = ?",
      )
      .bind(response.data.task_id, new Date().toISOString(), id)
      .run();
    const job = await db()
      .prepare("SELECT * FROM preview_jobs WHERE id = ?")
      .bind(id)
      .first<Job>();
    return json(
      { preview: serialize(job!, project), reused: false },
      202,
      cookie,
    );
  } catch (e) {
    if (createdId)
      await db()
        .prepare(
          "UPDATE preview_jobs SET status = ?, error = ?, updated_at = ? WHERE id = ?",
        )
        .bind(
          createAttempted ? "uncertain" : "error",
          createAttempted
            ? "The provider may have received this task, but confirmation was lost. No automatic retry will spend units again."
            : e instanceof AppError
              ? e.message
              : "The images could not be sent to YouCam.",
          new Date().toISOString(),
          createdId,
        )
        .run();
    return failure(e);
  }
}
