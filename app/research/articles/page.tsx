import type { Metadata } from "next";
import ArticleGrid from "@/components/research/article-grid";
import { FeaturedCard } from "@/components/research/article-card";
import { getArticlesPage, getFeatured, getTags } from "@/lib/research";

export const metadata: Metadata = {
  title: "All Research",
  description:
    "프로토콜, ZK, DeFi, 거버넌스에 대한 구조적 분석 — BAY 리서치 아카이브.",
};

/* The Research tab: the archive and nothing else. Cross-promotion (news
   teaser, Medium band) lives on the home page now — this surface's one job
   is to hold every piece and let a tag narrow it.

   ?category= lands here pre-filtered: the home's topic chips are entry points
   into the archive, so the narrowing has to survive the trip. An unknown
   value renders an empty grid rather than 404 — a tag can be retired in
   Notion while a link to it is still in someone's history. */
export default async function ResearchArchive(
  props: PageProps<"/research/articles">,
) {
  const raw = (await props.searchParams).category;
  const category = Array.isArray(raw) ? raw[0] : raw;
  const [featured, firstPage, tags] = await Promise.all([
    getFeatured(),
    getArticlesPage(1, undefined, category),
    getTags(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
        <h1 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
          최신 리서치
        </h1>
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
          {firstPage.total} pieces
        </p>
      </div>

      {/* Featured — absent until the first piece is published */}
      {featured && (
        <div className="mb-14 md:mb-16">
          <FeaturedCard article={featured} />
        </div>
      )}

      {/* the featured piece repeats in the grid on purpose — otherwise
          filtering by its tag silently hides it and the count above stops
          matching */}
      <ArticleGrid
        initial={firstPage}
        tags={tags}
        initialCategory={category ?? "All"}
      />
    </main>
  );
}
