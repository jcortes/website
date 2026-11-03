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

Schemas live in `src/content.config.ts`. The build fails on invalid content,
including a project that references a missing gig.

## Test

```sh
pnpm lint         # ESLint + Prettier check (pnpm format to fix)
pnpm typecheck    # astro check
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # builds the site, then runs Playwright against the build
```

The E2E suite runs against a production build served by `astro preview`,
built with `CONTENT_FIXTURES=true` so that test-only entries from
`e2e/fixtures/content/` (for example a gig with no related work) are included.
That build goes to `dist-e2e/`, never to `dist/`, and the privacy guard scans
the real production build in `dist/`.

It includes a **privacy guard** that scans the build and fails if it finds a
phone number or a client name from the denylist (see [Privacy](#privacy)).

## Build

```sh
pnpm build        # outputs the static site to dist/
pnpm preview      # serve dist/ locally
```

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, build and E2E on
every pull request and on pushes to `main`.

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
