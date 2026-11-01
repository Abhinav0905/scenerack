import { AppError, runtime } from "./server";
const BASE = "https://yce-api-01.makeupar.com";
type Payload = Record<string, any>;
export function providerUrl(raw: string) {
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    ![
      "amazonaws.com",
      "perfectcorp.com",
      "makeupar.com",
      "cloudfront.net",
    ].some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  )
    throw new AppError(
      "YouCam returned an unexpected image host. The result needs operator review.",
      502,
    );
  return u.href;
}
export async function youcam(path: string, body?: unknown): Promise<Payload> {
  const key = runtime().YOUCAM_API_KEY;
  if (!key)
    throw new AppError(
      "Live YouCam generation has not been connected yet. Recorded previews and planning remain available.",
      503,
    );
  const response = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
    redirect: "manual",
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "The YouCam connection needs attention.",
      402: "The YouCam account has insufficient units.",
      429: "YouCam is busy. Keep this task open; it will be checked again shortly.",
    };
    throw new AppError(
      messages[response.status] ??
        `YouCam could not accept this request (HTTP ${response.status}).`,
      response.status === 429 ? 429 : 502,
    );
  }
  const data = (await response.json()) as Payload;
  if (data.status && data.status !== 200)
    throw new AppError(
      "YouCam returned an unsuccessful response. The preview was not accepted.",
      502,
    );
  return data;
}
export async function currentCost() {
  let token: string | undefined;
  for (let i = 0; i < 12; i++) {
    const result = (
      await youcam(
        `/s2s/v2.0/credit/feature-cost?page_size=20${token ? `&starting_token=${encodeURIComponent(token)}` : ""}`,
      )
    ).result;
    if (!result || !Array.isArray(result.skus))
      throw new AppError("Current YouCam pricing could not be verified.", 503);
    const sku = result.skus.find(
      (s: Payload) =>
        typeof s.run_task_url === "string" &&
        s.run_task_url.endsWith("/s2s/v2.0/task/cloth-v4"),
    );
    if (sku) {
      const cost = Number(sku.amount);
      if (
        !Number.isFinite(cost) ||
        cost <= 0 ||
        cost > 2 ||
        Number(sku.proc_unit) !== 1
      )
        throw new AppError(
          "The live task price is outside the configured two-unit limit.",
          503,
        );
      return cost;
    }
    token = result.next_token;
    if (!token) break;
  }
  throw new AppError(
    "Clothes v4 pricing was not found. Generation is paused until it can be verified.",
    503,
  );
}
export async function balance() {
  const data = await youcam("/s2s/v1.0/client/credit");
  if (!Array.isArray(data.results))
    throw new AppError(
      "The remaining YouCam units could not be verified.",
      503,
    );
  return data.results
    .filter(
      (x: Payload) =>
        ["ApiSubsToken", "ApiPaygToken"].includes(x.type) &&
        (!x.expiry || Number(x.expiry) > Date.now()),
    )
    .reduce(
      (sum: number, x: Payload) => sum + Number(x.amount_dec ?? x.amount ?? 0),
      0,
    );
}
export async function upload(bytes: ArrayBuffer, name: string) {
  const result = await youcam("/s2s/v2.0/file", {
    files: [
      {
        content_type: "image/jpeg",
        file_name: name,
        file_size: bytes.byteLength,
      },
    ],
  });
  const file = result.data?.files?.[0];
  if (!file?.file_id || !Array.isArray(file.requests) || !file.requests.length)
    throw new AppError("YouCam did not provide an image upload target.", 502);
  for (const instruction of file.requests) {
    if (instruction.method !== "PUT")
      throw new AppError("Unexpected YouCam upload method.", 502);
    const headers = new Headers(instruction.headers ?? {});
    headers.delete("Authorization");
    const response = await fetch(providerUrl(instruction.url), {
      method: "PUT",
      headers,
      body: bytes,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new AppError("The image upload to YouCam did not finish.", 502);
  }
  return file.file_id as string;
}
export function parseTask(data: Payload) {
  const task = data.data;
  if (!task || !["running", "success", "error"].includes(task.task_status))
    throw new AppError("YouCam returned an unrecognized task state.", 502);
  if (task.task_status === "success" && typeof task.results?.url !== "string")
    throw new AppError(
      "YouCam finished without an image. This preview needs review.",
      502,
    );
  return {
    status: task.task_status as "running" | "success" | "error",
    url: task.results?.url as string | undefined,
    code: String(task.error ?? task.error_message ?? ""),
  };
}
export function friendlyError(code: string) {
  if (/face|pose|person|people/.test(code))
    return "Use a clear, front-facing photo of one adult with their face and torso visible.";
  if (/ref|region|edit/.test(code))
    return "YouCam could not apply this garment. Try a clear, front-facing garment image.";
  return "YouCam could not complete this preview. The garment remains available for a manual reference review.";
}
