"use client";

import { useState } from "react";
import {
  CONTACT_TOPICS,
  copyFor,
  topicLabel,
  type ContactErrorCode,
} from "@/lib/i18n";
import { ArrowUpRight } from "./icons";
import { useLang } from "./lang-provider";

/* The destination address deliberately lives only in the API route (CONTACT_TO)
   — nothing in the UI links to or displays it. */

const FIELD =
  "font-body w-full border-b border-white/15 bg-transparent py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-bay-400 disabled:opacity-50";
const LABEL =
  "font-mono mb-1 block text-[10px] tracking-[0.18em] text-white/45 uppercase";

/* Failures are held as a code, not as a sentence: the route answers in codes
   and the wording is looked up at render, so switching KR/EN while an error is
   on screen re-renders it in the new language instead of stranding the last
   server string there. */
type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; code: ContactErrorCode };

function errorCodeOf(body: unknown): ContactErrorCode {
  const code = (body as { code?: unknown })?.code;
  return code === "bad_request" ||
    code === "missing_fields" ||
    code === "bad_email" ||
    code === "send_failed"
    ? code
    : "send_failed";
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const { lang } = useLang();
  const t = copyFor(lang).contact;
  const sending = status.state === "sending";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus({ state: "sending" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ state: "error", code: errorCodeOf(body) });
        return;
      }
      form.reset();
      setStatus({ state: "sent" });
    } catch {
      setStatus({ state: "error", code: "network" });
    }
  }

  if (status.state === "sent") {
    return (
      <div className="liquid-glass w-full rounded-[1.25rem] px-7 py-9">
        <p className="font-mono mb-3 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
          {t.sentEyebrow}
        </p>
        <p className="font-heading text-2xl tracking-[-0.5px] break-keep text-white md:text-3xl">
          {t.sentTitle}
        </p>
        <p className="font-body mt-4 text-sm leading-relaxed font-light break-keep text-slate-400">
          {t.sentBody}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className="font-body mt-6 cursor-pointer text-xs font-light text-bay-300 underline underline-offset-4 transition-colors hover:text-bay-200"
        >
          {t.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={LABEL}>
            {t.name}
          </label>
          <input
            id="c-name"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            disabled={sending}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="c-email" className={LABEL}>
            {t.email}
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            disabled={sending}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="c-affiliation" className={LABEL}>
            {t.affiliation}
          </label>
          <input
            id="c-affiliation"
            name="affiliation"
            maxLength={120}
            autoComplete="organization"
            placeholder={t.affiliationPlaceholder}
            disabled={sending}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="c-topic" className={LABEL}>
            {t.topic}
          </label>
          <div className="relative">
            {/* value stays Korean in both languages — see CONTACT_TOPICS */}
            <select
              id="c-topic"
              name="topic"
              defaultValue={CONTACT_TOPICS[0].value}
              disabled={sending}
              className={`${FIELD} cursor-pointer appearance-none pr-7`}
            >
              {CONTACT_TOPICS.map((topic) => (
                <option
                  key={topic.value}
                  value={topic.value}
                  className="bg-ink text-white"
                >
                  {topicLabel(topic, lang)}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 text-white/40"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <label htmlFor="c-message" className={LABEL}>
          {t.message}
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          disabled={sending}
          className={`${FIELD} resize-y`}
        />
      </div>

      {/* honeypot — hidden from people, tempting to bots. aria-hidden + tabIndex
          keeps it out of the keyboard and screen-reader path. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="liquid-glass-strong font-body mt-9 inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
      >
        {sending ? t.submitting : t.submit}
        {!sending && <ArrowUpRight className="h-4 w-4" />}
      </button>

      <p
        aria-live="polite"
        className="font-body mt-5 text-xs leading-relaxed font-light break-keep text-slate-500"
      >
        {status.state === "error" ? (
          <span className="text-red-300">{t.errors[status.code]}</span>
        ) : (
          <>{t.replyNote}</>
        )}
      </p>
    </form>
  );
}
