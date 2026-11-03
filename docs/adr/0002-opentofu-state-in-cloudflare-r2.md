# 2. OpenTofu state lives in a Cloudflare R2 bucket

Date: 2026-11-03

## Status

Accepted

## Context

OpenTofu (`infra/`) manages the Cloudflare Pages project, the contact
function's bindings, the Turnstile widget and Web Analytics. CI plans on every
pull request and applies on `main`, so the state must live outside the
runners and be readable by both. It holds secrets: the Resend API key, the
destination inbox and the Turnstile secret are stored in it as plain values.
The repository is public and the budget is zero.

Options considered:

- **Commit the state to the repository**: no extra service, but it would
  publish the secrets; ruled out even with OpenTofu state encryption, since
  a leaked passphrase would expose every past version forever.
- **HCP Terraform / Terraform Cloud**: a managed backend with locking, but a
  separate account, its compatibility with OpenTofu isn't guaranteed, and it
  adds a third vendor for one file.
- **AWS S3 (+ DynamoDB or S3 locking)**: the reference backend, but it means
  an AWS account and IAM setup just for the state of a Cloudflare project.
- **Cloudflare R2 through the `s3` backend**: same vendor as everything else,
  free tier, private bucket, S3-compatible so the built-in backend works.

## Decision

Store the state in the private R2 bucket `website-tofu-state`
(key `website/terraform.tfstate`) using OpenTofu's `s3` backend
(`infra/versions.tf`). CI authenticates with an R2 API token scoped to that
bucket (Object Read & Write), stored as the `TOFU_STATE_ACCESS_KEY_ID` and
`TOFU_STATE_SECRET_ACCESS_KEY` secrets of the `production` GitHub environment;
the endpoint is derived from the `CLOUDFLARE_ACCOUNT_ID` variable. The bucket
and the token are created by hand once (`scripts/setup-accounts.sh`), because
the state can't hold the resource that stores it.

No state locking is configured: every OpenTofu job runs in the `opentofu`
concurrency group, so CI never runs two at once, and plans use `-lock=false`.

## Consequences

- One vendor and one dashboard for the whole site; no cost at this size.
- The state, and the secrets in it, are protected by the bucket being private
  and by a token that can reach only that bucket. Anyone with that token or
  account access can read them.
- Running OpenTofu outside CI (e.g. a local `tofu plan`) needs the same
  credentials and could race with CI, since there is no lock. Prefer CI.
- If concurrent runs ever become possible, enable `use_lockfile` (S3 native
  locking) after checking R2 supports the conditional writes it relies on.
- Moving the state elsewhere later is a `tofu init -migrate-state`.
