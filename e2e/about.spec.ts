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
      "IA aplicada",
      "Bases de datos",
      "Herramientas",
    ],
    portfolio: "Portafolio reciente",
    portfolioProject: "Gateway de infraestructura para agentes de IA",
    viewCode: "Ver código",
    viewSite: "Ver sitio",
    education: "Formación",
    courses: "Cursos y certificaciones",
    languages: "Idiomas",
    spanish: /Español/,
    english: "C1 Avanzado, EF SET",
    certificate: "Ver certificado",
    recentProjects: "Proyectos recientes",
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
    skillAreas: [
      "Development",
      "Cloud & DevOps",
      "Applied AI",
      "Databases",
      "Tools",
    ],
    portfolio: "Recent portfolio",
    portfolioProject: "Infrastructure gateway for AI agents",
    viewCode: "View code",
    viewSite: "View site",
    education: "Education",
    courses: "Courses and certifications",
    languages: "Languages",
    spanish: /Spanish/,
    english: "C1 Advanced, EF SET",
    certificate: "View certificate",
    recentProjects: "Recent projects",
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
      // Clients are listed, by name or by industry and region.
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

    test("lists the recent portfolio with technologies and public code links", async ({
      page,
    }) => {
      await page.goto(l.path);
      const projects = section(page, l.portfolio).getByRole("article");
      await expect(projects).toHaveCount(5);
      await expect(projects.first().getByRole("heading")).toHaveText(
        l.portfolioProject,
      );
      for (const project of await projects.all()) {
        await expect(project.getByRole("paragraph")).not.toBeEmpty();
        await expect(
          project.getByRole("list", { name: l.tech }).getByRole("listitem"),
        ).not.toHaveCount(0);
        // Every project links to its code or, if private, to where it runs.
        await expect(
          project.getByRole("link", {
            name: new RegExp(`${l.viewCode}|${l.viewSite}`),
          }),
        ).not.toHaveCount(0);
      }
      const portfolio = section(page, l.portfolio);
      await expect(
        portfolio.getByRole("link", { name: l.viewCode }),
      ).toHaveCount(3);
      await expect(
        portfolio.getByRole("link", { name: l.viewSite }),
      ).toHaveCount(2);
      await expect(
        portfolio.getByRole("link", { name: l.viewSite }).first(),
      ).toHaveAttribute("href", "https://estudiobolsillo.com/");
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
      await expect(
        section(page, l.courses).getByRole("link", {
          name: l.certificate,
        }),
      ).toHaveAttribute(
        "href",
        "https://res.cloudinary.com/total-typescript/image/upload/certificate/03c2dbba-4a97-4c38-b5fe-128812eb8f9a/ai-coding-crash-course.png",
      );
      await expect(section(page, l.languages)).toContainText(l.spanish);
      await expect(section(page, l.languages)).toContainText(l.english);
      await expect(
        section(page, l.languages).getByRole("link", { name: l.certificate }),
      ).toHaveAttribute("href", "https://cert.efset.org/en/8bvA44");

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
        "Jorge Cortes",
        l.experience,
        l.independent,
        "Turing",
        "Universidad Manuela Beltrán",
        // Projects are mentioned inside the experience, not in a section.
        l.recentProjects,
        l.portfolioProject,
        "vela-publicidad.pages.dev",
        l.english,
        "cert.efset.org/en/8bvA44",
        "AI Coding Crash Course",
        `AI Coding Crash Course · AI Hero · Matt Pocock · ${l.certificate}`,
        l.references,
      ]) {
        // Case-insensitive: the PDF sets section headings in capitals.
        expect(text.toLowerCase()).toContain(expected.toLowerCase());
      }
      expect(text).toMatch(l.years);
      // The mention follows the Turing job, and no project description is
      // repeated in the PDF.
      const lower = text.toLowerCase();
      expect(lower.indexOf(l.recentProjects.toLowerCase())).toBeGreaterThan(
        lower.indexOf("turing"),
      );
      expect(lower.indexOf(l.recentProjects.toLowerCase())).toBeLessThan(
        lower.indexOf("white prompt"),
      );
      expect(text).not.toContain("OPA/Conftest");
    });
  });
}
