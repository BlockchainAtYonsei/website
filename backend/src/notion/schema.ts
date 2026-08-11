/* Notion property names — the contract between the 운영진's databases and the
   sync mappers. Rename a property in Notion → change it here, one place.
   docs/backend-design.md §3 mirrors this table. */

export const MEMBER_PROPS = {
  name: "이름", // title
  slug: "Slug", // rich_text — required, [a-z0-9-]
  cohort: "기수", // number
  team: "팀", // select
  position: "직책", // select
  bio: "소개", // rich_text
  status: "상태", // select|status: 활동 | 알럼나이
  visible: "사이트 노출", // checkbox
  avatar: "프로필 사진", // files
} as const;

/* url property per social — only filled ones land in the socials array.
   Labels match the frontend's SocialLabel union. */
export const MEMBER_SOCIAL_PROPS = [
  "X",
  "Telegram",
  "LinkedIn",
  "Medium",
  "Instagram",
  "GitHub",
  "Website",
] as const;

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

export const NEWS_PROPS = {
  title: "제목", // title
  url: "URL", // url — unique key
  source: "출처", // select|rich_text
  summary: "코멘트", // rich_text — the curator's one-liner
  category: "카테고리", // select
  publishedAt: "원문 발행일", // date
  curator: "큐레이터", // relation → Members DB
  status: "상태", // select|status: 발행 | 초안 | 보관
} as const;

/* Korean labels are canonical; English accepted so a DB built from Notion's
   default status options still syncs. */
export const CONTENT_STATUS_MAP: Record<string, "draft" | "published" | "archived"> = {
  발행: "published",
  published: "published",
  초안: "draft",
  draft: "draft",
  보관: "archived",
  archived: "archived",
};

export const MEMBER_STATUS_MAP: Record<string, "active" | "alumni"> = {
  활동: "active",
  active: "active",
  알럼나이: "alumni",
  알럼: "alumni",
  alumni: "alumni",
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
