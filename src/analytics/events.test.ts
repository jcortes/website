import { describe, expect, test } from "vitest";
import { createEventHandler, type ConversionEvent } from "./events";

function setup() {
  const recorded: ConversionEvent[] = [];
  const handle = createEventHandler({
    record: async (event) => {
      recorded.push(event);
    },
  });
  return { handle, recorded };
}

const post = (body: unknown) =>
  new Request("https://site.test/api/event", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("conversion event handler", () => {
  test("records a known event with the page it happened on", async () => {
    const { handle, recorded } = setup();

    const response = await handle(
      post({ name: "book_call", path: "/en/contact/" }),
    );

    expect(response.status).toBe(204);
    expect(recorded).toEqual([{ name: "book_call", path: "/en/contact/" }]);
  });

  test("records a successful contact submission", async () => {
    const { handle, recorded } = setup();
    await handle(post({ name: "contact_submitted", path: "/contacto/" }));
    expect(recorded).toEqual([
      { name: "contact_submitted", path: "/contacto/" },
    ]);
  });

  for (const [why, body] of [
    ["an unknown event", { name: "purchase", path: "/" }],
    ["a missing path", { name: "book_call" }],
    [
      "a path that isn't site-relative",
      { name: "book_call", path: "https://x.test/" },
    ],
    ["an overlong path", { name: "book_call", path: `/${"a".repeat(300)}` }],
    ["a body that isn't JSON", "book_call"],
  ] as const) {
    test(`rejects ${why} with 400 and records nothing`, async () => {
      const { handle, recorded } = setup();
      const response = await handle(post(body));
      expect(response.status).toBe(400);
      expect(recorded).toEqual([]);
    });
  }

  test("a storage failure returns 502", async () => {
    const handle = createEventHandler({
      record: async () => {
        throw new Error("dataset unavailable");
      },
    });
    const response = await handle(post({ name: "book_call", path: "/" }));
    expect(response.status).toBe(502);
  });

  test("rejects GET with 405", async () => {
    const { handle, recorded } = setup();
    const response = await handle(new Request("https://site.test/api/event"));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(recorded).toEqual([]);
  });
});
