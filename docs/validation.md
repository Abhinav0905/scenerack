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
- The initial desktop page was inspected in Chrome. A server/client timezone mismatch was found and fixed with explicit UTC formatting. Further native browser interaction was interrupted by the user's active Chrome session. The isolated browser bridge also reported that its access host was unavailable. No full desktop/mobile click-through is claimed here.
- The native Sites deployment succeeded at [the private review app](https://scenerack.abhinav-0905.chatgpt.site).
- [The source repository](https://github.com/Abhinav0905/scenerack) is public. [CI run 41272464511](https://github.com/Abhinav0905/scenerack/actions/runs/41272464511) passed type checking, all 41 automated checks and a production build for application commit `db6646454fe1df5d0f7cebb95ed8504600eab14e`.

## Boundaries

The automated HTTP checks run against the local worker and database. They do not establish production browser behavior or access for anonymous judges. Deployment and public repository CI are verified separately above. The app remains owner-private; final judge access still needs to be enabled and verified.

There is no real-user study, physical fitting study or measured savings claim. Synthetic fixtures establish a working controlled demonstration. They do not estimate broad virtual-try-on accuracy.
