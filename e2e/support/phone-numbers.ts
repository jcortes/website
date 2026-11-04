/**
 * Finds phone-number-like strings in built HTML.
 *
 * Scans what a visitor can read or follow: text content plus human-facing
 * attribute values (alt, title, content, aria-label, href…), including SVG
 * <title>/<text>. Scripts, styles and path data (`d`, `points`, …) are skipped,
 * and each attribute value is checked on its own so that neighbouring numeric
 * attributes (cx="19" cy="23") never join into one long digit run.
 *
 * A match is any `tel:` link, or a run of digit groups joined by single
 * separators (space, dot, hyphen, parentheses) holding 10–15 digits, or 8–15
 * when it starts with "+". Years and date ranges stay below that threshold.
 */
export function findPhoneNumbers(html: string): string[] {
  const findings: string[] = [];

  for (const [, number] of html.matchAll(/\btel:([^"'\s>]+)/gi)) {
    findings.push(`tel:${number}`);
  }

  for (const [candidate] of readableText(html).matchAll(PHONE_CANDIDATE)) {
    const digits = candidate.replace(/\D/g, "").length;
    const international = candidate.trimStart().startsWith("+");
    if (digits <= 15 && (digits >= 10 || (international && digits >= 8))) {
      findings.push(candidate.trim());
    }
  }

  return findings;
}

const PHONE_CANDIDATE = /\+?\(?\d+\)?(?:[ .-]?\(?\d+\)?)+/g;

const NON_READABLE_ATTRIBUTES = new Set([
  "class",
  "style",
  "d",
  "points",
  "viewbox",
  "transform",
  "src",
  "srcset",
  "integrity",
]);

function readableText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, (tag) => {
      const values: string[] = [];
      for (const [, name, double, single] of tag.matchAll(
        /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
      )) {
        if (!NON_READABLE_ATTRIBUTES.has(name!.toLowerCase())) {
          values.push(double ?? single ?? "");
        }
      }
      return ` | ${values.join(" | ")} | `;
    })
    .replace(/&nbsp;|&#160;/g, " ");
}
