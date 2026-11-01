import { db, bucket, identity, failure, AppError } from "@/lib/server";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { owner } = await identity(request),
      { id } = await context.params;
    const row = await db()
      .prepare("SELECT storage_key FROM media WHERE id = ? AND owner = ?")
      .bind(id, owner)
      .first<{ storage_key: string }>();
    if (!row) throw new AppError("Photo not found.", 404);
    const item = await bucket().get(row.storage_key);
    if (!item) throw new AppError("Photo has expired.", 404);
    return new Response(item.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
