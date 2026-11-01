import { runtime, json } from "@/lib/server";
export async function GET() {
  const e = runtime();
  return json({
    provider: "YouCam AI Clothes v4",
    configured: !!e.YOUCAM_API_KEY,
    enabled: e.YOUCAM_LIVE_ENABLED === "true",
    costLimit: 2,
    unitCap: Number(e.YOUCAM_MAX_UNITS ?? 192),
    storage: !!e.DB && !!e.BUCKET,
    mode: "prototype",
    inputAssets: "Synthetic adult performers and unbranded sample garments",
  });
}
