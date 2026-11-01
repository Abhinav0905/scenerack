"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Download,
  Flag,
  Shirt as Hanger,
  ImagePlus,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type {
  DecisionStatus,
  Garment,
  Plan,
  Preview,
  Project,
} from "@/lib/model";
import { money, pairKey } from "@/lib/model";
import { seedProject } from "@/lib/seed";
import { solve } from "@/lib/planner";

type Snapshot = {
  project: Project;
  version: number;
  plan: Plan;
  baseline: Plan;
  sample: boolean;
};
type ProviderStatus = {
  configured: boolean;
  enabled: boolean;
  costLimit: number;
  unitCap: number;
};
type Tab = "production" | "preview" | "wardrobe" | "pull";
type Editor = { kind: "actor" | "garment"; id: string } | null;
const initial = seedProject();
const labels: Record<DecisionStatus, string> = {
  pending: "Needs a decision",
  approved: "Approved",
  rejected: "Look rejected",
  flagged: "Preview flagged",
};
const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "production", label: "Scene board", icon: Users },
  { id: "preview", label: "Preview room", icon: Sparkles },
  { id: "wardrobe", label: "Wardrobe", icon: Hanger },
  { id: "pull", label: "Pull & rent", icon: ClipboardList },
];
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok)
    throw new Error(body.error || "That did not save. Please try again.");
  return body;
}
function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csv = (s: unknown) => `"${String(s ?? "").replaceAll('"', '""')}"`;

