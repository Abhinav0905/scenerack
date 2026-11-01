import { ArrowLeft, Shirt } from "lucide-react";

export const metadata = { title: "SceneRack | Photos and privacy" };

export default function Privacy() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          <Shirt size={23} />
          SceneRack.
        </a>
        <a className="text-button" href="/#workspace">
          <ArrowLeft size={15} />
          Back to the workroom
        </a>
      </header>
      <main className="evidence-body">
        <section className="evidence-block">
          <div className="eyebrow">PHOTOS AND PRIVACY · NOVEMBER 1, 2026</div>
          <h1>Try the synthetic sample first.</h1>
          <p>
            SceneRack is a hackathon prototype by Kumar Abhinav. Its built-in
            cast and garment images are synthetic. You can use the saved
            previews and the planning tools without uploading a real person's
            photo.
          </p>
          <h2>What is stored</h2>
          <p>
            Your plan, notes, approvals and preview records are saved in
            Cloudflare D1. Uploaded images and newly generated results are saved
            in Cloudflare R2. The app checks access against your workspace. The
            built-in sample assets are public.
          </p>
          <p>
            Without a signed-in platform identity, a necessary HttpOnly session
            cookie identifies your workspace for up to 30 days. Clearing that
            cookie can remove your access to the workspace; it does not delete
            stored records. Do not use a shared browser profile for private
            photos.
          </p>
          <h2>When photos leave SceneRack</h2>
          <p>
            Choosing a photo uploads it to SceneRack's storage. Generating a
            fresh preview sends the selected performer photo and garment
            reference to Perfect Corp.'s YouCam API. This may involve processing
            face geometry. Upload only an adult's photo with their informed
            permission for this processing and permission from the image rights
            holder.
          </p>
          <p>
            The generation checkbox authorizes that specific preview request.
            Opening a saved example does not send a new generation request. See{" "}
            <a
              href="https://www.perfectcorp.com/perfectbeauty/youcam/terms-of-service-api"
              target="_blank"
              rel="noreferrer"
            >
              YouCam API terms
            </a>{" "}
            and{" "}
            <a
              href="https://www.perfectcorp.com/perfectbeauty/youcam/privacy-policy-api"
              target="_blank"
              rel="noreferrer"
            >
              Perfect Corp.'s privacy policy
            </a>{" "}
            for the provider's practices. Its API terms state that inputs and
            outputs are generally retained for 30 days.
          </p>
          <h2>Retention and removal</h2>
          <p>
            This prototype has no automatic deletion schedule or self-service
            deletion control. SceneRack's copies may remain after the provider's
            retention period. Resetting the sample restores planning data and
            keeps saved previews; it does not erase uploaded photos or generated
            results.
          </p>
          <p>
            For a removal request, contact the maintainer through the{" "}
            <a
              href="https://github.com/Abhinav0905/scenerack/issues"
              target="_blank"
              rel="noreferrer"
            >
              project issue tracker
            </a>{" "}
            and request a private follow-up. Do not post photos, session cookies
            or personal details in a public issue. If these storage terms are
            unsuitable, use the synthetic sample.
          </p>
          <h2>What a preview means</h2>
          <p>
            A generated appearance is not proof of fit, condition or exact
            garment detail. Check the real garment and hold a fitting before
            making a purchase or costume decision. SceneRack does not place
            orders or sell access to the YouCam API.
          </p>
        </section>
      </main>
    </>
  );
}
