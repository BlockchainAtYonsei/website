import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronLeft } from "@/components/icons";
import Reveal from "@/components/research/reveal";
import {
  Materials,
  Schedule,
  SheetHeading,
} from "@/components/research/study-session";
import { PAGE_BOX, StudyHero } from "@/components/research/study-ui";
import {
  findSession,
  neighbours,
  pad2,
  SESSIONS,
  sessionDate,
  sessionLabel,
  slotCount,
  slotMinutes,
  STUDY_DEFAULTS,
  totalMinutes,
  type Session,
} from "@/lib/study";

/* Nine sessions, known at build time — the whole set is prerendered and the
   route never falls through to a runtime render. */
export function generateStaticParams() {
  return SESSIONS.map((s) => ({ no: String(s.no) }));
}

export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/research/study/[no]">,
): Promise<Metadata> {
  const { no } = await props.params;
  const session = findSession(no);
  if (!session) return {};
  return {
    title: `${pad2(session.no)}회차 · ${session.topic}`,
    description: session.source
      ? `${session.source.label} · BAY 리서치팀 RWA 스터디 ${session.no}회차 진행안.`
      : `BAY 리서치팀 RWA 스터디 ${session.no}회차.`,
  };
}

/* The sheet's reading column. Narrower than the header's box: the rows are
   name-over-parts-over-focus now, not four columns, and a 1152px line of 13px
   Korean is not a line anyone reads. Left edge still sits on the header's. */
const SHEET = "max-w-3xl";

/* Prev/next as two plain lines under a rule — the sheet ends, the next one
   is named. Either end of the run keeps its slot so the other doesn't slide. */
function Pager({ session }: { session: Session }) {
  const { prev, next } = neighbours(session);
  const link = (t: Session | undefined, back: boolean) =>
    t ? (
      <Link
        href={`/research/study/${t.no}`}
        className={`group flex min-w-0 flex-col gap-1.5 ${back ? "" : "items-end text-right"}`}
      >
        <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
          {back ? "← 이전 회차" : "다음 회차 →"}
        </span>
        <span className="font-body truncate text-sm font-medium text-white transition-colors group-hover:text-bay-100">
          {sessionLabel(t)}
        </span>
      </Link>
    ) : (
      <span aria-hidden />
    );

  return (
    <nav className="mt-16 grid grid-cols-2 gap-8 border-t border-white/12 pt-8 md:mt-20">
      {link(prev, true)}
      {link(next, false)}
    </nav>
  );
}

export default async function StudySession(
  props: PageProps<"/research/study/[no]">,
) {
  const { no } = await props.params;
  const session = findSession(no);
  if (!session) notFound();

  const tbd = session.status === "tbd";
  const d = sessionDate(session.date);

  /* One line of facts under the title, in place of a stat row. */
  const meta = [
    d?.long,
    tbd
      ? `${STUDY_DEFAULTS.memberCount}명 예정`
      : `${slotCount(session)}명`,
    `${tbd ? STUDY_DEFAULTS.totalMinutes : totalMinutes(session)}분`,
    `인당 ${slotMinutes(session)}분`,
  ].filter(Boolean) as string[];

  return (
    <main className="overflow-x-clip">
      <StudyHero>
        {/* The house rules live on the index only — this page is one session's
            sheet, and the way back is where the rules are. */}
        <Link
          href="/research/study"
          className="font-mono group inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-300"
        >
          <ChevronLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
          전체 회차
        </Link>

        <p className="font-mono mt-10 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
          Session {pad2(session.no)}
          <span className="px-2.5 text-white/20">·</span>
          <span className="text-white/45">{session.topic}</span>
        </p>
        <h1 className="font-heading mt-4 text-3xl leading-[1.1] tracking-[-1.2px] break-keep text-white md:text-5xl">
          <span className="text-bay-300">{session.title.accent}</span>{" "}
          {session.title.rest}
        </h1>

        <p className="font-mono mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] tracking-[0.16em] text-white/45 uppercase">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-2.5">
              {i > 0 && <span className="text-white/20">·</span>}
              {m}
            </span>
          ))}
        </p>

        {/* The source as a line of text, not a button: it is the one thing on
            the sheet the reader is meant to go and read. A faint underline and
            the arrow say "link" without a label saying it. */}
        {session.source ? (
          <a
            href={session.source.url}
            target="_blank"
            rel="noreferrer"
            className="group font-body mt-8 inline-flex max-w-2xl items-start gap-2 text-[15px] leading-relaxed font-light break-keep text-slate-300 transition-colors hover:text-white"
          >
            <span className="underline decoration-white/20 underline-offset-4 transition-colors group-hover:decoration-bay-300/70">
              {session.source.label}
            </span>
            <ArrowUpRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-white/35 transition-colors group-hover:text-bay-300" />
          </a>
        ) : (
          <p className="font-body mt-8 text-[15px] leading-relaxed font-light text-slate-500">
            주제 미정 · 확정되면 업데이트됩니다
          </p>
        )}
      </StudyHero>

      <div className={`pt-14 pb-24 md:pt-20 md:pb-32 ${PAGE_BOX}`}>
        <div className={SHEET}>
          {tbd ? (
            <p className="font-body text-[15px] leading-relaxed font-light break-keep text-slate-400">
              {pad2(session.no)}회차는 주제 확정 대기 중입니다. 주제와 원문
              아티클이 정해지면 진행 순서가 여기에 표시됩니다. 사전 준비와
              진행 방식은 전체 회차 페이지의 공통 규칙을 따릅니다.
            </p>
          ) : (
            <>
              <Reveal>
                <SheetHeading
                  title="진행 순서"
                  aside={`${session.assign.length}파트 · ${totalMinutes(session)}분`}
                />
                <Schedule session={session} />
              </Reveal>

              <Reveal className="mt-16 md:mt-20">
                <SheetHeading
                  title="자료"
                  aside={
                    session.records.length > 0
                      ? `${session.records.length}건`
                      : "세션 이후"
                  }
                />
                <Materials records={session.records} />
              </Reveal>
            </>
          )}

          <Pager session={session} />
        </div>
      </div>
    </main>
  );
}