export default function Studio() {
  const [data, setData] = useState<Snapshot>({
    project: initial,
    version: 0,
    plan: solve(initial),
    baseline: solve(initial),
    sample: true,
  });
  const [loaded, setLoaded] = useState(false),
    [tab, setTab] = useState<Tab>("production");
  const [lookId, setLookId] = useState("archivist"),
    [garmentId, setGarmentId] = useState("brown");
  const [previews, setPreviews] = useState<Preview[]>([]),
    [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [busy, setBusy] = useState(false),
    [generating, setGenerating] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(false),
    [note, setNote] = useState(""),
    [editor, setEditor] = useState<Editor>(null),
    [resetOpen, setResetOpen] = useState(false);
  const [uploadPermission, setUploadPermission] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false),
    [compare, setCompare] = useState(false),
    [referenceReview, setReferenceReview] = useState(false);
  const workspace = useRef<HTMLElement>(null),
    modal = useRef<HTMLDialogElement>(null);
  const project = data.project,
    plan = data.plan;
  const look = project.looks.find((l) => l.id === lookId) ?? project.looks[0],
    actor = project.actors.find((a) => a.id === look.actorId)!;
  const garment =
    project.garments.find((g) => g.id === garmentId) ?? project.garments[0];
  const decision = project.decisions[pairKey(look.id, garment.id)],
    preview = previews.find(
      (p) =>
        p.actorId === actor.id &&
        p.garmentId === garment.id &&
        p.actorImage === actor.image &&
        p.garmentImage === garment.image &&
        p.category === garment.category,
    );
  const brownApproved =
    plan.assignments.some(
      (a) => a.lookId === "archivist" && a.garmentId === "brown",
    ) &&
    plan.assignments.some(
      (a) => a.lookId === "visitor" && a.garmentId === "navy",
    ) &&
    plan.cost === 0;
  const modifiedInventory =
    JSON.stringify(project.garments.map((g) => [g.id, g.cost, g.available])) !==
    JSON.stringify(initial.garments.map((g) => [g.id, g.cost, g.available]));
  const saved = plan.cost !== null ? (data.baseline.cost ?? 0) - plan.cost : 0;
  const refreshPreviews = useCallback(async () => {
    const r = await api<{ previews: Preview[] }>("/api/previews");
    setPreviews(r.previews);
  }, []);
  useEffect(() => {
    let active = true;
    api<Snapshot>("/api/project")
      .then(async (p) => {
        const [s, v] = await Promise.all([
          api<ProviderStatus>("/api/status"),
          api<{ previews: Preview[] }>("/api/previews"),
        ]);
        return [p, s, v] as const;
      })
      .then(([p, s, v]) => {
        if (active) {
          setData(p);
          setProvider(s);
          setPreviews(v.previews);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        refreshPreviews().catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [loaded, refreshPreviews]);
  useEffect(() => {
    setNote(decision?.note?.startsWith("Preset") ? "" : (decision?.note ?? ""));
    setCompare(false);
    setReferenceReview(false);
  }, [lookId, garmentId, decision?.note]);
  useEffect(() => {
    if ((editor || resetOpen) && modal.current && !modal.current.open)
      modal.current.showModal();
  }, [editor, resetOpen]);
  function open(next: Tab, selectedLook?: string, selectedGarment?: string) {
    setTab(next);
    if (selectedLook) setLookId(selectedLook);
    if (selectedGarment) setGarmentId(selectedGarment);
    workspace.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function save(next: Project, message: string) {
    setBusy(true);
    setError("");
    try {
      const r = await api<Snapshot>("/api/project", {
        method: "POST",
        body: JSON.stringify({ project: next, version: data.version }),
      });
      setData(r);
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function withEvent(p: Project, text: string) {
    return {
      ...p,
      events: [
        { id: crypto.randomUUID(), text, at: new Date().toISOString() },
        ...p.events,
      ].slice(0, 50),
    };
  }
  async function review(status: DecisionStatus) {
    if (!loaded || busy) return;
    const basis =
      preview?.status === "success" && !referenceReview
        ? "youcam"
        : "reference";
    const next = structuredClone(project);
    next.decisions[pairKey(look.id, garment.id)] = {
      status,
      note,
      updatedAt: new Date().toISOString(),
      basis,
      ...(basis === "youcam" ? { previewId: preview!.id } : {}),
    };
    await save(
      withEvent(
        next,
        `${actor.name} / ${garment.name}: ${labels[status].toLowerCase()}${basis === "youcam" ? " after YouCam preview" : " from garment reference"}.`,
      ),
      status === "approved"
        ? "Appearance approved. The plan has been recalculated."
        : status === "flagged"
          ? "Preview flagged. This look stays unresolved until you review it."
          : "Look rejected. The plan has been recalculated.",
    );
  }
  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const r = await api<{ preview: Preview; reused: boolean }>(
        "/api/previews",
        {
          method: "POST",
          body: JSON.stringify({
            actorId: actor.id,
            garmentId: garment.id,
            consent,
            retry: preview?.status === "error",
          }),
        },
      );
      setPreviews((p) => [
        r.preview,
        ...p.filter((x) => x.id !== r.preview.id),
      ]);
      setNotice(
        r.reused
          ? "Opened the saved request. No extra units spent."
          : "Images sent to YouCam. You can keep working while it renders.",
      );
    } catch (e) {
      setError((e as Error).message);
      await refreshPreviews().catch(() => {});
    } finally {
      setGenerating(false);
    }
  }
  async function updateGarment(id: string, patch: Partial<Garment>) {
    await save(
      withEvent(
        {
          ...project,
          garments: project.garments.map((g) =>
            g.id === id ? { ...g, ...patch } : g,
          ),
        },
        `${project.garments.find((g) => g.id === id)!.name}: wardrobe record updated.`,
      ),
      "Wardrobe saved. The plan has been checked again.",
    );
  }
  function exportCSV() {
    const rows: unknown[][] = [
      [
        "SceneRack",
        project.title,
        plan.status === "ready"
          ? "Appearance and stock plan"
          : "DRAFT: plan needs attention",
      ],
      [
        "Item",
        "Source",
        "Location",
        "Performers",
        "Scenes",
        "Cost (USD)",
        "Fitting",
      ],
    ];
    for (const g of plan.sourceItems) {
      const assigns = plan.assignments.filter((a) => a.garmentId === g.id);
      rows.push([
        g.name,
        g.source,
        g.location,
        [
          ...new Set(
            assigns.map(
              (a) => project.actors.find((x) => x.id === a.actorId)!.name,
            ),
          ),
        ].join(" / "),
        [...new Set(assigns.flatMap((a) => a.scenes))]
          .map((s) => project.scenes.find((x) => x.id === s)!.name)
          .join(" / "),
        g.cost,
        "Physical fitting required",
      ]);
    }
    rows.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      plan.cost ?? "Incomplete",
      "Sample costs; no order placed",
    ]);
    download(
      `scenerack-${plan.status === "ready" ? "pull-list" : "draft"}.csv`,
      rows.map((r) => r.map(csv).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      setData(
        await api<Snapshot>("/api/project", {
          method: "POST",
          body: JSON.stringify({ reset: true, version: data.version }),
        }),
      );
      await refreshPreviews();
      closeModal();
      setNotice("Sample reset. Saved YouCam previews are still available.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function closeModal() {
    modal.current?.close();
    setEditor(null);
    setResetOpen(false);
    setUploadPermission(false);
  }
  async function uploadPhoto(file?: File) {
    if (!file || !editor || !uploadPermission) return;
    const target = editor;
    setUploadBusy(true);
    setError("");
    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 15000000
      )
        throw new Error("Choose a JPG, PNG or WebP smaller than 15 MB.");
      const bitmap = await createImageBitmap(file),
        canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#eeeae2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("Could not read this image.")),
          "image/jpeg",
          0.9,
        ),
      );
      const form = new FormData();
      form.set("image", blob, "photo.jpg");
      form.set("permission", "true");
      const r = await api<{ image: string }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      const next = structuredClone(project);
      if (target.kind === "actor")
        next.actors.find((a) => a.id === target.id)!.image = r.image;
      else next.garments.find((g) => g.id === target.id)!.image = r.image;
      if (
        await save(
          withEvent(
            next,
            "A source photo changed. Affected appearance approvals need review.",
          ),
          "Photo saved. Review this look again before it can enter the plan.",
        )
      ) {
        await refreshPreviews();
        closeModal();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <>
      <a href="#workspace" className="skip-link">
        Skip to costume planner
      </a>
      <header className="site-header">
        <a href="#" className="brand" aria-label="SceneRack home">
          <span className="brand-mark">
            <Hanger size={23} />
          </span>
          SceneRack<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">The idea</a>
          <a href="/evidence">
            Build & evidence <ArrowUpRight size={13} />
          </a>
          <button
            className="button small dark"
            onClick={() => open("production")}
          >
            Open the studio <ArrowRight size={15} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> COSTUME PLANNING, BEFORE YOU SPEND
            </div>
            <h1 id="hero-title">
              One jacket.
              <br />
              Two actors.
              <br />
              <em>One scene.</em>
            </h1>
            <p className="hero-deck">
              A great costume idea falls apart when two people need the same
              piece. Small productions don't have the budget to buy their way
              out.
            </p>
            <p className="hero-solution">
              Preview what you already own. Approve the look. Get a costume plan
              your wardrobe can actually support.
            </p>
            <div className="hero-actions">
              <button
                className="button dark"
                onClick={() => open("production")}
              >
                Solve the sample production <ArrowRight size={18} />
              </button>
              <span>
                3 performers. 8 pieces.
                <br />
                One shared wardrobe.
              </span>
            </div>
            <div className="hero-foot">
              <Scissors size={14} /> Made for the people behind the curtain.
            </div>
          </div>
          <div
            className="hero-stage"
            aria-label="Two performers want the only navy blazer"
          >
            <div className="stage-topline">
              <span>THE LAST PLATFORM</span>
              <span>SCENE 01 / ARRIVAL</span>
            </div>
            <div className="actor-pin pin-maya">
              <div className="tape" />
              <img
                src="/assets/actor-maya.jpg"
                alt="Maya, a synthetic adult performer, in her original neutral outfit"
              />
              <div className="pin-caption">
                <span>Maya</span>
                <small>The archivist</small>
              </div>
            </div>
            <div className="actor-pin pin-leo">
              <div className="tape" />
              <img
                src="/assets/actor-leo.jpg"
                alt="Leo, a synthetic adult performer, in his original neutral outfit"
              />
              <div className="pin-caption">
                <span>Leo</span>
                <small>The visitor</small>
              </div>
            </div>
            <div className="conflict-line left" />
            <div className="conflict-line right" />
            <div className="jacket-pin">
              <img
                src="/assets/garment-navy.jpg"
                alt="One physical navy blazer in the sample wardrobe"
              />
              <span className="stock-tag">1 IN STOCK</span>
            </div>
            <div className="conflict-note">
              <span className="rust-dot" /> Two preferred looks. One physical
              piece.
            </div>
            <div className="stage-footer">
              <span>REFERENCE PHOTOS</span>
              <span>Synthetic sample cast & wardrobe</span>
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="how-strip section-shell"
          aria-label="Problem, approach and result"
        >
          <div>
            <span className="step-num">01 / THE PROBLEM</span>
            <h2>A mood board can't catch a stock conflict.</h2>
            <p>
              Costumes compete for the same garments. Finding out at the fitting
              means extra rentals and rushed decisions.
            </p>
          </div>
          <div>
            <span className="step-num">02 / THE APPROACH</span>
            <h2>Try the look before you commit.</h2>
            <p>
              YouCam puts a garment reference on a performer photo. You decide
              if the appearance works for the role.
            </p>
          </div>
          <div>
            <span className="step-num">03 / THE RESULT</span>
            <h2>An approved plan. A shorter rental list.</h2>
            <p>
              SceneRack checks shared stock, availability and budget, then tells
              you exactly what to pull, borrow or rent.
            </p>
          </div>
        </section>
        <section
          className="studio-section"
          id="workspace"
          ref={workspace}
          aria-labelledby="workspace-title"
        >
          <div className="section-shell">
            <div className="studio-heading">
              <div>
                <div className="eyebrow">YOUR COSTUME WORKROOM</div>
                <h2 id="workspace-title">
                  {project.title}
                  <span className="pill neutral">Sample production</span>
                </h2>
                <p>
                  Resolve the shared blazer. Keep the characters. Spend less.
                </p>
              </div>
              <button
                className="text-button reset-button"
                onClick={() => setResetOpen(true)}
                disabled={!loaded || busy}
              >
                <RefreshCw size={14} />
                Reset sample
              </button>
            </div>
            {error && (
              <div className="alert error" role="alert">
                <span>{error}</span>
                <button aria-label="Dismiss error" onClick={() => setError("")}>
                  <X size={17} />
                </button>
              </div>
            )}
            <div className="status-message" aria-live="polite" role="status">
              {busy
                ? "Saving and checking the plan…"
                : notice ||
                  (!loaded
                    ? "Loading your workroom…"
                    : "Your work saves automatically after each decision.")}
            </div>
            <div className="workroom">
              <div className="workroom-main">
                <div
                  className="tabs"
                  role="tablist"
                  aria-label="Costume planner views"
                >
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      id={`tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls={`panel-${t.id}`}
                      onClick={() => setTab(t.id)}
                    >
                      <t.icon size={17} />
                      {t.label}
                      {t.id === "pull" && (
                        <span className="tab-count">
                          {plan.sourceItems.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div
                  id={`panel-${tab}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${tab}`}
                  className={`panel panel-${tab}`}
                >
                  {tab === "production" && (
                    <>
                      <div className="panel-heading">
                        <div>
                          <h3>The scene board</h3>
                          <p>
                            One row per performer. One real item per assignment.
                          </p>
                        </div>
                        <span
                          className={`pill ${plan.status === "ready" ? "green" : "rust"}`}
                        >
                          {plan.status === "ready" ? (
                            <Check size={13} />
                          ) : (
                            <Flag size={13} />
                          )}{" "}
                          {plan.status === "ready"
                            ? "Stock checked"
                            : "Needs attention"}
                        </span>
                      </div>
                      <div className="story-callout">
                        <div className="callout-icon">
                          <Hanger size={20} />
                        </div>
                        <div>
                          <strong>
                            {brownApproved
                              ? "The owned alternative changes the plan."
                              : "Both Maya and Leo prefer the navy blazer."}
                          </strong>
                          <p>
                            {brownApproved
                              ? "Maya can wear the brown jacket. Leo gets the navy blazer. The $65 burgundy rental drops out of the sample plan."
                              : modifiedInventory || plan.status !== "ready"
                                ? "Your wardrobe constraints have changed. The board shows the current feasible allocation; unresolved requirements stay visible."
                                : "They share the opening scene. With the original approvals, Leo needs the $65 burgundy rental. Review Maya's brown jacket to try another route."}
                          </p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => open("preview", "archivist", "brown")}
                        >
                          {brownApproved
                            ? "Review again"
                            : "Review alternative"}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="scene-board-scroll">
                        <table className="scene-board">
                          <thead>
                            <tr>
                              <th>PERFORMER / ROLE</th>
                              {project.scenes.map((s, i) => (
                                <th key={s.id}>
                                  <small>SCENE 0{i + 1}</small>
                                  {s.name}
                                  <span>
                                    {s.start}–{s.end} min
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {project.actors.map((a) => {
                              const aLook = project.looks.find(
                                  (l) => l.actorId === a.id,
                                ),
                                assigned = plan.assignments.find(
                                  (x) => x.actorId === a.id,
                                ),
                                g = project.garments.find(
                                  (x) => x.id === assigned?.garmentId,
                                );
                              return (
                                <tr key={a.id}>
                                  <th scope="row">
                                    <div className="performer-cell">
                                      <img src={a.image} alt="" />
                                      <div>
                                        <strong>{a.name}</strong>
                                        <span>{a.character}</span>
                                        <button
                                          onClick={() =>
                                            setEditor({
                                              kind: "actor",
                                              id: a.id,
                                            })
                                          }
                                          disabled={!loaded}
                                        >
                                          Change photo
                                        </button>
                                      </div>
                                    </div>
                                  </th>
                                  {project.scenes.map((s) => (
                                    <td key={s.id}>
                                      {aLook?.scenes.includes(s.id) ? (
                                        g ? (
                                          <button
                                            className="scene-look"
                                            onClick={() =>
                                              open("preview", aLook.id, g.id)
                                            }
                                          >
                                            <span
                                              className="swatch"
                                              style={{ background: g.color }}
                                            />
                                            <strong>{g.name}</strong>
                                            <span>
                                              {g.source} · {money(g.cost)}
                                            </span>
                                            <small>
                                              <Check size={11} />
                                              Appearance approved
                                            </small>
                                          </button>
                                        ) : (
                                          <div className="empty-scene">
                                            <Flag size={17} />
                                            <span>No approved assignment</span>
                                          </div>
                                        )
                                      ) : (
                                        <span className="offstage">
                                          Offstage
                                        </span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="board-bottom">
                        <span>
                          <ShieldCheck size={16} /> Shared-stock checks run
                          after every change.
                        </span>
                        <span>
                          Appearance approval is not a physical fitting.
                        </span>
                      </div>
                      <details className="details">
                        <summary>
                          Why this plan? <ChevronDown size={15} />
                        </summary>
                        <div>
                          <p>
                            The planner picks the lowest acquisition cost among
                            approved, available and wearer-eligible candidates.
                            A physical item is paid for once, even when it
                            appears in several scenes.
                          </p>
                          {plan.preferredConflicts.map((c, i) => (
                            <p key={i} className="reason-row">
                              <Flag size={14} />
                              {c}
                            </p>
                          ))}
                          <p>
                            {plan.evaluated} complete assignment combinations
                            considered. Items stay with one performer unless you
                            explicitly allow a handoff.
                          </p>
                        </div>
                      </details>
                    </>
                  )}

                  {tab === "preview" && (
                    <>
                      <div className="panel-heading">
                        <div>
                          <h3>See it. Then decide.</h3>
                          <p>
                            A visual rehearsal, before the physical fitting.
                          </p>
                        </div>
                        <span
                          className={`pill ${provider?.enabled && provider?.configured ? "green" : "neutral"}`}
                        >
                          <span className="tiny-dot" />
                          {provider?.enabled && provider?.configured
                            ? "YouCam connected"
                            : "Saved / reference review"}
                        </span>
                      </div>
                      <div className="preview-selectors">
                        <label>
                          PERFORMER & ROLE
                          <select
                            value={look.id}
                            onChange={(e) => {
                              const l = project.looks.find(
                                (x) => x.id === e.target.value,
                              )!;
                              setLookId(l.id);
                              setGarmentId(l.candidates[0]);
                            }}
                          >
                            {project.looks.map((l) => (
                              <option key={l.id} value={l.id}>
                                {
                                  project.actors.find(
                                    (a) => a.id === l.actorId,
                                  )!.name
                                }{" "}
                                · {l.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div
                          className="candidate-tabs"
                          aria-label="Garment candidates"
                        >
                          {look.candidates.map((id) => {
                            const g = project.garments.find(
                                (x) => x.id === id,
                              )!,
                              d = project.decisions[pairKey(look.id, id)];
                            return (
                              <button
                                className={garment.id === id ? "selected" : ""}
                                key={id}
                                onClick={() => setGarmentId(id)}
                                aria-pressed={garment.id === id}
                              >
                                <span
                                  className="swatch"
                                  style={{ background: g.color }}
                                />
                                <span>
                                  {g.name}
                                  <small>
                                    {g.source} · {money(g.cost)}
                                  </small>
                                </span>
                                {d?.status === "approved" && (
                                  <Check size={13} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="preview-grid">
                        <div className="preview-photo">
                          <div className="photo-label">
                            <span>01 / PERFORMER</span>
                            <button
                              aria-label={`Replace ${actor.name}'s photo`}
                              onClick={() =>
                                setEditor({ kind: "actor", id: actor.id })
                              }
                            >
                              <ImagePlus size={15} />
                            </button>
                          </div>
                          <img
                            src={actor.image}
                            alt={`${actor.name} in the original source photo`}
                          />
                          <div className="photo-caption">
                            <strong>{actor.name}</strong>
                            <span>{actor.character}</span>
                          </div>
                        </div>
                        <div className="preview-photo result-photo">
                          <div className="photo-label">
                            <span>
                              {preview?.status === "success"
                                ? "02 / YOUCAM PREVIEW"
                                : "02 / VISUAL REHEARSAL"}
                            </span>
                            {preview?.status === "success" && (
                              <button
                                className={compare ? "active" : ""}
                                onClick={() => setCompare(!compare)}
                                aria-pressed={compare}
                              >
                                Compare original
                              </button>
                            )}
                          </div>
                          {preview?.status === "success" ? (
                            <>
                              <img
                                src={compare ? actor.image : preview.image}
                                alt={
                                  compare
                                    ? `${actor.name}'s original photo for comparison`
                                    : `YouCam generated appearance preview of ${actor.name} wearing the ${garment.name}`
                                }
                              />
                              <div className="generated-label">
                                <Sparkles size={12} />
                                {compare
                                  ? "Original input"
                                  : preview.source === "recorded"
                                    ? "Saved real YouCam result"
                                    : "Real YouCam result"}
                              </div>
                            </>
                          ) : (
                            <div className="preview-placeholder">
                              {generating ||
                              preview?.status === "processing" ||
                              preview?.status === "queued" ? (
                                <>
                                  <LoaderCircle className="spin" size={32} />
                                  <h4>Rehearsing the look</h4>
                                  <p>
                                    YouCam is working on these two images. You
                                    can switch tabs while it renders.
                                  </p>
                                  <span>Updates every 10 seconds</span>
                                </>
                              ) : (
                                <>
                                  <div className="placeholder-garment">
                                    <img
                                      src={garment.image}
                                      alt={`${garment.name}, garment reference only`}
                                    />
                                  </div>
                                  <h4>
                                    {preview?.status === "error" ||
                                    preview?.status === "uncertain"
                                      ? "This preview needs attention"
                                      : "The next look starts here."}
                                  </h4>
                                  <p>
                                    {preview?.message ||
                                      `Preview ${garment.name.toLowerCase()} on ${actor.name}, then decide if it suits the role.`}
                                  </p>
                                  <span>
                                    Garment reference. Not a try-on result.
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                          <div className="photo-caption">
                            <strong>{garment.name}</strong>
                            <span>
                              {garment.source} · {money(garment.cost)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="generation-bar">
                        <div className="garment-mini">
                          <img src={garment.image} alt="" />
                          <div>
                            <strong>The exact garment reference</strong>
                            <p>
                              {garment.name} ·{" "}
                              {garment.category === "outer"
                                ? "Outer layer"
                                : "Top"}
                            </p>
                          </div>
                        </div>
                        {preview?.status === "success" ? (
                          <div className="saved-generation">
                            <span className="generation-proof">
                              <Check size={15} />
                              Saved result · {preview.units} units
                              {preview.elapsedMs
                                ? ` · ${Math.round(preview.elapsedMs / 1000)}s`
                                : ""}
                            </span>
                            {preview.source === "recorded" &&
                              provider?.enabled &&
                              provider?.configured && (
                                <>
                                  <label className="check-label">
                                    <input
                                      type="checkbox"
                                      checked={consent}
                                      onChange={(e) =>
                                        setConsent(e.target.checked)
                                      }
                                    />
                                    Send these sample photos to YouCam again.
                                  </label>
                                  <button
                                    className="text-button"
                                    disabled={!consent || generating}
                                    onClick={generate}
                                  >
                                    <RefreshCw size={12} />
                                    {generating
                                      ? "Sending…"
                                      : "Generate a fresh preview · 2 units"}
                                  </button>
                                </>
                              )}
                          </div>
                        ) : (
                          <div className="generate-controls">
                            <label className="check-label">
                              <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                              />
                              Send these photos to YouCam for this preview. I
                              have permission for this processing.
                            </label>
                            <button
                              className="button dark small"
                              onClick={generate}
                              disabled={
                                !loaded ||
                                !consent ||
                                generating ||
                                preview?.status === "processing" ||
                                preview?.status === "queued" ||
                                !provider?.configured ||
                                !provider?.enabled
                              }
                            >
                              <Sparkles size={15} />
                              {generating
                                ? "Sending…"
                                : preview?.status === "error"
                                  ? "Retry preview"
                                  : "Generate preview"}
                              <span className="unit-badge">≤ 2 units</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {!provider?.configured && (
                        <p className="inline-note">
                          New generation is not configured on this instance. You
                          can inspect garment references and record manual
                          appearance decisions.
                        </p>
                      )}
                      <div className="review-box">
                        <div className="review-header">
                          <div>
                            <span className="step-num">YOUR CALL</span>
                            <h4>
                              Does this look work for {look.name.toLowerCase()}?
                            </h4>
                          </div>
                          <span
                            className={`pill ${decision?.status === "approved" ? "green" : decision?.status === "rejected" ? "rust" : "neutral"}`}
                          >
                            {labels[decision?.status ?? "pending"]}
                          </span>
                        </div>
                        <label className="review-note-label">
                          Direction note <span>(optional)</span>
                          <input
                            value={note}
                            maxLength={500}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. The worn brown jacket suits the archivist."
                          />
                        </label>
                        {preview?.status === "success" && (
                          <label className="check-label manual-review">
                            <input
                              type="checkbox"
                              checked={referenceReview}
                              onChange={(e) =>
                                setReferenceReview(e.target.checked)
                              }
                            />
                            Use the original garment reference for this
                            decision.
                          </label>
                        )}
                        <div className="review-actions">
                          <button
                            className="button dark"
                            onClick={() => review("approved")}
                            disabled={!loaded || busy}
                          >
                            <Check size={16} />
                            {preview?.status === "success" && !referenceReview
                              ? "Approve this look"
                              : "Approve from reference"}
                          </button>
                          <button
                            className="button outline"
                            onClick={() => review("rejected")}
                            disabled={!loaded || busy}
                          >
                            <X size={16} />
                            Reject the look
                          </button>
                          <button
                            className="text-button"
                            onClick={() => review("flagged")}
                            disabled={!loaded || busy}
                          >
                            <Flag size={15} />
                            Flag preview quality
                          </button>
                        </div>
                        <p className="review-explainer">
                          {preview?.status === "success"
                            ? "A YouCam preview informs appearance only. Inspect the face, hands, garment details and layers before approving."
                            : "This is a manual decision using the original garment reference. It will be labeled as such in the plan."}{" "}
                          Flagging a preview keeps the look unresolved; it does
                          not mean the physical garment is unsuitable.
                        </p>
                      </div>
                    </>
                  )}

                  {tab === "wardrobe" && (
                    <>
                      <div className="panel-heading">
                        <div>
                          <h3>Start with what you have.</h3>
                          <p>
                            Each card is one physical piece, with one source and
                            one cost.
                          </p>
                        </div>
                        <span className="pill neutral">
                          {project.garments.filter((g) => g.available).length}{" "}
                          available
                        </span>
                      </div>
                      <div className="wardrobe-grid">
                        {project.garments.map((g) => (
                          <article
                            className={`garment-card ${!g.available ? "unavailable" : ""}`}
                            key={g.id}
                          >
                            <div className="garment-photo">
                              <img src={g.image} alt={g.name} />
                              <span
                                className={`pill ${g.source === "Owned" ? "green" : "neutral"}`}
                              >
                                {g.source}
                              </span>
                              {!g.available && (
                                <span className="unavailable-stamp">
                                  Unavailable
                                </span>
                              )}
                            </div>
                            <div className="garment-info">
                              <div>
                                <h4>{g.name}</h4>
                                <strong>{money(g.cost)}</strong>
                              </div>
                              <p>{g.location}</p>
                              <div className="garment-card-actions">
                                <label className="check-label">
                                  <input
                                    type="checkbox"
                                    checked={g.available}
                                    disabled={!loaded || busy}
                                    onChange={(e) =>
                                      updateGarment(g.id, {
                                        available: e.target.checked,
                                      })
                                    }
                                  />
                                  Available
                                </label>
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    setEditor({ kind: "garment", id: g.id })
                                  }
                                >
                                  Edit item <ArrowUpRight size={13} />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <p className="inline-note">
                        <CircleHelp size={15} />
                        Sample prices and wearer eligibility are fictional
                        inputs. Confirm measurements, condition and real quotes
                        before using a plan for a production.
                      </p>
                    </>
                  )}

                  {tab === "pull" && (
                    <>
                      <div className="panel-heading">
                        <div>
                          <h3>
                            {plan.status === "ready"
                              ? "Your next move is clear."
                              : "Finish the plan before you pull."}
                          </h3>
                          <p>
                            A practical list for the wardrobe team. No purchases
                            are placed.
                          </p>
                        </div>
                        <PackageCheck size={25} />
                      </div>
                      <div className="result-banner">
                        <span className="step-num">
                          THE RESULT / MODELED SAMPLE COST
                        </span>
                        <div className="result-numbers">
                          <div>
                            <span>Original sample</span>
                            <strong>{money(data.baseline.cost ?? 0)}</strong>
                          </div>
                          <ArrowRight size={25} />
                          <div>
                            <span>Current plan</span>
                            <strong>
                              {plan.cost === null
                                ? "Unresolved"
                                : money(plan.cost)}
                            </strong>
                          </div>
                          <div className="result-delta">
                            {saved > 0 && !modifiedInventory ? (
                              <>
                                <span>{money(saved)} less to rent</span>
                                <small>after an appearance decision</small>
                              </>
                            ) : (
                              <>
                                <span>
                                  {plan.sourceItems.length} physical pieces
                                </span>
                                <small>each item counted once</small>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {plan.blockers.length > 0 && (
                        <div className="alert error">
                          {plan.blockers.join(" ")}
                        </div>
                      )}
                      <div className="pull-table-wrap">
                        <table className="pull-table">
                          <thead>
                            <tr>
                              <th>PIECE / SOURCE</th>
                              <th>PERFORMER & SCENES</th>
                              <th>PULL LOCATION</th>
                              <th>COST</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.sourceItems.map((g) => (
                              <tr key={g.id}>
                                <td>
                                  <div className="pull-item">
                                    <img src={g.image} alt="" />
                                    <div>
                                      <strong>{g.name}</strong>
                                      <span>{g.source}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {plan.assignments
                                    .filter((a) => a.garmentId === g.id)
                                    .map((a) => (
                                      <div
                                        className="pull-assignment"
                                        key={a.lookId}
                                      >
                                        <strong>
                                          {
                                            project.actors.find(
                                              (x) => x.id === a.actorId,
                                            )!.name
                                          }
                                        </strong>
                                        <span>
                                          {a.scenes
                                            .map(
                                              (s) =>
                                                `Scene ${project.scenes.findIndex((x) => x.id === s) + 1}`,
                                            )
                                            .join(" · ")}
                                        </span>
                                        <small>
                                          {project.decisions[
                                            pairKey(a.lookId, g.id)
                                          ]?.basis === "youcam"
                                            ? "YouCam preview approved"
                                            : "Reference approved"}
                                        </small>
                                      </div>
                                    ))}
                                </td>
                                <td>{g.location}</td>
                                <td>{money(g.cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th colSpan={3}>TOTAL ACQUISITION COST</th>
                              <td>
                                {plan.cost === null ? "—" : money(plan.cost)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {!plan.sourceItems.length && (
                        <p className="empty-list">
                          No complete assignment yet. Review candidates or
                          restore available stock.
                        </p>
                      )}
                      <div className="export-bar">
                        <button
                          className="button dark"
                          onClick={exportCSV}
                          disabled={!loaded || !plan.sourceItems.length}
                        >
                          <Download size={16} />
                          {plan.status === "ready"
                            ? "Export pull list"
                            : "Export draft list"}
                        </button>
                        <button
                          className="button outline"
                          onClick={() => window.print()}
                        >
                          <ClipboardList size={16} />
                          Print plan
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            download(
                              "scenerack-production.json",
                              JSON.stringify(project, null, 2),
                              "application/json",
                            )
                          }
                        >
                          Save project JSON <Download size={14} />
                        </button>
                      </div>
                      <div className="fitting-note">
                        <Scissors size={22} />
                        <div>
                          <strong>Next stop: a real fitting.</strong>
                          <p>
                            Confirm size, movement, condition and quick-change
                            timing with the performers. This plan covers
                            appearance, stock and modeled cost.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <aside className="plan-sidebar" aria-label="Current costume plan">
                <div className="cost-summary">
                  <div className="summary-top">
                    <span>THE CURRENT PLAN</span>
                    <span className="live-tag">
                      <span />
                      {busy ? "Checking" : loaded ? "Saved" : "Loading"}
                    </span>
                  </div>
                  <span className="cost-label">Acquisition cost</span>
                  <strong className="big-cost">
                    {plan.cost === null ? "—" : money(plan.cost)}
                  </strong>
                  <div className="budget-row">
                    <label htmlFor="budget">Production budget</label>
                    <div>
                      <span>$</span>
                      <input
                        id="budget"
                        type="number"
                        min="0"
                        max="100000"
                        step="1"
                        key={project.budget}
                        defaultValue={project.budget}
                        disabled={!loaded || busy}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (
                            Number.isFinite(value) &&
                            value >= 0 &&
                            value <= 100000 &&
                            value !== project.budget
                          )
                            save(
                              withEvent(
                                { ...project, budget: value },
                                `Budget changed to ${money(value)}.`,
                              ),
                              "Budget saved.",
                            );
                          else e.target.value = String(project.budget);
                        }}
                      />
                    </div>
                  </div>
                  <div className="budget-track">
                    <span
                      style={{
                        width: `${Math.min(100, ((plan.cost ?? 0) / Math.max(1, project.budget)) * 100)}%`,
                      }}
                      className={plan.status === "over_budget" ? "over" : ""}
                    />
                  </div>
                  <p
                    className={plan.status !== "ready" ? "budget-warning" : ""}
                  >
                    {plan.remaining === null
                      ? "Review needed before cost can be finalized."
                      : plan.remaining < 0
                        ? `${money(-plan.remaining)} over budget`
                        : `${money(plan.remaining)} left in the budget`}
                  </p>
                  <div className="source-counts">
                    <div>
                      <strong>{plan.ownedCount}</strong>
                      <span>owned</span>
                    </div>
                    <div>
                      <strong>
                        {
                          plan.sourceItems.filter(
                            (g) => g.source === "Borrowed",
                          ).length
                        }
                      </strong>
                      <span>borrowed</span>
                    </div>
                    <div>
                      <strong>{plan.rentalCount}</strong>
                      <span>to rent</span>
                    </div>
                  </div>
                  <button
                    className="button light full"
                    onClick={() => setTab("pull")}
                  >
                    View pull & rent list <ArrowRight size={16} />
                  </button>
                  <small>Sample costs. No transaction.</small>
                </div>
                <div className="next-decision">
                  <span className="step-num">
                    {brownApproved
                      ? "A DECISION WITH AN EFFECT"
                      : "THE DECISION TO TRY"}
                  </span>
                  <img
                    src="/assets/garment-brown.jpg"
                    alt="Brown chore jacket from the owned wardrobe"
                  />
                  <h4>
                    {brownApproved
                      ? "The brown jacket is in."
                      : "Could the brown jacket work?"}
                  </h4>
                  <p>
                    {brownApproved
                      ? "Check the scene board, then reject the look to see the rental return. Every decision stays in your hands."
                      : "It is already on the rack. Review it on Maya before committing to another rental."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => open("preview", "archivist", "brown")}
                  >
                    {brownApproved
                      ? "Revisit the decision"
                      : "Open the preview room"}
                    <ArrowRight size={15} />
                  </button>
                </div>
                <details className="activity">
                  <summary>
                    Decision history <ChevronDown size={14} />
                  </summary>
                  <ol>
                    {project.events.slice(0, 8).map((e) => (
                      <li key={e.id}>
                        <span>{e.text}</span>
                        <time>
                          {new Date(e.at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          }) + " UTC"}
                        </time>
                      </li>
                    ))}
                  </ol>
                </details>
              </aside>
            </div>
            <div className="workroom-foot">
              <span>
                <ShieldCheck size={14} /> Your production has its own saved
                workspace.
              </span>
              <span>
                Synthetic adults · YouCam appearance previews · Human approval
              </span>
            </div>
          </div>
        </section>
        <section className="closing section-shell">
          <div>
            <div className="eyebrow">LESS GUESSWORK. MORE REHEARSAL.</div>
            <h2>
              The right look should
              <br />
              also be a workable plan.
            </h2>
          </div>
          <div>
            <p>
              SceneRack joins visual decisions to the physical wardrobe. A saved
              preview has a purpose: it helps you decide what the production
              actually needs.
            </p>
            <a className="text-button" href="/evidence">
              See how it was built, tested and measured{" "}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#" className="brand">
          <Hanger size={20} />
          SceneRack.
        </a>
        <span>Built for the YouCam API Challenge · 2026</span>
        <a href="/evidence">
          Evidence & limitations <ArrowUpRight size={13} />
        </a>
        <a href="/privacy">Photos & privacy</a>
      </footer>
      <dialog
        ref={modal}
        className="edit-dialog"
        onCancel={closeModal}
        onClick={(e) => {
          if (e.target === modal.current) closeModal();
        }}
      >
        <div className="dialog-content">
          <button
            className="close-dialog"
            onClick={closeModal}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
          {resetOpen ? (
            <>
              <span className="eyebrow">START AGAIN</span>
              <h2>Reset this sample?</h2>
              <p>
                This restores the sample approvals, wardrobe and $80 budget.
                Saved YouCam previews stay available, so you can repeat the
                demonstration without another generation.
              </p>
              <div className="dialog-actions">
                <button className="button dark" onClick={reset} disabled={busy}>
                  Reset sample
                </button>
                <button className="button outline" onClick={closeModal}>
                  Keep my changes
                </button>
              </div>
            </>
          ) : (
            editor && (
              <>
                <span className="eyebrow">
                  {editor.kind === "garment"
                    ? "WARDROBE RECORD"
                    : "PERFORMER PHOTO"}
                </span>
                <h2>
                  {editor.kind === "garment"
                    ? project.garments.find((g) => g.id === editor.id)!.name
                    : project.actors.find((a) => a.id === editor.id)!.name}
                </h2>
                {editor.kind === "garment" && (
                  <GarmentForm
                    key={editor.id}
                    garment={project.garments.find((g) => g.id === editor.id)!}
                    project={project}
                    busy={busy}
                    onSave={async (patch) => {
                      if (
                        await save(
                          withEvent(
                            {
                              ...project,
                              garments: project.garments.map((g) =>
                                g.id === editor.id ? { ...g, ...patch } : g,
                              ),
                            },
                            "Wardrobe constraints updated.",
                          ),
                          "Item saved. The plan has been checked again.",
                        )
                      )
                        closeModal();
                    }}
                  />
                )}
                <div className="upload-section">
                  <h3>Replace the source photo</h3>
                  <p>
                    {editor.kind === "actor"
                      ? "Use one adult, facing forward, with the face, torso and hands visible. A neutral outfit works best."
                      : "Use a clear front view of the exact garment on a plain background."}{" "}
                    Changing the photo clears affected appearance approvals.
                  </p>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={uploadPermission}
                      onChange={(e) => setUploadPermission(e.target.checked)}
                    />
                    I have permission to upload and use this image
                    {editor.kind === "actor"
                      ? " and the adult performer consents to YouCam processing"
                      : ""}
                    .
                  </label>
                  <label
                    className={`button outline upload-button ${!uploadPermission || uploadBusy ? "disabled" : ""}`}
                  >
                    <ImagePlus size={16} />
                    {uploadBusy ? "Saving photo…" : "Choose photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={!uploadPermission || uploadBusy}
                      onChange={(e) => uploadPhoto(e.target.files?.[0])}
                    />
                  </label>
                  <small>
                    JPG, PNG or WebP · up to 15 MB. Converted to JPEG without
                    photo metadata. Stored privately in this workspace.
                  </small>
                  <p>
                    Photos are stored on Cloudflare. Generating a preview sends
                    the selected photos to YouCam, whose API terms generally
                    specify 30-day retention. SceneRack has no automatic
                    deletion schedule; resetting the sample does not erase
                    photos.{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer">
                      Read the photo and privacy notice
                    </a>{" "}
                    before uploading.
                  </p>
                </div>
              </>
            )
          )}
        </div>
      </dialog>
    </>
  );
}
function GarmentForm({
  garment: g,
  project: p,
  busy,
  onSave,
}: {
  garment: Garment;
  project: Project;
  busy: boolean;
  onSave: (patch: Partial<Garment>) => void;
}) {
  const [draft, setDraft] = useState(g);
  const patch = (v: Partial<Garment>) => setDraft({ ...draft, ...v });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="garment-form"
    >
      <div className="form-row">
        <label>
          Source
          <select
            value={draft.source}
            onChange={(e) =>
              patch({ source: e.target.value as Garment["source"] })
            }
          >
            <option>Owned</option>
            <option>Borrowed</option>
            <option>Rental</option>
          </select>
        </label>
        <label>
          Acquisition cost (USD)
          <input
            type="number"
            min="0"
            max="100000"
            step="0.01"
            required
            value={draft.cost}
            onChange={(e) => patch({ cost: Number(e.target.value) })}
          />
        </label>
      </div>
      <label>
        Location
        <input
          value={draft.location}
          maxLength={200}
          required
          onChange={(e) => patch({ location: e.target.value })}
        />
      </label>
      <fieldset>
        <legend>Confirmed wearer eligibility</legend>
        <p>
          Set by the wardrobe team after checking measurements. The image model
          does not decide this.
        </p>
        {p.actors.map((a) => (
          <label className="check-label" key={a.id}>
            <input
              type="checkbox"
              checked={draft.eligibleActors.includes(a.id)}
              onChange={(e) =>
                patch({
                  eligibleActors: e.target.checked
                    ? [...draft.eligibleActors, a.id]
                    : draft.eligibleActors.filter((x) => x !== a.id),
                })
              }
            />
            {a.name}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Available for these scenes</legend>
        {p.scenes.map((s) => (
          <label className="check-label" key={s.id}>
            <input
              type="checkbox"
              checked={draft.availableScenes.includes(s.id)}
              onChange={(e) =>
                patch({
                  availableScenes: e.target.checked
                    ? [...draft.availableScenes, s.id]
                    : draft.availableScenes.filter((x) => x !== s.id),
                })
              }
            />
            {s.name}
          </label>
        ))}
      </fieldset>
      <label className="check-label handoff">
        <input
          type="checkbox"
          checked={draft.allowHandoff}
          onChange={(e) => patch({ allowHandoff: e.target.checked })}
        />
        <span>
          Allow a handoff between performers.
          <small>
            I have checked the change time. Overlapping scenes are still
            blocked.
          </small>
        </span>
      </label>
      <button className="button dark" type="submit" disabled={busy}>
        <Check size={16} />
        Save wardrobe record
      </button>
    </form>
  );
}
