/**
 * Browser behavior of the contact page: preselects the gig and package from
 * the query string, keeps the Cal.com link's notes in sync with the selected
 * gig, validates with the same rules as the handler, and shows the outcome.
 */
import {
  packages,
  validateSubmission,
  type Field,
  type FieldError,
  type FieldErrors,
} from "./submission";

/** Localized strings the script needs, rendered by the page. */
export interface FormMessages {
  errors: Record<FieldError | "invalidEmail", string>;
  sending: string;
  notes: string;
  notesWithPackage: string;
}

const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

export function setupContactForm(form: HTMLFormElement): void {
  const messages = JSON.parse(form.dataset.messages!) as FormMessages;
  const gig = form.elements.namedItem("gig") as HTMLSelectElement;
  const pkg = form.elements.namedItem("package") as HTMLSelectElement;
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const failure = byId("contact-failure")!;
  const success = byId("contact-success")!;
  const calLinks =
    document.querySelectorAll<HTMLAnchorElement>("[data-cal-link]");

  preselect(gig, pkg);
  const syncCalLinks = () => {
    for (const link of calLinks) {
      const url = new URL(link.dataset.base!);
      if (gig.value) {
        const notes = (pkg.value ? messages.notesWithPackage : messages.notes)
          .replace("{gig}", selectedLabel(gig))
          .replace("{package}", selectedLabel(pkg));
        url.searchParams.set("notes", notes);
      }
      link.href = url.href;
    }
  };
  syncCalLinks();
  gig.addEventListener("change", syncCalLinks);
  pkg.addEventListener("change", syncCalLinks);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    failure.hidden = true;
    const data = Object.fromEntries(new FormData(form));
    const validation = validateSubmission(data);
    showErrors(form, messages, validation.ok ? {} : validation.errors);
    if (!validation.ok) return;

    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = messages.sending;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validation.submission,
          // Added to the form by the Turnstile widget.
          turnstileToken: data["cf-turnstile-response"] ?? "",
        }),
      });
      if (response.ok) {
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        fields?: FieldErrors;
      };
      if (response.status === 400 && body.fields && hasKeys(body.fields)) {
        showErrors(form, messages, body.fields);
        return;
      }
      showFailure(failure);
    } catch {
      showFailure(failure);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
}

const hasKeys = (o: object) => Object.keys(o).length > 0;

function showFailure(failure: HTMLElement) {
  failure.hidden = false;
  failure.focus();
}

function selectedLabel(select: HTMLSelectElement): string {
  return select.selectedOptions[0]?.textContent?.trim() ?? "";
}

/** Selects the gig and package named in the query string, when they exist. */
function preselect(gig: HTMLSelectElement, pkg: HTMLSelectElement) {
  const params = new URLSearchParams(location.search);
  const slug = params.get("gig");
  if (slug && [...gig.options].some((option) => option.value === slug)) {
    gig.value = slug;
    const tier = params.get("package");
    if (tier && (packages as readonly string[]).includes(tier)) {
      pkg.value = tier;
    }
  }
}

/** Marks each field with its error (or clears it); focuses the first one. */
function showErrors(
  form: HTMLFormElement,
  messages: FormMessages,
  errors: FieldErrors,
) {
  let first: HTMLElement | undefined;
  for (const control of form.querySelectorAll<HTMLElement>("[data-field]")) {
    const field = control.dataset.field as Field;
    const message = byId(`contact-${field}-error`);
    const error = errors[field];
    if (!message) continue;
    if (error) {
      control.setAttribute("aria-invalid", "true");
      message.textContent =
        field === "email" && error === "invalid"
          ? messages.errors.invalidEmail
          : messages.errors[error];
      message.hidden = false;
      first ??= control;
    } else {
      control.removeAttribute("aria-invalid");
      message.textContent = "";
      message.hidden = true;
    }
  }
  first?.focus();
}
