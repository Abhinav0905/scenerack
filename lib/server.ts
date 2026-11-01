import { env } from "cloudflare:workers";
import { seedProject } from "./seed";
import { solve } from "./planner";
import type { Project } from "./model";

export const runtime = () => env as Cloudflare.Env;
export function db() {
  if (!env.DB) throw new Error("Project storage is not configured");
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new Error("Image storage is not configured");
  return env.BUCKET;
}
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new AppError("This action must start from SceneRack.", 403);
}
export async function hash(s: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function identity(request: Request) {
  const user = request.headers.get("oai-authenticated-user-id");
  if (user) return { owner: `user:${user}`, cookie: null };
  const current = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)scenerack-session=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const id = current ?? crypto.randomUUID();
  return {
    owner: `session:${await hash(id)}`,
    cookie: current
      ? null
      : `scenerack-session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
  };
}
export function json(
  data: unknown,
  status = 200,
  cookie: string | null = null,
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof AppError)
    return json({ error: error.message }, error.status);
  console.error(
    "SceneRack request failed:",
    error instanceof Error
      ? error.message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
      : "Unknown error",
  );
  return json(
    {
      error:
        "The action could not finish. Your last saved plan is unchanged. Please try again.",
    },
    500,
  );
}
export async function getProject(owner: string) {
  let row = await db()
    .prepare("SELECT body, version FROM projects WHERE owner = ?")
    .bind(owner)
    .first<{ body: string; version: number }>();
  if (!row) {
    const project = seedProject();
    await db()
      .prepare(
        "INSERT OR IGNORE INTO projects (owner, body, version, updated_at) VALUES (?, ?, 1, ?)",
      )
      .bind(owner, JSON.stringify(project), new Date().toISOString())
      .run();
    row = await db()
      .prepare("SELECT body, version FROM projects WHERE owner = ?")
      .bind(owner)
      .first<{ body: string; version: number }>();
  }
  if (!row) throw new Error("Project could not be opened");
  return { project: JSON.parse(row.body) as Project, version: row.version };
}
export async function fingerprint(
  project: Project,
  actorId: string,
  garmentId: string,
) {
  const actor = project.actors.find((a) => a.id === actorId);
  const garment = project.garments.find((g) => g.id === garmentId);
  if (!actor || !garment)
    throw new AppError("Choose a known performer and garment.");
  return hash(
    JSON.stringify([
      actorId,
      actor.image,
      garmentId,
      garment.image,
      garment.category,
      "cloth-v4",
      "strict",
      "assets-v1",
    ]),
  );
}
export function projectResponse(project: Project, version: number) {
  return {
    project,
    version,
    plan: solve(project),
    baseline: solve(seedProject()),
    sample: true,
  };
}
