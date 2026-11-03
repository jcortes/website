import { expect, test } from "@playwright/test";

for (const path of ["/", "/en/"]) {
  test(`${path} shows the JC logo linking home`, async ({ page }) => {
    await page.goto(path);
    const home = page.getByRole("banner").getByRole("link").first();
    await expect(home).toHaveAttribute("href", path);
    await expect(home.getByRole("img", { name: /JC/ })).toBeVisible();
  });
}

test("the favicon is the SVG logo", async ({ page, request }) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"][type="image/svg+xml"]')
    .getAttribute("href");
  expect(href).toBeTruthy();

  const response = await request.get(href!);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toContain("JC");
});
