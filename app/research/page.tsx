import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import ArticleThumb from "@/components/research/article-thumb";
import HomeHero from "@/components/research/home-hero";
import NewsThumb from "@/components/research/news-thumb";
import Reveal from "@/components/research/reveal";
import { getNews } from "@/lib/news";
import { formatDate, getFeatured, type Accent } from "@/lib/research";
import { findSession, nextSessionNo, SESSIONS } from "@/lib/study";

/* The property's front door. Research, News and Study each own a tab; this
   page's job is to say what the team publishes and hand over the newest of
   each, so everything on it is a taster.

   One centred phrase over three equal cards — the three content surfaces,
   left to right, each showing its freshest thing. It used to be two mirrored
   full-bleed rows instead, which read as a composed front page on a laptop
   and as a mistake on a 27" monitor: a full-bleed picture has no width of its
   own, so the bigger the display the bigger it got — one picture taking half
   of 2560px and standing 720px tall, the row growing taller than the viewport.

   So the cards are the thing bounded now. They sit in the header's box
   (mx-auto max-w-6xl px-6, the exact classes research-header.tsx uses) as a
   three-column grid, which means a picture ends where the wordmark and the
   tabs end however wide the screen is, and each card's height is its own
   contents, not the viewport's.

   Glass appears exactly once, on the Medium band, because that is the only
   thing here asking to be clicked-through rather than browsed into. */

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

/* The study card's picture. The study surface ships no photography of its own
   — its cards are glass and type — so this is a fixed house cover the surface
   owns rather than a per-session figure: one image under a stable path that
   stays put as the 주차 (next session) rolls over, wearing the same bottom
   vignette the other two cards' pictures carry so the row reads as three real
   pictures rather than two-and-a-placeholder. Deliberately takes no session
   argument: do not wire this to studySession, or the cover would flip weekly. */
function StudyCover() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a1420]">
      <Image
        src="/study/cover.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
    </div>
  );
}

/* One card in the hub row. The whole card is a single link to its surface —
   not to the taster item — because these three stand for the surfaces, and a
   card whose picture opens one thing and whose title opens another is two
   links wearing one box. The label sits above the card as its section header,
   not inside it: a first-time visitor should be told the three surfaces are
   Research, News and Study before reading into any one of them, rather than
   inferring the structure the way someone who already knows the site would.
   The picture and the line under the title are that surface's freshest thing,
   proof it's alive. */
function HubCard({
  href,
  label,
  media,
  title,
  meta,
}: {
  href: string;
  label: string;
  media: React.ReactNode;
  title: string;
  meta: React.ReactNode;
}) {
  return (
    <Link href={href} className="group flex h-full flex-col">
      <p className="font-mono mb-3 text-[11px] tracking-[0.2em] text-bay-200 uppercase">
        {label}
      </p>
      <div className="flex flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.02] transition-colors group-hover:border-white/25">
        <div className="aspect-[16/10] w-full overflow-hidden">{media}</div>
        <div className="flex flex-1 flex-col p-6">
          <h2 className="font-heading line-clamp-3 text-lg leading-snug tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100">
            {title}
          </h2>
          <p className="font-mono mt-auto pt-4 text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {meta}
          </p>
        </div>
      </div>
    </Link>
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
  const latestNews = news[0];

  /* The study card wears the next session that hasn't happened yet — the same
     one the study page badges 다음 세션 — falling back to the last one on the
     calendar once the series is done, so the card is never empty. */
  const nextNo = nextSessionNo(new Date());
  const studySession =
    (nextNo != null ? findSession(nextNo) : undefined) ??
    SESSIONS[SESSIONS.length - 1];

  const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

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
        <div className={`relative pt-12 pb-8 md:pt-16 md:pb-10 ${PAGE_BOX}`}>
          <HomeHero />
        </div>
      </section>

      {/* The hub — three surfaces, three equal cards, newest of each */}
      <section className="border-t border-white/12">
        <Reveal
          className={`grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 md:py-10 lg:grid-cols-3 ${PAGE_BOX}`}
        >
          {/* Research — the pinned piece, so no "Latest": a label promising
              recency next to a piece from three months ago reads as a stale
              site rather than a chosen one. */}
          {article ? (
            <HubCard
              href="/research/articles"
              label="Research"
              media={
                <ArticleThumb
                  article={article}
                  sizes={CARD_SIZES}
                  priority
                  large
                  className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              }
              title={article.title}
              meta={
                <>
                  {article.tag}
                  <span className="px-2 text-white/20">·</span>
                  {article.readingMinutes} min read
                </>
              }
            />
          ) : (
            <div className="flex min-h-[16rem] flex-col justify-end rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
                Research
              </p>
              <p className="font-body mt-3 text-sm font-light text-slate-500">
                아직 발행된 리서치가 없습니다.
              </p>
            </div>
          )}

          {/* News — the freshest curated story */}
          {latestNews ? (
            <HubCard
              href="/research/news"
              label="News tracking"
              media={
                <NewsThumb
                  item={latestNews}
                  accent={accentOf(latestNews.categories[0] ?? "")}
                  sizes={CARD_SIZES}
                  large
                  className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              }
              title={latestNews.title}
              meta={
                <>
                  {formatDate(latestNews.date)}
                  <span className="px-2 text-white/20">·</span>
                  <span className="text-bay-300/70">
                    {latestNews.sourceName}
                  </span>
                </>
              }
            />
          ) : (
            <div className="flex min-h-[16rem] flex-col justify-end rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-bay-300 uppercase">
                News tracking
              </p>
              <p className="font-body mt-3 text-sm font-light text-slate-500">
                아직 큐레이션된 뉴스가 없습니다.
              </p>
            </div>
          )}

          {/* Study — the next session up. It ships no photo (see StudyCover),
              so the slot wears the study's own type-and-atmosphere identity
              rather than art borrowed from the article idiom. */}
          <HubCard
            href="/research/study"
            label="RWA Study"
            media={
              <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                <StudyCover />
              </div>
            }
            title={`${studySession.title.accent} ${studySession.title.rest}`}
            meta={
              <>
                {`${String(studySession.no).padStart(2, "0")}회차`}
                <span className="px-2 text-white/20">·</span>
                {studySession.topic}
              </>
            }
          />
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
