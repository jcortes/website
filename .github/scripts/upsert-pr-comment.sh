#!/usr/bin/env bash
# upsert-pr-comment.sh MARKER FILE: posts FILE as a comment on the current
# pull request, or edits this workflow's earlier comment containing MARKER, so
# each PR keeps one up-to-date comment per kind (plan, preview).
set -euo pipefail
marker="$1" file="$2"
: "${PR_NUMBER:?}" "${GITHUB_REPOSITORY:?}"

id=$(gh api --paginate "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" \
  --jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | contains(\"$marker\"))) | .id" |
  tail -n1)
if [[ -n "$id" ]]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$id" -F "body=@$file" >/dev/null
else
  gh pr comment "$PR_NUMBER" --repo "$GITHUB_REPOSITORY" --body-file "$file"
fi
