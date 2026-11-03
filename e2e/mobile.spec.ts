import { devices, expect, test } from "@playwright/test";
import { sitemapPaths } from "./support/routes";

// A small phone's screen, in Chromium (the device's default is WebKit).
const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } =
  devices["iPhone SE"];
test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent });

test("no page scrolls sideways on a phone", async ({ page, request }) => {
  test.slow();
  const overflowing: string[] = [];
  for (const path of await sitemapPaths(request)) {
    await page.goto(path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    if (scrollWidth > clientWidth) {
      overflowing.push(`${path}: ${scrollWidth}px > ${clientWidth}px`);
    }
  }
  expect(overflowing).toEqual([]);
});

for (const [path, nav, target] of [
  ["/", "Servicios", "/servicios/"],
  ["/en/", "Contact", "/en/contact/"],
] as const) {
  test(`the header navigation works on a phone (${path})`, async ({ page }) => {
    await page.goto(path);
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link").first()).toBeInViewport();
    await banner.getByRole("link", { name: nav, exact: true }).click();
    await expect(page).toHaveURL(target);
  });

  test(`the home page's calls to action are usable on a phone (${path})`, async ({
    page,
  }) => {
    await page.goto(path);
    const hero = page.getByRole("main").getByRole("region").first();
    const width = page.viewportSize()!.width;
    for (const link of await hero.getByRole("link").all()) {
      await expect(link).toBeVisible();
      const box = (await link.boundingBox())!;
      // Fully on screen horizontally, and a comfortable touch target.
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
}
