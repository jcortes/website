import { budgets, validateSubmission, type Submission } from "./submission";

export interface Email {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export interface ContactDependencies {
  /** Destination inbox: configuration, never hardcoded. */
  to: string;
  /** True when the Turnstile token is valid for the visitor's IP. */
  verifyTurnstile(token: string, ip: string | null): Promise<boolean>;
  /** Sends the email; throws when the provider fails. */
  sendEmail(email: Email): Promise<void>;
}

const json = (status: number, body: unknown, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

/** Collapses whitespace so user input can't break the subject line. */
const oneLine = (value: string) => value.replace(/\s+/g, " ");

export function buildEmail(to: string, s: Submission): Email {
  const who = s.company ? `${s.name} – ${s.company}` : s.name;
  const subject = oneLine(
    `[Gig: ${s.gig ?? "none"} · ${s.package ?? "none"}] ${who}`,
  );
  const rows: [string, string | undefined][] = [
    ["Name", s.name],
    ["Email", s.email],
    ["Company", s.company],
    ["Budget", s.budget && budgets[s.budget]],
    ["Gig", s.gig],
    ["Package", s.package],
    ["Language", s.locale],
  ];
  const text = [
    ...rows.map(([label, value]) => `${label}: ${value ?? "—"}`),
    "",
    "Project description:",
    s.message,
  ].join("\n");
  return { to, replyTo: s.email, subject, text };
}

/**
 * The contact endpoint as a request → response function: validates the
 * submission, verifies Turnstile and emails the owner.
 */
export function createContactHandler(deps: ContactDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return json(405, { ok: false, error: "method" }, { Allow: "POST" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { ok: false, error: "validation", fields: {} });
    }

    const validation = validateSubmission(body);
    if (!validation.ok) {
      return json(400, {
        ok: false,
        error: "validation",
        fields: validation.errors,
      });
    }

    const token = (body as Record<string, unknown>).turnstileToken;
    const ip = request.headers.get("CF-Connecting-IP");
    const human =
      typeof token === "string" &&
      token.length > 0 &&
      (await deps.verifyTurnstile(token, ip));
    if (!human) return json(403, { ok: false, error: "turnstile" });

    try {
      await deps.sendEmail(buildEmail(deps.to, validation.submission));
    } catch {
      return json(502, { ok: false, error: "email" });
    }
    return json(200, { ok: true });
  };
}
