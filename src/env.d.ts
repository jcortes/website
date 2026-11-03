/**
 * Public build-time values, set by CI from the OpenTofu outputs (infra/).
 * Both are absent in local, E2E and Lighthouse builds, which then render
 * neither the Turnstile widget nor the Web Analytics beacon.
 */
interface ImportMetaEnv {
  /** Turnstile widget site key (public; the secret stays in Cloudflare). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Cloudflare Web Analytics site token (public, embedded in every page). */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
