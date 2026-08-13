import type { Metadata } from "next";
import Link from "next/link";
import NewsFeed from "@/components/research/news-feed";
import { getAllNews } from "@/lib/news";

/* The whole feed, where the landing page only ranks its front. Grouped by
   curation week rather than sectioned by interest: someone who followed 전체
   보기 out of "The Latest" is asking what has been covered, and the answer to
   that reads best in the order it happened.

   A static segment beats /research/news/[slug], so an item slugged "archive"
   would be unreachable here. Nothing generates that slug — Notion slugs come
   from the title — but it is the one collision to know about. */

export const metadata: Metadata = {
  title: "전체 뉴스트래킹",
  description: "BAY가 큐레이션한 블록체인 소식 전체를, 주차별로.",
};

export default async function NewsArchivePage(
  props: PageProps<"/research/news/archive">,
) {
  const [items, params] = await Promise.all([getAllNews(), props.searchParams]);
  const topic = typeof params.topic === "string" ? params.topic : undefined;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <Link
        href="/research/news"
        className="font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-200"
      >
        ← News Tracking
      </Link>

      <div className="mt-5 mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
        <div>
          <h1 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            전체 뉴스트래킹
          </h1>
          <p className="font-body mt-3 max-w-xl text-sm leading-relaxed font-light break-keep text-slate-400">
            지금까지 큐레이션한 소식을 주차별로 모았습니다.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase">
          {items.length} stories
        </p>
      </div>

      <NewsFeed items={items} initialTag={topic} />
    </main>
  );
}
