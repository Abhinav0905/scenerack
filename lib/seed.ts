import type { Project, Garment } from "./model";
const allActors = ["maya", "leo", "imani"];
const allScenes = ["scene-1", "scene-2", "scene-3"];
function garment(
  id: string,
  name: string,
  color: string,
  source: Garment["source"],
  cost: number,
  category: Garment["category"] = "outer",
): Garment {
  return {
    id,
    name,
    color,
    source,
    cost,
    category,
    image: `/assets/garment-${id}.jpg`,
    location:
      source === "Owned"
        ? `Studio rack / ${id.toUpperCase()}`
        : source === "Borrowed"
          ? "Community wardrobe / sample lender"
          : "Sample rental catalog / quote only",
    available: true,
    eligibleActors: [...allActors],
    availableScenes: [...allScenes],
    allowHandoff: false,
    condition: "Sample item. Fitting and condition checks required.",
  };
}
export function seedProject(): Project {
  const createdAt = "2026-10-31T00:00:00Z";
  return {
    schemaVersion: 1,
    title: "The Last Platform",
    description:
      "An original three-scene sample production about three strangers waiting for the last train.",
    budget: 80,
    actors: [
      {
        id: "maya",
        name: "Maya",
        character: "The archivist",
        image: "/assets/actor-maya.jpg",
        note: "A practical, understated jacket. Synthetic adult demo performer.",
      },
      {
        id: "leo",
        name: "Leo",
        character: "The visitor",
        image: "/assets/actor-leo.jpg",
        note: "A formal silhouette for the arrival and departure. Synthetic adult demo performer.",
      },
      {
        id: "imani",
        name: "Imani",
        character: "The courier",
        image: "/assets/actor-imani.jpg",
        note: "An unfussy layer for the parcel handoff. Synthetic adult demo performer.",
      },
    ],
    scenes: [
      {
        id: "scene-1",
        name: "The arrival",
        subtitle: "Maya + Leo",
        start: 0,
        end: 10,
      },
      {
        id: "scene-2",
        name: "The parcel",
        subtitle: "Maya + Imani",
        start: 12,
        end: 22,
      },
      {
        id: "scene-3",
        name: "The departure",
        subtitle: "Leo + Imani",
        start: 24,
        end: 34,
      },
    ],
    garments: [
      garment("navy", "Navy blazer", "#243747", "Owned", 0),
      garment("brown", "Brown chore jacket", "#855a3c", "Owned", 0),
      garment("olive", "Olive field jacket", "#6c7050", "Rental", 45),
      garment("ivory", "Ivory shirt", "#e7dfd0", "Owned", 0, "upper_body"),
      garment("charcoal", "Charcoal waistcoat", "#464843", "Owned", 0),
      garment("burgundy", "Burgundy cardigan", "#79434d", "Rental", 65),
      garment("denim", "Denim jacket", "#647b8d", "Borrowed", 0),
      garment("sand", "Sand blazer", "#c0aa85", "Rental", 55),
    ],
    looks: [
      {
        id: "archivist",
        actorId: "maya",
        name: "The archivist",
        scenes: ["scene-1", "scene-2"],
        candidates: ["navy", "brown", "olive"],
        preferred: "navy",
      },
      {
        id: "visitor",
        actorId: "leo",
        name: "The visitor",
        scenes: ["scene-1", "scene-3"],
        candidates: ["navy", "burgundy", "sand", "brown"],
        preferred: "navy",
      },
      {
        id: "courier",
        actorId: "imani",
        name: "The courier",
        scenes: ["scene-2", "scene-3"],
        candidates: ["charcoal", "denim", "ivory"],
        preferred: "charcoal",
      },
    ],
    decisions: Object.fromEntries(
      [
        "archivist:navy",
        "visitor:navy",
        "visitor:burgundy",
        "courier:charcoal",
      ].map((k) => [
        k,
        {
          status: "approved",
          note: "Preset reference approval for this fictional production. Physical fitting is still required.",
          updatedAt: createdAt,
          basis: "reference",
        },
      ]),
    ),
    events: [
      {
        id: "sample-start",
        text: "Sample loaded: two preferred looks share the only navy blazer. Existing reference approvals are fictional demo inputs.",
        at: createdAt,
      },
    ],
  };
}
