"use client";

import { useState } from "react";
import { ChevronRight } from "@/components/icons";
import Modal from "@/components/modal";
import { PrepTable, StepsBar } from "@/components/research/study-ui";
import { STUDY_DEFAULTS } from "@/lib/study";

/* The house rules — 사전 준비 and 진행 방식 — used to be two full sections down the
   index. They are the same for every session and rarely read twice, so they
   were the two longest things on the page telling you what you already knew.
   Here they fold into one overlay behind a button in the hero's empty right
   half: the front door lists the nine sessions, and the rules are one click
   away for whoever actually needs them.

   Two tabs rather than a stack, because the two are read at different times —
   사전 준비 is a checklist for the week before, 진행 방식 is what happens in the
   room — and tabbing keeps whichever you came for from being buried under the
   other. */

const TABS = [
  { key: "prep", label: "사전 준비" },
  { key: "flow", label: "진행 방식" },
] as const;

const TITLE_ID = "study-rules-title";

export default function StudyRulesOverlay() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"prep" | "flow">("prep");

  return (
    <>
      {/* A plain underlined trigger above the card grid, where the status
          legend used to sit. The rules are reference the reader reaches for,
          not a headline, so no glass and no pill — a faint underline and the
          chevron are enough to read it as one clickable line, the same way the
          session pages set their source link. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group font-body inline-flex items-center gap-2 text-sm font-light text-slate-300 transition-colors hover:text-white"
      >
        <span className="break-keep underline decoration-white/20 underline-offset-4 transition-colors group-hover:decoration-bay-300/70">
          사전 준비 · 진행 방식
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-bay-300" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={TITLE_ID}
      >
        <p className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
          전 회차 공통
        </p>
        <h2
          id={TITLE_ID}
          className="font-heading mt-3 text-2xl tracking-[-0.5px] break-keep text-white"
        >
          공통 규칙
        </h2>

        {/* Tab strip — an underline marker in the header's blue, the same one
            the nav tabs use, so the switch reads as tabs and not as two
            buttons. */}
        <div
          role="tablist"
          aria-label="공통 규칙"
          className="mt-6 flex gap-6 border-b border-white/10"
        >
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={`font-mono relative -mb-px cursor-pointer pb-3 text-[11px] tracking-[0.16em] uppercase transition-colors ${
                  on ? "text-white" : "text-white/45 hover:text-bay-300"
                }`}
              >
                {t.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-px h-px bg-bay-400 shadow-[0_0_6px_rgba(95,139,255,0.8)] transition-opacity ${
                    on ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "prep" ? (
            <>
              <p className="font-body mb-4 text-[13px] leading-relaxed font-light break-keep text-slate-400">
                세션 전날까지 각자 마쳐 둡니다.
              </p>
              <PrepTable />
            </>
          ) : (
            <>
              <p className="font-body text-[13px] leading-relaxed font-light break-keep text-slate-400">
                {STUDY_DEFAULTS.flowNote}
              </p>
              {/* No frame, no pills — the steps sit straight on the modal as one
                  line, and a hairline is the only edge between them and the
                  summary. */}
              <div className="mt-6">
                <StepsBar />
              </div>
              <p className="font-body mt-6 border-t border-white/8 pt-6 text-[13px] leading-relaxed font-light break-keep text-slate-400">
                담당자 {STUDY_DEFAULTS.memberCount}명이 각{" "}
                {STUDY_DEFAULTS.minutesPerSlot}분씩, 총{" "}
                {STUDY_DEFAULTS.totalMinutes}분. 회차별 시간표는 각 회차
                페이지에서 확인하세요.
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
