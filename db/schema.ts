import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const projects = sqliteTable("projects", {
  owner: text("owner").primaryKey(),
  body: text("body").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});
export const jobs = sqliteTable(
  "preview_jobs",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    actorId: text("actor_id").notNull(),
    garmentId: text("garment_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    status: text("status").notNull(),
    taskId: text("task_id"),
    imageKey: text("image_key"),
    error: text("error"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    units: integer("units").notNull().default(2),
  },
  (t) => [uniqueIndex("owner_fingerprint").on(t.owner, t.fingerprint)],
);
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  createdAt: text("created_at").notNull(),
});
