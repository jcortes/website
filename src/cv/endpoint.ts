import { getProfile } from "../content/profile";
import { getSettings } from "../content/settings";
import type { Locale } from "../i18n/ui";
import { renderCvPdf } from "./render-pdf";

/** Static endpoint body for the CV PDF: generated at build time. */
export async function cvResponse(locale: Locale): Promise<Response> {
  const [profile, { social }] = await Promise.all([
    getProfile(),
    getSettings(),
  ]);
  const pdf = await renderCvPdf(profile, social, locale);
  return new Response(pdf, {
    headers: { "Content-Type": "application/pdf" },
  });
}
