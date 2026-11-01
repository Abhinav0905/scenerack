declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    YOUCAM_API_KEY?: string;
    YOUCAM_LIVE_ENABLED?: string;
    YOUCAM_MAX_UNITS?: string;
    YOUCAM_OWNER_ID?: string;
  }
}
