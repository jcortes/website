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
    "nav.main": "Principal",
    "nav.services": "Servicios",
    "nav.about": "Sobre mí",
    "nav.contact": "Contacto",
    "contact.title": "Contacto",
    "contact.lead":
      "Cuéntame qué necesitas y te responderé a tu correo con los siguientes pasos.",
    "contact.form": "Formulario de contacto",
    "contact.gig": "Servicio",
    "contact.gig.none": "Ninguno en particular",
    "contact.package": "Paquete",
    "contact.package.none": "Aún no lo sé",
    "contact.package.basic": "Básico",
    "contact.package.standard": "Estándar",
    "contact.package.premium": "Premium",
    "contact.name": "Nombre",
    "contact.email": "Correo electrónico",
    "contact.company": "Empresa",
    "contact.budget": "Presupuesto aproximado",
    "contact.budget.none": "Prefiero no decirlo",
    "contact.budget.under-1k": "Menos de 1.000 USD",
    "contact.budget.1k-5k": "1.000–5.000 USD",
    "contact.budget.5k-15k": "5.000–15.000 USD",
    "contact.budget.over-15k": "Más de 15.000 USD",
    "contact.budget.unsure": "Aún no lo sé",
    "contact.message": "Descripción del proyecto",
    "contact.messageHint":
      "Qué quieres lograr, qué tienes hoy y para cuándo lo necesitas.",
    "contact.optional": "opcional",
    "contact.submit": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.error.required": "Este campo es obligatorio.",
    "contact.error.invalid": "Elige una opción válida.",
    "contact.error.invalidEmail":
      "Escribe un correo válido, por ejemplo nombre@empresa.com.",
    "contact.error.tooShort": "Cuéntame un poco más (al menos 20 caracteres).",
    "contact.error.tooLong": "El texto es demasiado largo.",
    "contact.success.title": "¡Gracias! Recibí tu mensaje",
    "contact.success.body": "Te responderé pronto al correo que me dejaste.",
    "contact.failure.title": "No se pudo enviar tu mensaje",
    "contact.failure.body":
      "Inténtalo de nuevo en unos minutos o contáctame por otra vía:",
    "contact.call.title": "¿Prefieres conversar?",
    "contact.call.lead":
      "Agenda una llamada de 30 minutos y revisamos tu caso juntos.",
    "contact.call.book": "Agendar una llamada de 30 min",
    "contact.call.notes": "Me interesa: {gig}",
    "contact.call.notesWithPackage": "Me interesa: {gig} (paquete {package})",
    "contact.elsewhere": "También me encuentras en",
    "about.title": "Sobre mí",
    "about.experience": "Experiencia",
    "about.present": "actualidad",
    "about.clients": "Clientes",
    "about.tech": "Tecnologías",
    "about.skills": "Habilidades",
    "about.education": "Formación",
    "about.courses": "Cursos y certificaciones",
    "about.certification": "Certificación",
    "about.languages": "Idiomas",
    "about.github": "Perfil en GitHub",
    "about.profile": "Perfil",
    "about.downloadCv": "Descargar CV (PDF)",
    "about.references": "Referencias disponibles a solicitud",
    "services.title": "Servicios",
    "services.lead":
      "Elige el servicio que encaja con tu problema. Cada uno tiene tres paquetes con alcance, entregables y tiempos claros; los precios se cotizan según tu caso.",
    "services.seeDetails": "Ver servicio",
    "gig.packages": "Paquetes",
    "gig.packagesLead":
      "Tres niveles de alcance. El precio se cotiza según tu caso.",
    "gig.deliverables": "Entregables",
    "gig.deliveryDays.one": "Entrega estimada: {n} día",
    "gig.deliveryDays.other": "Entrega estimada: {n} días",
    "gig.revisions.one": "{n} revisión",
    "gig.revisions.other": "{n} revisiones",
    "gig.requestQuote": "Solicitar cotización de este paquete",
    "gig.gallery": "Galería",
    "work.title": "Trabajo relacionado",
    "work.lead":
      "Proyectos anteriores en los que hice este tipo de trabajo. Los clientes se mantienen anónimos por confidencialidad.",
    "work.problem": "Problema",
    "work.solution": "Solución",
    "work.result": "Resultado",
    "work.tech": "Tecnologías",
    "gig.faq": "Preguntas frecuentes",
    "gig.requirements": "Lo que necesito de ti",
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
    "nav.main": "Main",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.contact": "Contact",
    "contact.title": "Contact",
    "contact.lead":
      "Tell me what you need and I'll reply to your email with the next steps.",
    "contact.form": "Contact form",
    "contact.gig": "Service",
    "contact.gig.none": "None in particular",
    "contact.package": "Package",
    "contact.package.none": "Not sure yet",
    "contact.package.basic": "Basic",
    "contact.package.standard": "Standard",
    "contact.package.premium": "Premium",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.company": "Company",
    "contact.budget": "Approximate budget",
    "contact.budget.none": "I'd rather not say",
    "contact.budget.under-1k": "Under 1,000 USD",
    "contact.budget.1k-5k": "1,000–5,000 USD",
    "contact.budget.5k-15k": "5,000–15,000 USD",
    "contact.budget.over-15k": "Over 15,000 USD",
    "contact.budget.unsure": "Not sure yet",
    "contact.message": "Project description",
    "contact.messageHint":
      "What you want to achieve, what you have today and when you need it.",
    "contact.optional": "optional",
    "contact.submit": "Send message",
    "contact.sending": "Sending…",
    "contact.error.required": "This field is required.",
    "contact.error.invalid": "Pick a valid option.",
    "contact.error.invalidEmail":
      "Enter a valid email address, e.g. name@company.com.",
    "contact.error.tooShort": "Tell me a bit more (at least 20 characters).",
    "contact.error.tooLong": "This is too long.",
    "contact.success.title": "Thanks! I got your message",
    "contact.success.body":
      "I'll get back to you soon at the email you gave me.",
    "contact.failure.title": "Your message couldn't be sent",
    "contact.failure.body":
      "Please try again in a few minutes or reach me another way:",
    "contact.call.title": "Prefer to talk?",
    "contact.call.lead":
      "Book a 30-minute call and we'll go over your case together.",
    "contact.call.book": "Book a 30-min call",
    "contact.call.notes": "Interested in: {gig}",
    "contact.call.notesWithPackage": "Interested in: {gig} ({package} package)",
    "contact.elsewhere": "You can also find me on",
    "about.title": "About me",
    "about.experience": "Experience",
    "about.present": "present",
    "about.clients": "Clients",
    "about.tech": "Technologies",
    "about.skills": "Skills",
    "about.education": "Education",
    "about.courses": "Courses and certifications",
    "about.certification": "Certification",
    "about.languages": "Languages",
    "about.github": "GitHub profile",
    "about.profile": "Profile",
    "about.downloadCv": "Download CV (PDF)",
    "about.references": "References available upon request",
    "services.title": "Services",
    "services.lead":
      "Pick the service that fits your problem. Each one has three packages with clear scope, deliverables and timelines; pricing is quoted for your case.",
    "services.seeDetails": "See service",
    "gig.packages": "Packages",
    "gig.packagesLead":
      "Three levels of scope. Pricing is quoted for your case.",
    "gig.deliverables": "Deliverables",
    "gig.deliveryDays.one": "Estimated delivery: {n} day",
    "gig.deliveryDays.other": "Estimated delivery: {n} days",
    "gig.revisions.one": "{n} revision",
    "gig.revisions.other": "{n} revisions",
    "gig.requestQuote": "Request a quote for this package",
    "gig.gallery": "Gallery",
    "work.title": "Related work",
    "work.lead":
      "Past projects where I did this kind of work. Clients stay anonymous for confidentiality.",
    "work.problem": "Problem",
    "work.solution": "Solution",
    "work.result": "Result",
    "work.tech": "Technologies",
    "gig.faq": "Frequently asked questions",
    "gig.requirements": "What I need from you",
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

type PluralKey = UiKey extends infer K
  ? K extends `${infer Base}.one`
    ? Base
    : never
  : never;

/** Translates a count-dependent message ("{n} days"), picking one/other. */
export function usePlural(locale: Locale) {
  const t = useTranslations(locale);
  const rules = new Intl.PluralRules(locale);
  return (key: PluralKey, n: number): string => {
    const form = rules.select(n) === "one" ? "one" : "other";
    return t(`${key}.${form}`).replace("{n}", String(n));
  };
}
