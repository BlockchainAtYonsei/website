import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import HomeHero from "@/components/research/home-hero";
import Reveal from "@/components/research/reveal";
import { getNews } from "@/lib/news";
import { formatDate, getArticlesPage, getFeatured } from "@/lib/research";
import {
  findSession,
  nextSessionNo,
  pad2,
  SESSIONS,
  sessionDate,
} from "@/lib/study";

/* The property's front door, as a landing page. Research, News and Study each
   own a tab; this page's job is to receive a visitor who doesn't know the site
   yet and walk them to each of the three rooms.

   So it is built as four screens, one per scroll: the masthead, then one
   full-height panel per surface. Each panel leads with the surface's number,
   name and a line saying what it does — that's the thing a newcomer can't
   infer from a photo or a headline — and carries the surface's three freshest
   items under it as proof the room is in use. No pictures: an EigenCloud
   wordmark or a bond scan tells a stranger nothing about what a section IS.

   The panels are min-h (not h) of the viewport: a panel holds its screen on
   any monitor, but a phone whose list runs long grows rather than clips. The
   4rem subtracted is the sticky header's h-16, so a panel lands exactly at the
   bottom of the window rather than a header's-worth past it; svh so a phone's
   collapsing toolbar doesn't push the floor under its own chrome. */

/* The header's own box, copied from research-header.tsx rather than
   approximated: the two are aligned or they are not, and a second formula
   drifting from the first is how they stop being. */
const PAGE_BOX = "mx-auto max-w-6xl px-6";
const SCREEN = "min-h-[calc(100svh-4rem)]";

/* A row in a panel's list: the item on the left, its one fact on the right,
   hairline under. Links go to the item itself — inside a panel the surface is
   already named, so this is where the reader drills in. */
function Row({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li className="border-t border-white/8 first:border-t-0">
      <Link
        href={href}
        className="group/row flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-white"
      >
        <span className="font-body min-w-0 truncate text-[17px] leading-snug text-slate-300 transition-colors group-hover/row:text-white">
          {title}
        </span>
        <span className="font-mono shrink-0 text-[10px] tracking-[0.14em] whitespace-nowrap text-white/35 uppercase">
          {meta}
        </span>
      </Link>
    </li>
  );
}

/* Each panel's atmosphere: a radial glow in the hero's blue, placed on
   alternate sides so the three screens don't read as one repeated template,
   at a fraction of the hero's strength so the hero stays the loudest screen.
   Bare ink behind a paragraph and three rows was the first cut, and it read as
   an empty room — the glow is what makes a panel a place rather than a gap. */
const GLOW = [
  "radial-gradient(50% 60% at 15% 50%, rgba(47,107,255,0.16) 0%, transparent 70%)",
  "radial-gradient(50% 60% at 85% 45%, rgba(124,98,210,0.14) 0%, transparent 70%)",
  "radial-gradient(50% 60% at 20% 60%, rgba(45,160,185,0.12) 0%, transparent 70%)",
];

/* One surface, as one screen. Left: the number, the name, the blurb, and the
   way in. Right: the surface's three freshest items. On a phone the two stack,
   blurb first, so the room is introduced before its contents. */
