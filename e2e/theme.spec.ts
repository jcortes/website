import { expect, test, type Page } from "@playwright/test";

const rootElement = (page: Page) => page.locator("html");

test("dark mode is the default", async ({ page }) => {
  await page.goto("/");
  await expect(rootElement(page)).toHaveAttribute("data-theme", "dark");
});

test("the chosen theme persists across reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cambiar a modo claro" }).click();
  await expect(rootElement(page)).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(rootElement(page)).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Cambiar a modo oscuro" }).click();
  await page.reload();
  await expect(rootElement(page)).toHaveAttribute("data-theme", "dark");
});

test("the theme choice carries over to the other locale", async ({ page }) => {
  await page.goto("/en/");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.getByRole("link", { name: "Español" }).click();
  await expect(rootElement(page)).toHaveAttribute("data-theme", "light");
});

test("a remembered light theme is applied before the page first renders", async ({
  page,
}) => {
  // Record the theme at the moment <body> is inserted, before first paint.
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
    new MutationObserver((_, observer) => {
      if (!document.body) return;
      (window as unknown as { themeAtBody: string | null }).themeAtBody =
        document.documentElement.getAttribute("data-theme");
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });

  await page.goto("/");
  const themeAtBody = await page.evaluate(
    () => (window as unknown as { themeAtBody: string | null }).themeAtBody,
  );
  expect(themeAtBody).toBe("light");
});
