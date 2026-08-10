import type { NextRequest } from "next/server";

/* Contact form delivery.

   Two delivery paths, picked at request time:

     RESEND_API_KEY set  -> Resend's REST API. Preferred: real sender domain,
                            proper reply-to, no third party in the loop.
     no key              -> FormSubmit, which needs no account and no key at
                            all. Keeps the form working out of the box.

   Either way the POST is proxied from the server, so CONTACT_TO never reaches
   the browser — nothing in the UI links to or displays the address.

   Optional env:
     RESEND_API_KEY   from resend.com/api-keys; enables the Resend path
     CONTACT_TO       destination inbox (defaults below)
     CONTACT_FROM     verified sender; Resend's shared sender is the default so
                      this works before a domain is verified */

const TO = process.env.CONTACT_TO ?? "blockchainatyonsei@gmail.com";
const FROM = process.env.CONTACT_FROM ?? "BAY Website <onboarding@resend.dev>";

const LIMITS = { name: 80, email: 160, affiliation: 120, topic: 60, message: 5000 };

const GENERIC_ERROR = "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

type Submission = {
  name: string;
  email: string;
  affiliation: string;
  topic: string;
  message: string;
};

/* Label/value pairs, in the order they should read in the email. */
function rowsOf(s: Submission): [string, string][] {
  return [
    ["이름", s.name],
    ["이메일", s.email],
    ["소속", s.affiliation || "-"],
    ["문의 유형", s.topic || "-"],
  ];
}

function subjectOf(s: Submission): string {
  return `[BAY 문의] ${s.topic || "일반"} — ${s.name}`;
}

async function sendViaResend(apiKey: string, s: Submission): Promise<boolean> {
  const rows = rowsOf(s);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend blocks requests with no User-Agent (403, code 1010). Node's fetch
      // does send one ("node"), so this is really just a legible label in the
      // Resend logs — but it costs nothing and removes the failure mode.
      "User-Agent": "bay-website/1.0",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      // so hitting reply in Gmail goes to the person who filled the form
      reply_to: s.email,
      subject: subjectOf(s),
      text: [...rows.map(([k, v]) => `${k}: ${v}`), "", s.message].join("\n"),
      html: [
        `<table style="font-family:system-ui,sans-serif;font-size:14px">`,
        ...rows.map(
          ([k, v]) =>
            `<tr><td style="padding:2px 16px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`,
        ),
        `</table><hr style="margin:16px 0;border:0;border-top:1px solid #ddd">`,
        `<div style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(s.message)}</div>`,
      ].join(""),
    }),
  });

  if (!res.ok) {
    console.error("[contact] resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

/* FormSubmit builds the email body straight from the payload keys, so the keys
   are the Korean labels the recipient reads. Underscore keys are its own
   options and are not rendered.

   Two behaviours worth knowing, both confirmed against the live endpoint and
   neither of them documented:

     - a Referer header is required. Server-side fetch sends none, so it must be
       set by hand or the response is "Make sure you open this page through a
       web server". The documented `_url` field does not substitute for it.
     - failures still come back HTTP 200. The verdict is `success` in the body,
       and it is the STRING "true"/"false", not a boolean. */
async function sendViaFormSubmit(s: Submission, referer: string): Promise<boolean> {
  const fields: Record<string, string> = Object.fromEntries(rowsOf(s));

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: referer,
    },
    body: JSON.stringify({
      ...fields,
      메시지: s.message,
      _subject: subjectOf(s),
      _replyto: s.email,
      _template: "table",
      // the form is server-proxied and already honeypotted, and a browser
      // reCAPTCHA cannot run on a request the browser never makes
      _captcha: "false",
    }),
  });

  const body: { success?: string; message?: string } = await res
    .json()
    .catch(() => ({}));

  if (!res.ok || body.success !== "true") {
    console.error(
      "[contact] formsubmit failed",
      res.status,
      body.message ?? "(no message)",
    );
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // honeypot: a hidden field only a bot would fill. Report success so the bot
  // does not learn it was caught.
  if (clean(payload.website, 100)) {
    return Response.json({ ok: true });
  }

  const submission: Submission = {
    name: clean(payload.name, LIMITS.name),
    email: clean(payload.email, LIMITS.email),
    affiliation: clean(payload.affiliation, LIMITS.affiliation),
    topic: clean(payload.topic, LIMITS.topic),
    message: clean(payload.message, LIMITS.message),
  };

  if (!submission.name || !submission.email || !submission.message) {
    return Response.json(
      { error: "이름, 이메일, 메시지를 모두 입력해주세요." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return Response.json({ error: "이메일 주소를 확인해주세요." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  let sent: boolean;
  try {
    sent = apiKey
      ? await sendViaResend(apiKey, submission)
      : await sendViaFormSubmit(submission, request.nextUrl.origin + "/");
  } catch (err) {
    console.error("[contact] delivery threw", err);
    return Response.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  if (!sent) {
    return Response.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  return Response.json({ ok: true });
}
