import type { Tier } from "../content/catalog";
import { defaultLocale, locales, type Locale } from "./ui";

/** First path segment of each section, per locale. */
const sections = {
  services: { es: "servicios", en: "services" },
  about: { es: "sobre-mi", en: "about" },
  contact: { es: "contacto", en: "contact" },
} as const satisfies Record<string, Record<Locale, string>>;

export type Section = keyof typeof sections;

function localeRoot(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}/`;
}

/**
 * Splits a pathname into its locale and the rest (always starting with "/").
 * The default locale (Spanish) is unprefixed; others live under `/<locale>/`.
 */
function parse(pathname: string): { locale: Locale; rest: string } {
  const [, first, ...rest] = pathname.split("/");
  const locale = locales.find(
    (candidate) => candidate !== defaultLocale && candidate === first,
  );
  return locale
    ? { locale, rest: "/" + rest.join("/") }
    : { locale: defaultLocale, rest: pathname };
}

/** Path of the page equivalent to `pathname` in `target` locale. */
export function localizedPath(pathname: string, target: Locale): string {
  const { locale, rest } = parse(pathname);
  const [, first = "", ...tail] = rest.split("/");
  const section = Object.values(sections).find(
    (names) => names[locale] === first,
  );
  const translated = [section ? section[target] : first, ...tail].join("/");
  return localeRoot(target) + translated;
}

/** Path of a section page (and optional sub-pages) in `locale`. */
export function sectionPath(
  locale: Locale,
  section: Section,
  ...segments: string[]
): string {
  return (
    localeRoot(locale) +
    [sections[section][locale], ...segments].map((s) => `${s}/`).join("")
  );
}

/** Contact page with a gig and package preselected through the query string. */
export function quotePath(locale: Locale, gig: string, tier: Tier): string {
  const query = new URLSearchParams({ gig, package: tier });
  return `${sectionPath(locale, "contact")}?${query}`;
}

/** The Open Graph image shared by every page in `locale`. */
export function ogImagePath(locale: Locale): string {
  return `/og/${locale}.png`;
}

/** The CV PDF generated from the profile, next to the About page. */
export function cvPath(locale: Locale): string {
  return `${sectionPath(locale, "about")}jorge-cortes-cv.pdf`;
}
