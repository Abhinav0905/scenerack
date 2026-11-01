# License scope and third-party materials

The MIT license in `LICENSE` applies to SceneRack's original source code and its accompanying documentation. It does not replace the licenses of dependencies or grant additional rights to media and service outputs.

Dependencies retain their own licenses. Exact package versions are recorded in `package-lock.json`; each installed package includes its applicable license and notices. Preserve those notices when redistributing dependencies. Lucide icons retain their ISC license. React and Next.js retain their MIT licenses. Cloudflare's services and the YouCam API remain subject to their service terms.

Synthetic source portraits and garment references are documented in [docs/assets.md](docs/assets.md) and [public/assets/manifest.json](public/assets/manifest.json). No public-domain status or exclusive copyright is claimed. They are included as sample inputs; the MIT grant for source code does not relicense these images.

The unchanged YouCam outputs are documented in [public/previews/manifest.json](public/previews/manifest.json). Their use remains subject to [YouCam API terms](https://www.perfectcorp.com/perfectbeauty/youcam/terms-of-service-api). Screen captures and the project cover contain these same sample images.

The optional narrated demonstration uses the Kokoro-82M-v1.0 speech model with its generic `af_heart` voice. [Kokoro model weights](https://huggingface.co/hexgrad/Kokoro-82M) are released under Apache 2.0. No person's voice was cloned. The model and its weights are not bundled in the application.
