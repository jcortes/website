import { getProfile } from "../content/profile";
import type { Locale } from "../i18n/ui";
import { renderCvPdf } from "./render-pdf";

/** Static endpoint body for the CV PDF: generated at build time. */
export async function cvResponse(locale: Locale): Promise<Response> {
  const pdf = await renderCvPdf(await getProfile(), locale);
  return new Response(pdf, {
    headers: { "Content-Type": "application/pdf" },
  });
}
