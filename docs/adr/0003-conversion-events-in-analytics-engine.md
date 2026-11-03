# 3. Conversion events are stored in Workers Analytics Engine

Date: 2026-11-03

## Status

Accepted

## Context

The spec asks for cookie-free analytics (Cloudflare Web Analytics) "plus
custom conversion events for 'Book a call' clicks and successful form
submissions". Web Analytics only records page views and performance: it has
no custom-event API. Zaraz, Cloudflare's tag manager, can track events but
needs a zone, and a `*.pages.dev` site isn't one. A third-party product
(Plausible, PostHog…) would add a vendor, a script and possibly cookies.

## Decision

The browser reports each event with `navigator.sendBeacon` to `/api/event`, a
Pages Function (`functions/api/event.ts` around `src/analytics/events.ts`)
that accepts only known event names and site paths and writes a data point to
the Workers Analytics Engine dataset `website_events`, bound by OpenTofu.
Page views stay in Web Analytics.

## Consequences

- Still cookie-free, no new vendor, free at this volume, managed as code.
- Events aren't in the Web Analytics dashboard: they're read with the
  Analytics Engine SQL API (query in the README). Data is sampled at high
  volume, so counts use `SUM(_sample_interval)`.
- Previews write to the same dataset; each point carries the hostname so
  queries can keep production only.
- The endpoint is public and unauthenticated, so counts can be inflated by
  anyone posting to it. Acceptable for a personal site's trend data; rate
  limiting would be the next step if it matters.