function Panel({
  index,
  label,
  blurb,
  href,
  cta,
  listTitle,
  rows,
}: {
  index: number;
  label: string;
  blurb: string;
  href: string;
  cta: string;
  listTitle: string;
  rows: { href: string; title: string; meta: string }[];
}) {
  return (
    <section
      className={`relative flex flex-col justify-center overflow-hidden border-t border-white/10 ${SCREEN}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: GLOW[(index - 1) % GLOW.length] }}
      />
      <div aria-hidden className="bg-grid absolute inset-0 opacity-[0.12]" />
      <Reveal
        className={`relative grid w-full grid-cols-1 gap-12 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20 md:py-20 ${PAGE_BOX}`}
      >
        <div className="flex flex-col">
          <p className="font-mono flex items-center gap-4 text-[11px] tracking-[0.2em] text-bay-200 uppercase">
            <span className="text-white/25 tabular-nums">0{index}</span>
            {label}
          </p>
          <h2 className="font-heading mt-6 text-[2rem] leading-[1.15] tracking-[-1px] break-keep text-white md:text-[2.75rem]">
            {blurb}
          </h2>
          <Link
            href={href}
            className="font-body mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition-colors hover:border-bay-300 hover:text-bay-100"
          >
            {cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono mb-2 text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {listTitle}
          </p>
          {rows.length > 0 ? (
            <ul>
              {rows.map((r) => (
                <Row key={r.href} {...r} />
              ))}
            </ul>
          ) : (
            <p className="font-body border-t border-white/8 pt-4 text-sm font-light text-slate-500">
              곧 채워집니다.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}

export default async function ResearchHome() {
  /* Research leads with the pinned piece — a Featured checkbox in Notion, an
     editorial call the 리서치팀 makes without touching this file — then the
     newest ones after it, deduped so the pin doesn't appear twice. News is the
     three freshest stories. Study is the next session and the two after it
     (or the last three once the series is done), so the list always reads as
     a calendar rather than a history. */
  const [featured, page, news] = await Promise.all([
    getFeatured(),
    getArticlesPage(1, 4),
    getNews(),
  ]);
  const articles = [
    ...(featured ? [featured] : []),
    ...page.items.filter((a) => a.slug !== featured?.slug),
  ].slice(0, 3);

  const nextNo = nextSessionNo(new Date());
  const from = nextNo != null ? SESSIONS.findIndex((s) => s.no === nextNo) : -1;
  const sessions =
    from >= 0 ? SESSIONS.slice(from, from + 3) : SESSIONS.slice(-3);
  /* The badge the study page gives the next session, kept identical here. */
  const next = nextNo != null ? findSession(nextNo) : undefined;

  return (
    <main className="overflow-x-clip">
      {/* Screen 1 — masthead. Poster atmosphere behind a staggered type
          entrance, and a hint that the rooms are below. */}
      <section className={`relative flex flex-col justify-center overflow-hidden ${SCREEN}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 65% at 22% 25%, rgba(47,107,255,0.26) 0%, transparent 68%), radial-gradient(40% 45% at 82% 80%, rgba(124,98,210,0.15) 0%, transparent 70%)",
          }}
        />
        <div aria-hidden className="bg-grid absolute inset-0 opacity-25" />
        <div className={`relative w-full ${PAGE_BOX}`}>
          <HomeHero />
          <p className="font-mono mt-16 flex items-center justify-center gap-6 text-[10px] tracking-[0.2em] text-white/35 uppercase">
            <span>01 Research</span>
            <span className="text-white/15">·</span>
            <span>02 News</span>
            <span className="text-white/15">·</span>
            <span>03 Study</span>
          </p>
        </div>
      </section>

      {/* Screens 2–4 — one per surface */}
      <Panel
        index={1}
        label="Research"
        blurb="프로토콜·ZK·DeFi·거버넌스, 시장을 구조로 읽어내는 자체 리서치"
        href="/research/articles"
        cta="리서치 아카이브"
        listTitle="추천 · 최신"
        rows={articles.map((a) => ({
          href: `/research/${a.slug}`,
          title: a.title,
          meta: `${a.tag} · ${a.readingMinutes} min`,
        }))}
      />

      <Panel
        index={2}
        label="News tracking"
        blurb="시장에서 골라 온 소식에 큐레이터의 한 줄을 얹습니다"
        href="/research/news"
        cta="뉴스트래킹"
        listTitle="최신"
        rows={news.slice(0, 3).map((n) => ({
          href: `/research/news/${n.slug}`,
          title: n.title,
          meta: formatDate(n.date),
        }))}
      />

      <Panel
        index={3}
        label="RWA Study"
        blurb="Xangle RWA Series를 아홉 번에 걸쳐 함께 완독합니다"
        href="/research/study"
        cta="스터디 아카이브"
        listTitle="다음 세션"
        rows={sessions.map((s) => ({
          href: `/research/study/${s.no}`,
          title: `${pad2(s.no)}회차 · ${s.topic}`,
          meta:
            s.no === next?.no
              ? "다음"
              : (sessionDate(s.date)?.short ?? ""),
        }))}
      />

      {/* Medium — the page's one glass object */}
      <section className="border-t border-white/12">
        <Reveal className={`py-14 md:py-16 ${PAGE_BOX}`}>
          <div className="liquid-glass flex flex-col items-start justify-between gap-5 rounded-[1.25rem] px-7 py-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-heading text-lg tracking-[-0.5px] break-keep text-white">
                새 리서치를 먼저 받아보세요
              </p>
              <p className="font-body mt-1.5 text-sm leading-relaxed font-light break-keep text-slate-400">
                모든 리서치는 Medium에도 발행됩니다.
              </p>
            </div>
            <a
              href="https://medium.com/yonseiblockchainlab"
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-strong font-body inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              Medium 팔로우
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
