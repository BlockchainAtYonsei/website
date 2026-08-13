"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { weekOf, type NewsItem } from "@/lib/news";
import type { Accent } from "@/lib/research";
import Avatar from "./avatar";
import CoverArt from "./cover-art";
import { ArrowUpRight } from "../icons";

/* The news page in three passes over one feed: what just landed, what the
   week is worth stopping on, and everything else by topic. Rows gave equal
   weight to every story, which is the wrong shape for a page you arrive at
   cold — these sections rank instead.

   Two gaps against the design, both in the data rather than here:

     - news items carry no image. The hero and the topic grid use the same
       generated cover art the research cards use; a real `imageUrl` on the
       Notion DB would slot straight into <CoverArt>'s place.
     - an item carries one category, so a card shows one chip, not the two or
       three the mock pairs up. Multiple chips need a tags relation first.

   "Editor's Picks" is derived, not flagged: it is the newest week's curation,
   which is what "이번주 꼭 봐야 할 이슈" describes. A real pick flag on the
   Notion DB would replace `thisWeek` below and nothing else. */

const RAIL_SIZE = 4; // stories in The Latest, beside the hero
const PICK_SIZE = 6; // cards in Editor's Picks — two rows of three
const TOPIC_CHIPS = 8; // topics shown before 더보기
const TOPIC_SIZE = 9; // three rows of three, then out to the archive

/* Chip tints, picked by a hash of the topic so a category keeps its colour
   across sections and reorderings without anyone maintaining a mapping —
   these come from Notion and change without a deploy. */
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

const tintOf = (topic: string) => TINTS[hash(topic) % TINTS.length];
const accentOf = (topic: string) => ACCENTS[hash(topic) % ACCENTS.length];

/* "2026-08-11" → "08.11". The year is carried by the section, not the row. */
const monthDay = (iso: string) => iso.slice(5).replace("-", ".");

function TopicChip({ topic }: { topic: string }) {
  return (
    <span
      className={`font-body rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${tintOf(topic)}`}
    >
      {topic}
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
    const key = weekOf(feed[0].date).key;
    const week = rest.filter((n) => weekOf(n.date).key === key);
    /* Prefer this week, but a quiet week must not blank a whole band of the
       page — under three left and older items backfill, still newest first. */
    return (week.length >= 3 ? week : rest).slice(0, PICK_SIZE);
  }, [feed, hero, rail]);

  /* Counts drive the chip order, so the topics someone actually curates rise
     to the front on their own. */
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of feed) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  }, [feed]);

  const [topic, setTopic] = useState<string | null>(null);
  const [allTopics, setAllTopics] = useState(false);
  const shownTopics = allTopics ? topics : topics.slice(0, TOPIC_CHIPS);
  const byTopic = topic ? feed.filter((n) => n.category === topic) : feed;

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
            <CoverArt
              accent={accentOf(hero.category)}
              tag={hero.category}
              large
              className="aspect-[16/9] w-full"
            />
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <h3 className="font-heading text-2xl leading-[1.15] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-3xl">
                {hero.title}
              </h3>
              {hero.summary && (
                <p className="font-body mt-4 line-clamp-2 text-sm leading-relaxed font-light break-keep text-slate-400">
                  {hero.summary}
                </p>
              )}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <Byline item={hero} />
                <TopicChip topic={hero.category} />
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
                      {item.category}
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
                    {item.summary}
                  </p>
                )}
                {/* mt-auto pins the footer to the card floor, so a short title
                    and a long one still line their bylines up across a row */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
                  <Byline item={item} />
                  <TopicChip topic={item.category} />
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
              <CoverArt
                accent={accentOf(item.category)}
                tag={item.category}
                className="aspect-[16/9] w-full"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-body text-base leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                  {item.title}
                </h3>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                  <Byline item={item} />
                  <TopicChip topic={item.category} />
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
