export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const languageNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

export const ui = {
  es: {
    "site.title": "Jorge Cortés · Ingeniero de Software y DevOps",
    "site.description":
      "Ingeniero de sistemas independiente con más de 15 años en desarrollo backend, nube (AWS) y CI/CD.",
    "nav.skipToContent": "Saltar al contenido",
    "nav.home": "Inicio",
    "nav.language": "Idioma",
    "theme.toLight": "Cambiar a modo claro",
    "theme.toDark": "Cambiar a modo oscuro",
    "home.eyebrow": "Sitio en construcción",
    "home.title": "Ingeniero de Software y DevOps independiente",
    "home.lead":
      "Más de 15 años construyendo backends, infraestructura en AWS y pipelines de CI/CD. Muy pronto encontrarás aquí mis servicios y proyectos.",
  },
  en: {
    "site.title": "Jorge Cortés · Software & DevOps Engineer",
    "site.description":
      "Independent systems engineer with 15+ years in backend development, cloud (AWS) and CI/CD.",
    "nav.skipToContent": "Skip to content",
    "nav.home": "Home",
    "nav.language": "Language",
    "theme.toLight": "Switch to light mode",
    "theme.toDark": "Switch to dark mode",
    "home.eyebrow": "Site under construction",
    "home.title": "Independent Software & DevOps Engineer",
    "home.lead":
      "15+ years building backends, AWS infrastructure and CI/CD pipelines. My services and past work will be here very soon.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)[typeof defaultLocale];

export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}
