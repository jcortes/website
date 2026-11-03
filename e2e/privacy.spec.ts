import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { findPhoneNumbers } from "./support/phone-numbers";

const DIST = path.resolve(import.meta.dirname, "../dist");

async function builtHtmlFiles(dir = DIST): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

test.describe("privacy guard", () => {
  test("the phone detector catches real phone formats", () => {
    const leaks = [
      "Llámame al +57 300 123 4567",
      "Cel: 300 123 4567",
      "(601) 555-1234 ext",
      "+1 (415) 555-0132",
      "3001234567",
      "WhatsApp +573001234567",
      '<a href="tel:3001234567">call</a>',
      '<svg><title>+57 300 123 4567</title><path d="M0 0"/></svg>',
      '<meta name="description" content="300 123 4567">',
    ];
    for (const leak of leaks) {
      expect(findPhoneNumbers(leak), leak).not.toEqual([]);
    }
  });

  test("the phone detector ignores years, date ranges and short numbers", () => {
    const harmless = [
      "15+ años de experiencia",
      "2010 - 2014",
      "2010–2026",
      "May 2026 – present",
      "Node 24, ES2022",
      "© 2026",
      "v1.2.3",
      '<circle cx="19" cy="23" r="2.4"/><circle cx="46" cy="39" r="2.4"/>',
      '<svg viewBox="0 0 1440 900"><path d="M0 120 H180 L240 180 H420"/></svg>',
    ];
    for (const text of harmless) {
      expect(findPhoneNumbers(text), text).toEqual([]);
    }
  });

  test("no built page contains a phone number", async () => {
    const files = await builtHtmlFiles();
    expect(
      files.length,
      "no built HTML found; run the build first",
    ).toBeGreaterThan(0);

    const findings: string[] = [];
    for (const file of files) {
      const html = await readFile(file, "utf8");
      for (const match of findPhoneNumbers(html)) {
        findings.push(`${path.relative(DIST, file)}: ${match}`);
      }
    }
    expect(findings).toEqual([]);
  });
});
