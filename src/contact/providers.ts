import type { ContactDependencies, Email } from "./handler";

/**
 * Production adapters for the contact handler's dependencies. Kept thin: all
 * behavior worth testing lives in the handler, which tests drive with fakes.
 */

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND = "https://api.resend.com/emails";
/** Resend's shared sender: no custom domain needed. */
const FROM = "Website contact <onboarding@resend.dev>";

export function turnstileVerifier(
  secret: string,
): ContactDependencies["verifyTurnstile"] {
  return async (token, ip) => {
    const form = new FormData();
    form.set("secret", secret);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);
    const response = await fetch(SITEVERIFY, { method: "POST", body: form });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  };
}

export function resendSender(apiKey: string): ContactDependencies["sendEmail"] {
  return async (email: Email) => {
    const response = await fetch(RESEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend responded ${response.status}`);
    }
  };
}
