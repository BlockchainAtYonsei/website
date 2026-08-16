import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import CoverArt from "@/components/research/cover-art";
import HomeHero from "@/components/research/home-hero";
import NewsThumb from "@/components/research/news-thumb";
import Reveal from "@/components/research/reveal";
import { getNews } from "@/lib/news";
import { formatDate, getArticlesPage, type Accent } from "@/lib/research";

/* The property's front door. The archive and the feed each own a tab; this
   page's job is to say what the team publishes and hand over the newest of
   each, so everything on it is a taster.

   Two rows that mirror each other — research reads text-then-picture, news
   picture-then-text — and each picture runs off its own edge of the screen:
   the bleed is what makes the rows read as a composed front page instead of
   boxes in a column. Type keeps to the header's grid; only images leave it.
   Glass appears exactly once, on the Medium band, because that is the only
   thing here asking to be clicked rather than read. */

const HOME_NEWS = 3; // a taste of the feed; 전체 뉴스 goes and gets the rest

/* The header centers a max-w-6xl (1152px) box and pads it px-6 (24px), so its
   own left/right edges sit at 24px on a narrow screen and drift outward
   together as the viewport grows past 1200px. This page is full-bleed (no
   max-w wrapper) so its edges could not track that drift with a plain
   px-* scale — max() reproduces the header's exact formula: pinned at 24px
   until 1200px, then equal to the header's half-of-the-overflow inset. */
const NAV_INSET = "max(1.5rem, calc((100vw - 1152px) / 2 + 1.5rem))";
const PAGE_X = { paddingLeft: NAV_INSET, paddingRight: NAV_INSET };

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
  const [latest, news] = await Promise.all([
    getArticlesPage(1, 1),
    getNews(),
  ]);
  const article = latest.items[0];
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
        <div
          className="relative pt-20 pb-16 md:pt-28 md:pb-20"
          style={PAGE_X}
        >
          <HomeHero />
        </div>
      </section>

      {/* Research — type on the grid, the art running off the right edge.
          On phones the picture leads: a headline with nothing above it reads
          as the page starting over. */}
      <section className="border-t border-white/12">
        <Reveal className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-2">
          <div
            className="order-2 px-6 pb-14 lg:order-1 lg:py-20 lg:pr-16"
            style={{ paddingLeft: NAV_INSET }}
          >
            <RowHead
              label="Latest research"
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
            <Link
              href={`/research/${article.slug}`}
              className="group order-1 mt-0 block overflow-hidden lg:order-2 lg:rounded-l-[1.5rem]"
              tabIndex={-1}
              aria-hidden
            >
              <CoverArt
                accent={article.accent}
                tag={article.tag}
                large
                className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03] lg:aspect-[16/9]"
              />
            </Link>
          )}
        </Reveal>
      </section>

      {/* News — mirrored: the picture bleeds off the left edge, type keeps
          to the grid on the right. */}
      <section className="border-t border-white/12">
        <Reveal className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-2">
          {heroNews && (
            <Link
              href={`/research/news/${heroNews.slug}`}
              className="group block overflow-hidden lg:rounded-r-[1.5rem]"
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

          <div
            className="px-6 pb-14 lg:py-20 lg:pl-16"
            style={{ paddingRight: NAV_INSET }}
          >
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
        <Reveal className="py-14 md:py-16" style={PAGE_X}>
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
