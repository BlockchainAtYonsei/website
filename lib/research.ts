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
  | { t: "image"; url: string; caption?: string }
  /* a display line the author set apart from the prose — a diagram, a
     structure sketch, actual code. Rendered verbatim, newlines and all. */
  | { t: "code"; text: string; lang?: string }
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
  views: number;
  coverUrl: string | null;
  /* first author's slug — kept for old call sites; `authors` is the truth */
  author: string | null;
  authors: Byline[];
};

export type ArticlePage = {
  items: Article[];
  total: number;
  page: number;
  size: number;
};

export type ArticleDetail = Article & {
  body: Block[];
  mediumUrl: string | null;
  /* same tag first, then most recent — computed API-side */
  related: Article[];
};

const TAGS = ["articles"];

export const ARCHIVE_PAGE_SIZE = 12;

export async function getArticlesPage(
  page: number,
  size = ARCHIVE_PAGE_SIZE,
  category?: string,
): Promise<ArticlePage> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (category) q.set("category", category);
  const res = await api<ArticlePage>(`/v1/articles?${q}`, TAGS);
  return res ?? { items: [], total: 0, page, size };
}

/* Every published article, paging through the API's 50-per-page cap —
   build-time only (generateStaticParams); pages render from getArticlesPage. */
export async function getAllArticles(): Promise<Article[]> {
  const all: Article[] = [];
  for (let page = 1; ; page++) {
    const res = await getArticlesPage(page, 50);
    all.push(...res.items);
    if (all.length >= res.total || res.items.length === 0) return all;
  }
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
