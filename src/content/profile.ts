import { getCollection, type CollectionEntry } from "astro:content";

export type Profile = CollectionEntry<"profile">["data"];
export type Experience = Profile["experience"][number];

let profile: Promise<Profile> | undefined;

/**
 * The Profile/CV singleton: the single source for the About page and the CV
 * PDF. Fails the build unless there is exactly one profile file.
 */
export function getProfile(): Promise<Profile> {
  profile ??= loadProfile();
  return profile;
}

async function loadProfile(): Promise<Profile> {
  const entries = await getCollection("profile");
  if (entries.length !== 1) {
    throw new Error(
      `Invalid content: expected exactly one profile in src/content/profile/, found ${entries.length}`,
    );
  }
  const { data } = entries[0]!;
  return {
    ...data,
    // Newest first, whatever order the file lists them in.
    experience: data.experience.toSorted((a, b) =>
      b.start.localeCompare(a.start),
    ),
  };
}
