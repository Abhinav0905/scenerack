import { z } from "zod";
const id = z.string().regex(/^[a-z0-9-]{1,40}$/);
const asset = z
  .string()
  .regex(/^\/(?:assets\/[a-zA-Z0-9_./-]+|api\/media\/[a-f0-9-]+)$/);
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().min(1).max(100),
    description: z.string().max(500),
    budget: z.number().min(0).max(100000).multipleOf(0.01),
    actors: z
      .array(
        z.object({
          id,
          name: z.string().min(1).max(60),
          character: z.string().max(80),
          image: asset,
          note: z.string().max(500),
        }),
      )
      .min(1)
      .max(6),
    scenes: z
      .array(
        z.object({
          id,
          name: z.string().min(1).max(80),
          subtitle: z.string().max(100),
          start: z.number().min(0).max(1000),
          end: z.number().min(1).max(1000),
        }),
      )
      .min(1)
      .max(8),
    garments: z
      .array(
        z.object({
          id,
          name: z.string().min(1).max(80),
          category: z.enum(["outer", "upper_body"]),
          color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
          image: asset,
          source: z.enum(["Owned", "Borrowed", "Rental"]),
          location: z.string().max(200),
          cost: z.number().min(0).max(100000).multipleOf(0.01),
          available: z.boolean(),
          eligibleActors: z.array(id).max(6),
          availableScenes: z.array(id).max(8),
          allowHandoff: z.boolean(),
          condition: z.string().max(300),
        }),
      )
      .min(1)
      .max(20),
    looks: z
      .array(
        z.object({
          id,
          actorId: id,
          name: z.string().max(80),
          scenes: z.array(id).min(1).max(8),
          candidates: z.array(id).min(1).max(4),
          preferred: id,
        }),
      )
      .min(1)
      .max(6),
    decisions: z.record(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "flagged"]),
        note: z.string().max(500),
        updatedAt: z.string().max(40),
        previewId: z.string().max(120).optional(),
        basis: z.enum(["reference", "youcam"]),
      }),
    ),
    events: z
      .array(
        z.object({
          id: z.string().max(80),
          text: z.string().max(600),
          at: z.string().max(40),
        }),
      )
      .max(100),
  })
  .superRefine((p, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    for (const collection of [p.actors, p.garments, p.scenes, p.looks])
      if (new Set(collection.map((x) => x.id)).size !== collection.length)
        fail("IDs must be unique");
    if (p.scenes.some((s) => s.start >= s.end))
      fail("Scene start must be before its end");
    if (new Set(p.looks.map((l) => l.actorId)).size !== p.looks.length)
      fail("This prototype supports one continuous look per performer");
    if (Object.keys(p.decisions).length > 100) fail("Too many decisions");
    for (const l of p.looks) {
      if (
        !p.actors.some((a) => a.id === l.actorId) ||
        l.scenes.some((s) => !p.scenes.some((x) => x.id === s)) ||
        l.candidates.some((g) => !p.garments.some((x) => x.id === g)) ||
        !l.candidates.includes(l.preferred)
      )
        fail("Look references an unknown item");
      if (
        new Set(l.candidates).size !== l.candidates.length ||
        new Set(l.scenes).size !== l.scenes.length
      )
        fail("Duplicate references are not allowed");
    }
    for (const g of p.garments)
      if (
        g.eligibleActors.some((a) => !p.actors.some((x) => x.id === a)) ||
        g.availableScenes.some((s) => !p.scenes.some((x) => x.id === s))
      )
        fail("Garment references an unknown actor or scene");
    for (const key of Object.keys(p.decisions)) {
      const [l, g, ...extra] = key.split(":");
      if (
        extra.length ||
        !p.looks.some((x) => x.id === l && x.candidates.includes(g))
      )
        fail("Unknown review target");
    }
  });
