import { getCollection, type CollectionEntry } from "astro:content";

export type Gig = CollectionEntry<"gigs">;
export type Project = CollectionEntry<"projects">;
export type Tier = keyof Gig["data"]["packages"];

export const tiers: readonly Tier[] = ["basic", "standard", "premium"];

export interface Catalog {
  /** Every gig, in display order. */
  gigs: Gig[];
  /** Projects linked to a gig (its related work). */
  relatedWork(gig: Gig): Project[];
}

let catalog: Promise<Catalog> | undefined;

/**
 * Gigs and projects, with cross-references checked. Schemas validate each
 * entry on its own and Astro only logs broken references; this fails the
 * build when a project points at a gig that doesn't exist.
 */
export function getCatalog(): Promise<Catalog> {
  catalog ??= loadCatalog();
  return catalog;
}

async function loadCatalog(): Promise<Catalog> {
  const [gigs, projects] = await Promise.all([
    getCollection("gigs"),
    getCollection("projects"),
  ]);

  const gigIds = new Set(gigs.map((gig) => gig.id));
  const broken = projects.flatMap((project) =>
    project.data.gigs
      .filter((ref) => !gigIds.has(ref.id))
      .map(
        (ref) => `project "${project.id}" references missing gig "${ref.id}"`,
      ),
  );
  if (broken.length > 0) {
    throw new Error(`Invalid content:\n  ${broken.join("\n  ")}`);
  }

  gigs.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
  projects.sort((a, b) => a.id.localeCompare(b.id));

  return {
    gigs,
    relatedWork: (gig) =>
      projects.filter((project) =>
        project.data.gigs.some((ref) => ref.id === gig.id),
      ),
  };
}
