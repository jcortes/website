import { expect, test, type Page } from "@playwright/test";

const runningAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );

test("the circuit background is animated", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.getByTestId("circuit-background")).toBeVisible();
  expect(await runningAnimations(page)).toBeGreaterThan(0);
});

test("nothing animates when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("circuit-background")).toBeVisible();
  expect(await runningAnimations(page)).toBe(0);
});
