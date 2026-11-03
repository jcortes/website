import { expect, test, type Page, type Route } from "@playwright/test";

// The E2E build sets CALCOM_BOOKING_URL to this (see playwright.config.ts and
// the CI workflow); the real URL is configuration, never code.
const CAL_URL = "https://cal.com/e2e/discovery-call";
const ENDPOINT = "**/api/contact";

const locales = [
  {
    lang: "es",
    path: "/contacto/",
    nav: "Contacto",
    gig: "Servicio",
    package: "Paquete",
    gigTitle: /GitHub Actions/,
    otherGigTitle: /Terraform/,
    standard: "Estándar",
    noGig: "Ninguno en particular",
    name: "Nombre",
    email: "Correo electrónico",
    company: /Empresa/,
    budget: /Presupuesto aproximado/,
    message: "Descripción del proyecto",
    submit: "Enviar mensaje",
    required: "Este campo es obligatorio.",
    invalidEmail: /correo válido/,
    tooShort: /al menos 20 caracteres/,
    success: "¡Gracias! Recibí tu mensaje",
    failure: "No se pudo enviar tu mensaje",
    book: "Agendar una llamada de 30 min",
    notes: "Me interesa:",
  },
  {
    lang: "en",
    path: "/en/contact/",
    nav: "Contact",
    gig: "Service",
    package: "Package",
    gigTitle: /GitHub Actions/,
    otherGigTitle: /Terraform/,
    standard: "Standard",
    noGig: "None in particular",
    name: "Name",
    email: "Email",
    company: /Company/,
    budget: /Approximate budget/,
    message: "Project description",
    submit: "Send message",
    required: "This field is required.",
    invalidEmail: /valid email/,
    tooShort: /at least 20 characters/,
    success: "Thanks! I got your message",
    failure: "Your message couldn't be sent",
    book: "Book a 30-min call",
    notes: "Interested in:",
  },
] as const;

type L = (typeof locales)[number];

/** Stubs the contact endpoint; returns the JSON bodies it received. */
async function stubEndpoint(
  page: Page,
  respond: (route: Route) => Promise<void>,
) {
  const bodies: Record<string, unknown>[] = [];
  await page.route(ENDPOINT, async (route) => {
    bodies.push(route.request().postDataJSON());
    await respond(route);
  });
  return bodies;
}

const json = (status: number, body: unknown) => (route: Route) =>
  route.fulfill({ status, json: body });

async function fillValidForm(page: Page, l: L) {
  await page.getByLabel(l.name).fill("Ana Gómez");
  await page.getByLabel(l.email).fill("ana@acme.test");
  await page.getByLabel(l.company).fill("Acme");
  await page.getByLabel(l.budget).selectOption("5k-15k");
  await page
    .getByLabel(l.message)
    .fill("We need a CI/CD pipeline for our monorepo.");
}

function bookingLink(page: Page, l: L) {
  return page.getByRole("complementary").getByRole("link", { name: l.book });
}

async function bookingNotes(page: Page, l: L) {
  const href = await bookingLink(page, l).getAttribute("href");
  const url = new URL(href!);
  expect(`${url.origin}${url.pathname}`).toBe(CAL_URL);
  return url.searchParams.get("notes");
}

