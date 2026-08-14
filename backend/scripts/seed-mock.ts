/* Mock articles — the one dataset still waiting on its real Notion DB.

   npm run seed:mock   (DESTRUCTIVE for articles only: wipes and re-creates
   them; members and news are never touched)

   The roster is real (seed:members) and news tracking syncs from the 리서치
   Notion, so this script owns exactly what is still mock: the research
   articles. Bylines attach to the real member rows by slug — a pairing whose
   slug has left the roster drops with a warning rather than failing the
   seed. */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readingMinutes } from "../src/notion/reading-time";
import { ARTICLES, type Article, type Block } from "./mock-articles";

try {
  process.loadEnvFile();
} catch {
  /* env comes from the shell */
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/* ---- filler articles: enough volume to exercise the archive layout ----
   Titles/bodies are deliberately rough ("대충") — they exist to answer "what
   does the index look like at 60 pieces", not to read. Deterministic
   pseudo-randomness (index arithmetic) keeps reruns identical. */

const FILLER_COUNT = 54;

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

const FILLER_BODY = (title: string): Block[] => [
  { t: "p", text: `${title}에 대한 목업 본문이다. 레이아웃 검증용 채움 글로, 실제 리서치가 Notion 동기화로 이 자리를 대체한다.` },
  { t: "h2", text: "구조" },
  { t: "p", text: "첫 번째 축은 비용이고 두 번째 축은 신뢰 가정이다. 두 축이 교차하는 지점에서 설계 선택이 갈린다." },
  { t: "ul", items: ["관찰 가능한 지표부터 정리한다", "반례가 되는 사례를 찾는다", "지표가 무너지는 조건을 명시한다"] },
  { t: "quote", text: "채움 글에도 인용 블록은 하나 있어야 리듬이 보인다." },
  { t: "h2", text: "정리" },
  { t: "p", text: "결론 문단. 본문 길이가 카드 요약과 읽기 시간 계산에 영향을 주는지 확인하기 위한 두어 문장이다." },
];

/* newest filler sits between the real mocks; dates walk back ~2 weeks per
   piece so the archive spans 2024–2026 */
function fillerDate(i: number): string {
  const d = new Date(Date.UTC(2026, 6, 20));
  d.setUTCDate(d.getUTCDate() - i * 14 - (i % 5));
  return d.toISOString().slice(0, 10);
}

const FILLERS: (Article & { views: number })[] = Array.from(
  { length: FILLER_COUNT },
  (_, i) => {
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
      author: "",
      body: FILLER_BODY(title),
      views: ((i * 137) % 880) + 25,
    };
  },
);

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

  await prisma.articleAuthor.deleteMany();
  await prisma.article.deleteMany();

  let dropped = 0;
  const all: (Article & { views?: number })[] = [...ARTICLES, ...FILLERS];
  for (const [i, a] of all.entries()) {
    /* real mocks keep their curated pairings */
    const authors = (
      PAIRINGS[a.slug] ?? [
        writerSlugs[i % writerSlugs.length],
        writerSlugs[(i + 5) % writerSlugs.length],
      ]
    ).filter((slug) => {
      if (idBySlug.has(slug)) return true;
      dropped++;
      console.warn(`  ${a.slug}: author "${slug}" is not in the roster — byline dropped`);
      return false;
    });
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
      (dropped ? ` (${dropped} bylines dropped)` : ""),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
