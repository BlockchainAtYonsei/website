/* Local mock seed — full research roster + articles + news so layout work
   has a realistically shaped dataset before Notion connects.

   npm run seed:mock   (DESTRUCTIVE: wipes members/articles/news first)

   Every member gets exactly one byline via two-author pairings: the Authors
   directory lists writers only, so this is what makes the whole team visible
   there. Avatars mix pravatar placeholders with a few nulls to keep the
   no-photo rendering honest. */

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

const mockSocials = (slug: string) => [
  { label: "X", href: `https://x.com/${slug}` },
  { label: "GitHub", href: `https://github.com/${slug}` },
  { label: "LinkedIn", href: "https://www.linkedin.com" },
];

const avatar = (slug: string) => `https://i.pravatar.cc/300?u=${slug}`;

type MockMember = {
  slug: string;
  name: string;
  cohort: number;
  team: string;
  position: string;
  bio: string;
  avatarUrl: string | null;
  socials?: { label: string; href: string }[];
};

const MEMBERS: MockMember[] = [
  { slug: "yerim-bae", name: "배예림", cohort: 17, team: "리서치팀", position: "팀장", bio: "리서치팀을 이끌며 스테이킹 파생 구조와 프로토콜 인센티브 설계를 봅니다.", avatarUrl: avatar("yerim-bae") },
  { slug: "jehee-noh", name: "노제희", cohort: 17, team: "리서치팀", position: "부원", bio: "DeFi 시장 구조와 MEV, 온체인 유동성의 이동을 추적합니다.", avatarUrl: avatar("jehee-noh") },
  { slug: "jaehwan-lee", name: "이재환", cohort: 17, team: "리서치팀", position: "부원", bio: "ZK 증명 시스템과 롤업 인프라의 비용 구조를 파고듭니다.", avatarUrl: avatar("jaehwan-lee") },
  { slug: "jaeseo-kim", name: "김재서", cohort: 18, team: "리서치팀", position: "부원", bio: "온체인 거버넌스와 DAO의 의사결정 구조를 데이터로 봅니다.", avatarUrl: avatar("jaeseo-kim") },
  { slug: "uihyeok-park", name: "박의혁", cohort: 18, team: "리서치팀", position: "부원", bio: "스테이블코인과 RWA, 온체인 금융의 신뢰 구조에 관심이 있습니다.", avatarUrl: null },
  { slug: "younghwan-shin", name: "신영환", cohort: 18, team: "리서치팀", position: "부원", bio: "모듈러 블록체인과 DA 레이어의 경제성을 들여다봅니다.", avatarUrl: avatar("younghwan-shin") },
  { slug: "seongjae-lee", name: "이성재", cohort: 18, team: "리서치팀", position: "부원", bio: "합의 알고리즘과 노드 인프라의 안정성을 공부합니다.", avatarUrl: null },
  { slug: "chaeyun-lim", name: "임채윤", cohort: 18, team: "리서치팀", position: "부원", bio: "토큰 이코노미와 프로토콜 수익 모델을 분석합니다.", avatarUrl: avatar("chaeyun-lim") },
  { slug: "donghyun-jang", name: "장동현", cohort: 18, team: "리서치팀", position: "부원", bio: "크로스체인 브릿지와 상호운용성 프로토콜의 위험을 봅니다.", avatarUrl: avatar("donghyun-jang") },
  { slug: "yunseon-jang", name: "장윤선", cohort: 18, team: "리서치팀", position: "부원", bio: "온체인 데이터 분석과 시장 미시구조에 관심이 있습니다.", avatarUrl: null },
  { slug: "hyunchae-cho", name: "조현채", cohort: 18, team: "리서치팀", position: "부원", bio: "지갑 UX와 계정 추상화, 온보딩 구조를 리서치합니다.", avatarUrl: avatar("hyunchae-cho") },
  {
    slug: "sanghyeon-kwon", name: "권상현", cohort: 17, team: "홍보팀", position: "부장",
    bio: "학회 바깥으로 나가는 글과 브랜드를 만듭니다. 시장 구조와 인프라 경제성에 대해 씁니다.",
    avatarUrl: "https://github.com/0xSHKWON.png",
    socials: [{ label: "GitHub", href: "https://github.com/0xSHKWON" }],
  },
];

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

type MockNews = {
  title: string;
  url: string;
  sourceName: string;
  summary: string;
  category: string;
  publishedAt: string;
  curator?: string;
  draft?: boolean;
};

