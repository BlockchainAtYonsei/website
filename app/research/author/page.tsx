import type { Metadata } from "next";
import Link from "next/link";
import { AUTHORS, getArticlesByAuthor } from "@/lib/authors";

export const metadata: Metadata = {
  title: "Authors",
  description: "BAY 리서치를 쓰는 사람들.",
};

export default function AuthorsPage() {
  /* people with published work first, then 가나다 — the directory is for
     finding writing, not reproducing the org chart */
  const authors = [...AUTHORS].sort((a, b) => {
    const diff =
      getArticlesByAuthor(b.slug).length - getArticlesByAuthor(a.slug).length;
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "ko");
  });

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
        <div>
          <h1 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
            Authors
          </h1>
          <p className="font-body mt-3 max-w-xl text-sm leading-relaxed font-light break-keep text-slate-400">
            BAY 리서치를 쓰는 사람들. 프로필에서 소셜 링크와 작성한 글을 볼 수
            있습니다.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
          {authors.length} authors
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => {
          const count = getArticlesByAuthor(author.slug).length;
          return (
            <Link
              key={author.slug}
              href={`/research/author/${author.slug}`}
              className="liquid-glass group flex flex-col rounded-[1.25rem] p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div>
                <span className="font-body block text-base font-medium text-white transition-colors group-hover:text-bay-100">
                  {author.name}
                </span>
                <span className="font-mono mt-0.5 block text-[10px] tracking-[0.18em] text-bay-300/80 uppercase">
                  {author.role}
                </span>
              </div>
              <p className="font-body mt-4 text-sm leading-relaxed font-light break-keep text-slate-400">
                {author.bio}
              </p>
              <p className="font-mono mt-auto pt-4 text-[10px] tracking-[0.18em] text-white/40 uppercase">
                {count} {count === 1 ? "piece" : "pieces"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
