import { expect, test, type Page } from "@playwright/test";

// One thing moves on the whole site: the hero signal leading to the Primary
// CTA on the home page. The circuit background is static.

const runningAnimations = (page: Page) =>
  page.evaluate(
    () =>
      // CSS animations only: hover transitions don't count as motion here.
      document
        .getAnimations()
        .filter((a) => a instanceof CSSAnimation && a.playState === "running")
        .length,
  );

const pauseLabels = {
  pause: "Pausar animaciones",
  play: "Reanudar animaciones",
};

test("on the home page only the hero signal moves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.getByTestId("circuit-background")).toBeVisible();
  await expect(page.getByTestId("hero-signal")).toBeVisible();
  expect(await runningAnimations(page)).toBe(1);
});

test("nothing moves on the other pages, and they have no pause button", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const path of ["/servicios/", "/sobre-mi/", "/contacto/"]) {
    await page.goto(path);
    await expect(page.getByTestId("circuit-background")).toBeVisible();
    expect(await runningAnimations(page)).toBe(0);
    await expect(
      page.getByRole("button", { name: pauseLabels.pause }),
    ).toHaveCount(0);
  }
});

test("nothing moves when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await runningAnimations(page)).toBe(0);
  // Nothing to pause, so no pause button.
  await expect(
    page.getByRole("button", { name: pauseLabels.pause }),
  ).toBeHidden();
});

test("the pause button stops the signal and is remembered", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: pauseLabels.pause }).click();
  expect(await runningAnimations(page)).toBe(0);

  await page.reload();
  expect(await runningAnimations(page)).toBe(0);
  await page.getByRole("button", { name: pauseLabels.play }).click();
  expect(await runningAnimations(page)).toBe(1);
});
