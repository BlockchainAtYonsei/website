/* Mock articles — the one dataset still waiting on its real Notion DB.

   npm run seed:mock   (DESTRUCTIVE for articles only: wipes and re-creates
   them; members and news are never touched, and a non-local DATABASE_URL is
   refused outright — see assertLocalDatabase below)

   The roster is real (seed:members) and news tracking syncs from the 리서치
   Notion, so this script owns exactly what is still mock: the research
   articles. Bylines attach to the real member rows by slug — a pairing whose
   slug has left the roster drops with a warning rather than failing the
   seed. */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { firstReference, referenceCredit } from "../src/content/references";
import { readingMinutes } from "../src/notion/reading-time";
import { fetchOgImage } from "../src/sync/og-image";
import { ARTICLES, type Article, type Block } from "./mock-articles";

try {
  process.loadEnvFile();
} catch {
  /* env comes from the shell */
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/* Where the local database lives — everything else is somebody's real data.
   Names, not addresses: the production DB answers to `bay-pg` on the docker
   network (docs/deploy-runbook.md), so a container hostname is exactly the
   case this has to catch. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/* This script wipes tables. An earlier version of it seeded news as well, and
   a run of that one against production put thirty invented stories on the
   live site under real members' bylines, where they sat for weeks — nobody
   was going to notice, because they look exactly like the real ones. The
   news seeding is gone; the `deleteMany` on articles is not, so the same
   slip is still one shell history entry away.

   The environment is the only thing that distinguishes the two runs, so the
   environment is what gets checked. An intentional remote seed still works,
   it just has to be said out loud rather than inherited from whatever
   DATABASE_URL happened to be exported. */
function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (process.env.SEED_ALLOW_REMOTE === "1") {
    console.warn("  SEED_ALLOW_REMOTE=1 — seeding a non-local database on purpose");
    return;
  }
  const host = new URL(url).hostname;
  if (LOCAL_HOSTS.has(host)) return;
  throw new Error(
    `refusing to seed: DATABASE_URL points at "${host}", not a local database. ` +
      "This script deletes every article row. If that is genuinely what you want " +
      "there, re-run with SEED_ALLOW_REMOTE=1.",
  );
}

/* ---- filler articles: enough volume to exercise the archive layout ----
   Titles/bodies are deliberately rough ("대충") — they exist to answer "what
   does the index look like with a few pages in it", not to read.
   Deterministic pseudo-randomness (index arithmetic) keeps reruns identical.

   Volume is set per person, not in total: three pieces on an author page is
   a list rather than a lone card, and it stops there because the invented
   ones are standing in for work nobody did — at ten apiece the archive was
   claiming a body of research the club has not published. The count follows
   the roster, so a semester turnover changes it without an edit here. */

const PIECES_PER_WRITER = 3;

const STEMS: [string, string][] = [
  ["Infra", "시퀀서 탈중앙화 로드맵 비교"],
  ["Infra", "재실행 증명과 사기 증명의 비용 구조"],
  ["Infra", "블롭 수수료 시장의 초기 데이터"],
  ["ZK", "증명 집계 레이어의 경제성"],
  ["ZK", "폴딩 스킴이 바꾸는 프루버 지형"],
  ["ZK", "zkVM 벤치마크는 왜 서로 다른가"],
  ["DeFi", "온체인 옵션 볼트의 수익 구조 분해"],
  ["DeFi", "무기한 선물 DEX의 청산 엔진 비교"],
  ["DeFi", "대출 프로토콜의 금리 곡선 설계"],
  ["Governance", "국고 다각화 제안의 실행 구조"],
  ["Governance", "프로토콜 헌법과 하드포크 거부권"],
  ["Governance", "위임 시장의 인센티브 문제"],
  ["Market", "거래소 상장 프리미엄의 소멸 속도"],
  ["Market", "온체인 파생상품 미결제약정 읽기"],
  ["Market", "스테이블코인 페그 이탈의 미시구조"],
  ["Infra", "라이트 클라이언트의 신뢰 가정 정리"],
  ["ZK", "증명 시장 수수료 데이터 노트"],
  ["DeFi", "브릿지 유동성 인센티브의 반감기"],
];

/* What a filler cites — something actually about its subject, so its card
   ends up with a picture about that subject. Several per tag and rotated by
   position: nine Infra pieces citing one page is nine cards wearing the same
   photograph, which reads as a broken grid rather than a full one. */
