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
  url: string; // the original story
  sourceName: string;
  summary: string;
  category: string;
  date: string; // ISO — the story's original publication date
  views: number;
  curator: { slug: string; name: string; avatarUrl: string | null } | null;
};

export type NewsDetail = NewsItem & {
  body: Block[]; // [] = link-only item
  latest: NewsItem[]; // sidebar rail: newest overall
  related: NewsItem[]; // sidebar rail: same category
};

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
