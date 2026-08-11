/* News-tracking layer — curated stories from the Notion News DB, served by
   backend/. Each item is an external link plus the curator's one-line take;
   that comment is the product, the link is just provenance. */

import { api } from "./api";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  summary: string;
  category: string;
  date: string; // ISO — the story's original publication date
  curator: { slug: string; name: string } | null;
};

/* First 50 is months of curation at club cadence; the API's cursor
   pagination is there when the feed outgrows a single fetch. */
export async function getNews(): Promise<NewsItem[]> {
  const res = await api<{ items: NewsItem[]; nextCursor: string | null }>(
    "/v1/news?size=50",
    ["news"],
  );
  return res?.items ?? [];
}
