# 4. Content admin panel: Keystatic in GitHub mode, on a static site

Date: 2026-11-03

## Status

Accepted

## Context

The owner manages gigs, projects, testimonials, the profile/CV and the site
settings, in both languages, from any browser, with no database and no server
to run. Content is YAML in `src/content/`, validated by the build
(`src/content.config.ts`), and must stay hand-editable. Every change should
become a commit that CI deploys. The site is static on Cloudflare Pages, with
a few Pages Functions in `functions/`. The repository is public, the budget
is zero, and only the owner may edit.

Options considered:

- **Decap CMS**: Git-based too, but GitHub login needs an external OAuth
  proxy, the UI is aging, and its schema is a separate YAML config.
- **Hosted headless CMS (Sanity, Contentful, …)**: content leaves the
  repository, which breaks "files stay hand-editable" and the build-time
  schema validation; another account and vendor.
- **Keystatic, local mode only**: edits from a checkout, not from any browser.
- **Keystatic, GitHub mode**: a TypeScript schema, YAML files in the repo,
  GitHub login through a GitHub App, and each save is a commit made with the
  editor's own GitHub token.

Keystatic's Astro integration serves its panel and API on demand, which
needs a server adapter. On Pages, the adapter's `_worker.js` replaces the
`functions/` directory, so the contact and event functions would have to move
and the whole site would run through a Worker.

## Decision

Use Keystatic: local mode in `pnpm dev`, GitHub mode in production, with no
adapter, so the site stays static.

- `keystatic.config.ts` describes every collection and singleton, mirroring
  the build schema. The storage mode follows the build: `import.meta.env.DEV`
  selects local mode, any build selects GitHub mode on `jcortes/website`
  (`src/admin/storage.ts`).
- Dev: the `@keystatic/astro` integration serves `/keystatic` and its API, and
  saves to the files in the checkout.
- Builds: `/keystatic` is a prerendered page that loads the same React app
  client-side (`src/admin/KeystaticPage.astro`); `public/_redirects` serves it
  for every `/keystatic/*` path. The API (GitHub login, token refresh,
  logout) is the Pages Function `functions/api/keystatic/[[path]].ts`, built on
  Keystatic's runtime-agnostic handler. The panel reads and commits through
  GitHub's API with the editor's token; the function never touches content.
- The GitHub App is created by hand, once (`scripts/setup-accounts.sh`). Its
  client ID and secret are GitHub Actions values of the `production`
  environment; OpenTofu passes them to the Pages project and generates
  `KEYSTATIC_SECRET` (which encrypts the refresh-token cookie). Nothing is in
  the repository.
- Saves commit to `main`, so CI verifies and deploys them like any push.
- The panel's file conventions are the repository's: the slug is the file
  name (never stored in the file), entry images live under
  `src/assets/<collection>/<slug>/`, an optional group left blank is saved as
  `{}` (the build schema treats it as absent), and panel-written YAML is
  excluded from Prettier, since Keystatic has its own YAML style and a
  formatting failure on `main` would block the deploy.

## Consequences

- Who can edit is GitHub's decision: anyone can sign in, but a save needs
  write access to the repository (the App's token is limited to what the user
  can do). No user list to maintain.
- No server, no database, no extra vendor; the panel costs nothing.
- Edits go straight to `main` without review, so `main` can't require pull
  requests: branch protection or a ruleset doing so would reject panel saves. A save that breaks the build
  schema fails CI and isn't deployed, but stays on `main` until fixed.
- The panel is one route, `/keystatic`, with Keystatic's English UI, not one
  per locale; each entry still carries both languages side by side.
- Login works only on the production hostname, the App's single callback URL;
  preview deployments serve the panel but can't sign in.
- Saving an entry rewrites its whole file in Keystatic's YAML style: comments
  are dropped and long strings are re-wrapped. Notes that must survive belong
  in the README or the schema, not in content files.
- The admin page ships a large React bundle (~2.7 MB). Only `/keystatic`
  loads it; it's excluded from the sitemap and from Lighthouse CI.
- Moving to an adapter later (e.g. to add other on-demand routes) means
  moving `functions/` into Astro endpoints first.
