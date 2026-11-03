# 1. The CV PDF is generated at build time with pdfkit

Date: 2026-11-03

## Status

Accepted

## Context

The About page and the downloadable CV must never diverge, so the PDF is
generated from the same Profile/CV content (`src/content/profile/`) on every
build. It must be print-styled, available in both locales, and free of phone
numbers and references; the privacy guard scans its text.

Options considered:

- **Print the About page with a headless browser** (Playwright/Puppeteer):
  pixel-identical to the page, but it needs a browser during the build, a
  second build step (the page must be served first) and a heavy dependency in
  every build environment.
- **A JavaScript PDF library inside the Astro build** (pdfkit): no browser,
  runs as a static endpoint like any other page, layout written in code.

## Decision

Use **pdfkit** from static Astro endpoints
(`src/pages/sobre-mi/jorge-cortes-cv.pdf.ts`,
`src/pages/en/about/jorge-cortes-cv.pdf.ts`). `src/cv/render-pdf.ts` lays out
an A4 CV from the profile, reusing the site's UI strings for section titles.
It uses the PDF standard Helvetica fonts, whose WinAnsi encoding covers
Spanish and English text, so no font files are embedded.

## Consequences

- The PDF is built wherever the site is built, with no extra tooling.
- Its layout is separate from the About page's markup: a new profile field
  must be added to both. Both read the same data, so content cannot diverge.
- Characters outside WinAnsi (e.g. emoji, arrows) cannot appear in the PDF;
  switching to an embedded TTF font would lift that limit.
- E2E tests extract the PDF text (unpdf) to check its content, and the
  privacy guard scans it for phone numbers and denylisted names.
