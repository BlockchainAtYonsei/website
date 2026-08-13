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
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
        <div>
          <h1 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            News Tracking
          </h1>
          <p className="font-body mt-3 max-w-xl text-sm leading-relaxed font-light break-keep text-slate-400">
            시장에서 골라 온 소식에 큐레이터의 한 줄을 얹습니다. 제목을 누르면
            원문으로 이동합니다.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
          {items.length} stories
        </p>
      </div>

      <NewsHome items={items} />
    </main>
  );
}
