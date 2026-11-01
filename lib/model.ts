export type DecisionStatus = "pending" | "approved" | "rejected" | "flagged";
export type Garment = {
  id: string;
  name: string;
  category: "outer" | "upper_body";
  color: string;
  image: string;
  source: "Owned" | "Borrowed" | "Rental";
  location: string;
  cost: number;
  available: boolean;
  eligibleActors: string[];
  availableScenes: string[];
  allowHandoff: boolean;
  condition: string;
};
export type Actor = {
  id: string;
  name: string;
  character: string;
  image: string;
  note: string;
};
export type Scene = {
  id: string;
  name: string;
  subtitle: string;
  start: number;
  end: number;
};
export type Look = {
  id: string;
  actorId: string;
  name: string;
  scenes: string[];
  candidates: string[];
  preferred: string;
};
export type Decision = {
  status: DecisionStatus;
  note: string;
  updatedAt: string;
  previewId?: string;
  basis: "reference" | "youcam";
};
export type Project = {
  schemaVersion: 1;
  title: string;
  description: string;
  budget: number;
  actors: Actor[];
  garments: Garment[];
  scenes: Scene[];
  looks: Look[];
  decisions: Record<string, Decision>;
  events: { id: string; text: string; at: string }[];
};
export type Assignment = {
  lookId: string;
  actorId: string;
  garmentId: string;
  scenes: string[];
};
export type Plan = {
  status: "ready" | "over_budget" | "incomplete";
  assignments: Assignment[];
  cost: number | null;
  remaining: number | null;
  sourceItems: Garment[];
  blockers: string[];
  excluded: { lookId: string; garmentId: string; reason: string }[];
  preferredConflicts: string[];
  evaluated: number;
  ownedCount: number;
  rentalCount: number;
};
export type Preview = {
  actorImage?: string;
  garmentImage?: string;
  category?: string;
  id: string;
  actorId: string;
  garmentId: string;
  status: "queued" | "processing" | "success" | "error" | "uncertain";
  image?: string;
  message?: string;
  createdAt: string;
  completedAt?: string;
  units: number;
  source: "live" | "recorded";
  provider: "YouCam cloth-v4";
  elapsedMs?: number;
};
export const pairKey = (lookId: string, garmentId: string) =>
  `${lookId}:${garmentId}`;
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  }).format(n);