const NEWS: MockNews[] = [
  { title: "이더리움 클라이언트 다양성 보고서 — 단일 클라이언트 점유율 첫 50% 아래로", url: "https://www.theblock.co/mock/client-diversity", sourceName: "The Block", summary: "숫자보다 감소 속도가 중요하다. 슈퍼머저리티 리스크가 처음으로 협상 가능한 범위에 들어왔다.", category: "Infra", publishedAt: "2026-08-09", curator: "younghwan-shin" },
  { title: "대형 거래소, 준비금 증명에 실시간 오라클 도입", url: "https://www.coindesk.com/mock/por-oracle", sourceName: "CoinDesk", summary: "월간 어테스테이션의 관측 공백 문제를 정확히 겨냥한 변화. 다만 보관 위험은 여전히 서명자에 있다.", category: "Market", publishedAt: "2026-08-07", curator: "sanghyeon-kwon" },
  { title: "롤업 A, 스테이지 2 달성 — 보안 카운슬 권한 대폭 축소", url: "https://www.dlnews.com/mock/stage2", sourceName: "DL News", summary: "탈출구가 코드로 보장되는 첫 대형 사례. 다른 롤업들의 로드맵 발표가 이어질 것.", category: "Infra", publishedAt: "2026-08-03", curator: "jaehwan-lee" },
  { title: "하드포크 일정 확정", url: "https://theblock.co/p/1", sourceName: "The Block", summary: "검증자 이탈률 조항이 핵심.", category: "Infra", publishedAt: "2026-08-01", curator: "yerim-bae" },
  { title: "미 재무부, 스테이블코인 발행사 연방 인가 세부 규칙 공개", url: "https://www.reuters.com/mock/stablecoin-charter", sourceName: "Reuters", summary: "준비금 구성보다 환매 SLA 조항이 실질적 진입장벽. 중소 발행사 통폐합이 시작될 자리다.", category: "Regulation", publishedAt: "2026-07-24", curator: "uihyeok-park" },
  { title: "인텐트 기반 브릿지 점유율, 락앤민트 방식 첫 추월", url: "https://www.bankless.com/mock/intent-bridges", sourceName: "Bankless", summary: "솔버 담보 요건이 아직 표준화되지 않았다는 점을 기억할 것. 점유율 성장이 위험 총량 성장이기도 하다.", category: "DeFi", publishedAt: "2026-07-18", curator: "jehee-noh" },
  { title: "주요 DAO 투표율, 위임 만료제 도입 후 3배 상승", url: "https://www.decrypt.co/mock/delegation-expiry", sourceName: "Decrypt", summary: "방치된 투표권 회수가 정족수 문제의 실효적 해법임을 보여준 첫 대규모 실험.", category: "Governance", publishedAt: "2026-06-30", curator: "jaeseo-kim" },
  { title: "글로벌 은행 3곳, 토큰화 국채 결제망 공동 출범", url: "https://www.ft.com/mock/tokenized-treasuries", sourceName: "Financial Times", summary: "온체인 RWA의 유동성 분절 문제가 처음으로 발행 단에서 다뤄진다.", category: "Market", publishedAt: "2026-06-21", curator: "chaeyun-lim" },
  { title: "(초안) 다음 주 뉴스 후보", url: "https://example.com/mock/draft", sourceName: "TBD", summary: "", category: "Market", publishedAt: "2026-08-11", draft: true },
];

async function main() {
  await prisma.articleAuthor.deleteMany();
  await prisma.article.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.member.deleteMany();

  const idBySlug = new Map<string, string>();
  for (const m of MEMBERS) {
    const row = await prisma.member.create({
      data: {
        slug: m.slug,
        name: m.name,
        cohort: m.cohort,
        team: m.team,
        position: m.position,
        bio: m.bio,
        socials: m.socials ?? mockSocials(m.slug),
        avatarUrl: m.avatarUrl,
        status: "active",
        visible: true,
        notionPageId: `mock-member-${m.slug}`,
      },
    });
    idBySlug.set(m.slug, row.id);
  }

  const memberSlugs = MEMBERS.map((m) => m.slug);
  const all: (Article & { views?: number })[] = [...ARTICLES, ...FILLERS];
  for (const [i, a] of all.entries()) {
    /* real mocks keep their curated pairings; fillers rotate through the
       roster so every author page gets a multi-piece list */
    const authors =
      PAIRINGS[a.slug] ??
      [memberSlugs[i % 12], memberSlugs[(i + 5) % 12]];
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

  for (const [i, n] of NEWS.entries()) {
    await prisma.newsItem.create({
      data: {
        title: n.title,
        url: n.url,
        sourceName: n.sourceName,
        summary: n.summary,
        category: n.category,
        publishedAt: new Date(n.publishedAt),
        status: n.draft ? "draft" : "published",
        curatorId: n.curator ? idBySlug.get(n.curator) : null,
        notionPageId: `mock-news-${i}`,
      },
    });
  }

  console.log(
    `seeded ${MEMBERS.length} members, ${all.length} articles, ${NEWS.length} news items`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
