# website

Personal professional site of Jorge Cortés: Software & DevOps engineer.
Bilingual (Spanish at `/`, English under `/en/`), built with
[Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com).

## Requirements

- Node 24
- pnpm 10 (the exact version is pinned in `package.json` → `packageManager`;
  `.tool-versions` pins both for asdf/mise users)

## Install

```sh
pnpm install
pnpm exec playwright install chromium   # once, for the E2E suite
```

## Develop

```sh
pnpm dev          # http://localhost:4321
```

Pages live in `src/pages/` (Spanish at the root, English under `src/pages/en/`).
UI strings for both languages are in `src/i18n/ui.ts`.

## Content

Gigs and projects are YAML files, one per entry, with every text in both
languages (`{ es: …, en: … }`). The file name is the slug.

- `src/content/gigs/`: services, listed at `/servicios/` and `/en/services/`.
  Each has exactly three packages (`basic`, `standard`, `premium`). A package
  may carry a `price`, which is never shown.
- `src/content/projects/`: past work, shown as "Related work" on every gig it
  lists in `gigs`. Confidential projects may not have a client name or links.

- `src/content/profile/profile.yaml`: the Profile/CV singleton (summary,
  experience, skills, education, courses, languages). It feeds the
  About page (`/sobre-mi/`, `/en/about/`) and the CV PDF generated from it at
  build time (`jorge-cortes-cv.pdf` next to each About page), so the two
  never diverge. Clients appear only as anonymized descriptors; the profile
  has no phone numbers and no references. See
  [ADR 0001](docs/adr/0001-cv-pdf-generated-with-pdfkit.md).
- `src/content/settings/site.yaml`: the Site settings singleton: the Cal.com
  booking URL behind every "Book a call" button, the social links (GitHub,
  LinkedIn) used across the site and the CV, the trust-bar technologies and
  the years-of-experience figure (shown as "15+").
- `src/content/testimonials/`: testimonials (a localized quote and an
  optional author name, role, company and link). The set starts empty, and
  the home page shows the section only when at least one exists.

The home page (`/`, `/en/`) is built from these: hero, trust bar, services,
"How I work", a short About summary, testimonials (when any) and a closing
call to action.

Schemas live in `src/content.config.ts`. The build fails on invalid content,
including a project that references a missing gig.

## Contact

`/contacto/` and `/en/contact/` hold the contact form. A gig's "Request a
quote" button opens it with `?gig=<slug>&package=<tier>`, which preselects
both. Next to the form, "Book a 30-min call" links to the booking URL from
the site settings, with the selected gig in the booking notes.

The form posts JSON to `/api/contact`, a Cloudflare Pages Function
(`functions/api/contact.ts`). The function is a thin shell around
`src/contact/handler.ts`, a request → response handler whose Turnstile
verifier and email sender are injected, so unit tests drive it with fakes.
Form and handler share the validation in `src/contact/submission.ts`. The
function reads `CONTACT_TO_EMAIL`, `RESEND_API_KEY` and
`TURNSTILE_SECRET_KEY` from the Pages environment. Nothing is hardcoded. The
Turnstile widget and these bindings are part of the infrastructure work, so
real submissions are rejected (403) until then.

## Test

```sh
pnpm lint         # ESLint + Prettier check (pnpm format to fix)
pnpm typecheck    # astro check
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # builds the site, then runs Playwright against the build
pnpm lighthouse   # Lighthouse CI on every page of dist/ (build first)
```

The E2E suite runs against a production build served by `astro preview`,
built with `CONTENT_FIXTURES=true` so that test-only entries from
`e2e/fixtures/content/` (for example a gig with no related work) are included.
Fixture site settings (`e2e/fixtures/content/settings/`) replace the real
ones in that build, so tests see a fake booking URL. That build goes to
`dist-e2e/`, never to `dist/`, and the privacy guard scans the real
production build in `dist/`.

Every page listed in the sitemap gets [axe](https://github.com/dequelabs/axe-core)
accessibility checks in both themes, an SEO check (localized title and
description, canonical URL, `hreflang` alternates, Open Graph image) and a
phone-sized viewport check (no sideways scrolling).

Lighthouse CI (`lighthouserc.json`) audits every built page and fails below 95
on performance; accessibility, best practices and SEO are reported. Locally it
needs Chrome; to use Playwright's Chromium:
`CHROME_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())") pnpm lighthouse`.

It includes a **privacy guard** that scans the build, including the text of
the CV PDFs, and fails if it finds a phone number or a client name from the
denylist (see [Privacy](#privacy)).

## Build

```sh
pnpm build        # outputs the static site to dist/
pnpm preview      # serve dist/ locally
```

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, build,
Lighthouse CI and E2E on every pull request and on pushes to `main`. The
Lighthouse reports are uploaded as a build artifact.

## SEO

Every page has a localized title and description, a canonical URL,
`hreflang` alternates (`es`, `en`, `x-default`) and Open Graph tags. The Open
Graph image is generated at build time from the logo (`/og/es.png`,
`/og/en.png`, see `src/og/render-og.ts`), and `@astrojs/sitemap` writes
`sitemap-index.xml`. Absolute URLs use `site` in `astro.config.mjs`
(`https://jcortes.pages.dev`), which the `SITE_URL` environment variable
overrides.

## Third-party accounts and secrets

Cloudflare, Resend and Cal.com are set up by hand, guided by a wizard:

```sh
./scripts/setup-accounts.sh
```

It opens each dashboard, tells you what to click, and stores the values in the
git-ignored `.env` and in the `production` GitHub Actions environment
(`CLOUDFLARE_API_TOKEN`, `RESEND_API_KEY` and `CONTACT_TO_EMAIL` as secrets;
`CLOUDFLARE_ACCOUNT_ID` and `CALCOM_BOOKING_URL` as variables). CI jobs that
need them must declare `environment: production`. Re-running it is safe: press
Enter to keep a saved value.

The build doesn't read `CALCOM_BOOKING_URL`: the booking URL the site shows
is the one in `src/content/settings/site.yaml`, so keep the two in sync.

## Brand

Three variants of the "JC" circuit-gear logo live in `src/assets/brand/`.
`logo-c-solid.svg` is currently the site logo (imported in
`src/components/SiteHeader.astro`) and the favicon (`public/favicon.svg`, a
copy). To switch variants, change that import and replace `public/favicon.svg`.

## Privacy

This repository is public. The original CV (`cv.pdf`) is git-ignored and must
never be committed, and no page may expose phone numbers.

Client names are kept out of the repository too, including from the guard
that checks for them: the denylist is the `PRIVACY_DENYLIST` repository
secret (names separated by commas or newlines), set by the setup wizard. CI
fails when it's missing, which includes pull requests from forks (GitHub
doesn't pass them secrets). Locally, `pnpm test:e2e` reads it from `.env` and
skips that check when it's absent.
