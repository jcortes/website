import { expect, test } from "@playwright/test";
import { section } from "./support/regions";
import { pdfText } from "./support/pdf-text";

const locales = [
  {
    lang: "es",
    path: "/sobre-mi/",
    nav: "Sobre mí",
    title: "Sobre mí",
    years: /15\+ años/,
    experience: "Experiencia",
    independent: "Ingeniero de Software y DevOps independiente",
    present: "May 2026 – actualidad",
    previousPeriod: "Oct 2021 – May 2026",
    clients: "Clientes",
    tech: "Tecnologías",
    skills: "Habilidades",
    skillAreas: [
      "Desarrollo",
      "Nube y DevOps",
      "Bases de datos",
      "Herramientas",
    ],
    education: "Formación",
    courses: "Cursos y certificaciones",
    languages: "Idiomas",
    spanish: /Español/,
    download: "Descargar CV (PDF)",
    references: "Referencias disponibles a solicitud",
  },
  {
    lang: "en",
    path: "/en/about/",
    nav: "About",
    title: "About me",
    years: /15\+ years/,
    experience: "Experience",
    independent: "Independent Software & DevOps Engineer",
    present: "May 2026 – present",
    previousPeriod: "Oct 2021 – May 2026",
    clients: "Clients",
    tech: "Technologies",
    skills: "Skills",
    skillAreas: ["Development", "Cloud & DevOps", "Databases", "Tools"],
    education: "Education",
    courses: "Courses and certifications",
    languages: "Languages",
    spanish: /Spanish/,
    download: "Download CV (PDF)",
    references: "References available upon request",
  },
] as const;

for (const l of locales) {
  test.describe(`about me (${l.lang})`, () => {
    test("renders the profile summary with 15+ years of experience", async ({
      page,
    }) => {
      await page.goto(l.path);
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(l.title);
      await expect(page.getByRole("main")).toContainText(l.years);
    });

    test("is linked from the header", async ({ page }) => {
      await page.goto(l.lang === "es" ? "/" : "/en/");
      await page
        .getByRole("banner")
        .getByRole("link", { name: l.nav, exact: true })
        .click();
      await expect(page).toHaveURL(l.path);
    });

    test("the experience timeline runs from the present back to 2007", async ({
      page,
    }) => {
      await page.goto(l.path);
      const roles = section(page, l.experience).getByRole("article");

      const current = roles.first();
      await expect(current.getByRole("heading")).toHaveText(l.independent);
      await expect(current).toContainText(l.present);

      const previous = roles.nth(1);
      await expect(previous).toContainText("Turing");
      await expect(previous).toContainText(l.previousPeriod);
      // Clients appear only as anonymized descriptors (names are covered by
      // the privacy guard's denylist).
      await expect(
        previous.getByRole("list", { name: l.clients }).getByRole("listitem"),
      ).not.toHaveCount(0);

      await expect(roles.last()).toContainText("2007");

      for (const role of await roles.all()) {
        await expect(role.getByRole("heading")).not.toBeEmpty();
        await expect(role.locator("time").first()).toBeVisible();
        await expect(
          role.getByRole("list", { name: l.tech }).getByRole("listitem"),
        ).not.toHaveCount(0);
      }
    });

    test("shows skills by area, education, courses, languages and GitHub", async ({
      page,
    }) => {
      await page.goto(l.path);

      const skills = section(page, l.skills);
      await expect(skills.getByRole("heading", { level: 3 })).toHaveText(
        l.skillAreas,
      );
      for (const area of l.skillAreas) {
        await expect(
          skills.getByRole("list", { name: area }).getByRole("listitem"),
        ).not.toHaveCount(0);
      }

      await expect(section(page, l.education)).toContainText(
        "Universidad Manuela Beltrán",
      );
      await expect(
        section(page, l.courses).getByRole("listitem"),
      ).not.toHaveCount(0);
      await expect(section(page, l.languages)).toContainText(l.spanish);

      await expect(
        page.getByRole("main").getByRole("link", { name: /GitHub/ }),
      ).toHaveAttribute("href", "https://github.com/jcortes");
    });

    test("downloads the CV as a PDF built from the same profile", async ({
      page,
      request,
    }) => {
      await page.goto(l.path);
      const href = await page
        .getByRole("link", { name: l.download })
        .getAttribute("href");
      const response = await request.get(new URL(href!, page.url()).href);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("application/pdf");

      const bytes = await response.body();
      expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      const text = await pdfText(bytes);
      for (const expected of [
        "Jorge Cortés",
        l.experience,
        l.independent,
        "Turing",
        "Universidad Manuela Beltrán",
        l.references,
      ]) {
        // Case-insensitive: the PDF sets section headings in capitals.
        expect(text.toLowerCase()).toContain(expected.toLowerCase());
      }
      expect(text).toMatch(l.years);
    });
  });
}
