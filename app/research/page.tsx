import { ArrowUpRight } from "@/components/icons";
import ArticleGrid from "@/components/research/article-grid";
import { FeaturedCard } from "@/components/research/article-card";
import { getArticles, getFeatured, TAGS } from "@/lib/research";

export default function ResearchIndex() {
  const featured = getFeatured();
  const all = getArticles();

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

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
        <FeaturedCard article={featured} />
      </section>

      {/* Archive */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            All research
          </h2>
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {all.length} pieces
          </p>
        </div>
        {/* the featured piece repeats here on purpose — otherwise filtering by
            its tag silently hides it and the count above stops matching */}
        <ArticleGrid articles={all} tags={TAGS} />
      </section>

      {/* Subscribe */}
      <section className="relative overflow-hidden pb-28 md:pb-36">
        <div className="mx-auto max-w-6xl px-6">
          <div className="liquid-glass flex flex-col items-start justify-between gap-8 rounded-[1.5rem] px-8 py-12 md:flex-row md:items-center md:px-12">
            <div>
              <h2 className="font-heading text-3xl tracking-[-1px] break-keep text-white md:text-4xl">
                새 리서치를 먼저 받아보세요
              </h2>
              <p className="font-body mt-3 max-w-md text-sm leading-relaxed font-light break-keep text-slate-400">
                모든 글은 Medium에도 함께 발행됩니다. 팔로우하면 새 글이 올라올
                때 알림을 받습니다.
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
