"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { summaryPreview, weekOf, type NewsItem } from "@/lib/news";
import type { Accent } from "@/lib/research";
import Avatar from "./avatar";
import CoverArt from "./cover-art";
import { ArrowUpRight } from "../icons";

/* The news page in three passes over one feed: what just landed, what the
   week is worth stopping on, and everything else by topic. Rows gave equal
   weight to every story, which is the wrong shape for a page you arrive at
   cold — these sections rank instead.

   One gap against the design, in the data rather than here: news items carry
   no image, so the hero and the topic grid use the same generated cover art
   the research cards use. A real `imageUrl` on the Notion DB would slot
   straight into <CoverArt>'s place. Topics, which were the other gap, now
   come through in full — Notion's Topic is a multi-select and a card shows
   every tag the curator applied.

   "Editor's Picks" reads the team's own Pick checkbox. It falls back to the
   newest week's curation when nothing is ticked, so the band never goes blank
   on a week nobody got round to marking. */

const RAIL_SIZE = 4; // stories in The Latest, beside the hero
const PICK_SIZE = 6; // cards in Editor's Picks — two rows of three
const TOPIC_CHIPS = 8; // topics shown before 더보기
const TOPIC_SIZE = 9; // three rows of three, then out to the archive

/* The topic options as they stand in the Notion DB, tinted to echo the colours
   they already wear there — a curator who tags 보안 green sees green here.
   Notion's palette is set on light; these are the dark-surface equivalents.

   Not a whitelist: a topic added in Notion appears the moment a story carries
   it, just with a hashed colour until it is named here. Nothing breaks, so
   this table can lag behind without anyone noticing at 2am. */
const TOPIC_TINTS: Record<string, string> = {
  DeFi: "bg-orange-500/15 text-orange-200",
  RWA: "bg-orange-500/15 text-orange-200",
  시장: "bg-bay-500/15 text-bay-200",
  투자: "bg-violet-500/15 text-violet-200",
  기관: "bg-fuchsia-500/15 text-fuchsia-200",
  스테이블코인: "bg-rose-500/15 text-rose-200",
  보안: "bg-emerald-500/15 text-emerald-200",
  기술: "bg-amber-500/15 text-amber-200",
  "규제/법안": "bg-slate-400/15 text-slate-200",
  예측시장: "bg-slate-400/15 text-slate-200",
  기타: "bg-slate-400/15 text-slate-200",
};

/* Fallback for anything not in the table above, so an unnamed topic still
   keeps one colour everywhere on the page instead of flickering per render. */
const TINTS = [
  "bg-bay-500/15 text-bay-200",
  "bg-emerald-500/15 text-emerald-200",
  "bg-amber-500/15 text-amber-200",
  "bg-rose-500/15 text-rose-200",
  "bg-violet-500/15 text-violet-200",
  "bg-cyan-500/15 text-cyan-200",
];
const ACCENTS: Accent[] = ["blue", "violet", "teal", "indigo"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const tintOf = (topic: string) =>
  TOPIC_TINTS[topic] ?? TINTS[hash(topic) % TINTS.length];
const accentOf = (topic: string) => ACCENTS[hash(topic) % ACCENTS.length];

/* "2026-08-11" → "08.11". The year is carried by the section, not the row. */
const monthDay = (iso: string) => iso.slice(5).replace("-", ".");

/* Every tag the story carries. Capped at three so a heavily-tagged item can't
   push the byline off its own card — the rest stay reachable through the
   topic filter, which is where someone browsing by tag is looking anyway. */
function TopicChips({ topics, max = 3 }: { topics: string[]; max?: number }) {
  /* Deduped here too: the mapper already does it, but this component also
     renders whatever an older row in the database happens to hold, and a
     repeated key would take the card down rather than just look wrong. */
  const shown = [...new Set(topics)].slice(0, max);
  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      {shown.map((topic) => (
        <span
          key={topic}
          className={`font-body rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${tintOf(topic)}`}
        >
          {topic}
        </span>
      ))}
      {topics.length > shown.length && (
        <span className="font-mono text-[10px] text-slate-500">
          +{topics.length - shown.length}
        </span>
      )}
    </span>
  );
}

function Byline({ item }: { item: NewsItem }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {item.curator && (
        <Avatar
          name={item.curator.name}
          src={item.curator.avatarUrl}
          className="h-6 w-6 shrink-0 text-[10px]"
        />
      )}
      <span className="font-body truncate text-xs font-light text-slate-400">
        {item.curator?.name ?? item.sourceName}
        <span className="px-1.5 text-slate-600">·</span>
        {monthDay(item.date)}
      </span>
    </span>
  );
}

