// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// E2E builds include fixture content (see src/content.config.ts) and go to a
// separate directory, so they can never be mistaken for the production build.
const fixtures = process.env.CONTENT_FIXTURES === "true";

export default defineConfig({
  outDir: fixtures ? "./dist-e2e" : "./dist",
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  env: {
    schema: {
      // Public booking link for "Book a 30-min call", read at build time.
      // Set by scripts/setup-accounts.sh (.env and the GitHub environment).
      // Optional so builds without it still work; the link is then omitted.
      CALCOM_BOOKING_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        url: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
