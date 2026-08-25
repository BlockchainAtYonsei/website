import type { Metadata } from "next";
import { ArrowUpRight } from "@/components/icons";
import Reveal from "@/components/research/reveal";
import StudyRulesOverlay from "@/components/research/study-rules-overlay";
import {
  PAGE_BOX,
  SessionCard,
  StudyHero,
} from "@/components/research/study-ui";
import { SESSIONS, STUDY_META } from "@/lib/study";

export const metadata: Metadata = {
  title: "RWA Study",
  description:
    "BAY 리서치팀이 Xangle RWA Series를 9주에 걸쳐 완독합니다. 회차별 진행안, 담당 배분, 발표 자료.",
};

export default function StudyIndex() {
  return (
    <main className="overflow-x-clip">
      <StudyHero>
        <p className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
          {STUDY_META.eyebrow}
        </p>
        <h1 className="font-heading mt-5 text-4xl leading-[1.08] tracking-[-1.5px] break-keep text-white md:text-6xl">
          <span className="text-bay-300">{STUDY_META.accent}</span>{" "}
          {STUDY_META.rest}
        </h1>
        <p className="font-body mt-5 max-w-xl text-[15px] leading-relaxed font-light break-keep text-slate-400">
          {STUDY_META.sub}
        </p>

        {/* hidden until there is a shared page to point at */}
        {STUDY_META.notionUrl && (
          <a
            href={STUDY_META.notionUrl}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-strong font-body mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
          >
            공용 노션 페이지
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </StudyHero>

      <div className={`pt-14 pb-24 md:pt-20 md:pb-32 ${PAGE_BOX}`}>
        <Reveal>
          {/* The house-rules trigger sits above the grid, right-aligned. The
              rules are the same for every session, so they live one click away
              here rather than running down the page as their own sections. */}
          <div className="mb-5 flex justify-end">
            <StudyRulesOverlay />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SESSIONS.map((s) => (
              <SessionCard key={s.no} session={s} />
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
