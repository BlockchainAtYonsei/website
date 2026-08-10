import { ARTICLES, type Article } from "./research";

/* Author registry. Articles carry an author slug, so a byline is one entry
   here plus one field there — renames and social-link changes touch one file.
   Individual members go here as real bylines land; until then the club entity
   is the only author. */

/* Icon rendering happens in components (icons are React elements); data stays
   plain so this module can be imported anywhere. Labels outside this union
   would render without an icon, so the type keeps them out. */
export type SocialLabel =
  | "X"
  | "Telegram"
  | "LinkedIn"
  | "Medium"
  | "Instagram"
  | "GitHub"
  | "Website";

export type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  /* avatar monogram — defaults to the first character of the name */
  mark?: string;
  socials: { label: SocialLabel; href: string }[];
};

/* Individual entries are MOCK data: bios are placeholders and social hrefs
   point at platform roots, not real accounts — swap both for the real thing
   as members hand their profiles in. The roster mirrors the research team on
   the organization page, plus 권상현. */
const mockSocials = (): Author["socials"] => [
  { label: "X", href: "https://x.com" },
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://www.linkedin.com" },
];

export const AUTHORS: Author[] = [
  {
    slug: "bay-research",
    name: "BAY Research",
    role: "Blockchain at Yonsei",
    bio: "연세대학교 블록체인 학회 BAY의 리서치 팀. 프로토콜의 설계를 뜯어보고, 숫자가 무엇을 감추는지 확인합니다.",
    mark: "BAY",
    socials: [
      { label: "X", href: "https://x.com/BlockchainatYU" },
      { label: "Telegram", href: "https://t.me/blockchain_at_yonsei" },
      {
        label: "LinkedIn",
        href: "https://kr.linkedin.com/company/blockchain-at-yonsei",
      },
      { label: "Medium", href: "https://medium.com/yonseiblockchainlab" },
      {
        label: "Instagram",
        href: "https://www.instagram.com/blockchain_at_yonsei/",
      },
    ],
  },
  {
    slug: "yerim-bae",
    name: "배예림",
    role: "리서치팀장 · 17기",
    bio: "리서치팀을 이끌며 스테이킹 파생 구조와 프로토콜 인센티브 설계를 봅니다.",
    socials: mockSocials(),
  },
  {
    slug: "jehee-noh",
    name: "노제희",
    role: "리서치팀 · 17기",
    bio: "DeFi 시장 구조와 MEV, 온체인 유동성의 이동을 추적합니다.",
    socials: mockSocials(),
  },
  {
    slug: "jaehwan-lee",
    name: "이재환",
    role: "리서치팀 · 17기",
    bio: "ZK 증명 시스템과 롤업 인프라의 비용 구조를 파고듭니다.",
    socials: mockSocials(),
  },
  {
    slug: "jaeseo-kim",
    name: "김재서",
    role: "리서치팀 · 18기",
    bio: "온체인 거버넌스와 DAO의 의사결정 구조를 데이터로 봅니다.",
    socials: mockSocials(),
  },
  {
    slug: "uihyeok-park",
    name: "박의혁",
    role: "리서치팀 · 18기",
    bio: "스테이블코인과 RWA, 온체인 금융의 신뢰 구조에 관심이 있습니다.",
    socials: mockSocials(),
  },
  {
    slug: "younghwan-shin",
    name: "신영환",
    role: "리서치팀 · 18기",
    bio: "모듈러 블록체인과 DA 레이어의 경제성을 들여다봅니다.",
    socials: mockSocials(),
  },
  {
    slug: "seongjae-lee",
    name: "이성재",
    role: "리서치팀 · 18기",
    bio: "합의 알고리즘과 노드 인프라의 안정성을 공부합니다.",
    socials: mockSocials(),
  },
  {
    slug: "chaeyun-lim",
    name: "임채윤",
    role: "리서치팀 · 18기",
    bio: "토큰 이코노미와 프로토콜 수익 모델을 분석합니다.",
    socials: mockSocials(),
  },
  {
    slug: "donghyun-jang",
    name: "장동현",
    role: "리서치팀 · 18기",
    bio: "크로스체인 브릿지와 상호운용성 프로토콜의 위험을 봅니다.",
    socials: mockSocials(),
  },
  {
    slug: "yunseon-jang",
    name: "장윤선",
    role: "리서치팀 · 18기",
    bio: "온체인 데이터 분석과 시장 미시구조에 관심이 있습니다.",
    socials: mockSocials(),
  },
  {
    slug: "hyunjae-cho",
    name: "조현재",
    role: "리서치팀 · 18기",
    bio: "지갑 UX와 계정 추상화, 온보딩 구조를 리서치합니다.",
    socials: mockSocials(),
  },
  {
    slug: "sanghyeon-kwon",
    name: "권상현",
    role: "홍보부장 · 17기",
    bio: "학회 바깥으로 나가는 글과 브랜드를 만듭니다. 시장 구조와 인프라 경제성에 대해 씁니다.",
    /* real handle — mirrors the organization page roster */
    socials: [{ label: "GitHub", href: "https://github.com/0xSHKWON" }],
  },
];

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

/* Display name with the slug as fallback, so an article whose author entry is
   missing degrades to visible text instead of a crash. */
export function authorName(slug: string): string {
  return getAuthor(slug)?.name ?? slug;
}

export function authorMark(slug: string): string {
  const author = getAuthor(slug);
  return author?.mark ?? author?.name.charAt(0) ?? slug.charAt(0);
}

export function getArticlesByAuthor(slug: string): Article[] {
  return ARTICLES.filter((a) => a.author === slug).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}
