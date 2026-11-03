/**
 * Renders the Turnstile widget into `[data-turnstile]`, loading Cloudflare's
 * script only when the visitor first interacts with the form, so the page
 * itself stays light. The widget adds a `cf-turnstile-response` input to the
 * form. Tokens are single-use: call the returned reset after a failed send.
 */

interface Turnstile {
  render(container: HTMLElement, options: Record<string, string>): string;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";

export function setupTurnstile(form: HTMLFormElement): () => void {
  const container = form.querySelector<HTMLElement>("[data-turnstile]");
  if (!container) return () => {};
  let widgetId: string | undefined;

  const load = () => {
    form.removeEventListener("focusin", load);
    form.removeEventListener("pointerenter", load);
    window.onTurnstileLoad = () => {
      widgetId = window.turnstile?.render(container, {
        sitekey: container.dataset.sitekey!,
        language: container.dataset.language ?? "auto",
      });
    };
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    document.head.append(script);
  };
  form.addEventListener("focusin", load);
  form.addEventListener("pointerenter", load);

  return () => {
    if (widgetId !== undefined) window.turnstile?.reset(widgetId);
  };
}
