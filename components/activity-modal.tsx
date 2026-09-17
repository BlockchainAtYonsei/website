"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "./modal";
import { useLang } from "./lang-provider";

/* The Team Activity dialog behind the third card in "The BAY at work".

   Unlike the two team cards, this one is a browser rather than a read: you pick
   a cohort, then a regular session, then a group, drilling one level at a time.
   Each choice reveals the next level under it and stays lit so the trail is
   visible. The leaf (a group) has no content wired yet, so it shows a holding
   note rather than a dead click; the record lands there later. */

const COHORT = "26-2";
const SESSIONS = [1, 2, 3, 4];
const GROUPS = [1, 2, 3, 4, 5, 6, 7];

/* Eyebrows stay English on both sides of the language switch; the buttons and
   prose localise. */
const COPY = {
  KR: {
    title: "학회 활동",
    lead: "기수와 정규세션, 조를 차례로 골라 활동 기록을 살펴보세요.",
    session: (n: number) => `정규세션 ${n}차`,
    group: (n: number) => `${n}조`,
    picked: "선택",
    soon: "이 조의 활동 기록을 준비 중입니다.",
  },
  EN: {
    title: "Team Activity",
    lead: "Pick a cohort, a regular session, then a group to browse the record.",
    session: (n: number) => `Regular session ${n}`,
    group: (n: number) => `Group ${n}`,
    picked: "Selected",
    soon: "The record for this group is on its way.",
  },
} as const;

const EYEBROW = "font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase";

function pill(selected: boolean) {
  return `font-body cursor-pointer rounded-xl px-4 py-3 text-center text-sm font-medium break-keep transition-all duration-200 ${
    selected
      ? "liquid-glass-strong scale-[1.02] text-white ring-1 ring-bay-300/70"
      : "liquid-glass text-white/85 hover:scale-[1.03] hover:text-white"
  }`;
}

/* Shared entrance for a revealed level: fade up, so the next tier reads as
   having opened from the choice above it. */
const reveal = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.22, ease: "easeOut" },
} as const;

export default function ActivityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = COPY[lang];

  const [cohortOpen, setCohortOpen] = useState(false);
  const [session, setSession] = useState<number | null>(null);
  const [group, setGroup] = useState<number | null>(null);

  /* Picking a cohort or a session invalidates the levels beneath it, so each
     selection clears what it no longer describes. */
  const toggleCohort = () => {
    setCohortOpen((was) => !was);
    setSession(null);
    setGroup(null);
  };
  const pickSession = (n: number) => {
    setSession(n);
    setGroup(null);
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="activity-title">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        Activity
      </p>
      <h2
        id="activity-title"
        className="font-heading text-3xl leading-[1.15] tracking-[-1px] break-keep text-white md:text-4xl"
      >
        {t.title}
      </h2>
      <p className="font-body mt-6 max-w-xl leading-relaxed font-light break-keep text-slate-400">
        {t.lead}
      </p>

      {/* Cohort: the one button that is always here. */}
      <section className="mt-9">
        <h3 className={`${EYEBROW} mb-3.5`}>Cohort</h3>
        <button
          type="button"
          onClick={toggleCohort}
          aria-pressed={cohortOpen}
          className={`${pill(cohortOpen)} w-full sm:w-auto sm:min-w-[9rem]`}
        >
          {COHORT}
        </button>
      </section>

      <AnimatePresence initial={false}>
        {cohortOpen && (
          <motion.section key="sessions" className="mt-8" {...reveal}>
            <h3 className={`${EYEBROW} mb-3.5`}>Regular session</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SESSIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pickSession(n)}
                  aria-pressed={session === n}
                  className={pill(session === n)}
                >
                  {t.session(n)}
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {cohortOpen && session !== null && (
          <motion.section key="groups" className="mt-8" {...reveal}>
            <h3 className={`${EYEBROW} mb-3.5`}>Groups</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
              {GROUPS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGroup(n)}
                  aria-pressed={group === n}
                  className={pill(group === n)}
                >
                  {t.group(n)}
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {group !== null && session !== null && (
          <motion.div
            key="leaf"
            className="mt-8 rounded-[0.9rem] border border-white/10 px-5 py-4"
            {...reveal}
          >
            <p className={`${EYEBROW} mb-2`}>{t.picked}</p>
            <p className="font-body text-sm font-medium break-keep text-white">
              {COHORT} · {t.session(session)} · {t.group(group)}
            </p>
            <p className="font-body mt-2 text-sm font-light break-keep text-slate-400">
              {t.soon}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
