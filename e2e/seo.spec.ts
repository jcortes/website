import { expect, test, type Page } from "@playwright/test";
import { sitemapPaths } from "./support/routes";

// Equivalent pages, one per locale.
const pairs = [
  ["/", "/en/"],
  ["/servicios/", "/en/services/"],
  ["/servicios/ci-cd-github-actions/", "/en/services/ci-cd-github-actions/"],
  ["/sobre-mi/", "/en/about/"],
  ["/contacto/", "/en/contact/"],
] as const;

const head = (page: Page) => ({
  title: () => page.title(),
  meta: (selector: string) =>
    page.locator(`head meta[${selector}]`).getAttribute("content"),
  link: (selector: string) =>
    page.locator(`head link[${selector}]`).getAttribute("href"),
});

test("the sitemap lists every page in both locales", async ({ request }) => {
  const paths = await sitemapPaths(request);
  for (const pair of pairs) {
    for (const path of pair) expect(paths).toContain(path);
  }
  // Only pages: no PDFs, no API.
  expect(paths.filter((path) => !path.endsWith("/"))).toEqual([]);
});

for (const [es, en] of pairs) {
  test(`${es} and ${en} have localized titles and descriptions`, async ({
    page,
  }) => {
    await page.goto(es);
    const esTitle = await page.title();
    const esDescription = await head(page).meta('name="description"');
    await page.goto(en);
    expect(await page.title()).not.toBe(esTitle);
    expect(await head(page).meta('name="description"')).not.toBe(esDescription);
  });

  for (const [path, lang] of [
    [es, "es"],
    [en, "en"],
  ] as const) {
    test(`${path} has canonical, hreflang alternates and Open Graph tags`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const h = head(page);
      expect(await h.title()).toBeTruthy();
      expect(await h.meta('name="description"')).toBeTruthy();

      const canonical = new URL((await h.link('rel="canonical"'))!);
      expect(canonical.protocol).toBe("https:");
      expect(canonical.pathname).toBe(path);

      // Alternates point at the same production origin.
      for (const [hreflang, target] of [
        ["es", es],
        ["en", en],
        ["x-default", es],
      ]) {
        const href = await h.link(`rel="alternate"][hreflang="${hreflang}"`);
        expect(href, hreflang).toBe(new URL(target, canonical).href);
      }

      expect(await h.meta('property="og:title"')).toBeTruthy();
      expect(await h.meta('property="og:description"')).toBeTruthy();
      expect(await h.meta('property="og:url"')).toBe(canonical.href);
      expect(await h.meta('property="og:locale"')).toMatch(
        new RegExp(`^${lang}_`),
      );
      expect(await h.meta('name="twitter:card"')).toBe("summary_large_image");

      const image = new URL((await h.meta('property="og:image"'))!);
      expect(image.origin).toBe(canonical.origin);
      const response = await request.get(image.pathname);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toBe("image/png");
      // A real 1200×630 PNG (width and height from the IHDR chunk).
      const png = await response.body();
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
    });
  }
}
