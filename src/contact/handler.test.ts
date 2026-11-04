import { describe, expect, test } from "vitest";
import { createContactHandler, type Email } from "./handler";

const OWNER = "owner@example.test";

/** A handler wired to fakes, with the emails it sent and tokens it checked. */
function setup({
  turnstile = true,
  provider = "up",
}: { turnstile?: boolean; provider?: "up" | "down" } = {}) {
  const sent: Email[] = [];
  const verified: { token: string; ip: string | null }[] = [];
  const handle = createContactHandler({
    to: OWNER,
    verifyTurnstile: async (token, ip) => {
      verified.push({ token, ip });
      return turnstile;
    },
    sendEmail: async (email) => {
      if (provider === "down") throw new Error("provider unavailable");
      sent.push(email);
    },
  });
  return { handle, sent, verified };
}

const valid = {
  name: "Ana Gómez",
  email: "ana@acme.test",
  company: "Acme",
  budget: "5k-15k",
  message: "We need a CI/CD pipeline for our monorepo.",
  gig: "ci-cd-github-actions",
  package: "standard",
  locale: "en",
  turnstileToken: "token-from-widget",
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://site.test/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("contact handler", () => {
  test("a valid submission emails the owner with the gig, package and every field", async () => {
    const { handle, sent } = setup();

    const response = await handle(
      post(valid, { "CF-Connecting-IP": "203.0.113.7" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    const [email] = sent;
    expect(email!.to).toBe(OWNER);
    expect(email!.replyTo).toBe("ana@acme.test");
    expect(email!.subject).toBe(
      "[Gig: ci-cd-github-actions · standard] Ana Gómez – Acme",
    );
    for (const text of [
      "Ana Gómez",
      "ana@acme.test",
      "Acme",
      "5,000–15,000 USD",
      "We need a CI/CD pipeline for our monorepo.",
      "ci-cd-github-actions",
      "standard",
      "en",
    ]) {
      expect(email!.text).toContain(text);
    }
  });

  test("passes the Turnstile token and the visitor's IP to the verifier", async () => {
    const { handle, verified } = setup();
    await handle(post(valid, { "CF-Connecting-IP": "203.0.113.7" }));
    expect(verified).toEqual([
      { token: "token-from-widget", ip: "203.0.113.7" },
    ]);
  });

  test("without company, gig or package the subject says so", async () => {
    const { handle, sent } = setup();
    const { name, email, message, turnstileToken } = valid;
    await handle(post({ name, email, message, turnstileToken }));
    expect(sent[0]!.subject).toBe("[Gig: none · none] Ana Gómez");
  });

  test("rejects invalid fields with 400, field errors and no email", async () => {
    const { handle, sent, verified } = setup();

    const response = await handle(
      post({
        ...valid,
        name: "  ",
        email: "not-an-email",
        message: "too short",
        budget: "a million",
        package: "gold",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "validation",
      fields: {
        name: "required",
        email: "invalid",
        message: "tooShort",
        budget: "invalid",
        package: "invalid",
      },
    });
    expect(verified).toEqual([]);
    expect(sent).toEqual([]);
  });

  test("rejects a body that isn't JSON with 400", async () => {
    const { handle, sent } = setup();
    const response = await handle(post("name=Ana"));
    expect(response.status).toBe(400);
    expect(sent).toEqual([]);
  });

  test("a failed Turnstile check returns 403 and sends no email", async () => {
    const { handle, sent } = setup({ turnstile: false });
    const response = await handle(post(valid));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "turnstile" });
    expect(sent).toEqual([]);
  });

  test("a missing Turnstile token returns 403 without asking the verifier", async () => {
    const { handle, sent, verified } = setup();
    const response = await handle(post({ ...valid, turnstileToken: "" }));
    expect(response.status).toBe(403);
    expect(verified).toEqual([]);
    expect(sent).toEqual([]);
  });

  test("an email provider failure returns 502", async () => {
    const { handle } = setup({ provider: "down" });
    const response = await handle(post(valid));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: "email" });
  });

  for (const method of ["GET", "PUT", "DELETE"]) {
    test(`rejects ${method} with 405`, async () => {
      const { handle, sent } = setup();
      const response = await handle(
        new Request("https://site.test/api/contact", { method }),
      );
      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("POST");
      expect(sent).toEqual([]);
    });
  }
});