const FILLER_REFERENCES: Record<string, [string, string][]> = {
  Infra: [
    ["ethereum.org — 스테이킹", "https://ethereum.org/en/staking/"],
    ["ethereum.org — 댕크샤딩", "https://ethereum.org/en/roadmap/danksharding/"],
    ["Celestia — What is Celestia", "https://celestia.org/what-is-celestia/"],
  ],
  ZK: [
    ["ethereum.org — 영지식 증명", "https://ethereum.org/en/zero-knowledge-proofs/"],
    ["Succinct — Blog", "https://blog.succinct.xyz/"],
  ],
  DeFi: [
    ["ethereum.org — 디파이", "https://ethereum.org/en/defi/"],
    ["Paradigm — Intent-Based Architectures and Their Risks", "https://www.paradigm.xyz/2023/06/intents"],
  ],
  Governance: [
    ["ethereum.org — DAO", "https://ethereum.org/en/dao/"],
    ["ENS — Blog", "https://blog.ens.domains/"],
  ],
  Market: [
    ["Circle — USDC Transparency", "https://www.circle.com/transparency"],
    ["ethereum.org — 스테이블코인", "https://ethereum.org/en/stablecoins/"],
  ],
};

const FILLER_BODY = (title: string, tag: string, i: number): Block[] => [
  { t: "p", text: `${title}에 대한 목업 본문이다. 레이아웃 검증용 채움 글로, 실제 리서치가 Notion 동기화로 이 자리를 대체한다.` },
  { t: "h2", text: "구조" },
  { t: "p", text: "첫 번째 축은 비용이고 두 번째 축은 신뢰 가정이다. 두 축이 교차하는 지점에서 설계 선택이 갈린다." },
  { t: "ul", items: ["관찰 가능한 지표부터 정리한다", "반례가 되는 사례를 찾는다", "지표가 무너지는 조건을 명시한다"] },
  { t: "quote", text: "채움 글에도 인용 블록은 하나 있어야 리듬이 보인다." },
  { t: "h2", text: "정리" },
  { t: "p", text: "결론 문단. 본문 길이가 카드 요약과 읽기 시간 계산에 영향을 주는지 확인하기 위한 두어 문장이다." },
  { t: "divider" },
  { t: "h2", text: "참고자료" },
  {
    t: "ul",
    items: [
      (([label, url]) => `[${label}](${url})`)(
        FILLER_REFERENCES[tag][i % FILLER_REFERENCES[tag].length],
      ),
    ],
  },
];

/* ---- cover pictures ----
   Not chosen here. A piece cites its sources, and the site's rule (see
   src/content/references.ts, which the Notion sync runs too) is that the
   first thing it cites lends its link-preview image — so what a mock article
   needs is not a photo but a real 참고자료 list, and it has one.

   Crawled at seed time rather than baked in as URLs, because that is the same
   path the sync takes: what fails here fails there. A reference site that
   publishes no preview image leaves the cover null and the card falls back to
   generated art, which is the honest local picture of what production does.
   Every distinct reference is fetched once, and all of them at once. Once
   because several pieces cite the same page; at once because this runs on the
   backend container's boot, where the deploy waits sixty seconds for /health
   before giving up — a dozen references crawled in series, each with an
   eight-second timeout, is a bad day away from failing a deploy. In parallel
   the whole crawl costs one timeout. */
const ogCache = new Map<string, string | null>();

async function warmCovers(bodies: Block[][]): Promise<void> {
  const urls = [
    ...new Set(bodies.map(firstReference).filter((r) => r !== null).map((r) => r.url)),
  ];
  const images = await Promise.all(urls.map((u) => fetchOgImage(u)));
  urls.forEach((u, i) => ogCache.set(u, images[i]));
}

function coverFrom(body: Block[]): { url: string; credit: string } | null {
  const ref = firstReference(body);
  const url = ref && ogCache.get(ref.url);
  return url && ref ? { url, credit: referenceCredit(ref) } : null;
}

/* newest filler sits behind the real mocks; dates walk back ~2 weeks per
   piece, so the archive reaches about a year back at the current volume */
function fillerDate(i: number): string {
  const d = new Date(Date.UTC(2026, 6, 20));
  d.setUTCDate(d.getUTCDate() - i * 14 - (i % 5));
  return d.toISOString().slice(0, 10);
}

/* One byline each, unlike the curated six: a filler exists to fill a row on
   one person's page, and a second name on it would credit its author twice
   over — the whole point of counting per writer is that the count is exact. */
function filler(i: number, author: string): Article & { views: number } {
  const [tag, stem] = STEMS[i % STEMS.length];
  const round = Math.floor(i / STEMS.length);
  const title = round === 0 ? stem : `${stem} ${round + 1}부`;
  const accents = ["blue", "violet", "teal", "indigo"] as const;
  return {
    slug: `mock-${String(i + 1).padStart(2, "0")}`,
    title,
    dek: `${stem} — 볼륨 테스트용 목업 요약. 실제 덱은 두 문장 정도의 훅으로 채워진다.`,
    tag,
    accent: accents[i % 4],
    date: fillerDate(i),
    author,
    body: FILLER_BODY(title, tag, i),
    views: ((i * 137) % 880) + 25,
  };
}

