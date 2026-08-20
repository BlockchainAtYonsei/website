"use client";

import { useState, type ReactNode } from "react";
import {
  APPLY_FORM_URL,
  CLOSED_COHORT,
  NEXT_COHORT,
  RECRUITING_OPEN,
} from "@/lib/cohort";
import { copyFor } from "@/lib/i18n";
import { ArrowUpRight, ChevronDown } from "./icons";
import { useLang } from "./lang-provider";
import Modal from "./modal";
import SocialLinks from "./social-links";

/* The recruiting overlay: what BAY asks of an applicant and, when a cycle is
   taking them, how to apply — carried over from the Notion recruiting page
   this site replaces.

   Only the requirements stay up between cycles, because they are the part that
   holds regardless of which round is running. The dated 18기 schedule that sat
   beside them in Notion is not here: every one of those dates has passed, so
   carrying it over would have put a stale timetable directly above a notice
   saying the round is closed.

   Everything cycle-bound hangs off RECRUITING_OPEN. False: no form link, and a
   closed notice at the bottom naming the round that just ended. True: the form
   section appears and the notice goes. Open the next cycle in lib/cohort and
   the two halves swap on their own.

   The cohort numbers live there rather than here so the Organization page can
   read them without crossing the client boundary; the wording around them
   lives in lib/i18n, which renders the same number as "18기" or "BAY 18th"
   depending on the language switch. */

/* Section headings and the follow label are the same mark — small, mono,
   letterspaced — so the dialog reads as one list of parts rather than a stack
   of unrelated blocks. */
const EYEBROW = "font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase";

function Section({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className={`${EYEBROW} mb-3.5`}>{eyebrow}</h3>
      {children}
    </section>
  );
}

export function ApplyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = copyFor(lang).apply;

  return (
    <Modal open={open} onClose={onClose} labelledBy="apply-modal-title">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        {t.eyebrow}
      </p>
      <h2
        id="apply-modal-title"
        className="font-heading text-3xl leading-[1.15] tracking-[-1px] break-keep text-white md:text-4xl"
      >
        {t.title}
      </h2>
      <p className="font-body mt-4 max-w-lg leading-relaxed font-light break-keep text-slate-400">
        {t.intro}
      </p>

      <Section eyebrow={t.requirementsEyebrow}>
        {/* Numbered because the source is: three conditions to check yourself
            against, not a bag of nice-to-haves. */}
        <ol className="space-y-2.5">
          {t.requirements.map((req, i) => (
            <li key={req} className="flex gap-3">
              <span className="font-mono mt-[0.15em] shrink-0 text-xs text-bay-300">
                {i + 1}
              </span>
              <span className="font-body text-sm leading-relaxed font-light break-keep text-slate-300">
                {req}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* The whole section waits for an open cycle. A live button into a shut
          form would take submissions nobody reads, and the sentence above it
          has nothing to say without the button. */}
      {RECRUITING_OPEN && (
        <Section eyebrow={t.howEyebrow}>
          <p className="font-body max-w-lg text-sm leading-relaxed font-light break-keep text-slate-300">
            {t.howBody}
          </p>
          <a
            href={APPLY_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-strong font-body mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
          >
            {t.formCta}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Section>
      )}

      <Section eyebrow={t.faqEyebrow}>
        {/* Native <details> rather than state and an animation: seven of these
            open and close independently, the browser already handles the
            keyboard and the aria wiring, and a dialog this size does not need
            another motion component inside it. */}
        {/* last:border-b-0 — the section divider below already closes the
            list, and the two rules together read as a double line */}
        <div className="border-t border-white/8">
          {t.faq.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-white/8 last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="font-body text-sm leading-relaxed font-light break-keep text-slate-200 transition-colors group-hover:text-white">
                  {q}
                </span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-white/35 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              {/* pr clears the chevron's column so the answer does not run
                  under it on the last line */}
              <p className="font-body pr-8 pb-4 text-sm leading-relaxed font-light break-keep text-slate-400">
                {a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <div className="mt-9 border-t border-white/10 pt-8">
        {!RECRUITING_OPEN && (
          <>
            <p className="font-heading text-xl leading-snug tracking-[-0.5px] break-keep text-white md:text-2xl">
              {t.closedTitle(t.cohort(CLOSED_COHORT))}
            </p>
            <p className="font-body mt-3 mb-8 max-w-lg text-sm leading-relaxed font-light break-keep text-slate-400">
              {t.closedBody(t.cohort(NEXT_COHORT))}
            </p>
          </>
        )}

        <p className={`${EYEBROW} mb-4`}>{t.followEyebrow}</p>
        <div className="flex justify-start">
          <SocialLinks />
        </div>
      </div>

      {/* no mailto — questions go through the contact form, same as everywhere */}
      <p className="font-body mt-8 text-xs leading-relaxed font-light break-keep text-slate-500">
        {t.contactNote}
      </p>
    </Modal>
  );
}

/* Trigger that owns its dialog state, so the button can be dropped into a
   server component without lifting state anywhere.

   Leave `children` off and the button labels itself from the language switch —
   which is the only way the landing page can get a translated label, since it
   renders on the server and cannot read the setting. Pass children to override
   it for a trigger that needs different wording.

   Only safe where the trigger itself stays mounted. Inside something that
   unmounts on click — a closing menu, say — the dialog would unmount with it;
   render <ApplyModal> at a stable level and drive `open` from there instead. */
export default function ApplyTrigger({
  className,
  children,
  onActivate,
}: {
  className?: string;
  children?: ReactNode;
  onActivate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onActivate?.();
          setOpen(true);
        }}
        className={`cursor-pointer ${className ?? ""}`}
      >
        {children ?? (
          <>
            {copyFor(lang).applyCta}
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </button>
      <ApplyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
