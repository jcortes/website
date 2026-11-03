import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { findDeniedNames, parseDenylist } from "./support/denylist";
import { findPhoneNumbers } from "./support/phone-numbers";

const DIST = path.resolve(import.meta.dirname, "../dist");

/** Files in the production build with one of the given extensions. */
async function builtFiles(extensions: string[]): Promise<string[]> {
  const entries = await readdir(DIST, { withFileTypes: true, recursive: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && extensions.includes(path.extname(entry.name)),
    )
    .map((entry) => path.join(entry.parentPath, entry.name));
}

const TEXT_EXTENSIONS = [
  ".html",
  ".svg",
  ".xml",
  ".txt",
  ".json",
  ".js",
  ".css",
];

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
    const files = await builtFiles([".html"]);
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

test.describe("privacy guard: client names", () => {
  test("the denylist accepts names separated by newlines or commas", () => {
    expect(parseDenylist(" Acme, Initech\nSmith & Wesson\n\n , ")).toEqual([
      "Acme",
      "Initech",
      "Smith & Wesson",
    ]);
  });

  test("the name detector catches names however they are written", () => {
    const names = ["Acme", "Smith & Wesson", "Café Olé", "Banco Ejemplo"];
    const leaks: Array<[string, string]> = [
      ["Built for ACME", "Acme"],
      ["<p>Smith &amp; Wesson</p>", "Smith & Wesson"],
      ["cafe ole", "Café Olé"],
      ['<a href="https://acme.com/x">site</a>', "Acme"],
      ['<img alt="Logo de banco  \n  ejemplo">', "Banco Ejemplo"],
      ["Caf&eacute; Ol&#233;", "Café Olé"],
    ];
    for (const [text, name] of leaks) {
      expect(findDeniedNames(text, names), text).toEqual([name]);
    }
  });

  test("the name detector ignores names inside other words", () => {
    expect(findDeniedNames("Acmeified, subacme", ["Acme"])).toEqual([]);
  });

  test("no built file contains a client name from the denylist", async () => {
    const names = parseDenylist(process.env.PRIVACY_DENYLIST ?? "");
    if (names.length === 0) {
      // CI must always check; locally the secret is usually absent.
      expect(
        process.env.CI,
        "PRIVACY_DENYLIST is empty: set the GitHub Actions secret",
      ).toBeFalsy();
      test.skip(true, "PRIVACY_DENYLIST not set (see README → Privacy)");
    }

    const files = await builtFiles(TEXT_EXTENSIONS);
    expect(files.length, "no build output found").toBeGreaterThan(0);

    const findings: string[] = [];
    for (const file of files) {
      const text = await readFile(file, "utf8");
      // Report the file and a count only: the names themselves are secret.
      const found = findDeniedNames(text, names);
      if (found.length > 0) {
        findings.push(`${path.relative(DIST, file)}: ${found.length} name(s)`);
      }
    }
    expect(findings).toEqual([]);
  });
});
