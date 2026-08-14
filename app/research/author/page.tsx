import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/components/research/avatar";
import { getAuthors, type Author } from "@/lib/authors";

export const metadata: Metadata = {
  title: "Authors",
  description: "BAY 리서치를 쓰는 사람들.",
};

/* A contributors spread, not a roster table. The page keeps 가나다순 — the
   order a Korean directory is expected to read in — but breaks the grid's
   uniformity where it counts: three columns of naturally uneven heights, the
   middle one dropped a beat. The cards themselves stay plain glass — no
   backdrop art; the stagger carries the page. */

function Card({ author }: { author: Author }) {
  return (
    <Link
      href={`/research/author/${author.slug}`}
      className="group liquid-glass relative flex flex-col rounded-[1.25rem] p-7 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex items-center gap-4">
        <Avatar
          name={author.name}
          src={author.avatarUrl}
          className="h-14 w-14 shrink-0 text-xl"
        />
        <div className="min-w-0">
          <h2 className="font-heading text-[1.35rem] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100">
            {author.name}
          </h2>
          <p className="font-mono mt-1 text-[10px] tracking-[0.18em] text-bay-300/80 uppercase">
            {author.role}
          </p>
        </div>
      </div>

      {author.bio && (
        <p className="font-body mt-5 text-sm leading-relaxed font-light break-keep text-slate-400">
          {author.bio}
        </p>
      )}

      <p className="font-mono mt-auto pt-6 text-[10px] tracking-[0.18em] text-white/45 uppercase">
        리서치 <span className="text-white">{author.articleCount}</span>
        <span className="px-2 text-white/20">·</span>
        뉴스 <span className="text-white">{author.newsCount}</span>
      </p>
    </Link>
  );
}

export default async function AuthorsPage() {
  /* the API already narrows to people with published work (?writers=1) */
  const authors = (await getAuthors()).sort((a, b) =>
    a.name.localeCompare(b.name, "ko"),
  );

  /* Round-robin into three columns so 가나다 reads across, not down — and the
     columns keep their natural height differences instead of a grid flattening
     them. The middle column starts a beat lower: the offset is what makes the
     spread read as composed rather than generated. Mobile renders the flat
     list (columns would scramble the reading order there). */
  const columns: Author[][] = [[], [], []];
  authors.forEach((a, i) => columns[i % 3].push(a));

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <h1 className="font-heading text-3xl tracking-[-1px] text-white md:text-4xl">
          Authors
        </h1>

        <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
          {authors.length} authors
        </p>
      </div>

      {/* mobile: one column in reading order */}
      <div className="flex flex-col gap-5 lg:hidden">
        {authors.map((a) => (
          <Card key={a.slug} author={a} />
        ))}
      </div>

      {/* desktop: the staggered spread */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {columns.map((column, c) => (
          <div
            key={c}
            className={`flex flex-col gap-6 ${c === 1 ? "mt-14" : ""}`}
          >
            {column.map((a) => (
              <Card key={a.slug} author={a} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
