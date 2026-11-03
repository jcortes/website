import { expect, test } from "@playwright/test";
import { section } from "./support/regions";

const gigSlugs = [
  "ci-cd-github-actions",
  "aws-infrastructure-as-code",
  "custom-backend-apis",
];

const locales = [
  {
    lang: "es",
    listing: "/servicios/",
    gigs: [/GitHub Actions/, /Terraform/, /APIs/],
    packages: "Paquetes",
    tiers: ["Básico", "Estándar", "Premium"],
    deliverables: "Entregables",
    deliveryTime: /Entrega estimada: \d+ días/,
    revisions: /\d+ revisi(ón|ones)/,
    gallery: "Galería",
    galleryAlt: /^Diagrama/,
    faq: "Preguntas frecuentes",
    requirements: "Lo que necesito de ti",
    quote: /Solicitar cotización/,
    contact: "/contacto/",
    relatedWork: "Trabajo relacionado",
    story: ["Problema", "Solución", "Resultado"],
    tech: "Tecnologías",
  },
  {
    lang: "en",
    listing: "/en/services/",
    gigs: [/GitHub Actions/, /Terraform/, /APIs/],
    packages: "Packages",
    tiers: ["Basic", "Standard", "Premium"],
    deliverables: "Deliverables",
    deliveryTime: /Estimated delivery: \d+ days/,
    revisions: /\d+ revisions?/,
    gallery: "Gallery",
    galleryAlt: /diagram/,
    faq: "Frequently asked questions",
    requirements: "What I need from you",
    quote: /Request a quote/,
    contact: "/en/contact/",
    relatedWork: "Related work",
    story: ["Problem", "Solution", "Result"],
    tech: "Technologies",
  },
] as const;

// Gigs whose content links at least one (confidential) project.
const gigsWithRelatedWork = ["ci-cd-github-actions", "custom-backend-apis"];

for (const l of locales) {
  test.describe(`services (${l.lang})`, () => {
    test("the listing shows every gig", async ({ page }) => {
      await page.goto(l.listing);
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
      for (const title of l.gigs) {
        await expect(
          page.getByRole("heading", { level: 2, name: title }),
        ).toBeVisible();
      }
    });

    test("a gig opens from the listing", async ({ page }) => {
      await page.goto(l.listing);
      await page.getByRole("link", { name: l.gigs[0] }).click();
      await expect(page).toHaveURL(`${l.listing}${gigSlugs[0]}/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        l.gigs[0],
      );
    });

    for (const slug of gigSlugs) {
      test.describe(slug, () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(`${l.listing}${slug}/`);
        });

        test("shows three packages with scope, deliverables, time and revisions", async ({
          page,
        }) => {
          const packages = section(page, l.packages).getByRole("article");
          await expect(packages).toHaveCount(3);

          for (const [i, tier] of l.tiers.entries()) {
            const pkg = packages.nth(i);
            await expect(pkg.getByRole("heading", { level: 3 })).toHaveText(
              tier,
            );
            await expect(pkg.getByRole("paragraph").first()).not.toBeEmpty();
            await expect(
              pkg
                .getByRole("list", { name: l.deliverables })
                .getByRole("listitem")
                .first(),
            ).toBeVisible();
            await expect(pkg).toContainText(l.deliveryTime);
            await expect(pkg).toContainText(l.revisions);
          }
        });

        test("each package requests a quote for that gig and package", async ({
          page,
        }) => {
          const packages = section(page, l.packages).getByRole("article");
          for (const [i, tier] of ["basic", "standard", "premium"].entries()) {
            const href = await packages
              .nth(i)
              .getByRole("link", { name: l.quote })
              .getAttribute("href");
            const url = new URL(href!, page.url());
            expect(url.pathname).toBe(l.contact);
            expect(url.searchParams.get("gig")).toBe(slug);
            expect(url.searchParams.get("package")).toBe(tier);
          }
        });

        test("shows the gallery with localized alt text", async ({ page }) => {
          const image = section(page, l.gallery).getByRole("img").first();
          await expect(image).toBeVisible();
          await expect(image).toHaveAttribute("alt", l.galleryAlt);
        });

        test("shows the FAQ with expandable answers", async ({ page }) => {
          const faq = section(page, l.faq);
          const question = faq.locator("summary").first();
          const answer = faq.locator("details").first().locator("p");
          await expect(question).not.toBeEmpty();
          await expect(answer).toBeHidden();
          await question.click();
          await expect(answer).toBeVisible();
        });

        test("shows what I need from the client", async ({ page }) => {
          await expect(
            section(page, l.requirements).getByRole("listitem").first(),
          ).not.toBeEmpty();
        });

        if (gigsWithRelatedWork.includes(slug)) {
          test("shows related work as problem, solution and result", async ({
            page,
          }) => {
            const projects = section(page, l.relatedWork).getByRole("article");
            await expect(projects.first()).toBeVisible();
            for (const project of await projects.all()) {
              await expect(project.getByRole("heading")).not.toHaveCount(0);
              await expect(project.locator("dt")).toHaveText(l.story);
              for (const description of await project.locator("dd").all()) {
                await expect(description).not.toBeEmpty();
              }
              await expect(
                project
                  .getByRole("list", { name: l.tech })
                  .getByRole("listitem")
                  .first(),
              ).toBeVisible();
            }
          });

          test("confidential projects link nowhere outside the site", async ({
            page,
          }) => {
            // Client names are covered by the privacy guard's denylist.
            const related = section(page, l.relatedWork);
            await expect(related.getByRole("article").first()).toBeVisible();
            for (const link of await related.getByRole("link").all()) {
              const href = await link.getAttribute("href");
              expect(new URL(href!, page.url()).origin).toBe(
                new URL(page.url()).origin,
              );
            }
          });
        }

        test("shows no prices", async ({ page }) => {
          await expect(section(page, l.packages)).not.toContainText(
            /[$€]|\b(USD|EUR|COP)\b/,
          );
        });
      });
    }
  });
}

// Fixture content (e2e/fixtures/content), built in with CONTENT_FIXTURES=true.
test.describe("fixture gig without related work", () => {
  for (const l of locales) {
    test(`renders no related-work section and no hidden price (${l.lang})`, async ({
      page,
    }) => {
      await page.goto(`${l.listing}e2e-gig-without-related-work/`);
      await expect(section(page, l.packages)).toBeVisible();
      await expect(section(page, l.relatedWork)).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: l.relatedWork, exact: true }),
      ).toHaveCount(0);
      // Its basic package has a price in content; prices are never shown.
      await expect(page.locator("body")).not.toContainText("4321");
    });
  }
});
