#!/usr/bin/env bash
# smoke-admin-login.sh ORIGIN: checks that the admin panel's GitHub login
# (functions/api/keystatic/) answers with a redirect to GitHub's OAuth page.
# Its API answers 500 while the GitHub App's values are missing on the Pages
# project, and nothing else in CI would notice (docs/adr/0004).
# Retries briefly: a fresh deployment can take a few seconds to serve.
set -euo pipefail
origin="${1:?usage: smoke-admin-login.sh ORIGIN}"
url="${origin%/}/api/keystatic/github/login"
want="https://github.com/login/oauth/authorize"

for attempt in 1 2 3 4 5; do
  out=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$url" || true)
  code=${out%% *} location=${out#* }
  if [[ "$code" =~ ^30[1278]$ && "$location" == "$want"* ]]; then
    echo "admin login OK: $code -> $want"
    exit 0
  fi
  echo "attempt $attempt: HTTP $code ${location:-(no redirect)}"
  sleep $((attempt * 3))
done
echo "::error::Admin panel login ($url) doesn't redirect to GitHub: check the GitHub App values on the Pages project (scripts/setup-accounts.sh, infra/main.tf)."
exit 1
