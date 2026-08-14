import type {
  ArticleModel as Article,
  MemberModel as Member,
  NewsItemModel as NewsItem,
} from "../generated/prisma/models";

/* Response shaping — field names match the frontend's types (lib/authors.ts
   Author, lib/research.ts Article) so migration is a data-source swap, not a
   refactor. `tag`/`date`/`author` are the frontend's names; the structured
   fields ride along for the redesign to use. */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* "리서치팀"+"팀장" → "리서치팀장 · 17기", "홍보팀"+"부장" → "홍보부장 · 17기",
   부원 → "리서치팀 · 18기". Convenience only — the structured fields are the
   source of truth and the frontend may format its own. */
export function roleOf(m: Pick<Member, "team" | "position" | "cohort">): string {
  const base =
    m.position === "부원" || !m.team
      ? m.team || m.position
      : `${m.team.replace(/팀$/, "")}${m.position}`;
  return `${base} · ${m.cohort}기`;
}

export function toAuthor(m: Member) {
  return {
    slug: m.slug,
    name: m.name,
    cohort: m.cohort,
    team: m.team,
    position: m.position,
    role: roleOf(m),
    bio: m.bio,
    avatarUrl: m.avatarUrl,
    socials: m.socials,
    status: m.status,
  };
}

export function toByline(m: Member) {
  return { slug: m.slug, name: m.name, avatarUrl: m.avatarUrl };
}

type ArticleWithAuthors = Article & { authors: { member: Member }[] };

export function toArticleListItem(a: ArticleWithAuthors) {
  const authors = a.authors.map(({ member }) => toByline(member));
  return {
    slug: a.slug,
    title: a.title,
    dek: a.dek,
    tag: a.category,
    accent: a.accent,
    date: a.publishedAt ? isoDate(a.publishedAt) : null,
    featured: a.featured,
    readingMinutes: a.readingMinutes,
    views: a.views,
    coverUrl: a.coverUrl,
    author: authors[0]?.slug ?? null,
    authors,
  };
}

export function toArticleDetail(a: ArticleWithAuthors) {
  return {
    ...toArticleListItem(a),
    body: a.body,
    mediumUrl: a.mediumUrl,
  };
}

export const ARTICLE_INCLUDE = {
  authors: { include: { member: true }, orderBy: { ord: "asc" as const } },
};


/* The first image in a body, surfaced so list cards can show the story's
   real picture instead of generated cover art. Null when the write-up has
   none — the card falls back to the cover art it always had. */
function firstImageUrl(body: unknown): string | null {
  if (!Array.isArray(body)) return null;
  for (const b of body as { t?: string; url?: string }[]) {
    if (b?.t === "image" && typeof b.url === "string") return b.url;
  }
  return null;
}

/* Shared by the news endpoints and the member profile's 뉴스 tab. */
export function toNewsItem(n: NewsItem & { curator: Member | null }) {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    url: n.url,
    sourceName: n.sourceName,
    summary: n.summary,
    categories: n.categories,
    pick: n.pick,
    /* the curator's own picture beats the publisher's og:image; null means
       the card falls back to generated cover art */
    imageUrl: firstImageUrl(n.body) ?? n.coverUrl,
    date: isoDate(n.publishedAt),
    curator: n.curator
      ? { slug: n.curator.slug, name: n.curator.name, avatarUrl: n.curator.avatarUrl }
      : null,
  };
}
