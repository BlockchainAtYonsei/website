/* Author layer — an API client over the members roster (backend/, synced from
   the Notion Members DB). The Authors directory asks for writers only; the
   full roster stays the organization page's business. */

import { api } from "./api";
import type { NewsItem } from "./news";
import type { Article } from "./research";

/* Icon rendering happens in components (icons are React elements); data stays
   plain so this module can be imported anywhere. Labels outside this union
   would render without an icon, so unknown labels are filtered at the edge. */
export type SocialLabel =
  | "X"
  | "Telegram"
  | "LinkedIn"
  | "Medium"
  | "Instagram"
  | "GitHub"
  | "Website";

export type Social = { label: SocialLabel; href: string };

export type Author = {
  slug: string;
  name: string;
  cohort: number;
  team: string;
  position: string;
  /* composed by the API — "리서치팀장 · 17기" */
  role: string;
  bio: string;
  avatarUrl: string | null;
  socials: Social[];
  articleCount: number;
};

const KNOWN_LABELS = new Set<string>([
  "X",
  "Telegram",
  "LinkedIn",
  "Medium",
  "Instagram",
  "GitHub",
  "Website",
]);

type RawAuthor = Omit<Author, "socials"> & {
  socials: { label: string; href: string }[];
};

/* An unknown label from the API would crash the icon lookup — drop it and
   keep the rest of the profile rendering. */
function narrow<T extends RawAuthor>(raw: T): T & { socials: Social[] } {
  return {
    ...raw,
    socials: raw.socials.filter((s): s is Social => KNOWN_LABELS.has(s.label)),
  };
}

const TAGS = ["members"];

export async function getAuthors(): Promise<Author[]> {
  const res = await api<{ items: RawAuthor[] }>("/v1/members?writers=1", TAGS);
  return (res?.items ?? []).map(narrow);
}

/* The whole visible roster — the /organization chart's data source. Errors
   degrade to an empty list so the page renders its fallback note instead of
   failing the build when the backend is unreachable. */
export async function getRoster(): Promise<Author[]> {
  try {
    const res = await api<{ items: RawAuthor[] }>("/v1/members", TAGS);
    return (res?.items ?? []).map(narrow);
  } catch {
    return [];
  }
}

/* Detail resolves regardless of roster visibility, and ships both profile
   tabs — written research and curated news — in the same payload. */
export async function getAuthor(
  slug: string,
): Promise<(Author & { articles: Article[]; news: NewsItem[] }) | null> {
  const res = await api<RawAuthor & { articles: Article[]; news: NewsItem[] }>(
    `/v1/members/${encodeURIComponent(slug)}`,
    ["members", "articles", "news"],
  );
  return res ? narrow(res) : null;
}
