// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

// E2E builds include fixture content (see src/content.config.ts) and go to a
// separate directory, so they can never be mistaken for the production build.
const fixtures = process.env.CONTENT_FIXTURES === "true";

/**
 * The Keystatic admin panel at /keystatic (keystatic.config.ts).
 * - `astro dev`: the @keystatic/astro integration serves the panel and its
 *   API on demand, in local mode (saves to the files in this checkout).
 * - builds: the site stays static, so /keystatic is a prerendered shell of
 *   the same app in GitHub mode; its API runs as a Cloudflare Pages Function
 *   (functions/api/keystatic/). See docs/adr/0004.
 */
function admin() {
  const devPanel = keystatic();
  return {
    name: "admin",
    hooks: {
      /** @param {any} params */
      "astro:config:setup": (params) => {
        // @keystatic/astro has this one hook only.
        if (params.command === "dev") {
          return devPanel.hooks["astro:config:setup"]?.(params);
        }
        params.injectRoute({
          pattern: "/keystatic",
          entrypoint: "./src/admin/KeystaticPage.astro",
          prerender: true,
        });
      },
    },
  };
}

export default defineConfig({
  // Production origin, for canonical URLs, hreflang alternates, Open Graph
  // and the sitemap. SITE_URL overrides it (e.g. for a custom domain).
  site: process.env.SITE_URL ?? "https://jcortes.pages.dev",
  integrations: [
    react(),
    admin(),
    // The admin panel isn't a page of the site.
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith("/keystatic"),
    }),
  ],
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
