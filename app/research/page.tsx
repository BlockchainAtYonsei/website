import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import ArticleThumb from "@/components/research/article-thumb";
import HomeHero from "@/components/research/home-hero";
import NewsThumb from "@/components/research/news-thumb";
import Reveal from "@/components/research/reveal";
import { getNews } from "@/lib/news";
import { formatDate, getFeatured, type Accent } from "@/lib/research";

/* The property's front door. The archive and the feed each own a tab; this
   page's job is to say what the team publishes and hand over the newest of
   each, so everything on it is a taster.

   Two rows that mirror each other — research reads text-then-picture, news
   picture-then-text — and both stop at the header's edge. They used to run
   off the screen instead, which on a laptop looked like a composed front page
   and on a 27" monitor looked like a mistake: the picture took half of 2560px
   and stood 720px tall, the row grew taller than the viewport, and the
   navigation sat in a 1152px band up the middle of it with the artwork
   sailing past on both sides. A full-bleed picture has no width of its own,
   so the bigger the display the bigger it gets — the one measurement on this
   page that nothing bounded.

   So everything here is the header's box: mx-auto max-w-6xl px-6, the exact
   classes research-header.tsx uses. Pictures end where the wordmark and the
   tabs end, which is the alignment a wide screen actually shows you, and the
   row's height stops growing at 1152px.

   Glass appears exactly once, on the Medium band, because that is the only
   thing here asking to be clicked rather than read. */

const HOME_NEWS = 3; // a taste of the feed; 전체 뉴스 goes and gets the rest

/* The header's own box, copied from research-header.tsx rather than
   approximated: the two are aligned or they are not, and a second formula
   drifting from the first is how they stop being. */
const PAGE_BOX = "mx-auto max-w-6xl px-6";

/* Generated art only shows when a story ships no picture of its own, but when
   it does the colour has to be the one the news page already gives that topic
   — same hash, same table, so a story doesn't change colour between here and
   the feed. */
