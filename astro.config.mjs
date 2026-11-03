// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// E2E builds include fixture content (see src/content.config.ts) and go to a
// separate directory, so they can never be mistaken for the production build.
const fixtures = process.env.CONTENT_FIXTURES === "true";

export default defineConfig({
  // Production origin, for canonical URLs, hreflang alternates, Open Graph
  // and the sitemap. SITE_URL overrides it (e.g. for a custom domain).
  site: process.env.SITE_URL ?? "https://jcortes.pages.dev",
  integrations: [sitemap()],
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
