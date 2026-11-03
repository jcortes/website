// @ts-check
import { defineConfig } from "astro/config";
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
  vite: {
    plugins: [tailwindcss()],
  },
});