/* Fillers top each writer up to PIECES_PER_WRITER — the curated six already
   carry a byline for nearly everyone, so counting them is what keeps the
   people in that list from ending up with one more piece than the rest.
   Dealt round-robin rather than writer-by-writer so the dates interleave;
   consecutive dates by one person would read as a publishing streak. */
function fillersFor(writers: string[], curated: Map<string, number>) {
  const owed = new Map(
    writers.map((w) => [w, Math.max(0, PIECES_PER_WRITER - (curated.get(w) ?? 0))]),
  );
  const out: (Article & { views: number })[] = [];
  for (let round = 0; round < PIECES_PER_WRITER; round++) {
    for (const w of writers) {
      if ((owed.get(w) ?? 0) > round) out.push(filler(out.length, w));
    }
  }
  return out;
}

/* two bylines per piece → 6 articles cover all 12 members */
const PAIRINGS: Record<string, string[]> = {
  "restaking-risk-surface": ["yerim-bae", "uihyeok-park"],
  "zk-proving-market": ["jaehwan-lee", "seongjae-lee"],
  "intent-settlement": ["jehee-noh", "yunseon-jang"],
  "onchain-governance-turnout": ["jaeseo-kim", "chaeyun-lim"],
  "stablecoin-reserve-transparency": ["sanghyeon-kwon", "hyunchae-cho"],
  "modular-da-economics": ["younghwan-shin", "donghyun-jang"],
};

async function main() {
  assertLocalDatabase();

  /* bylines resolve against the real roster — run seed:members first */
  const members = await prisma.member.findMany({
    select: { id: true, slug: true, team: true },
  });
  const idBySlug = new Map(members.map((m) => [m.slug, m.id]));
  if (idBySlug.size === 0) {
    throw new Error("the roster is empty — run `npm run seed:members` first");
  }

  /* fillers rotate through the research team (slug-sorted for deterministic
     reruns) so every research author page gets a multi-piece list */
  const writerSlugs = members
    .filter((m) => m.team === "리서치팀")
    .map((m) => m.slug)
    .sort();

  /* what the curated six already put on each research author's page — a
     pairing naming someone off the roster is dropped below, so it must not
     be counted as a piece here either */
  const curated = new Map<string, number>();
  for (const slugs of Object.values(PAIRINGS)) {
    for (const slug of slugs) {
      if (idBySlug.has(slug)) curated.set(slug, (curated.get(slug) ?? 0) + 1);
    }
  }
  const fillers = fillersFor(writerSlugs, curated);

  /* newest first, so the rotation hands each tag's best-fitting photo to the
     piece most likely to be on a front page rather than to whichever filler
     happens to sit at the bottom of the archive */
  const all: (Article & { views?: number })[] = [...ARTICLES, ...fillers].sort(
    (x, y) => y.date.localeCompare(x.date),
  );

  /* crawl before the wipe, not during it: between the deleteMany and the last
     insert the archive is empty, and on a container boot that window sits in
     front of the API coming up at all */
  await warmCovers(all.map((a) => a.body));

  await prisma.articleAuthor.deleteMany();
  await prisma.article.deleteMany();

  let dropped = 0;
  let missingCover = 0;
  for (const [i, a] of all.entries()) {
    /* real mocks keep their curated pairings; a filler carries its one */
    const authors = (PAIRINGS[a.slug] ?? [a.author]).filter((slug) => {
      if (idBySlug.has(slug)) return true;
      dropped++;
      console.warn(`  ${a.slug}: author "${slug}" is not in the roster — byline dropped`);
      return false;
    });
    const cover = coverFrom(a.body);
    if (!cover) missingCover++;
    const article = await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        dek: a.dek,
        category: a.tag,
        accent: a.accent,
        status: "published",
        publishedAt: new Date(a.date),
        featured: a.featured ?? false,
        body: a.body,
        coverUrl: cover?.url ?? null,
        coverCredit: cover?.credit ?? null,
        readingMinutes: readingMinutes(a.body),
        views: a.views ?? ((i * 211) % 1400) + 120,
        notionPageId: `mock-article-${a.slug}`,
        notionLastEditedAt: new Date(a.date),
      },
    });
    await prisma.articleAuthor.createMany({
      data: authors.map((slug, ord) => ({
        articleId: article.id,
        memberId: idBySlug.get(slug)!,
        ord,
      })),
    });
  }

  console.log(
    `seeded ${all.length} mock articles over the ${idBySlug.size}-member roster` +
      (dropped ? ` (${dropped} bylines dropped)` : "") +
      (missingCover ? ` — ${missingCover} with no preview image at their first 참고자료` : ""),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
