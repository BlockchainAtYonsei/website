import Link from "next/link";
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
    the same face that stands in the Authors directory stands here — and when
    the person is one of those members the whole cell links to their profile,
    the same /research/author/[slug] the directory opens. A name we don't know
    (not in STUDY_MEMBERS) stays plain text rather than linking into a 404. */
function Presenter({ name }: { name: string }) {
  const m = memberOf(name);
  const cell = (
    <div className="flex items-center gap-3 md:flex-row-reverse">
      <Avatar
        name={name}
        src={m?.avatar ?? null}
        className="h-9 w-9 shrink-0 text-sm transition-[box-shadow] group-hover/who:ring-2 group-hover/who:ring-bay-400/45"
      />
      <p className="font-body text-[15px] leading-tight font-medium whitespace-nowrap text-white transition-colors group-hover/who:text-bay-100">
        {name}
      </p>
    </div>
  );

  if (!m) return cell;
  return (
    <Link
      href={`/research/author/${m.slug}`}
      className="group/who -m-1 rounded-xl p-1 transition-colors hover:bg-white/5"
    >
      {cell}
    </Link>
  );
}

/* A part number as a comparable key: "3-1. (1)" and "3-1 (1)" both become
   "3-1(1)", so a record's title and a part's `n` match however each was typed. */
const partKey = (s: string) => s.replace(/[.\s]/g, "");
const PART_TOKEN = /\d+-\d+(?:\s*\(\d+\))?|\d+/g;

/** The real part keys a title token stands for: itself when it names a part
    exactly, or every "(N)" sub-part under it. So a deck titled "3-2." covers
    "3-2(1)" and "3-2(2)" when the section was split between two presenters. */
function childrenOf(token: string, valid: Set<string>): string[] {
  const k = partKey(token);
  return [...valid].filter((v) => v === k || v.startsWith(`${k}(`));
}

/** Which parts a record covers, read from the numbers its title opens with.
    A record's title is "<parts>. <name>", e.g. "2-1 ~ 2-4. …", "3-2 · 3-3. …",
    "4-4 · 4-6. …", "3-1. …". Groups split on · / , ; a group with ~ is an
    inclusive range within one chapter. Returns [] when the title doesn't open
    on a real part of this session (background docs like "00. …"), so those
    stay in the 자료 list without wiring into the schedule. */
function coveredParts(title: string, valid: Set<string>): string[] {
  const cut = title.indexOf(". ");
  const spec = cut >= 0 ? title.slice(0, cut) : "";
  const first = spec.match(PART_TOKEN)?.[0];
  if (!first || childrenOf(first, valid).length === 0) return [];

  const keys = new Set<string>();
  for (const group of spec.split(/[·,]/)) {
    const toks = group.match(PART_TOKEN) ?? [];
    const a = toks[0]?.match(/^(\d+)-(\d+)$/);
    const b = toks[toks.length - 1]?.match(/^(\d+)-(\d+)$/);
    if (group.includes("~") && a && b && a[1] === b[1]) {
      for (let i = Number(a[2]); i <= Number(b[2]); i++)
        for (const c of childrenOf(`${a[1]}-${i}`, valid)) keys.add(c);
    } else {
      for (const t of toks) for (const c of childrenOf(t, valid)) keys.add(c);
    }
  }
  return [...keys];
}

/** Every real part a title mentions, wherever the number sits. Looser than
    coveredParts: it doesn't require the title to *open* on the part, so a
    supplementary doc named "00. …" or "… 보충" still gets tied to the parts it
    covers. Used to file extras under a slot, not to draw the primary link. */
function scanParts(title: string, valid: Set<string>): string[] {
  const keys = new Set<string>();
  for (const t of title.match(PART_TOKEN) ?? [])
    for (const c of childrenOf(t, valid)) keys.add(c);
  return [...keys];
}

/** underline is the only marker a part's title carries when it has a deck. Wrap
    just the title text; the number stays a plain mono prefix. */
function Parts({
  parts,
  linkOf,
}: {
  parts: { n: string; t: string }[];
  /* Resolves a part to its deck, or undefined when nothing is uploaded yet. */
  linkOf: (n: string) => string | undefined;
}) {
  return (
    <ul className="space-y-1.5">
      {parts.map((p) => {
        const href = linkOf(p.n);
        return (
          <li
            key={p.n + p.t}
            /* whitespace-pre-line so a hard break inside a long title (the 2-2
               parenthetical) lands on its own line. */
            className="font-body text-[14px] leading-snug font-light break-keep whitespace-pre-line text-slate-300"
          >
            <span className="font-mono mr-2 text-[11px] text-bay-300/80">
              {p.n}
            </span>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-bay-300"
              >
                {p.t}
              </a>
            ) : (
              p.t
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Docs that cover this slot's parts but didn't win a part's underline — a
    section's 보충/배경/PDF versions. Filed under the slot they belong to rather
    than in a separate 자료 list. */
function ExtraDocs({ records }: { records: StudyRecord[] }) {
  return (
    <div className="mt-4">
      <p className="font-mono mb-2 text-[10px] tracking-[0.16em] text-white/35 uppercase">
        추가 자료
      </p>
      <ul className="space-y-1.5">
        {records.map((r) => (
          <li key={r.url}>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="font-body text-[13px] leading-snug font-light break-keep text-slate-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-bay-300"
            >
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Running order: one row per part, in the article's order. */
export function Schedule({ session }: { session: Session }) {
  const valid = new Set(
    session.assign.flatMap((a) => a.parts.map((p) => partKey(p.n))),
  );

  /* part key → its primary deck. First writer wins, so a section's own
     발표자료 (listed first) takes the part over a later 보충/PDF. */
  const links = new Map<string, string>();
  for (const r of session.records) {
    if (r.pending || !r.url) continue;
    for (const k of coveredParts(r.title, valid))
      if (!links.has(k)) links.set(k, r.url);
  }
  const linkOf = (n: string) => links.get(partKey(n));

  /* Anything with a file that isn't already a part's underline is an extra,
     filed under whichever slot holds the parts it covers. */
  const usedUrls = new Set(links.values());
  const extrasFor = (parts: { n: string }[]): StudyRecord[] => {
    const keys = new Set(parts.map((p) => partKey(p.n)));
    return session.records.filter(
      (r) =>
        r.url &&
        !r.pending &&
        !usedUrls.has(r.url) &&
        scanParts(r.title, valid).some((k) => keys.has(k)),
    );
  };

  return (
    <ol>
      {session.assign.map((a, i) => {
        const extras = a.who === EVERYONE ? [] : extrasFor(a.parts);
        return (
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
            <Parts parts={a.parts} linkOf={linkOf} />
            {a.focus && (
              <p className="font-body mt-3 text-[13px] leading-relaxed font-light break-keep whitespace-pre-line text-slate-500">
                {a.focus}
              </p>
            )}
            {extras.length > 0 && <ExtraDocs records={extras} />}
          </div>
        </li>
        );
      })}
    </ol>
  );
}
