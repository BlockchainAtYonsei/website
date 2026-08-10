"use client";

import { useState, type ReactNode } from "react";
import Modal from "./modal";
import SocialLinks from "./social-links";

/* Recruiting notice. Update these two numbers when a cycle opens or closes —
   when 19기 opens, swap the body for the application link. */
const CLOSED_COHORT = "18기";
const NEXT_COHORT = "19기";

export function ApplyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="apply-modal-title">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        Recruiting
      </p>
      <h2
        id="apply-modal-title"
        className="font-heading text-3xl leading-[1.15] tracking-[-1px] break-keep text-white italic md:text-4xl"
      >
        {CLOSED_COHORT} 모집이 마감되었습니다.
      </h2>
      <p className="font-body mt-5 max-w-lg leading-relaxed font-light break-keep text-slate-400">
        다음 {NEXT_COHORT}에 BAY가 되어주세요. 모집 공고는 아래 채널로 가장 먼저
        전해드립니다.
      </p>

      <div className="mt-8 border-t border-white/10 pt-8">
        <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-white/45 uppercase">
          Follow for updates
        </p>
        <div className="flex justify-start">
          <SocialLinks />
        </div>
      </div>

      {/* no mailto — questions go through the contact form, same as everywhere */}
      <p className="font-body mt-8 text-xs leading-relaxed font-light break-keep text-slate-500">
        모집 일정이나 지원 자격이 궁금하시면 메뉴의 Contact로 문의해 주세요.
      </p>
    </Modal>
  );
}

/* Trigger that owns its dialog state, so the button can be dropped into a
   server component without lifting state anywhere.

   Only safe where the trigger itself stays mounted. Inside something that
   unmounts on click — a closing menu, say — the dialog would unmount with it;
   render <ApplyModal> at a stable level and drive `open` from there instead. */
export default function ApplyTrigger({
  className,
  children,
  onActivate,
}: {
  className?: string;
  children: ReactNode;
  onActivate?: () => void;
}) {
  const [open, setOpen] = useState(false);

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
        {children}
      </button>
      <ApplyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
