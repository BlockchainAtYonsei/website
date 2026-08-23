import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import HomeHero from "@/components/research/home-hero";
import Reveal from "@/components/research/reveal";
import { getNews } from "@/lib/news";
import { getFeatured } from "@/lib/research";
import { findSession, nextSessionNo, SESSIONS } from "@/lib/study";

/* The property's front door. Research, News and Study each own a tab; this
   page's job is to say what the team publishes — not to show a taster of each.

   The cards used to lead with a picture: the freshest article's photo, a
   crawled og:image, a house cover for study. But a photo on the front door
   answered the wrong question. A visitor here doesn't yet know the site, and a
   Russian bond scan or an EigenCloud wordmark tells them nothing about what
   the section IS — the picture read as decoration you had to already be an
   insider to parse. The one thing the lobby has to land is that the lab runs
   three distinct surfaces, so each card now leads with the section's name and
   a line saying what it does, and carries its freshest item underneath as
   proof the surface is alive rather than as the headline. Type, no pictures:
   the sections are the subject. */

/* The header's own box, copied from research-header.tsx rather than
   approximated: the two are aligned or they are not, and a second formula
   drifting from the first is how they stop being. */
const PAGE_BOX = "mx-auto max-w-6xl px-6";

/* One card in the hub row. The whole card is a single link to its surface —
   these three stand for the surfaces, not for the items showing under them.
   `label` names the surface, `blurb` says what it does, and `latest` is the
   freshest thing on it: a small role word (추천/최신/다음) and the item,
   pinned to the card's floor so the three align however long the blurbs run.
   `latest` is optional — a section with nothing published yet still stands on
   its name and blurb rather than needing a separate empty state. */
function HubCard({
  href,
  label,
  blurb,
  latest,
}: {
  href: string;
  label: string;
  blurb: string;
  latest?: { role: string; text: string };
}) {
  return (
    <Link
      href={href}
      className="group flex h-full min-h-[12rem] flex-col rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-white/25"
    >
      <p className="font-mono text-[11px] tracking-[0.2em] text-bay-200 uppercase">
        {label}
      </p>
      <h2 className="font-heading mt-4 text-xl leading-snug tracking-[-0.5px] break-keep text-white transition-colors group-hover:text-bay-100">
        {blurb}
      </h2>
      {latest && (
        <div className="mt-auto flex items-baseline gap-2.5 border-t border-white/8 pt-4">
          <span className="font-mono shrink-0 text-[10px] tracking-[0.16em] text-white/40 uppercase">
            {latest.role}
          </span>
          <span className="font-body min-w-0 flex-1 truncate text-[13px] font-light text-slate-300">
            {latest.text}
          </span>
        </div>
      )}
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

  return (
    <main className="overflow-x-clip">
      {/* First screen — masthead + the three cards, sized to the viewport so
          the lobby lands as exactly the hero and the three surfaces on any
          monitor; the Medium band and the footer wait below the fold. The
          4rem subtracted is the sticky header's h-16, so the block ends right
          at the bottom of the window rather than a header's-worth past it.
          svh, not vh, so a phone's collapsing toolbar doesn't push the cards
          under its own chrome. */}
      <div className="flex min-h-[calc(100svh-4rem)] flex-col">
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

        {/* The hub — three surfaces, three equal cards, what each one is.
            flex-1 with the cards at its top (justify-start) keeps them close
            under the hero rather than floating in the middle; the leftover
            height on a tall monitor trails below the row as breathing room,
            and still holds the Medium band under the fold. No rule between the
            hero and the cards — the change in ground already reads as the
            seam, and the line only underscored the gap. */}
        <section className="flex flex-1 flex-col justify-start">
          <Reveal
            className={`grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 md:py-10 lg:grid-cols-3 ${PAGE_BOX}`}
          >
          {/* Research — the pinned piece, tagged 추천 not 최신: a promise of
              recency next to an editorial pick reads as a stale site. */}
          <HubCard
            href="/research/articles"
            label="Research"
            blurb="프로토콜·ZK·DeFi·거버넌스, 시장을 구조로 읽어내는 자체 리서치"
            latest={
              article ? { role: "추천", text: article.title } : undefined
            }
          />

          {/* News — the freshest curated story */}
          <HubCard
            href="/research/news"
            label="News tracking"
            blurb="시장에서 골라 온 소식에 큐레이터의 한 줄을 얹습니다"
            latest={
              latestNews ? { role: "최신", text: latestNews.title } : undefined
            }
          />

          {/* Study — the next session up */}
          <HubCard
            href="/research/study"
            label="RWA Study"
            blurb="Xangle RWA Series를 아홉 번에 걸쳐 함께 완독합니다"
            latest={{
              role: "다음",
              text: `${String(studySession.no).padStart(2, "0")}회차 · ${studySession.topic}`,
            }}
          />
          </Reveal>
        </section>
      </div>

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
