# SceneRack demo input assets

Created October 31, 2026 with OpenAI's built-in imagegen tool for this project. These are synthetic cast portraits and fictional, unbranded garment images. No external photographs, product catalog images, trademarks or reference pictures were supplied to generation.

The files are inputs to the YouCam integration. They are not YouCam results. Do not describe the cast as real participants or the garments as available stock from a real shop. The fictional names are labels for the sample production.

## Files

All final files are JPEG, sRGB, 8-bit, with no alpha channel. Public paths are relative to the application's origin.

| Asset | Public path | Dimensions | Intended input category |
| --- | --- | --- | --- |
| Maya, fictional adult woman | `/assets/actor-maya.jpg` | 768 × 1024 | Person |
| Leo, fictional adult man | `/assets/actor-leo.jpg` | 768 × 1024 | Person |
| Imani, fictional adult woman | `/assets/actor-imani.jpg` | 768 × 1024 | Person |
| Navy blazer | `/assets/garment-navy.jpg` | 1024 × 1024 | `outer` |
| Brown chore jacket | `/assets/garment-brown.jpg` | 1024 × 1024 | `outer` |
| Olive field jacket | `/assets/garment-olive.jpg` | 1024 × 1024 | `outer` |
| Ivory shirt | `/assets/garment-ivory.jpg` | 1024 × 1024 | `upper_body` |
| Charcoal waistcoat | `/assets/garment-charcoal.jpg` | 1024 × 1024 | `outer` |
| Burgundy cardigan | `/assets/garment-burgundy.jpg` | 1024 × 1024 | `outer` |
| Blue denim jacket | `/assets/garment-denim.jpg` | 1024 × 1024 | `outer` |
| Sand linen blazer | `/assets/garment-sand.jpg` | 1024 × 1024 | `outer` |

The category column is the intended use, not evidence that an API call succeeded. The implementation's live task records establish that separately.

## Provenance and use

[The asset manifest](../public/assets/manifest.json) records the exact generation prompt, original generation filename, final file dimensions, byte size and SHA-256 hash for each asset. Generation used no uploaded reference images. The actor prompts requested adults aged 32, 34 and 38.

These files were created in the user-authorized SceneRack build. They have no third-party stock-photo attribution requirement because no stock photos were used. This document does not assign an additional public license or claim public-domain status or exclusive copyright. Keep this provenance with the repository and identify the sample assets as synthetic in the demo.

The original generated PNG files remain under the recorded generation directory inside `/Users/mac001/.codex/generated_images/`. Final workspace copies are self-contained. Image processing only resized and padded the source images, then encoded JPEG at quality 92. No features of the people or garments were retouched after generation.

Two early PNG copies also remain at `public/assets/people/alex.png` and `public/assets/garments/navy-blazer.png`. They are the original versions of Leo and the navy blazer. Use the stable JPEG paths above in application code.

## Visual review

Every original was inspected. The three people face the camera, have visible faces and hands, wear plain gray T-shirts and stand against an uncluttered background. Each garment is a single front-facing product image with no visible branding. Final JPEG dimensions, color space, bit depth and hashes were verified after conversion.

Suggested in-product label: "Synthetic sample cast and wardrobe. Preview generated with YouCam." Use the second sentence only beside an actual YouCam result.
