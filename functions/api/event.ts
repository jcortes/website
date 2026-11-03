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
  const handle = createEventHandler({
    record: async ({ name, path }) => {
      if (!env.EVENTS) throw new Error("EVENTS binding missing");
      // Query with the SQL API: blob1 = event name, blob2 = page path.
      env.EVENTS.writeDataPoint({ indexes: [name], blobs: [name, path] });
    },
  });
  return handle(request);
}
