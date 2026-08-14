/* Notion property names — the contract between the 운영진's databases and the
   sync mappers. Rename a property in Notion → change it here, one place.
   docs/backend-design.md §3 mirrors this table. */

export const ARTICLE_PROPS = {
  title: "제목", // title
  slug: "Slug", // rich_text — required, [a-z0-9-]
  dek: "Dek", // rich_text
  category: "카테고리", // select
  accent: "Accent", // select: blue | violet | teal | indigo (blank = derived)
  status: "상태", // select|status: 발행 | 초안 | 보관
  publishedAt: "발행일", // date
  featured: "Featured", // checkbox
  authors: "작성자", // relation → Members DB
  mediumUrl: "Medium URL", // url
  cover: "커버", // files (re-hosting deferred — design §3.4)
} as const;

/* Names as they actually read in the 리서치팀's Blockchain News Tracking DB.
   That database is the team's weekly working tool, so it sets the vocabulary
   and this file follows it — renaming their columns to suit the sync would
   break the views and templates ten people use every week. */
export const NEWS_PROPS = {
  /* rich_text, not title: the title property of that database is Insight,
     which is a scratch field the team leaves as "insight" more often than
     not. The headline lives in Title. */
  title: "Title", // rich_text
  slug: "Slug", // rich_text — optional; derived from the page id when absent
  url: "Source", // rich_text holding a URL — often empty, see the mapper
  source: "출처", // select|rich_text — no such column; the host is the fallback
  summary: "Content Summary", // rich_text — the curator's write-up
  category: "Topic", // multi_select
  publishedAt: "Date of issue", // date
  curator: "Author", // multi_select of names, matched against the roster
  status: "Status", // multi_select
  pick: "Pick", // checkbox — 이번 주 꼭 볼 것
  week: "Week", // rich_text "2026.08.09~2026.08.15" — unused; dates carry it
} as const;

/* Korean labels are canonical; English accepted so a DB built from Notion's
   default status options still syncs. */
export const CONTENT_STATUS_MAP: Record<string, "draft" | "published" | "archived"> = {
  발행: "published",
  published: "published",
  "홈페이지 게시": "published", // the news DB's own wording for "ship it"
  초안: "draft",
  draft: "draft",
  "작성 중": "draft",
  "In progress": "draft",
  "Not started": "draft",
  미완성: "draft",
  보관: "archived",
  archived: "archived",
};

export const ACCENTS = ["blue", "violet", "teal", "indigo"] as const;
export type AccentName = (typeof ACCENTS)[number];

/* Deterministic accent for articles that don't pick one — same category,
   same palette, so the archive grid stays visually grouped. */
export function accentForCategory(category: string): AccentName {
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
