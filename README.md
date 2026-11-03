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

## Test

```sh
pnpm lint         # ESLint + Prettier check (pnpm format to fix)
pnpm typecheck    # astro check
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # builds the site, then runs Playwright against the build
```

The E2E suite runs against the production build served by `astro preview`.
It includes a **privacy guard** that scans every built HTML file and fails if
it finds a phone number.

## Build

```sh
pnpm build        # outputs the static site to dist/
pnpm preview      # serve dist/ locally
```

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, build and E2E on
every pull request and on pushes to `main`.

## Brand

Three variants of the "JC" circuit-gear logo live in `src/assets/brand/`.
`logo-c-solid.svg` is currently the site logo (imported in
`src/components/SiteHeader.astro`) and the favicon (`public/favicon.svg`, a
copy). To switch variants, change that import and replace `public/favicon.svg`.

## Privacy

This repository is public. The original CV (`cv.pdf`) is git-ignored and must
never be committed, and no page may expose phone numbers.
