import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import ArticleGrid from "@/components/research/article-grid";
import { FeaturedCard } from "@/components/research/article-card";
import { getNews } from "@/lib/news";
import {
  formatDate,
  getArticlesPage,
  getFeatured,
  getTags,
} from "@/lib/research";

export default async function ResearchIndex() {
  const [featured, firstPage, tags, news] = await Promise.all([
    getFeatured(),
    getArticlesPage(1),
    getTags(),
    getNews(),
  ]);
  const latestNews = news.slice(0, 3);

  return (
    <main>
      {/* Masthead */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[420px]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 40%, rgba(47,107,255,0.20) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-20 md:pb-16">
          {/* the masthead wordmark is the title — an h1 here would just say it
              twice, so the page heading exists for screen readers only and the
              section heading below labels the featured piece */}
          <h1 className="sr-only">BAY Research</h1>
          <h2 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            최신 리서치
          </h2>
        </div>
      </section>

      {/* Featured — absent until the first piece is published */}
      {featured && (
        <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
          <FeaturedCard article={featured} />
        </section>
      )}

      {/* Archive */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            All research
          </h2>
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {firstPage.total} pieces
          </p>
        </div>
        {/* the featured piece repeats here on purpose — otherwise filtering by
            its tag silently hides it and the count above stops matching */}
        <ArticleGrid initial={firstPage} tags={tags} />
      </section>

      {/* News teaser — the tracking feed lives at /research/news; three rows
          here keep the index the one place that shows everything we publish */}
      {latestNews.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
              News
            </h2>
            <Link
              href="/research/news"
              className="font-body inline-flex items-center gap-1.5 text-xs font-light text-slate-400 transition-colors hover:text-bay-300"
            >
              전체 뉴스
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-6">
            {latestNews.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/research/news/${item.slug}`}
                  className="group flex flex-col gap-1.5 border-b border-white/6 py-5 md:flex-row md:items-baseline md:gap-6"
                >
                  <span className="font-mono flex shrink-0 items-center gap-3 text-[10px] tracking-[0.18em] text-white/40 uppercase md:w-48">
                    {formatDate(item.date)}
                    <span className="text-bay-300/70">{item.sourceName}</span>
                  </span>
                  <span className="font-body text-base font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Subscribe */}
      <section className="relative overflow-hidden pb-28 md:pb-36">
        <div className="mx-auto max-w-6xl px-6">
          <div className="liquid-glass flex flex-col items-start justify-between gap-8 rounded-[1.5rem] px-8 py-12 md:flex-row md:items-center md:px-12">
            <div>
              <h2 className="font-heading text-3xl tracking-[-1px] break-keep text-white md:text-4xl">
                새 리서치를 먼저 받아보세요
              </h2>
              <p className="font-body mt-3 text-sm leading-relaxed font-light break-keep md:whitespace-nowrap text-slate-400">
                모든 글은 Medium에도 발행되니 팔로우하셔서 새 글이 올라올 때 알림을 받으세요.
              </p>
            </div>
            <a
              href="https://medium.com/yonseiblockchainlab"
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-strong font-body inline-flex shrink-0 items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              Medium 팔로우
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
