import type { NextRequest } from "next/server";

/* Contact form delivery.

   Talks to Resend's REST API with fetch rather than pulling in the SDK — the
   payload is four fields and one POST, so a dependency buys nothing.

   Required env:
     RESEND_API_KEY   from resend.com/api-keys
   Optional env:
     CONTACT_TO       destination inbox (defaults below)
     CONTACT_FROM     verified sender; Resend's shared sender is the default so
                      this works before a domain is verified */

const TO = process.env.CONTACT_TO ?? "blockchainatyonsei@gmail.com";
const FROM = process.env.CONTACT_FROM ?? "BAY Website <onboarding@resend.dev>";

const LIMITS = { name: 80, email: 160, affiliation: 120, topic: 60, message: 5000 };

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

  const name = clean(payload.name, LIMITS.name);
  const email = clean(payload.email, LIMITS.email);
  const affiliation = clean(payload.affiliation, LIMITS.affiliation);
  const topic = clean(payload.topic, LIMITS.topic);
  const message = clean(payload.message, LIMITS.message);

  if (!name || !email || !message) {
    return Response.json(
      { error: "이름, 이메일, 메시지를 모두 입력해주세요." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "이메일 주소를 확인해주세요." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set — cannot send mail");
    return Response.json(
      { error: "메일 발송이 아직 설정되지 않았습니다. 직접 메일로 보내주세요." },
      { status: 503 },
    );
  }

  const rows: [string, string][] = [
    ["이름", name],
    ["이메일", email],
    ["소속", affiliation || "-"],
    ["문의 유형", topic || "-"],
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      // so hitting reply in Gmail goes to the person who filled the form
      reply_to: email,
      subject: `[BAY 문의] ${topic || "일반"} — ${name}`,
      text: [...rows.map(([k, v]) => `${k}: ${v}`), "", message].join("\n"),
      html: [
        `<table style="font-family:system-ui,sans-serif;font-size:14px">`,
        ...rows.map(
          ([k, v]) =>
            `<tr><td style="padding:2px 16px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`,
        ),
        `</table><hr style="margin:16px 0;border:0;border-top:1px solid #ddd">`,
        `<div style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(message)}</div>`,
      ].join(""),
    }),
  });

  if (!res.ok) {
    console.error("[contact] resend failed", res.status, await res.text());
    return Response.json(
      { error: "전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
