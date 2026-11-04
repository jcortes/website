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

### Admin panel

Everything above can also be edited at `/keystatic`
([Keystatic](https://keystatic.com), configured in `keystatic.config.ts`,
which mirrors the schemas field by field; see
[ADR 0004](docs/adr/0004-keystatic-admin-in-github-mode.md)):

- **Locally**: `pnpm dev`, then <http://127.0.0.1:4321/keystatic>. Saves go
  straight to the files in your checkout; commit them as usual.
- **Online**: <https://jcortes.pages.dev/keystatic>. Sign in with GitHub;
  saving needs write access to this repository. Each save is a commit on
  `main`, which CI checks and deploys, so `main` must not require pull
  requests (branch protection or rulesets would reject the panel's commits). Login works only on the production
  host, not on preview deployments. It needs the GitHub App from the setup
  wizard (see [Third-party accounts and secrets](#third-party-accounts-and-secrets)).

The panel follows the files' conventions: the slug is the file name, and an
entry's images live in `src/assets/<collection>/<slug>/`. Saving rewrites the
whole file in Keystatic's YAML style (comments are dropped), which is why
`src/content/**/*.yaml` is excluded from Prettier. Hand edits keep working.

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
`TURNSTILE_SECRET_KEY` from the Pages environment, set by OpenTofu (see
[Infrastructure and deployment](#infrastructure-and-deployment)). Nothing is
hardcoded.

The Turnstile widget renders only when the build gets
`PUBLIC_TURNSTILE_SITE_KEY` (CI passes it from the OpenTofu outputs); local,
E2E and Lighthouse builds have no widget, so a real handler would reject their
submissions with 403. Cloudflare's script loads on the visitor's first
interaction with the form, to keep the page fast.

## Analytics

Page views: Cloudflare Web Analytics (cookie-free). The beacon is embedded
only when the build gets `PUBLIC_CF_ANALYTICS_TOKEN`, so production only.

Conversion events: a click on any element marked `data-track="book_call"` (every
"Book a call" link) and a successful contact submission (`contact_submitted`)
are reported with `navigator.sendBeacon` to `/api/event`
(`functions/api/event.ts`, a thin shell around `src/analytics/events.ts`). It
accepts only known event names and site paths and writes them to the Workers
Analytics Engine dataset `website_events` (`blob1` = event, `blob2` = path,
`blob3` = hostname, since previews share the dataset); see
[ADR 0003](docs/adr/0003-conversion-events-in-analytics-engine.md).
Query them with the
[SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/):

```sql
SELECT blob1 AS event, blob2 AS path, SUM(_sample_interval) AS count
FROM website_events
WHERE timestamp > NOW() - INTERVAL '30' DAY AND blob3 = 'jcortes.pages.dev'
GROUP BY event, path
```

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

Lighthouse CI (`lighthouserc.json`) audits every built page except the admin
panel and fails below 95 on performance; accessibility, best practices and SEO
are reported. Locally it needs Chrome; to use Playwright's Chromium:
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
Lighthouse reports are uploaded as a build artifact. Then it plans or applies
the infrastructure and deploys, below.

## Infrastructure and deployment

The site runs on Cloudflare Pages at `https://jcortes.pages.dev`. Everything
it needs on Cloudflare is OpenTofu code in `infra/`: the Pages project
(direct upload), the functions' bindings (`CONTACT_TO_EMAIL`,
`RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` as secrets, the `EVENTS` Analytics
Engine dataset and, once the GitHub App exists, the admin panel's
`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` and a generated
`KEYSTATIC_SECRET`) for production and previews, the Turnstile widget and the Web
Analytics site. State lives in a private R2 bucket
([ADR 0002](docs/adr/0002-opentofu-state-in-cloudflare-r2.md)).

After the checks pass, the workflow (jobs `infra` and `deploy`, in the
`production` GitHub environment):

- **On pull requests**: `tofu fmt -check`, `validate` and `plan`; the plan is
  posted to the PR as a comment. Then a preview deploy of the branch, whose URL
  is posted to the PR too. PRs from forks get neither (no secrets).
  Both jobs use the `production` environment, so it must not restrict
  deployment branches or require reviewers.
- **On `main`**: `tofu apply`, then a production deploy.

The build gets `SITE_URL`, `PUBLIC_TURNSTILE_SITE_KEY` and
`PUBLIC_CF_ANALYTICS_TOKEN` from the OpenTofu outputs (and
`PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` from a variable), and Wrangler
(`pages deploy`) uploads `dist/` and the `functions/`. Until the first apply
has created the project, the deploy job is skipped.

No secret is in the repository. CI reads `CLOUDFLARE_API_TOKEN`,
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `TOFU_STATE_ACCESS_KEY_ID`,
`TOFU_STATE_SECRET_ACCESS_KEY` and `KEYSTATIC_GITHUB_CLIENT_SECRET` (secrets)
and `CLOUDFLARE_ACCOUNT_ID`, `KEYSTATIC_GITHUB_CLIENT_ID` and
`KEYSTATIC_GITHUB_APP_SLUG` (variables) from the `production` environment; the
Turnstile secret and `KEYSTATIC_SECRET` go from OpenTofu straight to
Cloudflare.

### First deployment

1. Run `./scripts/setup-accounts.sh`: it creates the GitHub environment and
   walks you through the R2 state bucket and its keys, among the rest.
2. Open a pull request: the plan should create three resources. The preview
   deploy is skipped this time, since nothing exists yet.
3. Merge: CI applies, then deploys production.

The "How I built this site" page (`/como-lo-construi/`,
`/en/how-i-built-it/`, `src/components/BuiltPage.astro`) describes this setup
for visitors; keep it in step when it changes.

## SEO

Every page has a localized title and description, a canonical URL,
`hreflang` alternates (`es`, `en`, `x-default`) and Open Graph tags. The Open
Graph image is generated at build time from the logo (`/og/es.png`,
`/og/en.png`, see `src/og/render-og.ts`), and `@astrojs/sitemap` writes
`sitemap-index.xml`. Absolute URLs use `site` in `astro.config.mjs`
(`https://jcortes.pages.dev`), which the `SITE_URL` environment variable
overrides.

## Third-party accounts and secrets

Cloudflare, Resend, Cal.com and the admin panel's GitHub App are set up by
hand, guided by a wizard:

```sh
./scripts/setup-accounts.sh
```

It opens each dashboard, tells you what to click, and stores the values in the
git-ignored `.env` and in the `production` GitHub Actions environment
(`CLOUDFLARE_API_TOKEN`, `TOFU_STATE_ACCESS_KEY_ID`,
`TOFU_STATE_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and
`KEYSTATIC_GITHUB_CLIENT_SECRET` as secrets; `CLOUDFLARE_ACCOUNT_ID`,
`CALCOM_BOOKING_URL`, `KEYSTATIC_GITHUB_CLIENT_ID` and
`KEYSTATIC_GITHUB_APP_SLUG` as variables). CI jobs that
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
