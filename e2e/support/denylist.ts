/**
 * Client-name denylist for the privacy guard. The names are private: they
 * come from the PRIVACY_DENYLIST secret, never from the repository.
 */

/** Names separated by newlines or commas; blanks are ignored. */
export function parseDenylist(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * The denylisted names that appear in `text` (built HTML, SVG, JS…), matched
 * as whole words, ignoring case, accents, HTML entities and line wrapping.
 * Scans everything, including attributes and URLs.
 */
export function findDeniedNames(text: string, names: string[]): string[] {
  const haystack = normalize(decodeEntities(text));
  return names.filter((name) => {
    const words = normalize(name).split(" ").filter(Boolean).map(escape);
    if (words.length === 0) return false;
    return new RegExp(
      `(?<![\\p{L}\\p{N}])${words.join("\\s+")}(?![\\p{L}\\p{N}])`,
      "u",
    ).test(haystack);
  });
}

function decodeEntities(text: string): string {
  return (
    text
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        fromCodePoint(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec) => fromCodePoint(parseInt(dec, 10)))
      // Accented letters (&eacute; → e): accents are ignored anyway.
      .replace(/&([a-z])(?:acute|grave|circ|uml|tilde|cedil|ring);/gi, "$1")
      .replace(
        /&(amp|lt|gt|quot|apos|nbsp);/g,
        (_, name: string) => ENTITIES[name]!,
      )
  );
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function fromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return " ";
  }
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escape(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
