/**
 * Cloudflare Pages Function: POST /api/contact. Every value comes from the
 * Pages project's environment (secrets), never from the repository.
 */
import { createContactHandler } from "../../src/contact/handler";
import { resendSender, turnstileVerifier } from "../../src/contact/providers";

interface Env {
  CONTACT_TO_EMAIL?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } = env;
  if (!CONTACT_TO_EMAIL || !RESEND_API_KEY || !TURNSTILE_SECRET_KEY) {
    console.error("contact: missing configuration");
    return Response.json({ ok: false, error: "config" }, { status: 500 });
  }
  const handle = createContactHandler({
    to: CONTACT_TO_EMAIL,
    verifyTurnstile: turnstileVerifier(TURNSTILE_SECRET_KEY),
    sendEmail: resendSender(RESEND_API_KEY),
  });
  return handle(request);
}
