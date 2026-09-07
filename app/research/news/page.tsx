import type { Metadata } from "next";
import NewsHome from "@/components/research/news-home";
import { getAllNews } from "@/lib/news";

export const metadata: Metadata = {
  title: "News Tracking",
  description: "BAY가 고른 블록체인 뉴스와 큐레이터의 코멘트.",
};

export default async function NewsPage() {
  /* The whole feed, not the first page: 주제별's chip counts state how much
     sits behind 전체 보기, and a count taken from a 50-item slice would
     promise less than the archive holds. */
  const items = await getAllNews();

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <NewsHome items={items} />
    </main>
  );
}
