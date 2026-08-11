import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@/components/icons";
import ArticleBody from "@/components/research/article-body";
import ArticleCard, { TagChip } from "@/components/research/article-card";
import Avatar from "@/components/research/avatar";
import CoverArt from "@/components/research/cover-art";
import Toc from "@/components/research/toc";
import ViewPing from "@/components/research/view-ping";
import { formatDate, getAllArticles, getArticle, getToc } from "@/lib/research";

/* Prerender what the API knows at build time; anything newer renders on
   first request. An unreachable API degrades to an empty list instead of a
   failed build — the pages still work once it's back. */
export async function generateStaticParams() {
  try {
    return (await getAllArticles()).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/research/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.dek,
    openGraph: {
      title: `${article.title} — BAY Research`,
      description: article.dek,
      type: "article",
      locale: "ko_KR",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage(props: PageProps<"/research/[slug]">) {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const toc = getToc(article.body);
  const related = article.related;

  return (
    <main>
      <ViewPing kind="articles" slug={slug} />
      {/* Article head */}
      <article>
        <header className="mx-auto max-w-6xl px-6 pt-14 md:pt-20">
          <Link
            href="/research"
            className="font-mono inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-300"
          >
            <span aria-hidden>←</span> All research
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <TagChip label={article.tag} />
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
              {formatDate(article.date)}
            </span>
          </div>

          <h1 className="font-heading mt-6 max-w-4xl text-4xl leading-[1.1] tracking-[-2px] break-keep text-white md:text-6xl lg:text-[4.25rem]">
            {article.title}
          </h1>
          <p className="font-body mt-7 max-w-2xl text-lg leading-relaxed font-light break-keep text-slate-400">
            {article.dek}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/8 pt-7">
            {article.authors.map((a) => (
              <Link
                key={a.slug}
                href={`/research/author/${a.slug}`}
                className="group inline-flex items-center gap-3"
              >
                <Avatar name={a.name} src={a.avatarUrl} className="h-9 w-9 text-sm" />
                <span className="font-body text-sm text-white transition-colors group-hover:text-bay-100">
                  {a.name}
                </span>
              </Link>
            ))}
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
              {article.readingMinutes} min read
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6">
          <CoverArt
            accent={article.accent}
            tag={article.tag}
            large
            className="mt-12 aspect-[21/9] w-full rounded-[1.5rem] md:mt-14"
          />
        </div>

        {/* Body + contents rail */}
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-16 md:pb-32">
          <div className="grid grid-cols-1 gap-x-16 lg:grid-cols-[minmax(0,1fr)_220px]">
            <ArticleBody blocks={article.body} />
            {/* contents rail is navigation, not content — below lg there is no
                room for it beside the text and stacking it just pushes the
                article down, so it is dropped rather than collapsed */}
            <aside className="hidden lg:block">
              <Toc entries={toc} />
            </aside>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-white/8">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
                Keep reading
              </h2>
              <Link
                href="/research"
                className="font-body inline-flex items-center gap-1.5 text-xs font-light text-slate-400 transition-colors hover:text-bay-300"
              >
                전체 리서치
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