function SectionHead({
  title,
  note,
  id,
}: {
  title: string;
  note: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="mb-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 scroll-mt-24"
    >
      <h2 className="font-heading text-2xl tracking-[-0.5px] break-keep text-white md:text-3xl">
        {title}
      </h2>
      <p className="font-body text-sm font-light break-keep text-slate-400">
        {note}
      </p>
    </div>
  );
}

export default function NewsHome({ items }: { items: NewsItem[] }) {
  /* One sort for the whole page. The API already orders by publishedAt desc,
     but every section below slices off the front of this list, so the order
     is worth owning here rather than borrowing. ISO dates compare
     lexicographically, so a string compare is the chronological one. */
  const feed = useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date)),
    [items],
  );

  const [hero, ...rest] = feed;
  const rail = rest.slice(0, RAIL_SIZE);

  /* The newest week, by the same Monday-anchored reckoning the curation
     sessions use — not "the last seven days", which would split a session.

     Minus whatever the section above already showed: both draw from the front
     of the same feed, so without this the top story is on screen three times
     before the reader has scrolled once. 주제별 below is the archive and does
     repeat them, which is what an archive is for. */
  const picks = useMemo(() => {
    if (!feed.length) return [];
    const above = new Set([hero, ...rail].map((n) => n.id));
    const rest = feed.filter((n) => !above.has(n.id));

    const ticked = rest.filter((n) => n.pick);
    if (ticked.length > 0) return ticked.slice(0, PICK_SIZE);

    /* Nothing ticked — fall back to the newest curation week so the band still
       says something rather than disappearing. */
    const key = weekOf(feed[0].date).key;
    const week = rest.filter((n) => weekOf(n.date).key === key);
    return (week.length >= 3 ? week : rest).slice(0, PICK_SIZE);
  }, [feed, hero, rail]);

  /* Counts drive the chip order, so the topics someone actually curates rise
     to the front on their own. */
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    /* One story counts once per topic it carries, so the chips add up to more
       than the feed — which is the honest reading of "how much 보안 is here". */
    for (const n of feed) {
      for (const c of n.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      /* 기타 last whatever its count — it is the bucket for everything that
         didn't fit a topic, so leading with it says nothing. */
      .sort(
        (a, b) =>
          Number(a.topic === "기타") - Number(b.topic === "기타") ||
          b.count - a.count ||
          a.topic.localeCompare(b.topic),
      );
  }, [feed]);

  const [topic, setTopic] = useState<string | null>(null);
  const [allTopics, setAllTopics] = useState(false);
  const shownTopics = allTopics ? topics : topics.slice(0, TOPIC_CHIPS);
  const byTopic = topic ? feed.filter((n) => n.categories.includes(topic)) : feed;

  /* Three rows and out. The section is a sampler of what each topic holds, not
     the archive — the chip counts say how much is behind it and 전체 보기 goes
     and gets it, carrying the filter so the trip doesn't lose the reader's
     place. */
  const topicCards = byTopic.slice(0, TOPIC_SIZE);
  const archiveHref = topic
    ? `/research/news/archive?topic=${encodeURIComponent(topic)}`
    : "/research/news/archive";

  if (!feed.length) {
    return (
      <p className="font-body mt-14 text-sm font-light text-slate-500">
        아직 큐레이션된 뉴스가 없습니다.
      </p>
    );
  }

  return (
    <>
      {/* ---- 최신 ---- */}
      <section>
        <SectionHead title="최신 뉴스트래킹" note="가장 먼저 볼 이슈" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Link
            href={`/research/news/${hero.slug}`}
            className="group liquid-glass flex flex-col overflow-hidden rounded-[1.25rem] transition-transform duration-300 hover:scale-[1.01] lg:col-span-7"
          >
            {hero.imageUrl ? (
              /* the story's own picture beats generated art every time */
              <img
                src={hero.imageUrl}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <CoverArt
                accent={accentOf(hero.categories[0] ?? "")}
                tag={hero.categories[0] ?? "News"}
                large
                className="aspect-[16/9] w-full"
              />
            )}
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <h3 className="font-heading text-2xl leading-[1.15] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-3xl">
                {hero.title}
              </h3>
              {hero.summary && (
                <p className="font-body mt-4 line-clamp-2 text-sm leading-relaxed font-light break-keep text-slate-400">
                  {summaryPreview(hero.summary)}
                </p>
              )}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <Byline item={hero} />
                <TopicChips topics={hero.categories} />
              </div>
            </div>
          </Link>

          <div className="liquid-glass rounded-[1.25rem] p-6 md:p-7 lg:col-span-5">
            <div className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-4">
              <h3 className="font-heading text-xl tracking-[-0.5px] text-white">
                The Latest
              </h3>
              {/* out to the full archive, not down to 주제별 — the rail is a
                  chronological slice, so "전체" means the rest of the feed */}
              <Link
                href="/research/news/archive"
                className="font-body inline-flex items-center gap-1 text-xs font-light text-slate-400 transition-colors hover:text-bay-200"
              >
                전체 보기
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <ul>
              {rail.map((item) => (
                <li key={item.id} className="border-b border-white/8 last:border-b-0">
                  <Link href={`/research/news/${item.slug}`} className="group block py-4">
                    <p className="font-body text-[11px] font-medium text-bay-300">
                      {item.categories.join(" · ")}
                    </p>
                    <h4 className="font-body mt-1.5 text-[15px] leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                      {item.title}
                    </h4>
                    <p className="font-body mt-2 text-xs font-light text-slate-500">
                      {item.curator?.name ?? item.sourceName}
                      <span className="px-1.5 text-slate-600">·</span>
                      {monthDay(item.date)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- 이번 주 ---- */}
      {picks.length > 0 && (
        <section className="mt-20 md:mt-24">
          <SectionHead title="Editor's Picks" note="이번주 꼭 봐야할 이슈" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((item) => (
              <Link
                key={item.id}
                href={`/research/news/${item.slug}`}
                className="group liquid-glass flex h-full flex-col rounded-[1.25rem] p-6 transition-transform duration-300 hover:scale-[1.015]"
              >
                <h3 className="font-body text-lg leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="font-body mt-3 line-clamp-2 text-sm leading-relaxed font-light break-keep text-slate-400">
                    {summaryPreview(item.summary)}
                  </p>
                )}
                {/* mt-auto pins the footer to the card floor, so a short title
                    and a long one still line their bylines up across a row */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
                  <Byline item={item} />
                  <TopicChips topics={item.categories} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---- 주제별 ---- */}
      <section className="mt-20 md:mt-24">
        <SectionHead id="topics" title="주제별" note="관심 주제로 모아보기" />

        <div className="flex flex-wrap items-center gap-2 border-b border-white/8 pb-6">
          <button
            type="button"
            onClick={() => setTopic(null)}
            aria-pressed={topic === null}
            className={`font-body cursor-pointer rounded-full px-4 py-2 text-[13px] transition-colors ${
              topic === null
                ? "bg-white text-black"
                : "bg-white/6 text-slate-300 hover:bg-white/12 hover:text-white"
            }`}
          >
            전체
            <span className="pl-1.5 opacity-60">{feed.length}</span>
          </button>

          {shownTopics.map(({ topic: name, count }) => {
            const on = topic === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setTopic(on ? null : name)}
                aria-pressed={on}
                className={`font-body cursor-pointer rounded-full px-4 py-2 text-[13px] transition-colors ${
                  on
                    ? "bg-white text-black"
                    : "bg-white/6 text-slate-300 hover:bg-white/12 hover:text-white"
                }`}
              >
                {name}
                <span className="pl-1.5 opacity-60">{count}</span>
              </button>
            );
          })}

          {topics.length > TOPIC_CHIPS && (
            <button
              type="button"
              onClick={() => setAllTopics((v) => !v)}
              className="font-body inline-flex cursor-pointer items-center gap-1 px-2 py-2 text-[13px] text-slate-400 transition-colors hover:text-bay-200"
            >
              {allTopics ? "접기" : "더보기"}
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topicCards.map((item) => (
            <Link
              key={item.id}
              href={`/research/news/${item.slug}`}
              className="group liquid-glass flex h-full flex-col overflow-hidden rounded-[1.25rem] transition-transform duration-300 hover:scale-[1.015]"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <CoverArt
                  accent={accentOf(item.categories[0] ?? "")}
                  tag={item.categories[0] ?? "News"}
                  className="aspect-[16/9] w-full"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-body text-base leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                  {item.title}
                </h3>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                  <Byline item={item} />
                  <TopicChips topics={item.categories} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {byTopic.length === 0 ? (
          <p className="font-body mt-10 text-sm font-light text-slate-500">
            이 주제로 모인 소식이 아직 없습니다.
          </p>
        ) : (
          <div className="mt-12 flex justify-center">
            <Link
              href={archiveHref}
              className="liquid-glass-strong font-body inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              전체 보기
              {byTopic.length > TOPIC_SIZE && (
                <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">
                  +{byTopic.length - TOPIC_SIZE}
                </span>
              )}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
