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
