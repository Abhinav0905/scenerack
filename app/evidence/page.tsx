import { ArrowLeft, ArrowUpRight, Shirt, Check, Flag } from "lucide-react";
import manifest from "@/public/previews/manifest.json";
export const metadata = { title: "SceneRack | Build, results and limits" };
export default function Evidence() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Shirt size={23} />
          </span>
          SceneRack.
        </a>
        <a className="text-button" href="/#workspace">
          <ArrowLeft size={15} />
          Back to the workroom
        </a>
      </header>
      <main>
        <section className="evidence-hero section-shell">
          <div className="eyebrow">THE PROBLEM, THE BUILD, THE EVIDENCE</div>
          <h1>
            A costume preview
            <br />
            needs a workable plan.
          </h1>
          <p>
            Two actors can like the same jacket. They cannot wear the same
            physical jacket in the same scene. SceneRack helps small productions
            turn an appearance decision into an approved allocation and a
            sourcing list, before they spend on another rental.
          </p>
        </section>
        <div className="evidence-body">
          <section className="evidence-block">
            <h2>How the problem is solved</h2>
            <p>
              Start with performer photos, garment references and the scene
              requirements. YouCam AI Clothes v4 generates the appearance
              preview. A person approves the look, rejects it or flags an image
              defect. The planner then chooses the least-cost complete
              allocation that meets the recorded approvals, stock availability,
              wearer eligibility and handoff rules.
            </p>
            <pre>
              Performer + garment → YouCam preview → Human decision{`\n`}→ Stock
              & scene constraints → Pull / borrow / rent list
            </pre>
            <p>
              The API changes a real planning decision. It is not a decorative
              image beside an unrelated recommendation. No generative model
              chooses the budget, invents availability or gives physical-fit
              advice.
            </p>
          </section>
          <section className="evidence-block">
            <h2>What the sample demonstrates</h2>
            <div className="evidence-grid">
              <div className="evidence-stat">
                <strong>$65 → $0</strong>
                <span>
                  Modeled acquisition cost after approving the owned brown
                  jacket
                </span>
              </div>
              <div className="evidence-stat">
                <strong>3 / 3</strong>
                <span>
                  Performers assigned without double-booking physical stock
                </span>
              </div>
              <div className="evidence-stat">
                <strong>1 → 0</strong>
                <span>Rental pieces needed in this fictional scenario</span>
              </div>
            </div>
            <p>
              Initially, Maya and Leo both prefer the only navy blazer. Their
              scenes overlap. Existing reference approvals therefore require a
              $65 burgundy cardigan rental for Leo. Approve the brown chore
              jacket for Maya: she gets brown, Leo gets navy and Imani keeps the
              charcoal waistcoat. Reject that look or withdraw the brown jacket
              from stock and the rental returns.
            </p>
            <p>
              These are calculated outcomes from fictional prices and approvals.
              They are not measured customer savings, actual supplier quotes or
              proof of demand. No orders are placed.
            </p>
          </section>
          <section className="evidence-block">
            <h2>Real API results, with the limits visible</h2>
            <div className="evidence-grid">
              <div className="evidence-stat">
                <strong>12 / 12</strong>
                <span>
                  Selected fixture requests completed through the real YouCam
                  API
                </span>
              </div>
              <div className="evidence-stat">
                <strong>11 / 12</strong>
                <span>
                  Useful for limited appearance review in an AI-assisted visual
                  inspection
                </span>
              </div>
              <div className="evidence-stat">
                <strong>24 units</strong>
                <span>Verified two-unit task price × 12 fixture renders</span>
              </div>
            </div>
            <p>
              The source people are synthetic adults. The eight unbranded
              garments are synthetic references. The resulting try-on images
              were returned by YouCam, then saved unchanged. The recorded
              examples are labeled in the app, and you can request a fresh
              render or replace a source photo.
            </p>
            <p>
              The observed request-to-saved-result times were 11.3–21.9 seconds
              with ten-second polling. This includes uploads, processing,
              polling delay and image storage. It is not a service-latency
              benchmark.
            </p>
            <p>
              One render added rolled cuffs to Leo's brown jacket although the
              source has straight cuffs. That image should be flagged for
              review. It is not evidence against using the physical jacket.
              Other previews change small button, pocket or texture details.
              Keep the garment reference visible, then do a real fitting.
            </p>
            <div className="quality-example">
              <img
                src="/assets/garment-brown.jpg"
                alt="Original brown jacket with straight cuffs"
              />
              <img
                src="/previews/leo-brown.jpg"
                alt="Real YouCam result with invented rolled cuffs that requires review"
              />
              <div>
                <span className="pill rust">
                  <Flag size={12} />
                  Flag the render
                </span>
                <h3>These cuffs changed.</h3>
                <p>
                  The preview-quality action keeps the appearance decision
                  unresolved. The physical item stays in the wardrobe.
                </p>
              </div>
            </div>
            <p>
              <a href="/previews/manifest.json">
                Inspect the result manifest, timestamps and SHA-256 hashes{" "}
                <ArrowUpRight size={12} />
              </a>{" "}
              ·{" "}
              <a href="/assets/manifest.json">
                Source image prompts and provenance
              </a>
            </p>
          </section>
          <section className="evidence-block">
            <h2>What was checked</h2>
            <table className="evidence-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Evidence and scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Planner, validation and admission</td>
                  <td>
                    23 automated checks, including 200 deterministic randomized
                    scenarios. Approvals, stock, eligibility, scene overlap,
                    explicit handoffs, integer-cent costs and incomplete plans.
                  </td>
                </tr>
                <tr>
                  <td>Application boundaries</td>
                  <td>
                    18 local HTTP checks. Separate workspaces, private photos,
                    stale-save rejection, source-change invalidation, verified
                    preview approvals and consent before generation.
                  </td>
                </tr>
                <tr>
                  <td>Live integration</td>
                  <td>
                    File registration, signed uploads, task creation, polling,
                    result download and durable storage exercised by the 12
                    recorded fixtures.
                  </td>
                </tr>
                <tr>
                  <td>Visual review</td>
                  <td>
                    AI-assisted inspection against every original input. Eleven
                    useful for broad appearance review; one flagged. No costume
                    professional has validated these outputs.
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              The test commands and per-image observations are included with the
              source. This is a selected fixture set, not an estimate of
              performance across body types, fabrics, lighting or theatre
              wardrobes.
            </p>
          </section>
          <section className="evidence-block">
            <h2>What happens when something fails</h2>
            <ul>
              <li>
                A missing approval, withdrawn item or impossible stock
                assignment leaves the plan incomplete. The app never silently
                assigns an unapproved alternative.
              </li>
              <li>
                An over-budget solution stays visibly over budget. The exported
                list is marked as a draft.
              </li>
              <li>
                Changing a source photo invalidates its old approvals and hides
                stale previews.
              </li>
              <li>
                A known failed request can be retried deliberately. An ambiguous
                task submission is not automatically repeated and charged again.
              </li>
              <li>
                Live generation has a two-unit price ceiling, a global
                allowance, a per-workspace limit and an atomic active-request
                limit. Saved results remain readable if generation is paused.
              </li>
              <li>
                New uploads and generated results are scoped to the current
                workspace. The public sample assets contain synthetic people
                only.
              </li>
            </ul>
          </section>
          <section className="evidence-block">
            <h2>Scope and next validation</h2>
            <p>
              The prototype supports one continuous look per performer, with a
              bounded set of candidate garments and timed scenes. It models
              individual physical pieces. It does not cover layered costume
              assemblies, multiple interchangeable stock units, real supplier
              inventory or rental booking.
            </p>
            <p>
              The next useful test is a short task with a costume lead: assign a
              real three-scene wardrobe, resolve a clash and explain the
              resulting pull list. Measure task completion, missed conflicts and
              whether the generated look changes a decision. User interviews,
              adoption and revenue have not been claimed.
            </p>
            <p>
              Technical foundation: React and TypeScript, a Vinext server on
              Cloudflare Workers, D1 for production state and jobs, R2 for
              private images, and YouCam Clothes v4 for garment previews.
            </p>
          </section>
          <section className="evidence-block">
            <h2>Official references</h2>
            <p>
              <a href="https://youcam-api-skin-ai-ecommerce.devpost.com/">
                YouCam API Challenge requirements
              </a>{" "}
              ·{" "}
              <a href="https://youcam-api-skin-ai-ecommerce.devpost.com/rules">
                Official judging rules
              </a>{" "}
              ·{" "}
              <a href="https://yce.perfectcorp.com/document/index.html">
                YouCam API documentation
              </a>
            </p>
            <a className="button dark" href="/#workspace">
              Try the production decision <Check size={16} />
            </a>
          </section>
        </div>
      </main>
      <footer className="site-footer">
        <span>
          SceneRack · Evidence recorded October 31, 2026, Pacific time
        </span>
        <span>
          {manifest.length} genuine API results · Synthetic source assets
        </span>
      </footer>
    </>
  );
}
