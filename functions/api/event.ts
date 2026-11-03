/**
 * Cloudflare Pages Function: POST /api/event. Stores conversion events in the
 * Workers Analytics Engine dataset bound as EVENTS (see infra/main.tf).
 */
import { createEventHandler } from "../../src/analytics/events";

/** The slice of the Analytics Engine binding this function uses. */
interface AnalyticsEngineDataset {
  writeDataPoint(point: { blobs?: string[]; indexes?: string[] }): void;
}

interface Env {
  EVENTS?: AnalyticsEngineDataset;
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { EVENTS } = env;
  if (!EVENTS) {
    console.error("event: missing EVENTS binding");
    return new Response(null, { status: 500 });
  }
  // Previews share the dataset; the hostname tells them apart.
  const host = new URL(request.url).hostname;
  const handle = createEventHandler({
    record: async ({ name, path }) => {
      // SQL API columns: blob1 = event, blob2 = page path, blob3 = hostname.
      EVENTS.writeDataPoint({ indexes: [name], blobs: [name, path, host] });
    },
  });
  return handle(request);
}
