import type { LangCode } from "@/components/lang-provider";

/* The timeline data, bilingual. It used to live in app/page.tsx as a Korean-
   only array passed down as a prop, but the page is server-rendered and the
   language switch is a client hook — so the timeline now reads this itself via
   historyFor(lang), the same lib + helper shape teams.ts uses.

   Month labels and item text carry both languages; proper nouns (hackathon
   names, placements) read the same in either, but the month markers and the
   Korean prose around them need the pair. `hl` marks the marquee wins that
   render brighter — that is language-agnostic, so it stays a bare flag. */

type Bilingual = { KR: string; EN: string };

type HistoryItemRaw = { month?: Bilingual; text: Bilingual; hl?: boolean };
type HistoryYearRaw = { year: string; items: HistoryItemRaw[] };

export type HistoryItem = { month?: string; text: string; hl?: boolean };
export type HistoryYear = { year: string; items: HistoryItem[] };

const M = {
  feb: { KR: "2월", EN: "Feb" },
  mar: { KR: "3월", EN: "Mar" },
  apr: { KR: "4월", EN: "Apr" },
  jun: { KR: "6월", EN: "Jun" },
  aug: { KR: "8월", EN: "Aug" },
  sep: { KR: "9월", EN: "Sep" },
  oct: { KR: "10월", EN: "Oct" },
  nov: { KR: "11월", EN: "Nov" },
  dec: { KR: "12월", EN: "Dec" },
} as const;

