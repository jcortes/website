import { expect, test } from "@playwright/test";

test("switching from Spanish lands on the equivalent English page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("switching from English lands on the equivalent Spanish page", async ({
  page,
}) => {
  await page.goto("/en/");
  await page.getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

for (const [from, link, to] of [
  ["/servicios/", "English", "/en/services/"],
  ["/en/services/", "Español", "/servicios/"],
  ["/sobre-mi/", "English", "/en/about/"],
  ["/en/about/", "Español", "/sobre-mi/"],
  [
    "/servicios/ci-cd-github-actions/",
    "English",
    "/en/services/ci-cd-github-actions/",
  ],
  [
    "/en/services/ci-cd-github-actions/",
    "Español",
    "/servicios/ci-cd-github-actions/",
  ],
] as const) {
  test(`switching from ${from} lands on ${to}`, async ({ page }) => {
    await page.goto(from);
    await page.getByRole("link", { name: link }).click();
    await expect(page).toHaveURL(to);
  });
}

test("the header links to the services in the current language", async ({
  page,
}) => {
  await page.goto("/en/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Services" })
    .click();
  await expect(page).toHaveURL("/en/services/");
});
