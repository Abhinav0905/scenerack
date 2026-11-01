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
- The desktop workflow was exercised in Safari: the $65 starting plan, Maya's real brown-jacket preview, approval to $0, persisted decisions after reload, the three-item pull list and reset. Five actual app screenshots were captured and verified after upload to Devpost. A server/client timezone mismatch found during the earlier Chrome review was fixed with explicit UTC formatting. No mobile click-through is claimed.
- The native Sites deployment succeeded at [SceneRack](https://scenerack.abhinav-0905.chatgpt.site). On November 1 UTC, public access was enabled with the owner's approval. Unauthenticated requests returned HTTP 200 for the page, workspace API and saved Maya/brown image.
- [The source repository](https://github.com/Abhinav0905/scenerack) is public. [CI run 41272464511](https://github.com/Abhinav0905/scenerack/actions/runs/41272464511) passed type checking, all 41 automated checks and a production build for application commit `db6646454fe1df5d0f7cebb95ed8504600eab14e`.
- The public and MIT release at `6bab34352bbd91f7aa8bf3ec9611722cecfe78f2` passed [CI run 41275073207](https://github.com/Abhinav0905/scenerack/actions/runs/41275073207), including all 41 checks. The live privacy page was verified separately.
- The public production workflow was exercised in Vivaldi: approve Maya/brown, reload the saved $0 allocation, inspect the pull list, then reject the look to restore $65. The actual CSV export lists navy for Leo, brown for Maya and charcoal for Imani, with a $0 total.
- The [narrated video](https://youtu.be/SG_D5dO7N3s) is 146.167 seconds, 1920×1080 at 30 fps. The full file decoded without errors. Captioned frames and the end card were reviewed, and a full speech-recognition pass checked the narration. Audio peaks at -1.5 dB. YouTube reported no copyright or Community Guidelines issues; the English subtitle import and unlisted publication receipt were verified. Its unauthenticated oEmbed endpoint returned HTTP 200.

## Boundaries

The automated HTTP checks run against the local worker and database. They do not establish production browser behavior by themselves. Deployment, anonymous access and public repository CI are verified separately above. Live generation uses a finite credit allowance; the saved real examples and planner remain usable without a new generation.

There is no real-user study, physical fitting study or measured savings claim. Synthetic fixtures establish a working controlled demonstration. They do not estimate broad virtual-try-on accuracy.
