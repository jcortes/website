/**
 * Public build-time values, set by CI (infra/ outputs and GitHub variables).
 * All are absent in local, E2E and Lighthouse builds, which then render
 * neither the Turnstile widget nor the Web Analytics beacon.
 */
interface ImportMetaEnv {
  /** Turnstile widget site key (public; the secret stays in Cloudflare). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Cloudflare Web Analytics site token (public, embedded in every page). */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
  /**
   * Slug of the GitHub App behind the online admin panel (Keystatic), for its
   * "install the app" links. Optional; production builds get it from CI.
   */
  readonly PUBLIC_KEYSTATIC_GITHUB_APP_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
