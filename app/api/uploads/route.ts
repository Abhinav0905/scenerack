import {
  db,
  bucket,
  identity,
  sameOrigin,
  failure,
  AppError,
  json,
} from "@/lib/server";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { owner, cookie } = await identity(request);
    if (Number(request.headers.get("content-length") ?? 0) > 8000500)
      throw new AppError("Use a JPEG smaller than 8 MB.", 413);
    const form = await request.formData(),
      file = form.get("image");
    if (form.get("permission") !== "true" || !(file instanceof File))
      throw new AppError("Confirm permission to use this image.");
    if (file.type !== "image/jpeg" || file.size > 8000000)
      throw new AppError("Use a JPEG smaller than 8 MB.", 413);
    const bytes = await file.arrayBuffer(),
      head = new Uint8Array(bytes);
    if (head[0] !== 255 || head[1] !== 216 || head[2] !== 255)
      throw new AppError("This is not a valid JPEG.");
    const count = await db()
      .prepare("SELECT COUNT(*) AS n FROM media WHERE owner = ?")
      .bind(owner)
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= 20)
      throw new AppError("This workspace has reached its 20-photo limit.", 429);
    const id = crypto.randomUUID(),
      key = `uploads/${id}.jpg`;
    await bucket().put(key, bytes, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    await db()
      .prepare(
        "INSERT INTO media (id, owner, storage_key, mime, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(id, owner, key, "image/jpeg", new Date().toISOString())
      .run();
    return json({ image: `/api/media/${id}` }, 201, cookie);
  } catch (e) {
    return failure(e);
  }
}
