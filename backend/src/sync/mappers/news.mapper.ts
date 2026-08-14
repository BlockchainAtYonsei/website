import type { PageObjectResponse } from "@notionhq/client";
import {
  checkboxOf,
  dateOf,
  linkOf,
  multiSelectOf,
  namesOf,
  richTextOf,
  selectOf,
} from "../../notion/properties";
import { CONTENT_STATUS_MAP, NEWS_PROPS as P, SLUG_RE } from "../../notion/schema";

export type NewsData = {
  slug: string;
  title: string;
  /* Absent on a quarter of the published items — the write-up is the piece
     and the link is a courtesy, so it cannot be a reason to drop a story. */
  url?: string;
  pick: boolean;
  sourceName: string;
  summary: string;
  categories: string[];
  publishedAt: string; // ISO date
  status: "draft" | "published" | "archived";
  /* Written by hand in Notion, resolved against the member roster in the
     syncer — the roster lives in this database, so there is no relation to
     follow. */
  curatorName?: string;
};

export type NewsMapResult = { data?: NewsData; warnings: string[] };

export function pageToNews(page: PageObjectResponse): NewsMapResult {
  const warnings: string[] = [];
  const title = richTextOf(page, P.title);
  const rawStatus = namesOf(page, P.status)[0] ?? selectOf(page, P.status);

  /* Their board keeps a run of untouched rows at the bottom as next week's
     slots. Empty title AND empty status is one of those — skipping it is
     routine, so it must not file a warning each time or the sync report
     becomes 26 lines of noise nobody reads. */
  if (!title && !rawStatus) return { warnings };

  const label = title ?? page.id;
  if (!title) {
    warnings.push(`news ${label}: "${P.title}" is empty — skipped`);
    return { warnings };
  }

  /* Source is a hyperlink whose visible text is the headline, so the value is
     the href rather than the text. A row with neither is fine: the write-up is
     the piece and the original is a courtesy. */
  const rawUrl = linkOf(page, P.url);
  let url: string | undefined;
  let host: string | undefined;
  try {
    if (rawUrl) {
      host = new URL(rawUrl).hostname.replace(/^www\./, "");
      url = rawUrl;
    }
  } catch {
    warnings.push(
      `news ${label}: "${P.url}" is not a URL ("${rawUrl?.slice(0, 40)}") — kept without a link`,
    );
  }

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

  /* Deduped: a multi-select cannot hold the same option twice, but nothing
     downstream should depend on that — the same tag rendered twice on a card
     is a visible defect and a duplicate React key at once. */
  const topics = [
    ...new Set(
      multiSelectOf(page, P.category) ??
        (selectOf(page, P.category) ? [selectOf(page, P.category)!] : []),
    ),
  ];

  return {
    data: {
      slug,
      title,
      url,
      /* No 출처 column exists; the host stands in for it, and an item with no
         link has no source to name — the byline carries the attribution. */
      sourceName: selectOf(page, P.source) ?? richTextOf(page, P.source) ?? host ?? "",
      summary,
      /* Kept in the curator's tagging order: the first is what a cramped
         surface shows, so it should be the one they reached for first. An
         untagged story still needs a bucket to be findable under. */
      categories: topics.length > 0 ? topics : ["기타"],
      publishedAt: publishedAt.slice(0, 10),
      status,
      pick: checkboxOf(page, P.pick) ?? false,
      curatorName: namesOf(page, P.curator)[0],
    },
    warnings,
  };
}
