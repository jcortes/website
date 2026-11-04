/**
 * Cloudflare Pages Function: /api/keystatic/*, the online admin panel's API
 * (GitHub login, token refresh and logout). The panel itself is the static
 * /keystatic page; with a GitHub token from this API it reads and commits to
 * the repository directly, so this function never touches content. Only
 * users with write access to the repository can save (docs/adr/0004).
 *
 * KEYSTATIC_GITHUB_CLIENT_ID and KEYSTATIC_GITHUB_CLIENT_SECRET come from the
 * GitHub App, KEYSTATIC_SECRET encrypts the refresh-token cookie; all three
 * are set on the Pages project by OpenTofu (infra/main.tf).
 */
import { makeGenericAPIRouteHandler } from "@keystatic/core/api/generic";
import { githubStorage } from "../../../src/admin/storage";

interface Env {
  KEYSTATIC_GITHUB_CLIENT_ID?: string;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string;
  KEYSTATIC_SECRET?: string;
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const {
    KEYSTATIC_GITHUB_CLIENT_ID: clientId,
    KEYSTATIC_GITHUB_CLIENT_SECRET: clientSecret,
    KEYSTATIC_SECRET: secret,
  } = env;
  if (!clientId || !clientSecret || !secret) {
    console.error("keystatic: missing GitHub App configuration");
    return new Response(null, { status: 500 });
  }
  // The API needs only the storage settings, not the content schema.
  const handle = makeGenericAPIRouteHandler({
    config: { storage: githubStorage },
    clientId,
    clientSecret,
    secret,
  });
  const { body, headers, status } = await handle(request);
  // Only local mode (never used here) answers with bytes; GitHub mode's
  // bodies are text or empty.
  return new Response(body as string | null, { status, headers });
}
