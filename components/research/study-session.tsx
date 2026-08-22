import { ArrowUpRight } from "@/components/icons";
import Avatar from "@/components/research/avatar";
import { EVERYONE, memberOf, type Session, type StudyRecord } from "@/lib/study";

/* The session page as a programme sheet.

   The first cut was a dashboard: a four-column table with Part chips, a glass
   panel per block, a stat row in the hero, kind badges on every file. Every one
   of those was a box drawn around something that was already legible, and nine
   of them on one screen is what "정신 없다" looks like.

   This is the same content on one rhythm instead. Every row — a presenter's
   slot, a file — is a narrow mono gutter on the left and the content on the
   right, with a hairline between rows. The gutter holds the one fact that
   orders the row (the time slot, the file's kind); nothing is boxed. A reading
   guide should look like something you print and bring to the room. */

/* Gutter + content + a slot for the trailing arrow. Rows sit directly under
   the heading's rule, so the first row carries no rule of its own. */
const ROW =
  "grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-x-5 border-t border-white/8 py-6 first:border-t-0 md:grid-cols-[88px_minmax(0,1fr)_auto] md:gap-x-8";

/* The schedule row: a gutter with the part number on the left, the parts in
   the middle, the presenter at the right edge from md up — above the parts on
   a phone, where there is no right column. No times: the order is the order. */
const SLOT_ROW =
  "grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-5 gap-y-4 border-t border-white/8 py-6 first:border-t-0 md:grid-cols-[88px_minmax(0,1fr)_auto] md:gap-x-8";
const SLOT_GUTTER = "col-start-1 row-start-1";
const SLOT_WHO = "col-start-2 row-start-1 md:col-start-3 md:justify-self-end";
const SLOT_BODY = "col-start-2 row-start-2 min-w-0 md:col-start-2 md:row-start-1";
/* A part the room reads together has no presenter cell at all. On a phone the
   body then takes the first row rather than leaving a blank line under the
   tag. A separate string, not an override appended to SLOT_BODY: two
   row-start utilities on one element resolve by stylesheet order. */
const SLOT_BODY_ALONE = "col-start-2 row-start-1 min-w-0 md:col-start-2";
const GUTTER =
  "font-mono pt-[3px] text-[11px] tracking-[0.14em] whitespace-nowrap uppercase";

/** Section heading for the sheet: title left, a short count right, one rule
    underneath that the rows hang from. */
export function SheetHeading({
  title,
  aside,
}: {
  title: string;
  aside?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/12 pb-4">
      <h2 className="font-heading text-xl tracking-[-0.5px] break-keep text-white">
        {title}
      </h2>
      {aside && (
        <span className="font-mono text-[10px] tracking-[0.16em] whitespace-nowrap text-white/40 uppercase">
          {aside}
        </span>
      )}
    </div>
  );
}

/** Name with the member's photo: the study's people are site members, so
    the same face that stands in the Authors directory stands here. */
function Presenter({ name }: { name: string }) {
  const m = memberOf(name);
  return (
    <div className="flex items-center gap-3 md:flex-row-reverse">
      <Avatar
        name={name}
        src={m?.avatar ?? null}
        className="h-9 w-9 shrink-0 text-sm"
      />
      <p className="font-body text-[15px] leading-tight font-medium whitespace-nowrap text-white">
        {name}
      </p>
    </div>
  );
}

function Parts({ parts }: { parts: { n: string; t: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {parts.map((p) => (
        <li
          key={p.n + p.t}
          className="font-body text-[14px] leading-snug font-light break-keep text-slate-300"
        >
          <span className="font-mono mr-2 text-[11px] text-bay-300/80">{p.n}</span>
          {p.t}
        </li>
      ))}
    </ul>
  );
}

/** Running order: one row per part, in the article's order. */
export function Schedule({ session }: { session: Session }) {
  return (
    <ol>
      {session.assign.map((a, i) => (
        <li key={a.who + i} className={SLOT_ROW}>
          <span className={`${GUTTER} ${SLOT_GUTTER} text-bay-200`}>
            Part {i + 1}
          </span>
          {a.who !== EVERYONE && (
            <div className={SLOT_WHO}>
              <Presenter name={a.who} />
            </div>
          )}
          <div className={a.who === EVERYONE ? SLOT_BODY_ALONE : SLOT_BODY}>
            <Parts parts={a.parts} />
            {a.focus && (
              <p className="font-body mt-3 text-[13px] leading-relaxed font-light break-keep text-slate-500">
                {a.focus}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** What the session left behind. Same gutter rhythm — the file's kind sits
    where the time slot sat above — so the two lists read as one sheet. Decks
    under /study/materials are standalone documents with their own layout, so
    they open in a new tab like the Xangle originals do. */
export function Materials({ records }: { records: StudyRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="font-body py-8 text-[14px] leading-relaxed font-light break-keep text-slate-500">
        세션이 끝나면 발표 자료와 참고 자료가 여기에 모입니다.
      </p>
    );
  }

  return (
    <ul>
      {records.map((r, i) => {
        const meta = [r.who, r.part].filter(Boolean).join(" · ");
        const live = !r.pending && r.url;
        const inner = (
          <>
            <span className={`${GUTTER} text-white/40`}>{r.kind || "자료"}</span>
            <span className="min-w-0">
              <span
                className={`font-body block text-[15px] leading-snug font-medium break-keep transition-colors ${
                  live ? "text-white group-hover:text-bay-100" : "text-white/60"
                }`}
              >
                {r.title}
              </span>
              {meta && (
                <span className="font-body mt-1.5 block text-[13px] font-light break-keep text-slate-500">
                  {meta}
                </span>
              )}
            </span>
            {live ? (
              <ArrowUpRight className="mt-1 h-4 w-4 text-white/30 transition-colors group-hover:text-bay-300" />
            ) : (
              <span className="font-mono mt-1 text-[9px] tracking-[0.16em] text-white/30 uppercase">
                준비 중
              </span>
            )}
          </>
        );
        return (
          <li key={r.title + i}>
            {live ? (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className={`group ${ROW}`}
              >
                {inner}
              </a>
            ) : (
              <div className={ROW}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
