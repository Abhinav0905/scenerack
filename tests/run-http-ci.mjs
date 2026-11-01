import { spawn } from "node:child_process";
const server = spawn("npm", ["run", "dev", "--", "--port", "3100"], {
  stdio: "inherit",
  detached: true,
});
let ready = false;
try {
  for (let n = 0; n < 60; n++) {
    try {
      ready = (await fetch("http://127.0.0.1:3100/api/status")).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Test server did not become ready.");
  const test = spawn(process.execPath, ["tests/http-smoke.mjs"], {
    stdio: "inherit",
  });
  const code = await new Promise((resolve) => test.on("exit", resolve));
  process.exitCode = code ?? 1;
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}
