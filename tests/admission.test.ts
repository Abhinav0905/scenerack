import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
const route = readFileSync("app/api/previews/route.ts", "utf8");
const admission = route.match(
  /"(INSERT OR IGNORE INTO preview_jobs[^"\n]+)"/,
)![1];
function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("drizzle/0000_fresh_mordo.sql", "utf8"));
  return db;
}
function admit(
  db: DatabaseSync,
  id: string,
  { settled = 0, balance = 420, cap = 192 } = {},
) {
  return db
    .prepare(admission)
    .run(
      id,
      "test-owner",
      "maya",
      "brown",
      id,
      "2026-11-01T00:00:00Z",
      "2026-11-01T00:00:00Z",
      2,
      2,
      cap,
      "test-owner",
      2,
      "test-owner",
      settled,
      2,
      balance - 12,
    ).changes;
}
test("a job completing after the frozen balance baseline cannot free the same reserve twice", () => {
  const db = setup();
  assert.equal(admit(db, "first", { balance: 14 }), 1);
  db.prepare(
    "UPDATE preview_jobs SET status = 'success' WHERE id = 'first'",
  ).run();
  assert.equal(admit(db, "delayed-second", { settled: 0, balance: 14 }), 0);
  assert.equal(
    db.prepare("SELECT SUM(units) AS units FROM preview_jobs").get()!.units,
    2,
  );
  db.close();
});
test("atomic admission permits at most two current jobs per workspace", () => {
  const db = setup();
  assert.equal(admit(db, "one"), 1);
  assert.equal(admit(db, "two"), 1);
  assert.equal(admit(db, "three"), 0);
  db.close();
});
test("global cumulative allowance remains enforced after tasks finish", () => {
  const db = setup();
  assert.equal(admit(db, "one", { cap: 2 }), 1);
  db.exec("UPDATE preview_jobs SET status = 'success'");
  assert.equal(admit(db, "two", { settled: 2, cap: 2 }), 0);
  db.close();
});
