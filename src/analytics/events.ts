/**
 * Conversion events: what the site counts beyond page views, which
 * Cloudflare Web Analytics records on its own. The browser reports them to
 * POST /api/event (see src/analytics/track.ts); the Pages Function stores
 * them in a Workers Analytics Engine dataset.
 */

export const conversionEvents = ["book_call", "contact_submitted"] as const;
export type ConversionEventName = (typeof conversionEvents)[number];

export interface ConversionEvent {
  name: ConversionEventName;
  /** Path of the page the event happened on. */
  path: string;
}

export interface EventDependencies {
  /** Stores the event; throws when storage fails. */
  record(event: ConversionEvent): Promise<void>;
}

const MAX_PATH = 256;

function parseEvent(input: unknown): ConversionEvent | null {
  if (typeof input !== "object" || !input) return null;
  const { name, path } = input as Record<string, unknown>;
  const known = (conversionEvents as readonly unknown[]).includes(name);
  const sitePath =
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    path.length <= MAX_PATH;
  return known && sitePath ? { name: name as ConversionEventName, path } : null;
}

/** The event endpoint as a request → response function. */
export function createEventHandler(deps: EventDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }
    // sendBeacon posts text/plain, so the body is parsed regardless of type.
    const event = parseEvent(await request.json().catch(() => null));
    if (!event) return new Response(null, { status: 400 });
    try {
      await deps.record(event);
    } catch {
      return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 204 });
  };
}
