import { db, bucket, identity, failure, AppError } from "@/lib/server";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { owner } = await identity(request),
      { id } = await context.params;
    const row = await db()
      .prepare(
        "SELECT image_key FROM preview_jobs WHERE id = ? AND owner = ? AND status = 'success'",
      )
      .bind(id, owner)
      .first<{ image_key: string }>();
    if (!row) throw new AppError("Image not found.", 404);
    const item = await bucket().get(row.image_key);
    if (!item) throw new AppError("Image has expired.", 404);
    return new Response(item.body, {
      headers: {
        "Content-Type": item.httpMetadata?.contentType ?? "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
