import { locales, type Locale } from "../i18n/ui";

/**
 * A contact-form submission and its validation, shared by the form (client-side
 * errors) and the contact handler (which enforces the same rules).
 */

export const packages = ["basic", "standard", "premium"] as const;
export type Package = (typeof packages)[number];

/** Approximate budget ranges a visitor can pick, in USD. */
export const budgets = {
  "under-1k": "Under 1,000 USD",
  "1k-5k": "1,000–5,000 USD",
  "5k-15k": "5,000–15,000 USD",
  "over-15k": "Over 15,000 USD",
  unsure: "Not sure yet",
} as const;
export type Budget = keyof typeof budgets;

export interface Submission {
  name: string;
  email: string;
  company?: string;
  budget?: Budget;
  message: string;
  /** Gig slug, when the visitor picked one. */
  gig?: string;
  package?: Package;
  /** Language the visitor wrote from. */
  locale?: Locale;
}

export type Field =
  "name" | "email" | "company" | "budget" | "message" | "gig" | "package";
export type FieldError = "required" | "invalid" | "tooShort" | "tooLong";
export type FieldErrors = Partial<Record<Field, FieldError>>;

export const limits = {
  name: 100,
  email: 254,
  company: 100,
  messageMin: 20,
  message: 5000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type Validation =
  { ok: true; submission: Submission } | { ok: false; errors: FieldErrors };

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const oneOf = <T extends string>(
  options: readonly T[],
  value: string,
): value is T => (options as readonly string[]).includes(value);

/** Validates raw form input; unknown keys are ignored. */
export function validateSubmission(input: unknown): Validation {
  const raw = (typeof input === "object" && input) || {};
  const get = (key: string) => text((raw as Record<string, unknown>)[key]);
  const errors: FieldErrors = {};

  const name = get("name");
  if (!name) errors.name = "required";
  else if (name.length > limits.name) errors.name = "tooLong";

  const email = get("email");
  if (!email) errors.email = "required";
  else if (email.length > limits.email || !EMAIL.test(email))
    errors.email = "invalid";

  const company = get("company");
  if (company.length > limits.company) errors.company = "tooLong";

  const budget = get("budget");
  if (budget && !oneOf(Object.keys(budgets) as Budget[], budget))
    errors.budget = "invalid";

  const message = get("message");
  if (!message) errors.message = "required";
  else if (message.length < limits.messageMin) errors.message = "tooShort";
  else if (message.length > limits.message) errors.message = "tooLong";

  const gig = get("gig");
  if (gig && !SLUG.test(gig)) errors.gig = "invalid";

  const pkg = get("package");
  if (pkg && !oneOf(packages, pkg)) errors.package = "invalid";

  const locale = get("locale");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    submission: {
      name,
      email,
      message,
      ...(company && { company }),
      ...(budget && { budget: budget as Budget }),
      ...(gig && { gig }),
      ...(pkg && { package: pkg as Package }),
      ...(oneOf(locales, locale) && { locale }),
    },
  };
}
