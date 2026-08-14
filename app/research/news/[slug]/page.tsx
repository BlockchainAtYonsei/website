import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@/components/icons";
import ArticleBody, { inline } from "@/components/research/article-body";
import { TagChip } from "@/components/research/article-card";
import Avatar from "@/components/research/avatar";
import {
  getNews,
  getNewsItem,
  summaryList,
  weekOf,
  type NewsDetail,
  type NewsItem,
} from "@/lib/news";
import { formatDate } from "@/lib/research";

export async function generateStaticParams() {
  try {
    return (await getNews()).map((n) => ({ slug: n.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/research/news/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await getNewsItem(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary || `${item.sourceName} 보도에 대한 BAY의 요약과 인사이트.`,
  };
}

/* Sidebar rail — the reference layout's right column: a titled panel of
   compact item links. Server-rendered; nothing here is interactive. */
function Rail({
  title,
  items,
  more,
}: {
  title: string;
  items: NewsItem[];
  more?: { href: string; label: string };
}) {
  if (items.length === 0) return null;
  return (
    <section className="liquid-glass rounded-[1.25rem] p-6">
      <h2 className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        {title}
      </h2>
      <ul className="mt-1 divide-y divide-white/6">
        {items.map((n) => (
          <li key={n.id}>
            <Link href={`/research/news/${n.slug}`} className="group block py-4">
              <p className="font-body line-clamp-2 text-sm leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                {n.title}
              </p>
              <p className="font-mono mt-2 flex items-center gap-2.5 text-[10px] tracking-[0.15em] text-white/40 uppercase">
                {n.curator && <span>{n.curator.name}</span>}
                <span>{formatDate(n.date)}</span>
                <span className="text-bay-300/70">{n.categories.join(" · ")}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {more && (
        <Link
          href={more.href}
          className="font-body mt-2 inline-flex items-center gap-1.5 text-xs font-light text-slate-400 transition-colors hover:text-bay-300"
        >
          {more.label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </section>
  );
}


/* Content Summary arrives as the curator typed it into the Notion property.
   `summaryList` recovers the points from either shape they use; rendering
   replaces their markers ("•", "1.") with the site's own so the numbering
   isn't doubled, and keeps the list ordered when they numbered it. */
function Summary({ summary }: { summary: string }) {
  const { ordered, items } = summaryList(summary);
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <div className="mt-8">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        Summary
      </p>
      <List className="max-w-2xl space-y-3">
        {items.map((line, i) => (
          <li key={i} className="flex gap-3.5">
            {ordered ? (
              <span className="font-mono mt-[0.3em] w-4 shrink-0 text-xs text-bay-300/80">
                {i + 1}
              </span>
            ) : (
              <span
                aria-hidden
                className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-bay-300/80"
              />
            )}
            <span className="font-body text-[15px] leading-relaxed font-light break-keep text-slate-300">
              {line}
            </span>
          </li>
        ))}
      </List>
    </div>
  );
}

/* The picture the story leads with, and where it comes from. `imageUrl` is
   already the resolved pick — the write-up's own first image, else the cover
   the sync crawled or the team chose by hand — so the only thing left to work
   out is whether it is still sitting in the body, where rendering it again
   would print it twice. Lifting it out is what a magazine does with lead art,
   and it takes the curator's caption with it. */
function leadOf(item: NewsDetail) {
  if (!item.imageUrl) return { blocks: item.body };
  const i = item.body.findIndex((b) => b.t === "image" && b.url === item.imageUrl);
  if (i === -1) return { url: item.imageUrl, blocks: item.body };
  const block = item.body[i];
  return {
    url: item.imageUrl,
    caption: block.t === "image" ? block.caption : undefined,
    blocks: item.body.filter((_, j) => j !== i),
  };
}

const CREDIT_LINK =
  "text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-bay-300 hover:decoration-bay-300";

/* Under the lead image, right-aligned, the way a photo credit sits — and it
   is a way out to the story, not just a line of text.

   Three cases, in order. A caption that already carries a link renders as the
   curator wrote it. A plain credit ("출처: 블록미디어") becomes the link, since
   the publisher it names is the story we are linking to anyway. No caption at
   all falls back to the source's host. Nothing renders when the write-up
   stands alone: a bare "출처:" is worse than silence. */
function LeadCaption({ caption, item }: { caption?: string; item: NewsDetail }) {
  if (caption?.includes("](")) {
    return <Credit>{inline(caption)}</Credit>;
  }
  if (!item.url) return caption ? <Credit>{caption}</Credit> : null;
  return (
    <Credit>
      {caption ? null : "출처: "}
      <a href={item.url} target="_blank" rel="noreferrer" className={CREDIT_LINK}>
        {caption ?? item.sourceName ?? "원문"}
      </a>
    </Credit>
  );
}

function Credit({ children }: { children: ReactNode }) {
  return (
    <figcaption className="font-body mt-3 text-right text-xs font-light break-keep text-slate-500">
      {children}
    </figcaption>
  );
}

export default async function NewsDetailPage(
  props: PageProps<"/research/news/[slug]">,
) {
  const { slug } = await props.params;
  const item = await getNewsItem(slug);
  if (!item) notFound();

  const week = weekOf(item.date);
  const lead = leadOf(item);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <Link
        href="/research/news"
        className="font-mono inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-300"
      >
        <span aria-hidden>←</span> All news
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-x-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          {/* Lead art above the headline, as the design has it — plain <img>
              like the rest of the site's pictures, since the sources are our
              own R2 copies, the publisher's CDN or Wikimedia. Cropped to one
              ratio because og:images arrive at every shape and a column that
              changes height per story reads as broken. */}
          {lead.url && (
            <figure className="mb-8">
              <img
                src={lead.url}
                alt=""
                className="aspect-[16/9] w-full rounded-[1.25rem] border border-white/8 object-cover"
              />
              <LeadCaption caption={lead.caption} item={item} />
            </figure>
          )}

          <header>
            <div className="flex flex-wrap items-center gap-3">
              {/* every topic the curator tagged, not just the first */}
              {item.categories.map((c) => (
                <TagChip key={c} label={c} />
              ))}
              <span className="font-mono text-[10px] tracking-[0.18em] text-bay-300/80 uppercase">
                {week.label}
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
                {formatDate(item.date)}
              </span>
            </div>

            <h1 className="font-heading mt-6 max-w-3xl text-3xl leading-[1.15] tracking-[-1px] break-keep text-white md:text-5xl">
              {item.title}
            </h1>

            {/* Byline right under the title, where an article signs itself —
                it used to sit below the summary, splitting the content in
                half with a profile card. */}
            {item.curator && (
              <div className="mt-6 border-b border-white/8 pb-6">
                <Link
                  href={`/research/author/${item.curator.slug}`}
                  className="group inline-flex items-center gap-3"
                >
                  <Avatar
                    name={item.curator.name}
                    src={item.curator.avatarUrl}
                    className="h-9 w-9 text-sm"
                  />
                  <span>
                    <span className="font-body block text-sm text-white transition-colors group-hover:text-bay-100">
                      {item.curator.name}
                    </span>
                    <span className="font-mono block text-[10px] tracking-[0.18em] text-white/40 uppercase">
                      Curator
                    </span>
                  </span>
                </Link>
              </div>
            )}

            <Summary summary={item.summary} />
          </header>

          {/* 요약 & 인사이트 is the agreed shape of a news item, so the page
              draws both labels rather than trusting 78 write-ups to type them
              — eight of them did, in six different spellings, and the sync
              drops those now that this is here. */}
          {lead.blocks.length > 0 && (
            <div className="mt-10">
              <p className="font-mono mb-1 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
                Insight
              </p>
              <ArticleBody blocks={lead.blocks} />
            </div>
          )}

          {/* the way out to the original story — the only external link on
              the page, and absent when the write-up stands alone */}
          {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-strong font-body mt-12 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
          >
            원문 보기
            <ArrowUpRight className="h-4 w-4" />
          </a>
          )}
        </article>

        {/* the reference layout's right column; below lg it would just push
            the body down, so it is dropped rather than stacked */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <Rail
              title="최신 뉴스트래킹"
              items={item.latest}
              more={{ href: "/research/news", label: "전체 보기" }}
            />
            <Rail title="관련 이슈" items={item.related} />
          </div>
        </aside>
      </div>
    </main>
  );
}
