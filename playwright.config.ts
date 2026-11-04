import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = 4329;

// Local runs pick up PRIVACY_DENYLIST (and the rest) from the git-ignored
// .env written by scripts/setup-accounts.sh. CI passes secrets as env vars.
if (existsSync(".env")) process.loadEnvFile(".env");

// E2E runs against a production build with fixture content (e2e/fixtures/
// content) built in, in dist-e2e/ (seam 1). The privacy guard scans the real
// production build in dist/. In CI both builds are separate steps, so the
// server only previews; locally we build both first.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI
      ? `CONTENT_FIXTURES=true pnpm preview --port ${PORT} --ignore-lock`
      : `pnpm build && CONTENT_FIXTURES=true pnpm build && CONTENT_FIXTURES=true pnpm preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
