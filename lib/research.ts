/* Research content layer — an API client since the backend landed. Articles
   are authored in Notion, synced into Postgres, and served by backend/; the
   `Block` union below is the body contract shared with the sync's
   block-mapper, so a change here must land there too. */

import { api } from "./api";

export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string; cite?: string }
  | { t: "callout"; title?: string; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "divider" };

/* cover art palettes — pulled from the hero's atmosphere gradient so research
   pages read as the same site, not a bolted-on blog */
export type Accent = "blue" | "violet" | "teal" | "indigo";

export type Byline = { slug: string; name: string; avatarUrl: string | null };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  tag: string;
  accent: Accent;
  date: string; // ISO
  featured: boolean;
  readingMinutes: number; // precomputed by the API (500 chars/min)
  coverUrl: string | null;
  /* first author's slug — kept for old call sites; `authors` is the truth */
  author: string | null;
  authors: Byline[];
};

export type ArticleDetail = Article & {
  body: Block[];
  mediumUrl: string | null;
  /* same tag first, then most recent — computed API-side */
  related: Article[];
};

const TAGS = ["articles"];

/* size 50: the archive fits one page for now; the API paginates when the
   archive outgrows it. */
export async function getArticles(): Promise<Article[]> {
  const res = await api<{ items: Article[] }>("/v1/articles?size=50", TAGS);
  return res?.items ?? [];
}

/* null when nothing is published yet — the index hides the featured slot. */
export function getFeatured(): Promise<Article | null> {
  return api<Article>("/v1/articles/featured", TAGS);
}

export function getArticle(slug: string): Promise<ArticleDetail | null> {
  return api<ArticleDetail>(`/v1/articles/${encodeURIComponent(slug)}`, TAGS);
}

/* Filter chips — "All" first, then categories by usage (API ordering). */
export async function getTags(): Promise<string[]> {
  const res = await api<{ items: string[] }>("/v1/articles/categories", TAGS);
  return ["All", ...(res?.items ?? [])];
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

/* Headings become TOC anchors. Korean is valid in an id and in a URL fragment,
   so keep it rather than dropping to an opaque index. */
export function headingId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug ? `${slug}-${index}` : `section-${index}`;
}

export type TocEntry = { id: string; text: string; level: 2 | 3 };

export function getToc(body: Block[]): TocEntry[] {
  return body.flatMap((b, i) =>
    b.t === "h2" || b.t === "h3"
      ? [{ id: headingId(b.text, i), text: b.text, level: b.t === "h2" ? 2 : 3 } as const]
      : [],
  );
}
