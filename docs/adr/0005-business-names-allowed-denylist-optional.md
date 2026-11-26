# 5. Business names are allowed; the name denylist is optional

Date: 2026-11-26

## Status

Accepted

## Context

The site started by never naming clients: the profile described them by
industry and region, and the privacy guard failed CI unless the
`PRIVACY_DENYLIST` secret listed the names to keep out of the build. The
recent portfolio now names the businesses it was built for (Estudio Bolsillo,
Vela Publicidad), and the owner wants no restrictions on business names for
now.

## Decision

- Clients and businesses may be named on the site and in the CV, or described
  by industry and region, as each entry prefers.
- `PRIVACY_DENYLIST` stays as a repository secret but is empty. When it is
  empty, the name check is skipped, in CI too, instead of failing.
- The setup wizard no longer asks for the denylist.
- Confidential projects (`confidential: true`) still may not have a client
  name or links: that is a per-project choice, not a site-wide rule.
- The phone-number check is unchanged.

## Consequences

Naming a client is a content decision, not a build error. To protect a name
again, set the secret (`gh secret set PRIVACY_DENYLIST`) and the same line in
`.env`; the existing check turns back on with no code change. A misspelled or
missing secret no longer fails CI, so the guard only protects names someone
remembered to list.
