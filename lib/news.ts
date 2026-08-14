/* News-tracking layer — curated stories from the Notion News DB, served by
   backend/. Each item is a page of its own (요약/인사이트 authored in Notion,
   same Block[] contract as research) with the original story one 원문 button
   away. */

import { api } from "./api";
import type { Block } from "./research";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  /* The original story. Absent on a fifth of the feed — the curator's
     write-up is the piece and the link is a courtesy. */
  url: string | null;
  sourceName: string;
  summary: string;
  /* Notion's Topic is a multi-select — a story is 보안 and DeFi at once. In
     the curator's tagging order, so [0] is the one a cramped surface shows. */
  categories: string[];
  /* The 리서치팀's own "이번 주 꼭 볼 것" checkbox in Notion. */
  pick: boolean;
  /* First image out of the write-up's body — the card thumbnail. Null falls
     back to generated cover art. */
  imageUrl: string | null;
  /* The publisher's og:image, kept as the second try when imageUrl doesn't
     load: it lives on a different host, so the failure that takes one out
     rarely takes both. Equal to imageUrl when the write-up had no picture of
     its own, and null when the story has no crawlable original. */
  coverUrl: string | null;
  date: string; // ISO — the story's original publication date
  curator: { slug: string; name: string; avatarUrl: string | null } | null;
};

export type NewsDetail = NewsItem & {
  body: Block[]; // [] = link-only item
  latest: NewsItem[]; // sidebar rail: newest overall
  related: NewsItem[]; // sidebar rail: shares a topic
};


/* The summary is one Notion property the curator types the whole list into,
   and the DB holds two habits: a point per line, and "1. … 2. … 3. …" run
   together on a single line. Both are the same list, so both have to come
   back out as one — reading only the newlines left the second shape as a
   blob whose own numbering surfaced mid-sentence.

   `ordered` is what the curator numbered, kept rather than flattened to
   dots: the points are steps and cross-refer to each other by number. */
export type SummaryList = { ordered: boolean; items: string[] };

const MARKER = /^([•·▪‣\-–—]|\d+[.)])\s*/;

/* One line, cut at its own "1." "2." "3." markers. The run has to start at 1
   and count up, so a date ("2026. 8.") or a stray figure inside a point
   can't cut it in half; anything before the first marker stays as its own
   item rather than being dropped. */
function splitEnumerated(line: string): string[] {
  const cuts: number[] = [];
  let expected = 1;
  for (const m of line.matchAll(/(^|\s)(\d+)[.)]/g)) {
    if (Number(m[2]) !== expected) continue;
    cuts.push((m.index ?? 0) + m[1].length);
    expected++;
  }
  if (cuts.length < 2) return [line];
  const head = cuts[0] > 0 ? [line.slice(0, cuts[0])] : [];
  return [...head, ...cuts.map((c, i) => line.slice(c, cuts[i + 1]))];
}

export function summaryList(summary: string): SummaryList {
  const raw = summary
    .split(/\n+/)
    .flatMap(splitEnumerated)
    .map((l) => l.trim())
    .filter(Boolean);
  const ordered =
    raw.length > 1 && raw.every((l, i) => l.startsWith(`${i + 1}.`) || l.startsWith(`${i + 1})`));
  return {
    ordered,
    items: raw.map((l) => l.replace(MARKER, "").trim()).filter(Boolean),
  };
}

/* The summary as one clamp-friendly line for cards and rows. A card that
   clamps two lines must not spend them on "•" markers and hard breaks. The
   detail page keeps the full structure — this is for everywhere smaller. */
export function summaryPreview(summary: string): string {
  return summaryList(summary).items.join(" ");
}

const TAGS = ["news"];

/* First 50 is months of curation at club cadence; the API's cursor
   pagination is there when the feed outgrows a single fetch. */
export async function getNews(): Promise<NewsItem[]> {
  const res = await api<{ items: NewsItem[]; nextCursor: string | null }>(
    "/v1/news?size=50",
    TAGS,
  );
  return res?.items ?? [];
}

/* Every published item, walked through the API's cursor. The landing page is
   happy with the first 50 because it only ranks the front of the feed; the
   archive is the one surface whose job is to be complete, so it pages.
   The page cap is a runaway guard, not a limit anyone should hit — at club
   cadence it is decades of curation. */
export async function getAllNews(): Promise<NewsItem[]> {
  const all: NewsItem[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 40; page++) {
    const q = new URLSearchParams({ size: "50" });
    if (cursor) q.set("cursor", cursor);
    const res = await api<{ items: NewsItem[]; nextCursor: string | null }>(
      `/v1/news?${q}`,
      TAGS,
    );
    if (!res?.items.length) break;
    all.push(...res.items);
    if (!res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return all;
}

export function getNewsItem(slug: string): Promise<NewsDetail | null> {
  return api<NewsDetail>(`/v1/news/${encodeURIComponent(slug)}`, TAGS);
}

/* The club curates in weekly sessions, so news time is week time:
   Monday-anchored, labeled the way meetings are ("2026년 8월 1주차" = the week
   whose Monday is the month's first). A week straddling a month boundary
   belongs to its Monday's month — same as how the session would be named. */
export function weekOf(iso: string): { key: string; label: string; range: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
  const sunday = new Date(d);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const nth = Math.floor((d.getUTCDate() - 1) / 7) + 1;
  const dd = (x: Date) =>
    `${String(x.getUTCMonth() + 1).padStart(2, "0")}.${String(x.getUTCDate()).padStart(2, "0")}`;
  return {
    key: d.toISOString().slice(0, 10),
    label: `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${nth}주차`,
    range: `${dd(d)} – ${dd(sunday)}`,
  };
}
