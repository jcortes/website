import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./support/routes";

// Every page in the sitemap, in both themes (colour contrast differs).
test.describe.configure({ mode: "parallel" });

for (const theme of ["dark", "light"] as const) {
  test(`every page passes axe checks (${theme} theme)`, async ({
    page,
    request,
  }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
    }, theme);

    const paths = await sitemapPaths(request);
    expect(paths.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const path of paths) {
      await page.goto(path);
      const { violations: found } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      for (const violation of found) {
        violations.push(
          `${path}: ${violation.id} (${violation.impact}) ${violation.help} → ` +
            violation.nodes.map((node) => node.target.join(" ")).join(", "),
        );
      }
    }
    expect(violations).toEqual([]);
  });
}
