import { getCollection, type CollectionEntry } from "astro:content";

export type Settings = CollectionEntry<"settings">["data"];

let settings: Promise<Settings> | undefined;

/**
 * The Site settings singleton: booking URL, social links, trust bar and
 * years of experience. Fails the build unless there is exactly one file.
 */
export function getSettings(): Promise<Settings> {
  settings ??= loadSettings();
  return settings;
}

async function loadSettings(): Promise<Settings> {
  const entries = await getCollection("settings");
  if (entries.length !== 1) {
    throw new Error(
      `Invalid content: expected exactly one settings file in src/content/settings/, found ${entries.length}`,
    );
  }
  return entries[0]!.data;
}