const ACCENTS: Accent[] = ["blue", "violet", "teal", "indigo"];
function accentOf(topic: string): Accent {
  let h = 0;
  for (let i = 0; i < topic.length; i++) h = (h * 31 + topic.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

/* Section label + its way out to the full surface. */
function RowHead({
  label,
  href,
  cta,
}: {
  label: string;
  href: string;
  cta: string;
}) {
  return (
    <p className="font-mono mb-5 flex items-center justify-between gap-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
      {label}
      <Link
        href={href}
        className="font-body inline-flex items-center gap-1 text-xs font-light text-slate-400 normal-case transition-colors hover:text-bay-300"
      >
        {cta}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </p>
  );
}

export default async function ResearchHome() {
  /* The pinned piece, not the newest one. A front door shows the work the
     team wants read first, and the archive is where recency belongs — the
     flag is a Featured checkbox in Notion, so which piece stands here is an
     editorial decision the 리서치팀 makes without touching this file. Falls
     back to the newest published piece API-side, so the slot is never empty
     just because nobody has ticked the box. */
  const [article, news] = await Promise.all([getFeatured(), getNews()]);
  const latestNews = news.slice(0, HOME_NEWS);
  const heroNews = latestNews[0];

  return (
    <main className="overflow-x-clip">
      {/* Masthead — poster atmosphere behind a staggered type entrance */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 65% at 22% 25%, rgba(47,107,255,0.26) 0%, transparent 68%), radial-gradient(40% 45% at 82% 80%, rgba(124,98,210,0.15) 0%, transparent 70%)",
          }}
        />
        <div aria-hidden className="bg-grid absolute inset-0 opacity-25" />
        <div className={`relative pt-20 pb-16 md:pt-28 md:pb-20 ${PAGE_BOX}`}>
          <HomeHero />
        </div>
      </section>

      {/* Research — type left, picture right, both inside the header's box.
          On phones the picture leads: a headline with nothing above it reads
          as the page starting over. */}
      <section className="border-t border-white/12">
        <Reveal
          className={`grid grid-cols-1 items-center gap-y-8 py-12 md:py-16 lg:grid-cols-2 lg:gap-x-14 ${PAGE_BOX}`}
        >
          <div className="order-2 lg:order-1">
            {/* not "Latest": this slot is pinned, and a label promising
                recency next to a piece from three months ago reads as a
                stale site rather than a chosen one */}
            <RowHead
              label="Featured research"
              href="/research/articles"
              cta="전체 리서치"
            />
            {article ? (
              <Link href={`/research/${article.slug}`} className="group block">
                <h2 className="font-heading text-2xl leading-[1.12] tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100 md:text-4xl">
                  {article.title}
                </h2>
                <p className="font-body mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed font-light break-keep text-slate-400">
                  {article.dek}
                </p>
                <p className="font-mono mt-5 text-[10px] tracking-[0.18em] text-white/40 uppercase">
                  {article.tag}
                  <span className="px-2.5 text-white/20">·</span>
                  {formatDate(article.date)}
                  <span className="px-2.5 text-white/20">·</span>
                  {article.readingMinutes} min read
                </p>
              </Link>
            ) : (
              <p className="font-body text-sm font-light text-slate-500">
                아직 발행된 리서치가 없습니다.
              </p>
            )}
          </div>

          {article && (
            /* No credit line here, unlike the article's own header. This is a
               taster the size of half a screen and the credit was the only
               small grey type on it, sitting under a full-bleed panel with
               nothing else beside it — it read as a caption for the page
               rather than for the picture. The attribution is owed once, and
               it is paid where the picture is actually shown, one click in. */
            <Link
              href={`/research/${article.slug}`}
              className="group order-1 block overflow-hidden rounded-[1.25rem] lg:order-2"
              tabIndex={-1}
              aria-hidden
            >
              <ArticleThumb
                article={article}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                large
                className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03] lg:aspect-[16/9]"
              />
            </Link>
          )}
        </Reveal>
      </section>

      {/* News — mirrored: picture left, type right, same box. */}
      <section className="border-t border-white/12">
        <Reveal
          className={`grid grid-cols-1 items-center gap-y-8 py-12 md:py-16 lg:grid-cols-2 lg:gap-x-14 ${PAGE_BOX}`}
        >
          {heroNews && (
            <Link
              href={`/research/news/${heroNews.slug}`}
              className="group block overflow-hidden rounded-[1.25rem]"
              tabIndex={-1}
              aria-hidden
            >
              <NewsThumb
                item={heroNews}
                accent={accentOf(heroNews.categories[0] ?? "")}
                sizes="(min-width: 1024px) 50vw, 100vw"
                large
                className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03] lg:aspect-[16/9]"
              />
            </Link>
          )}

          <div>
            <RowHead
              label="News tracking"
              href="/research/news"
              cta="전체 뉴스"
            />
            {latestNews.length > 0 ? (
              <ul>
                {latestNews.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-white/8 last:border-b-0"
                  >
                    <Link
                      href={`/research/news/${item.slug}`}
                      className="group flex flex-col gap-1 py-4"
                    >
                      <span className="font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
                        {formatDate(item.date)}
                        <span className="px-2 text-white/20">·</span>
                        <span className="text-bay-300/70">
                          {item.sourceName}
                        </span>
                      </span>
                      <span className="font-body text-[15px] leading-snug font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body text-sm font-light text-slate-500">
                아직 큐레이션된 뉴스가 없습니다.
              </p>
            )}
          </div>
        </Reveal>
      </section>

      {/* Medium — the page's one glass object */}
      <section className="border-t border-white/12">
        <Reveal className={`py-14 md:py-16 ${PAGE_BOX}`}>
          <div className="liquid-glass flex flex-col items-start justify-between gap-5 rounded-[1.25rem] px-7 py-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-heading text-lg tracking-[-0.5px] break-keep text-white">
                새 리서치를 먼저 받아보세요
              </p>
              <p className="font-body mt-1.5 text-sm leading-relaxed font-light break-keep text-slate-400">
                모든 리서치는 Medium에도 발행됩니다.
              </p>
            </div>
            <a
              href="https://medium.com/yonseiblockchainlab"
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-strong font-body inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              Medium 팔로우
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
