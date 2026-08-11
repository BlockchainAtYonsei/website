import type { PageObjectResponse } from "@notionhq/client";
import {
  dateOf,
  relationIdsOf,
  richTextOf,
  selectOf,
  titleOf,
  urlOf,
} from "../../notion/properties";
import { CONTENT_STATUS_MAP, NEWS_PROPS as P, SLUG_RE } from "../../notion/schema";

export type NewsData = {
  slug: string;
  title: string;
  url: string;
  sourceName: string;
  summary: string;
  category: string;
  publishedAt: string; // ISO date
  status: "draft" | "published" | "archived";
  curatorPageId?: string;
};

export type NewsMapResult = { data?: NewsData; warnings: string[] };

export function pageToNews(page: PageObjectResponse): NewsMapResult {
  const warnings: string[] = [];
  const title = titleOf(page, P.title);
  const url = urlOf(page, P.url);

  const label = title ?? page.id;
  if (!title) warnings.push(`news ${label}: "${P.title}" is empty — skipped`);
  let host: string | undefined;
  try {
    host = url ? new URL(url).hostname.replace(/^www\./, "") : undefined;
  } catch {
    /* fall through to the warning below */
  }
  if (!url || !host) warnings.push(`news ${label}: "${P.url}" missing or invalid — skipped`);
  if (!title || !url || !host) return { warnings };

  const rawStatus = selectOf(page, P.status);
  const status = (rawStatus && CONTENT_STATUS_MAP[rawStatus]) || "draft";
  if (rawStatus && !CONTENT_STATUS_MAP[rawStatus]) {
    warnings.push(`news ${label}: unknown "${P.status}" value "${rawStatus}", kept as draft`);
  }

  const summary = richTextOf(page, P.summary) ?? "";
  if (!summary && status === "published") {
    warnings.push(`news ${label}: "${P.summary}" is empty — the curator's take is the point`);
  }

  let publishedAt = dateOf(page, P.publishedAt);
  if (!publishedAt) {
    publishedAt = page.created_time.slice(0, 10);
    if (status === "published") {
      warnings.push(`news ${label}: "${P.publishedAt}" is empty, using curation date`);
    }
  }

  /* News ships weekly in batches — hand-written slugs would be pure friction,
     so a missing/invalid Slug property falls back to the page id (stable,
     unique, just not pretty). */
  const rawSlug = richTextOf(page, P.slug)?.toLowerCase();
  const slug =
    rawSlug && SLUG_RE.test(rawSlug)
      ? rawSlug
      : page.id.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (rawSlug && slug !== rawSlug) {
    warnings.push(`news ${label}: "${P.slug}" not [a-z0-9-], using page id instead`);
  }

  return {
    data: {
      slug,
      title,
      url,
      /* 출처 may be a select or plain text; falls back to the URL's host so a
         missing property degrades to something true rather than blank */
      sourceName: selectOf(page, P.source) ?? richTextOf(page, P.source) ?? host,
      summary,
      category: selectOf(page, P.category) ?? "General",
      publishedAt: publishedAt.slice(0, 10),
      status,
      curatorPageId: relationIdsOf(page, P.curator)?.[0],
    },
    warnings,
  };
}
