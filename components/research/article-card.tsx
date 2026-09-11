import Link from "next/link";
import ArticleThumb from "./article-thumb";
import Avatar from "./avatar";
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
      className="group liquid-glass grid grid-cols-1 overflow-hidden rounded-[1.5rem] transition-transform duration-300 hover:scale-[1.006] md:grid-cols-[3fr_2fr]"
    >
      {/* The cover keeps its own aspect. It is never stretched to the text
          column's height, which is what used to crop it into a tall sliver;
          if the text ever runs taller than the picture, the picture centers
          instead of distorting. Cover 60 / text 40 keeps the image the lead. */}
      <ArticleThumb
        article={article}
        sizes="(min-width: 1200px) 660px, (min-width: 768px) 60vw, 100vw"
        large
        priority
        className="aspect-[16/10] w-full md:self-center"
      />
      <div className="flex flex-col justify-between gap-6 p-7 md:p-9">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <TagChip label={article.tag} />
            <span className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
              Featured
            </span>
          </div>
          {/* h3, not h2: the index labels this card with a "최신 리서치" h2, so
              the article title nests under it the same way grid cards nest
              under "All research" */}
          <h3 className="font-heading text-2xl leading-[1.15] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-3xl">
            {article.title}
          </h3>
          <p className="font-body mt-4 line-clamp-3 text-sm leading-relaxed font-light break-keep text-slate-400">
            {article.dek}
          </p>
        </div>
        <div>
          {/* plain text, not a link: the whole card is already an anchor and
              anchors don't nest; the byline links live on the article page */}
          <span className="flex items-center gap-2.5">
            <span className="flex -space-x-1.5">
              {article.authors.slice(0, 3).map((a) => (
                <Avatar
                  key={a.slug}
                  name={a.name}
                  src={a.avatarUrl}
                  className="h-6 w-6 border border-ink text-[10px]"
                />
              ))}
            </span>
            <span className="font-body text-xs font-light text-slate-500">
              {article.authors.map((a) => a.name).join(" · ")}
            </span>
          </span>
          <ArticleMeta article={article} className="mt-4 border-t border-white/8 pt-4" />
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
