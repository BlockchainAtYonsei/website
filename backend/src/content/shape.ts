import type {
  ArticleModel as Article,
  MemberModel as Member,
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
