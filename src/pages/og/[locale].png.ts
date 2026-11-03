import type { APIRoute, GetStaticPaths } from "astro";
import { getProfile } from "../../content/profile";
import { getSettings } from "../../content/settings";
import { useTranslations, locales, type Locale } from "../../i18n/ui";
import { renderOgImage } from "../../og/render-og";

export const getStaticPaths = (() =>
  locales.map((locale) => ({ params: { locale } }))) satisfies GetStaticPaths;

/** The Open Graph image for every page in a locale (see BaseLayout). */
export const GET: APIRoute = async ({ params }) => {
  const locale = params.locale as Locale;
  const t = useTranslations(locale);
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const png = await renderOgImage({
    name: profile.name,
    headline: profile.headline[locale],
    tagline: t("og.tagline").replace(
      "{years}",
      String(settings.yearsOfExperience),
    ),
  });
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
