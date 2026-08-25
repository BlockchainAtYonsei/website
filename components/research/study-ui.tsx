import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import {
  pad2,
  prepOf,
  sessionDate,
  slotCount,
  slotMinutes,
  stepsOf,
  totalMinutes,
  type Session,
} from "@/lib/study";

/* Parts shared by the study index and the rules overlay: the hero shell, the
   session card, and the two house-rule blocks (prep table, steps). The session
   page's own rows live in study-session.tsx. Everything here is server-
   rendered; nothing on these surfaces changes after the page is drawn. */

/** The header's box, the measurement every research surface aligns to. */
export const PAGE_BOX = "mx-auto max-w-6xl px-6";

/** Copy in lib/study.ts marks emphasis with **…**. Parsing it here keeps the
    data free of markup and the page free of dangerouslySetInnerHTML — the
    string is ours either way, but only one of the two stays that way by
    construction. Odd chunks are the emphasized ones. */
export function Emph({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((chunk, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">
            {chunk}
          </strong>
        ) : (
          chunk
        ),
      )}
    </>
  );
}

/** A hairline-bordered container with no glass. The rules overlay is the only
    place a table still lives, and it sits on the modal's own glass — a second
    glass layer there reads as a muddy double. */
export function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] border border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

/* ---- badges -------------------------------------------------------------- */

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`font-mono rounded-full border px-2.5 py-1 text-[9px] tracking-[0.16em] whitespace-nowrap uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/* ---- 사전 준비 ---------------------------------------------------------- */

const PREP_COLS = "md:grid-cols-[120px_96px_minmax(0,1fr)]";

export function PrepTable({ session }: { session?: Session }) {
  return (
    <Frame>
      <div
        className={`font-mono hidden gap-x-6 border-b border-white/10 px-6 py-3.5 text-[10px] tracking-[0.18em] text-white/35 uppercase md:grid ${PREP_COLS}`}
      >
        {["시점", "누가", "무엇을"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <ul>
        {prepOf(session).map((p) => (
          <li
            key={p.when}
            className={`grid gap-x-6 gap-y-2 border-t border-white/6 px-6 py-5 first:border-t-0 md:items-start ${PREP_COLS}`}
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-bay-300 uppercase">
              {p.when}
            </span>
            <span className="font-body text-sm font-medium text-white">
              {p.who}
            </span>
            <div>
              {p.list ? (
                <ul className="space-y-2">
                  {p.list.map((item) => (
                    <li
                      key={item}
                      className="font-body relative pl-4 text-[13px] leading-relaxed font-light break-keep text-slate-300 before:absolute before:top-[0.55em] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-bay-400/70"
                    >
                      <Emph text={item} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-[13px] leading-relaxed font-light break-keep whitespace-pre-line text-slate-300">
                  <Emph text={p.what ?? ""} />
                </p>
              )}
              {p.note && (
                <p className="font-body mt-3 text-xs leading-relaxed font-light break-keep text-slate-500">
                  {p.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* ---- 진행 방식 / 진행표 -------------------------------------------------- */

/** The three beats inside one slot, as one line of text. No pills and no
    container edge: this only ever renders inside the rules overlay, where every
    nested box adds to the clutter. */
export function StepsBar({ session }: { session?: Session }) {
  /* Both fall back to the house rules when there is no session — the index
     page uses this bar to describe them. */
  const steps = stepsOf(session);
  const minutes = slotMinutes(session);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
      <span className="font-mono mr-1 text-[10px] tracking-[0.18em] text-white/35 uppercase">
        각 순서 {minutes}분 구성
      </span>
      {steps.map((st, i) => (
        <span key={st.n} className="flex items-center gap-3">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 shrink-0 text-white/20" />
          )}
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-bay-300">{st.n}</span>
            <span className="font-body text-xs font-light break-keep text-slate-200">
              {st.t}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-white/40">
              {st.d}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

/* ---- 회차 카드 ---------------------------------------------------------- */

export function SessionCard({ session }: { session: Session }) {
  const tbd = session.status === "tbd";
  const d = sessionDate(session.date);
  /* Only landed files count — a pending row is a placeholder, and a card that
     promised "자료 3" then opened onto three "준비 중" lines would read as a
     broken link. */
  const materials = session.records.filter((r) => !r.pending && r.url).length;
  const foot: string[] = tbd
    ? ["진행안 준비 전"]
    : [`${slotCount(session)}명`, `${totalMinutes(session)}분`];
  if (d) foot.push(d.long);

  return (
    <Link
      href={`/research/study/${session.no}`}
      className={`liquid-glass group flex flex-col rounded-[1.25rem] p-6 transition-transform duration-300 hover:-translate-y-1 ${tbd ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-heading mr-auto text-2xl leading-none tracking-[-1px] text-white/85">
          {pad2(session.no)}
        </span>
        {materials > 0 && (
          <Badge className="border-white/15 bg-white/8 text-white/75">
            자료
          </Badge>
        )}
      </div>

      <h3 className="font-heading mt-5 text-lg leading-snug tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100">
        {session.topic}
      </h3>
      <p className="font-body mt-2.5 line-clamp-2 text-[13px] leading-relaxed font-light break-keep text-slate-400">
        {session.source ? session.source.label : "주제가 정해지면 채워집니다"}
      </p>

      {/* mt-auto, not a fixed margin: the source line runs to one line on some
          cards and two on others, and a row of cards whose footers sit at
          different heights reads as a rendering bug rather than as copy. */}
      <p className="font-mono mt-auto flex items-center gap-2 pt-6 text-[10px] tracking-[0.14em] text-white/40 uppercase">
        {foot.map((f, i) => (
          <span key={f} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/20">·</span>}
            {f}
          </span>
        ))}
        <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-bay-300" />
      </p>
    </Link>
  );
}

/* ---- hero shell --------------------------------------------------------- */

/** The masthead both study pages open with: the research home's atmosphere,
    holding whatever the page puts in it. */
export function StudyHero({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 65% at 22% 25%, rgba(47,107,255,0.26) 0%, transparent 68%), radial-gradient(40% 45% at 82% 80%, rgba(124,98,210,0.15) 0%, transparent 70%)",
        }}
      />
      <div aria-hidden className="bg-grid absolute inset-0 opacity-25" />
      <div className={`relative pt-16 pb-14 md:pt-24 md:pb-20 ${PAGE_BOX}`}>
        {children}
      </div>
    </section>
  );
}
