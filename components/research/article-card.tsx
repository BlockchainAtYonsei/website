import Link from "next/link";
import CoverArt from "./cover-art";
import { authorName } from "@/lib/authors";
import { formatDate, readingMinutes, type Article } from "@/lib/research";

export function ArticleMeta({
  article,
  className = "",
}: {
  article: Article;
  className?: string;
}) {
  return (
    <div
      className={`font-mono flex items-center gap-3 text-[10px] tracking-[0.18em] text-bay-300/70 uppercase ${className}`}
    >
      <span>{formatDate(article.date)}</span>
      <span className="h-px w-4 bg-bay-300/30" />
      <span>{readingMinutes(article)} min read</span>
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
      className="group liquid-glass grid grid-cols-1 overflow-hidden rounded-[1.5rem] transition-transform duration-300 hover:scale-[1.006] md:grid-cols-2"
    >
      <CoverArt
        accent={article.accent}
        tag={article.tag}
        large
        className="aspect-[16/10] w-full md:aspect-auto md:h-full md:min-h-[340px]"
      />
      <div className="flex flex-col justify-between gap-8 p-7 md:p-10">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <TagChip label={article.tag} />
            <span className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
              Featured
            </span>
          </div>
          {/* h3, not h2 — the index labels this card with a "최신 리서치" h2, so
              the article title nests under it the same way grid cards nest
              under "All research" */}
          <h3 className="font-heading text-3xl leading-[1.12] tracking-[-1px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-4xl lg:text-5xl">
            {article.title}
          </h3>
          <p className="font-body mt-5 max-w-xl leading-relaxed font-light break-keep text-slate-400">
            {article.dek}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ArticleMeta article={article} />
          {/* plain text, not a link — the whole card is already an anchor and
              anchors don't nest; the byline links live on the article page */}
          <span className="font-body text-xs font-light text-slate-500">
            {authorName(article.author)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className="group liquid-glass flex h-full flex-col overflow-hidden rounded-[1.25rem] transition-transform duration-300 hover:scale-[1.015]"
    >
      <CoverArt
        accent={article.accent}
        tag={article.tag}
        className="aspect-[16/9] w-full"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <TagChip label={article.tag} />
        </div>
        <h3 className="font-heading text-2xl leading-[1.1] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-[1.75rem]">
          {article.title}
        </h3>
        <p className="font-body mt-3 line-clamp-3 text-sm leading-relaxed font-light break-keep text-slate-400">
          {article.dek}
        </p>
        <ArticleMeta article={article} className="mt-6 pt-1" />
      </div>
    </Link>
  );
}
