import { expect, test, type Page } from "@playwright/test";

/**
 * Conversion events (POST /api/event) fire on "Book a call" clicks and on a
 * successful contact submission. Page views are Cloudflare Web Analytics'
 * job and aren't part of the built site under test.
 */

interface Reported {
  name: string;
  path: string;
}

/** Captures the conversion events the page reports. */
async function captureEvents(page: Page): Promise<Reported[]> {
  const events: Reported[] = [];
  await page.route("**/api/event", async (route) => {
    events.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204 });
  });
  // Stay on the site: "Book a call" links lead to the (fixture) Cal.com URL.
  await page.route("https://cal.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>Cal</title>" }),
  );
  return events;
}

for (const [path, name] of [
  ["/", "Agenda tu diagnóstico gratis de 30 min"],
  ["/en/", "Book your free 30-min diagnosis"],
] as const) {
  test(`clicking "${name}" on ${path} reports a book_call event`, async ({
    page,
  }) => {
    const events = await captureEvents(page);
    await page.goto(path);
    await page.getByRole("link", { name }).first().click();
    await expect.poll(() => events).toEqual([{ name: "book_call", path }]);
  });
}

test("booking a call from the contact page reports a book_call event", async ({
  page,
}) => {
  const events = await captureEvents(page);
  await page.goto("/en/contact/");
  await page
    .getByRole("complementary")
    .getByRole("link", { name: "Book your free 30-min diagnosis" })
    .click();
  await expect
    .poll(() => events)
    .toEqual([{ name: "book_call", path: "/en/contact/" }]);
});

async function submitContactForm(page: Page, status: number) {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status, json: { ok: status === 200 } }),
  );
  await page.goto("/en/contact/");
  await page.getByLabel("Name").fill("Ana Gómez");
  await page.getByLabel("Email").fill("ana@acme.test");
  await page
    .getByLabel("Project description")
    .fill("We need a CI/CD pipeline for our monorepo.");
  await page.getByRole("button", { name: "Send message" }).click();
}

test("a successful submission reports a contact_submitted event", async ({
  page,
}) => {
  const events = await captureEvents(page);
  await submitContactForm(page, 200);
  await expect(page.getByRole("status")).toBeVisible();
  await expect
    .poll(() => events)
    .toEqual([{ name: "contact_submitted", path: "/en/contact/" }]);
});

test("a failed submission reports nothing", async ({ page }) => {
  const events = await captureEvents(page);
  await submitContactForm(page, 502);
  await expect(page.getByRole("alert")).toBeVisible();
  expect(events).toEqual([]);
});
