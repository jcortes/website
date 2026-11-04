/**
 * Renders the Turnstile widget into `[data-turnstile]`, loading Cloudflare's
 * script only when the visitor first interacts with the form, so the page
 * itself stays light. Builds without a site key have no container, and the
 * token is then always empty.
 */

interface Turnstile {
  render(container: HTMLElement, options: Record<string, unknown>): string;
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
/** How long a submission waits for a token still being issued. */
const TOKEN_TIMEOUT_MS = 10_000;

export interface TurnstileToken {
  /** The current token, waiting for one still being issued ("" if none). */
  get(): Promise<string>;
  /** Discards the used token (tokens are single-use) and gets a new one. */
  reset(): void;
}

export function setupTurnstile(form: HTMLFormElement): TurnstileToken {
  const container = form.querySelector<HTMLElement>("[data-turnstile]");
  if (!container) return { get: async () => "", reset: () => {} };

  let widgetId: string | undefined;
  let token = "";
  let waiting: ((token: string) => void)[] = [];
  const issued = (value: string) => {
    token = value;
    for (const resolve of waiting) resolve(value);
    waiting = [];
  };

  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    window.onTurnstileLoad = () => {
      widgetId = window.turnstile?.render(container, {
        sitekey: container.dataset.sitekey!,
        language: container.dataset.language ?? "auto",
        callback: issued,
        "expired-callback": () => (token = ""),
        "error-callback": () => issued(""),
      });
    };
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    document.head.append(script);
  };
  form.addEventListener("focusin", load, { once: true });
  form.addEventListener("pointerenter", load, { once: true });

  return {
    get() {
      if (token) return Promise.resolve(token);
      load();
      return new Promise((resolve) => {
        waiting.push(resolve);
        setTimeout(() => resolve(""), TOKEN_TIMEOUT_MS);
      });
    },
    reset() {
      token = "";
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
    },
  };
}
