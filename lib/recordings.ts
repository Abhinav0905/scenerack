import manifest from "../public/previews/manifest.json";
import type { Preview, Project } from "./model";
export function recordedPreviews(project: Project): Preview[] {
  return manifest
    .filter(
      (r) =>
        project.actors.some(
          (a) => a.id === r.actorId && a.image === r.actorImage,
        ) &&
        project.garments.some(
          (g) =>
            g.id === r.garmentId &&
            g.image === r.garmentImage &&
            g.category === r.category,
        ),
    )
    .map(
      (r) =>
        ({
          ...r,
          status: "success",
          source: "recorded",
          provider: "YouCam cloth-v4",
        }) as Preview,
    );
}
