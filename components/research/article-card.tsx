import Link from "next/link";
import ArticleThumb from "./article-thumb";
import { formatDate, type Article } from "@/lib/research";

/* The card's bottom line, identical on every card: date bottom-left,
   reading time bottom-right. Callers pin it with mt-auto so short and long
   deks land the meta on the same y across a row. */
export function ArticleMeta({
  article,
  className = "",
}: {
  article: Article;
  className?: string;
}) {
  return (
    <div
      className={`font-mono flex items-center justify-between gap-3 text-[10px] tracking-[0.18em] text-bay-300/70 uppercase ${className}`}
    >
      <span>{formatDate(article.date)}</span>
      <span className="text-white/40">{article.readingMinutes} min read</span>
    </div>
  );
}

export function TagChip({ label }: { label: string }) {
  return (
    <span className="font-mono rounded-full border border-white/12 px-3 py-1 text-[10px] tracking-[0.18em] text-white/70 uppercase">
      {label}
    </span>
  );
}

export function FeaturedCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="group liquid-glass mx-auto block overflow-hidden rounded-[1.5rem] transition-transform duration-300 hover:scale-[1.006] md:w-[70%]"
    >
      {/* Image only, for now: the featured slot shows just the piece's cover.
          The card text lived here before, but the cover already carries the
          title and the tall two-column crop was distorting the picture.
          Capped at 70% width on desktop so the hero does not dominate. */}
      <ArticleThumb
        article={article}
        sizes="(min-width: 1200px) 773px, 100vw"
        large
        priority
        className="aspect-[16/10] w-full"
      />
    </Link>
  );
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="group liquid-glass flex h-full flex-col overflow-hidden rounded-[1.25rem] transition-transform duration-300 hover:scale-[1.015]"
    >
      <ArticleThumb
        article={article}
        sizes="(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw"
        className="aspect-[16/9] w-full"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <TagChip label={article.tag} />
        </div>
        <h3 className="font-heading text-2xl leading-[1.1] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-[1.75rem]">
          {article.title}
        </h3>
        <ArticleMeta article={article} className="mt-auto pt-6" />
      </div>
    </Link>
  );
}
