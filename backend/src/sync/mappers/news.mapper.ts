import type { PageObjectResponse } from "@notionhq/client";
import {
  dateOf,
  relationIdsOf,
  richTextOf,
  selectOf,
  titleOf,
  urlOf,
} from "../../notion/properties";
import { CONTENT_STATUS_MAP, NEWS_PROPS as P } from "../../notion/schema";

export type NewsData = {
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

  return {
    data: {
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
