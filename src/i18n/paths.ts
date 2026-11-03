import { defaultLocale, locales, type Locale } from "./ui";

/**
 * Strips the locale prefix from a pathname. The default locale (Spanish) is
 * unprefixed; other locales live under `/<locale>/`.
 */
function withoutLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  const prefixed = locales.some(
    (locale) => locale !== defaultLocale && locale === first,
  );
  return prefixed ? "/" + rest.join("/") : pathname;
}

/** Path of the page equivalent to `pathname` in `target` locale. */
export function localizedPath(pathname: string, target: Locale): string {
  const rest = withoutLocale(pathname);
  if (target === defaultLocale) return rest || "/";
  return `/${target}${rest === "/" ? "/" : rest}`;
}
