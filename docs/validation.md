# SceneRack verification record

The problem under test is a shared wardrobe conflict, not image novelty alone. The expected result is an appearance-approved allocation and an accurate acquisition list.

## Completed checks

- TypeScript type checking passed.
- 23 automated planning, validation and SQL admission checks passed. One check covers 200 deterministic randomized wardrobe cases.
- 18 local HTTP checks passed. They exercise independent workspaces, optimistic versioning, cross-origin rejection, upload ownership, source invalidation, recorded-preview approval and reset.
- A live duplicate request experiment sent two simultaneous POSTs and produced one job at two units. The request-to-saved-result time was 12.473 seconds. [Receipt](live-idempotency-check.json).
- An obsolete-source regression reused a completed real provider task. The app settled it, freed the active slot and kept the stale preview hidden. No new YouCam task was created. [Receipt](obsolete-preview-regression.json).
- 12 original fixture tasks completed through the real file registration, signed upload, task creation, polling and persistence path. [Provider task receipts](live-api-evidence.json).
- Every fixture result was compared with its source images. Eleven were useful for limited appearance review and one was flagged for invented rolled cuffs. [Visual review](preview-quality-review.md).
- The 1280×720 gallery cover was rendered and visually inspected. Its images are unchanged YouCam outputs; it is an explanatory cover, not a screenshot of the app.
- The initial desktop page was inspected in Chrome. A server/client timezone mismatch was found and fixed with explicit UTC formatting. Further native browser interaction was interrupted by the user's active Chrome session; no full desktop/mobile click-through is claimed here.

## Boundaries

The automated HTTP checks run against the local worker and database. They do not establish production browser behavior or access for anonymous judges. Production deployment, public repository CI and final judge access must be verified separately.

There is no real-user study, physical fitting study or measured savings claim. Synthetic fixtures establish a working controlled demonstration. They do not estimate broad virtual-try-on accuracy.
