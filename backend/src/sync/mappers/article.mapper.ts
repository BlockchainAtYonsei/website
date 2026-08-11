import type { PageObjectResponse } from "@notionhq/client";
import {
  checkboxOf,
  dateOf,
  relationIdsOf,
  richTextOf,
  selectOf,
  titleOf,
  urlOf,
} from "../../notion/properties";
import {
  ACCENTS,
  ARTICLE_PROPS as P,
  CONTENT_STATUS_MAP,
  SLUG_RE,
  accentForCategory,
  type AccentName,
} from "../../notion/schema";

export type ArticleMeta = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  accent: AccentName;
  status: "draft" | "published" | "archived";
  publishedAt: string; // ISO date
  featured: boolean;
  mediumUrl?: string;
  /* Notion page ids from the 작성자 relation — resolved to member rows by the
     syncer, which has DB access; the mapper stays pure. */
  authorPageIds: string[];
};

export type ArticleMapResult = { meta?: ArticleMeta; warnings: string[] };

export function pageToArticleMeta(page: PageObjectResponse): ArticleMapResult {
  const warnings: string[] = [];
  const title = titleOf(page, P.title);
  const slug = richTextOf(page, P.slug)?.toLowerCase();

  const label = title ?? page.id;
  if (!title) warnings.push(`article ${label}: "${P.title}" is empty — skipped`);
  if (!slug || !SLUG_RE.test(slug)) {
    warnings.push(`article ${label}: "${P.slug}" missing or not [a-z0-9-] — skipped`);
  }
  if (!title || !slug || !SLUG_RE.test(slug)) return { warnings };

  const rawStatus = selectOf(page, P.status);
  const status = (rawStatus && CONTENT_STATUS_MAP[rawStatus]) || "draft";
  if (rawStatus && !CONTENT_STATUS_MAP[rawStatus]) {
    warnings.push(`article ${slug}: unknown "${P.status}" value "${rawStatus}", kept as draft`);
  }

  const category = selectOf(page, P.category) ?? "Research";
  if (!selectOf(page, P.category)) {
    warnings.push(`article ${slug}: "${P.category}" is empty, using "Research"`);
  }

  const rawAccent = selectOf(page, P.accent);
  const accent = (ACCENTS as readonly string[]).includes(rawAccent ?? "")
    ? (rawAccent as AccentName)
    : accentForCategory(category);
  if (rawAccent && accent !== rawAccent) {
    warnings.push(`article ${slug}: unknown "${P.accent}" value "${rawAccent}", derived instead`);
  }

  let publishedAt = dateOf(page, P.publishedAt);
  if (!publishedAt) {
    publishedAt = page.created_time.slice(0, 10);
    if (status === "published") {
      warnings.push(`article ${slug}: "${P.publishedAt}" is empty, using page creation date`);
    }
  }

  const authorPageIds = relationIdsOf(page, P.authors) ?? [];
  if (authorPageIds.length === 0) {
    warnings.push(`article ${slug}: "${P.authors}" relation is empty — skipped`);
    return { warnings };
  }

  const dek = richTextOf(page, P.dek) ?? "";
  if (!dek) warnings.push(`article ${slug}: "${P.dek}" is empty`);

  return {
    meta: {
      slug,
      title,
      dek,
      category,
      accent,
      status,
      publishedAt: publishedAt.slice(0, 10),
      featured: checkboxOf(page, P.featured) ?? false,
      mediumUrl: urlOf(page, P.mediumUrl),
      authorPageIds,
    },
    warnings,
  };
}
