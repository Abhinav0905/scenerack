import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".sites-runtime/tests", { recursive: true });
await build({
  entryPoints: ["tests/planner.test.ts", "tests/admission.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: ".sites-runtime/tests",
  outExtension: { ".js": ".mjs" },
  logLevel: "error",
});
const result = spawnSync(
  process.execPath,
  [
    "--test",
    ".sites-runtime/tests/planner.test.mjs",
    ".sites-runtime/tests/admission.test.mjs",
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
