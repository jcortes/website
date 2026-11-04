import { expect, test } from "@playwright/test";

const REPO = "https://github.com/jcortes/website";

const locales = [
  {
    lang: "es",
    home: "/",
    path: "/como-lo-construi/",
    nav: "Cómo lo hice",
    heading: "Cómo construí este sitio",
    sections: ["Arquitectura", "Pipeline", "Infraestructura como código"],
    switchTo: ["English", "/en/how-i-built-it/"],
  },
  {
    lang: "en",
    home: "/en/",
    path: "/en/how-i-built-it/",
    nav: "How I built it",
    heading: "How I built this site",
    sections: ["Architecture", "Pipeline", "Infrastructure as code"],
    switchTo: ["Español", "/como-lo-construi/"],
  },
] as const;

for (const l of locales) {
  test.describe(`how I built this site (${l.lang})`, () => {
    test("is linked from the header", async ({ page }) => {
      await page.goto(l.home);
      await page
        .getByRole("banner")
        .getByRole("link", { name: l.nav, exact: true })
        .click();
      await expect(page).toHaveURL(l.path);
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
    });

    test("explains the architecture, pipeline and IaC", async ({ page }) => {
      await page.goto(l.path);
      await expect(
        page.getByRole("heading", { level: 1, name: l.heading }),
      ).toBeVisible();
      for (const name of l.sections) {
        await expect(
          page.getByRole("heading", { level: 2, name, exact: true }),
        ).toBeVisible();
      }
    });

    test("links to the public repository", async ({ page }) => {
      await page.goto(l.path);
      await expect(
        page.getByRole("main").getByRole("link", { name: /jcortes\/website/ }),
      ).toHaveAttribute("href", REPO);
    });

    test("the language switcher lands on the other locale's page", async ({
      page,
    }) => {
      const [link, to] = l.switchTo;
      await page.goto(l.path);
      await page.getByRole("link", { name: link }).click();
      await expect(page).toHaveURL(to);
    });
  });
}
