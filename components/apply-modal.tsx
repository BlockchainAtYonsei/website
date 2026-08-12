"use client";

import { useState, type ReactNode } from "react";
import { CLOSED_COHORT, NEXT_COHORT } from "@/lib/cohort";
import { copyFor } from "@/lib/i18n";
import { ArrowUpRight } from "./icons";
import { useLang } from "./lang-provider";
import Modal from "./modal";
import SocialLinks from "./social-links";

/* Recruiting notice — when 19기 opens, swap the body for the application link.
   The cohort numbers themselves live in lib/cohort so the Organization page
   can read them without crossing the client boundary; the wording around them
   lives in lib/i18n, which renders the same numbers as "18기" or "BAY 18th"
   depending on the language switch. */

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
        {t.title(t.cohort(CLOSED_COHORT))}
      </h2>
      <p className="font-body mt-5 max-w-lg leading-relaxed font-light break-keep text-slate-400">
        {t.body(t.cohort(NEXT_COHORT))}
      </p>

      <div className="mt-8 border-t border-white/10 pt-8">
        <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-white/45 uppercase">
          {t.followEyebrow}
        </p>
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
