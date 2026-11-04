import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { section } from "./support/regions";

// Values from the E2E fixture site settings
// (e2e/fixtures/content/settings/site.yaml), which replace the real ones.
const BOOKING_URL = "https://cal.com/e2e/discovery-call";
const TRUST_BAR = ["AWS", "GitHub Actions", "Fixture Tech"];

const locales = [
  {
    lang: "es",
    path: "/",
    hero: "Ingeniero de Software y DevOps independiente",
    years: "15+ años de experiencia",
    bookCall: "Agendar una llamada",
    seeServices: "Ver servicios",
    services: "/servicios/",
    testimonial: "Testimonio de prueba para la suite E2E.",
    sections: [
      "En resumen",
      "Servicios",
      "Cómo trabajo",
      "Sobre mí",
      "Testimonios",
      "¿Hablamos?",
    ],
  },
  {
    lang: "en",
    path: "/en/",
    hero: "Independent Software & DevOps Engineer",
    years: "15+ years of experience",
    bookCall: "Book a call",
    seeServices: "See services",
    services: "/en/services/",
    testimonial: "Test testimonial for the E2E suite.",
    sections: [
      "At a glance",
      "Services",
      "How I work",
      "About me",
      "Testimonials",
      "Let's talk",
    ],
  },
] as const;

for (const l of locales) {
  test.describe(`home (${l.lang})`, () => {
    test("shows the hero, then every section in order", async ({ page }) => {
      await page.goto(l.path);
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
      // The hero's h1 comes first, then one h2 per section.
      await expect(page.getByRole("main").locator("h1, h2")).toHaveText([
        l.hero,
        ...l.sections,
      ]);
    });

    test("the hero calls to book a call and to see the services", async ({
      page,
    }) => {
      await page.goto(l.path);
      const hero = section(page, l.hero);
      await expect(
        hero.getByRole("link", { name: l.bookCall }),
      ).toHaveAttribute("href", BOOKING_URL);
      await hero.getByRole("link", { name: l.seeServices }).click();
      await expect(page).toHaveURL(l.services);
    });

    test("the trust bar shows only the years and the key technologies", async ({
      page,
    }) => {
      await page.goto(l.path);
      const trust = section(page, l.sections[0]);
      await expect(trust).toContainText(l.years);
      await expect(trust.getByRole("listitem")).toHaveText(TRUST_BAR);
      // No project count and no company logos.
      await expect(trust.getByRole("img")).toHaveCount(0);
      await expect(trust).not.toContainText(/proyectos|projects/i);
      await expect(trust).toHaveText(/^\D*15\+\D*$/);
    });

    test("the services are cards linking to each gig", async ({ page }) => {
      await page.goto(l.path);
      const cards = section(page, l.sections[1]).getByRole("heading", {
        level: 3,
      });
      await expect(cards.first()).toBeVisible();
      await cards.first().getByRole("link").click();
      await expect(page).toHaveURL(new RegExp(`^.*${l.services}[a-z0-9-]+/$`));
    });

    test("shows a fixture testimonial", async ({ page }) => {
      await page.goto(l.path);
      await expect(section(page, l.sections[4])).toContainText(l.testimonial);
    });

    test("the closing CTA books a call", async ({ page }) => {
      await page.goto(l.path);
      await expect(
        section(page, l.sections[5]).getByRole("link", { name: l.bookCall }),
      ).toHaveAttribute("href", BOOKING_URL);
    });
  });
}

// The production build (dist/) has no fixture content. While the real
// content has no testimonials, its home pages have no testimonials section.
test("without testimonials the home page has no testimonials section", async ({
  page,
}) => {
  const root = path.resolve(import.meta.dirname, "..");
  const content = await readdir(path.join(root, "src/content/testimonials"));
  test.skip(
    content.some((file) => file.endsWith(".yaml")),
    "the real content has testimonials",
  );
  for (const [file, heading] of [
    ["dist/index.html", "Testimonios"],
    ["dist/en/index.html", "Testimonials"],
  ]) {
    await page.setContent(await readFile(path.join(root, file), "utf8"));
    await expect(page.getByRole("heading", { level: 2 })).not.toHaveCount(0);
    await expect(page.getByRole("heading", { name: heading })).toHaveCount(0);
  }
});
