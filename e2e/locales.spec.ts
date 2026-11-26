import { expect, test } from "@playwright/test";

test("the root renders the home page in Spanish", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "producción",
  );
});

test("/en/ renders the home page in English", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "production",
  );
});

test.describe("with an English-speaking browser", () => {
  test.use({
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });

  test("the root is not redirected based on browser language", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.request().redirectedFrom()).toBeNull();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });
});