for (const l of locales) {
  test.describe(`contact (${l.lang})`, () => {
    test("is linked from the header", async ({ page }) => {
      await page.goto(l.lang === "es" ? "/" : "/en/");
      await page
        .getByRole("banner")
        .getByRole("link", { name: l.nav, exact: true })
        .click();
      await expect(page).toHaveURL(l.path);
    });

    test("a gig's quote button preselects that gig and package", async ({
      page,
    }) => {
      const services = l.lang === "es" ? "/servicios/" : "/en/services/";
      await page.goto(`${services}ci-cd-github-actions/`);
      await page
        .getByRole("link", { name: /cotización|quote/i })
        .nth(1)
        .click();
      await expect(page).toHaveURL(new RegExp(`^.*${l.path}\\?`));
      await expect(page.getByLabel(l.gig)).toHaveValue("ci-cd-github-actions");
      await expect(page.getByLabel(l.package)).toHaveValue("standard");
    });

    test("the preselected gig and package can be changed or cleared", async ({
      page,
    }) => {
      await page.goto(`${l.path}?gig=ci-cd-github-actions&package=premium`);
      const gig = page.getByLabel(l.gig);
      const pkg = page.getByLabel(l.package);

      await expect(gig).toHaveValue("ci-cd-github-actions");
      await gig.selectOption({ label: await optionLabel(page) });
      await expect(gig).toHaveValue("aws-infrastructure-as-code");
      await pkg.selectOption("basic");
      await expect(pkg).toHaveValue("basic");

      await gig.selectOption({ label: l.noGig });
      await pkg.selectOption("");
      await expect(gig).toHaveValue("");
      await expect(pkg).toHaveValue("");
    });

    test("an unknown gig in the query string preselects nothing", async ({
      page,
    }) => {
      await page.goto(`${l.path}?gig=does-not-exist&package=gold`);
      await expect(page.getByLabel(l.gig)).toHaveValue("");
      await expect(page.getByLabel(l.package)).toHaveValue("");
    });

    test("the booking link carries the selected gig in its notes", async ({
      page,
    }) => {
      await page.goto(`${l.path}?gig=ci-cd-github-actions&package=standard`);
      const notes = await bookingNotes(page, l);
      expect(notes).toContain(l.notes);
      expect(notes).toMatch(l.gigTitle);
      expect(notes).toContain(l.standard);

      await page.getByLabel(l.gig).selectOption("aws-infrastructure-as-code");
      expect(await bookingNotes(page, l)).toMatch(l.otherGigTitle);

      await page.getByLabel(l.gig).selectOption("");
      expect(await bookingNotes(page, l)).toBeNull();
    });

    test("links to GitHub next to the form", async ({ page }) => {
      await page.goto(l.path);
      await expect(
        page.getByRole("complementary").getByRole("link", { name: /GitHub/ }),
      ).toHaveAttribute("href", "https://github.com/jcortes");
    });

    test("shows field errors before sending anything", async ({ page }) => {
      const bodies = await stubEndpoint(page, json(200, { ok: true }));
      await page.goto(l.path);

      await page.getByLabel(l.email).fill("not-an-email");
      await page.getByLabel(l.message).fill("too short");
      await page.getByRole("button", { name: l.submit }).click();

      const name = page.getByLabel(l.name);
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await expect(name).toHaveAccessibleDescription(l.required);
      await expect(name).toBeFocused();
      await expect(page.getByLabel(l.email)).toHaveAccessibleDescription(
        l.invalidEmail,
      );
      await expect(page.getByLabel(l.message)).toHaveAccessibleDescription(
        l.tooShort,
      );
      expect(bodies).toEqual([]);

      await name.fill("Ana");
      await page.getByRole("button", { name: l.submit }).click();
      await expect(name).not.toHaveAttribute("aria-invalid");
    });

    test("shows the handler's field errors", async ({ page }) => {
      await stubEndpoint(
        page,
        json(400, {
          ok: false,
          error: "validation",
          fields: { email: "invalid" },
        }),
      );
      await page.goto(l.path);
      await fillValidForm(page, l);
      await page.getByRole("button", { name: l.submit }).click();
      await expect(page.getByLabel(l.email)).toHaveAccessibleDescription(
        l.invalidEmail,
      );
      await expect(page.getByRole("alert")).toBeHidden();
    });

    test("confirms a successful submission", async ({ page }) => {
      const bodies = await stubEndpoint(page, json(200, { ok: true }));
      await page.goto(`${l.path}?gig=ci-cd-github-actions&package=standard`);
      await fillValidForm(page, l);
      await page.getByRole("button", { name: l.submit }).click();

      await expect(page.getByRole("status")).toContainText(l.success);
      await expect(
        page.getByRole("form", { name: /formulario|form/i }),
      ).toBeHidden();
      expect(bodies).toEqual([
        {
          name: "Ana Gómez",
          email: "ana@acme.test",
          company: "Acme",
          budget: "5k-15k",
          message: "We need a CI/CD pipeline for our monorepo.",
          gig: "ci-cd-github-actions",
          package: "standard",
          locale: l.lang,
          turnstileToken: "",
        },
      ]);
    });

    for (const [why, respond] of [
      ["the email provider fails", json(502, { ok: false, error: "email" })],
      ["the network fails", (route: Route) => route.abort()],
    ] as const) {
      test(`explains the failure and offers another way when ${why}`, async ({
        page,
      }) => {
        await stubEndpoint(page, respond);
        await page.goto(`${l.path}?gig=ci-cd-github-actions`);
        await fillValidForm(page, l);
        await page.getByRole("button", { name: l.submit }).click();

        const alert = page.getByRole("alert");
        await expect(alert).toContainText(l.failure);
        const book = alert.getByRole("link", { name: l.book });
        await expect(book).toBeVisible();
        const notes = new URL((await book.getAttribute("href"))!).searchParams;
        expect(notes.get("notes")).toMatch(l.gigTitle);
        await expect(alert.getByRole("link", { name: /GitHub/ })).toBeVisible();
        // The form stays filled in, ready to retry.
        await expect(page.getByLabel(l.name)).toHaveValue("Ana Gómez");
        await expect(
          page.getByRole("button", { name: l.submit }),
        ).toBeEnabled();
      });
    }
  });
}

/** Visible label of the AWS IaC gig option, as a visitor would pick it. */
async function optionLabel(page: Page): Promise<string> {
  const option = page.locator('option[value="aws-infrastructure-as-code"]');
  return (await option.textContent())!.trim();
}