const HISTORY: HistoryYearRaw[] = [
  {
    year: "2017",
    items: [
      {
        month: M.nov,
        text: {
          KR: "Yonsei Blockchain Lab 설립 - BAY의 시작",
          EN: "Yonsei Blockchain Lab founded — the start of BAY",
        },
      },
    ],
  },
  {
    year: "2018",
    items: [
      {
        month: M.apr,
        text: {
          KR: "이더리움 재단 MEET UP - 비탈릭 부테린과 공동 개최",
          EN: "Ethereum Foundation meetup — co-hosted with Vitalik Buterin",
        },
        hl: true,
      },
      {
        month: M.oct,
        text: {
          KR: "ABF 메인행사 'Blockcamp Seoul' 주최",
          EN: "Hosted 'Blockcamp Seoul', the main ABF event",
        },
      },
      {
        month: M.oct,
        text: {
          KR: "'블록체인 2.0 : 금융산업의 미래' 특강 진행",
          EN: "Lecture: 'Blockchain 2.0: The Future of Finance'",
        },
      },
      {
        text: {
          KR: "YSB Start-up Competition 우승",
          EN: "Won the YSB Start-up Competition",
        },
        hl: true,
      },
      {
        text: {
          KR: "'블록체인과 문화예술' 해커톤 수상",
          EN: "Award at the 'Blockchain × Arts & Culture' hackathon",
        },
        hl: true,
      },
    ],
  },
  {
    year: "2019",
    items: [
      {
        month: M.apr,
        text: {
          KR: "'블록체인 산업 발전방안에 관한 연구' 국책과제 수행기관 선정",
          EN: "Selected to run the national R&D project 'Research on Advancing the Blockchain Industry'",
        },
      },
    ],
  },
  {
    year: "2020",
    items: [
      {
        month: M.feb,
        text: {
          KR: "D.STREET 블록체인 산업연구",
          EN: "D.STREET blockchain industry research",
        },
      },
      {
        month: M.mar,
        text: { KR: "대학 파트너십 체결", EN: "University partnership signed" },
      },
      {
        month: M.sep,
        text: {
          KR: "CODA Protocol(現 MINA Protocol) AMA 개최",
          EN: "Hosted an AMA with CODA Protocol (now MINA Protocol)",
        },
      },
    ],
  },
  {
    year: "2021",
    items: [
      {
        month: M.apr,
        text: {
          KR: "CELO Mobile Make it Hackathon 3rd place",
          EN: "CELO Mobile Make it Hackathon — 3rd place",
        },
        hl: true,
      },
      {
        month: M.nov,
        text: {
          KR: "칭화대학교 블록체인 학회 THUBA NFT 연합세션",
          EN: "Joint NFT session with THUBA, Tsinghua University's blockchain society",
        },
      },
    ],
  },
  {
    year: "2022",
    items: [
      {
        month: M.apr,
        text: {
          KR: "제1회 'DAO Genesis Hackathon' 주최",
          EN: "Hosted the 1st 'DAO Genesis Hackathon'",
        },
      },
      {
        month: M.sep,
        text: {
          KR: "22년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'",
          EN: "'Beomi & Suri' NFT project for the 2022 Yonsei–Korea Games",
        },
      },
    ],
  },
  {
    year: "2023",
    items: [
      {
        month: M.sep,
        text: {
          KR: "XRPL Summer Hackathon DoraHacks 1st place",
          EN: "XRPL Summer Hackathon by DoraHacks — 1st place",
        },
        hl: true,
      },
      {
        month: M.sep,
        text: {
          KR: "23년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'",
          EN: "'Beomi & Suri' NFT project for the 2023 Yonsei–Korea Games",
        },
      },
    ],
  },
  {
    year: "2024",
    items: [
      {
        month: M.apr,
        text: {
          KR: "ETHSeoul Astar Track 2nd place",
          EN: "ETHSeoul Astar Track — 2nd place",
        },
        hl: true,
      },
      {
        month: M.apr,
        text: {
          KR: "ETHSeoul NEAR Dev Hub Track 1st place",
          EN: "ETHSeoul NEAR Dev Hub Track — 1st place",
        },
        hl: true,
      },
    ],
  },
  {
    year: "2025",
    items: [
      {
        month: M.jun,
        text: {
          KR: "XRPL 2025 Korea Hackathon 1st place",
          EN: "XRPL 2025 Korea Hackathon — 1st place",
        },
        hl: true,
      },
      {
        month: M.aug,
        text: {
          KR: "Blockthon 2025 Sponsored by Sui - 1·2·3위 석권",
          EN: "Blockthon 2025 sponsored by Sui — swept 1st, 2nd & 3rd",
        },
        hl: true,
      },
      {
        month: M.nov,
        text: { KR: "Monad Blitz 1st place", EN: "Monad Blitz — 1st place" },
        hl: true,
      },
      {
        month: M.dec,
        text: {
          KR: "Backpack Endgame 1st place",
          EN: "Backpack Endgame — 1st place",
        },
        hl: true,
      },
      {
        text: {
          KR: "Creditcoin Moonshot Idea Space Ideathon in Seoul 2nd place",
          EN: "Creditcoin Moonshot Idea Space Ideathon in Seoul — 2nd place",
        },
        hl: true,
      },
      {
        text: {
          KR: "Campu3 Ideathon by BlockchainValley - Network Track 1st place",
          EN: "Campu3 Ideathon by BlockchainValley, Network Track — 1st place",
        },
        hl: true,
      },
      {
        text: {
          KR: "Sui-mming Hackathon 2025 University Track",
          EN: "Sui-mming Hackathon 2025 University Track",
        },
        hl: true,
      },
    ],
  },
  {
    year: "2026",
    items: [
      {
        month: M.feb,
        text: {
          KR: "KOBAC 2026 Pitch Award Winner",
          EN: "KOBAC 2026 Pitch Award winner",
        },
        hl: true,
      },
      {
        month: M.apr,
        text: {
          KR: "BuidlHack 2026 Finalist - Citadel",
          EN: "BuidlHack 2026 finalist — Citadel",
        },
        hl: true,
      },
      {
        month: M.apr,
        text: {
          KR: "BuidlHack 2026 Status Network Builder Quest Winner - VESTAr",
          EN: "BuidlHack 2026 Status Network Builder Quest winner — VESTAr",
        },
        hl: true,
      },
      {
        month: M.apr,
        text: {
          KR: "BuidlHack 2026 General Track 2nd place - Challengent",
          EN: "BuidlHack 2026 General Track 2nd place — Challengent",
        },
        hl: true,
      },
      {
        text: { KR: "WorldLand Grants 수상", EN: "WorldLand Grants award" },
        hl: true,
      },
      {
        text: {
          KR: "Consensus 2026 Miami - Base + AWS Track 러너업",
          EN: "Consensus 2026 Miami, Base + AWS Track — runner-up",
        },
        hl: true,
      },
      {
        text: {
          KR: "Solana Startup Village 학생상 - Heist",
          EN: "Solana Startup Village student award — Heist",
        },
        hl: true,
      },
      {
        text: {
          KR: "고려대 AI × 블록체인 BM 대회 우수상 - 닌자랩스",
          EN: "Korea University AI × Blockchain BM Competition, Excellence Award — Ninja Labs",
        },
        hl: true,
      },
      {
        text: {
          KR: "고려대 AI × 블록체인 BM 대회 특별상 - GrowPass",
          EN: "Korea University AI × Blockchain BM Competition, Special Award — GrowPass",
        },
        hl: true,
      },
    ],
  },
];

export function historyFor(lang: LangCode): HistoryYear[] {
  return HISTORY.map((y) => ({
    year: y.year,
    items: y.items.map((it) => ({
      month: it.month?.[lang],
      text: it.text[lang],
      hl: it.hl,
    })),
  }));
}
