import type { ConversionEventName } from "./events";

/**
 * Browser side of the conversion events: reports one to /api/event. Uses
 * sendBeacon so the report survives the visitor leaving the page (a "Book a
 * call" link navigates away to Cal.com).
 */
export function track(name: ConversionEventName): void {
  const body = JSON.stringify({ name, path: location.pathname });
  if (!navigator.sendBeacon?.("/api/event", body)) {
    fetch("/api/event", { method: "POST", body, keepalive: true }).catch(
      () => {},
    );
  }
}

/** Reports a click on any element marked `data-track="<event name>"`. */
export function trackMarkedClicks(root: Document): void {
  root.addEventListener("click", (event) => {
    const marked = (event.target as Element | null)?.closest<HTMLElement>(
      "[data-track]",
    );
    if (marked) track(marked.dataset.track as ConversionEventName);
  });
}
