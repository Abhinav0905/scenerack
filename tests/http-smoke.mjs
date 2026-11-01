import assert from "node:assert/strict";
import fs from "node:fs/promises";
const root = process.env.SCENERACK_TEST_URL || "http://127.0.0.1:3100";
function client() {
  let cookie = "";
  return async (path, method = "GET", body, extra = {}) => {
    const res = await fetch(root + path, {
      method,
      headers: {
        Origin: root,
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
    if (res.headers.get("set-cookie"))
      cookie = res.headers.get("set-cookie").split(";")[0];
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
    return { status: res.status, data };
  };
}
let checks = 0;
function ok(name, fn) {
  fn();
  checks++;
  console.log("PASS " + name);
}
const a = client(),
  b = client();
let snap = (await a("/api/project")).data;
const second = (await b("/api/project")).data;
ok("new workspace starts with the $65 sample", () =>
  assert.equal(snap.plan.cost, 65),
);
const initialVersion = snap.version;
const approved = structuredClone(snap.project);
approved.decisions["archivist:brown"] = {
  status: "approved",
  basis: "reference",
  note: "HTTP test",
  updatedAt: new Date().toISOString(),
};
let r = await a("/api/project", "POST", {
  project: approved,
  version: snap.version,
});
snap = r.data;
ok("approval persists and reallocates to zero rental cost", () => {
  assert.equal(r.status, 200);
  assert.equal(snap.plan.cost, 0);
});
r = await a("/api/project", "POST", {
  project: approved,
  version: initialVersion,
});
ok("stale tab save is rejected", () => assert.equal(r.status, 409));
r = await b("/api/project");
ok("second workspace is isolated", () => {
  assert.equal(r.data.plan.cost, 65);
  assert.equal(r.data.version, second.version);
});
r = await a(
  "/api/project",
  "POST",
  { project: snap.project, version: snap.version },
  { Origin: "https://untrusted.example" },
);
ok("cross-origin mutation is blocked", () => assert.equal(r.status, 403));
const invalid = structuredClone(snap.project);
invalid.looks[0].candidates = ["missing"];
r = await a("/api/project", "POST", {
  project: invalid,
  version: snap.version,
});
ok("invalid project references are rejected", () =>
  assert.equal(r.status, 400),
);
const forged = structuredClone(snap.project);
forged.decisions["archivist:brown"].basis = "youcam";
forged.decisions["archivist:brown"].previewId = "not-a-real-preview";
r = await a("/api/project", "POST", { project: forged, version: snap.version });
ok("fabricated provider approval is rejected", () =>
  assert.equal(r.status, 400),
);
const recorded = await a("/api/previews");
ok("real recorded examples are available to a fresh workspace", () =>
  assert.equal(recorded.data.previews.length, 12),
);
const trueApproval = structuredClone(snap.project);
trueApproval.decisions["archivist:brown"].basis = "youcam";
trueApproval.decisions["archivist:brown"].previewId = "recorded-maya-brown";
r = await a("/api/project", "POST", {
  project: trueApproval,
  version: snap.version,
});
snap = r.data;
ok("verified saved YouCam result can support an approval", () =>
  assert.equal(r.status, 200),
);
const form = new FormData();
form.set(
  "image",
  new Blob([await fs.readFile("public/assets/actor-maya.jpg")], {
    type: "image/jpeg",
  }),
  "test.jpg",
);
form.set("permission", "true");
r = await a("/api/uploads", "POST", form);
const photo = r.data.image;
ok("permitted source upload is stored privately", () => {
  assert.equal(r.status, 201);
  assert.match(photo, /^\/api\/media\//);
});
r = await b(photo);
ok("another workspace cannot read an uploaded photo", () =>
  assert.equal(r.status, 404),
);
const changed = structuredClone(snap.project);
changed.actors[0].image = photo;
r = await a("/api/project", "POST", {
  project: changed,
  version: snap.version,
});
snap = r.data;
ok("changing a source invalidates affected appearance approvals", () => {
  assert.equal(r.status, 200);
  assert.equal(snap.project.decisions["archivist:brown"], undefined);
  assert.equal(snap.project.decisions["archivist:navy"], undefined);
});
r = await a("/api/previews");
ok("old source previews are absent after photo change", () =>
  assert.equal(
    r.data.previews.some((p) => p.actorId === "maya"),
    false,
  ),
);
const stolen = structuredClone(second.project);
stolen.actors[0].image = photo;
r = await b("/api/project", "POST", {
  project: stolen,
  version: second.version,
});
ok("another workspace cannot attach an uploaded photo", () =>
  assert.equal(r.status, 403),
);
r = await a("/api/project", "POST", { reset: true, version: snap.version });
snap = r.data;
ok("reset restores original sample state", () => {
  assert.equal(r.status, 200);
  assert.equal(snap.plan.cost, 65);
});
const races = await Promise.all([
  a("/api/project", "POST", { project: snap.project, version: snap.version }),
  a("/api/project", "POST", { project: snap.project, version: snap.version }),
]);
ok("two same-version writes cannot both commit", () =>
  assert.deepEqual(races.map((x) => x.status).sort(), [200, 409]),
);
r = await a("/api/previews", "POST", {
  actorId: "maya",
  garmentId: "brown",
  consent: false,
});
ok("generation requires explicit image consent", () =>
  assert.equal(r.status, 400),
);
r = await a("/api/previews/not-owned");
ok("private preview jobs are owner checked", () => assert.equal(r.status, 404));
console.log(`${checks} HTTP checks passed. No live generations requested.`);
