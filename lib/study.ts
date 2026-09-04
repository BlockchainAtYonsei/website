/* The 리서치팀's RWA 스터디 — nine sessions read straight through the Xangle
   RWA Series, one article a week.

   This started life as a separate static site (bayresearch2026-web/bay-rwa-study)
   whose whole screen was drawn from one `window.STUDY` object. Only that object
   came across; the markup and stylesheet did not, because the study now renders
   in the research property's own idiom. So this file is the same shape the old
   site read — meta, defaults, sessions — as typed data, and everything the pages
   derive from it (running order, timetable, next-up) is computed here rather
   than in JSX.

   Emphasis inside copy is written as **…**, not <b>…</b>. The source data used
   HTML because it was injected with innerHTML; here it is React, and a marker
   the page parses beats a string the page has to trust.

   Within a session, `assign` runs in the article's own order — the sheet is
   read against the article. Across sessions, the run is the team's order — 기초(생태계·렌딩) → 전통자산
   (주식·채권) → 대체자산 → 체인(솔라나) → 인프라(커스터디·지갑) → 규제 — which is
   not the order Xangle published them in. To reorder, move the blocks and
   renumber `no`/`date`; note that date-bound facts (누구의 불참 등) stay with the
   date, not with the content. */

export type SessionStatus = "tbd" | "ready" | "done";

/** A numbered slice of the article's table of contents — "2-1." and its title. */
export type Part = { n: string; t: string };

/** One part of the running order, in the article's own order. `who` is a
    presenter's name, or EVERYONE for a stretch the room reads together (a
    short intro or outro) — that is still a part, it just has no presenter.
    One person can hold two parts when their sections aren't adjacent in the
    table of contents; the list follows the article, not the roster. */
export type Assignment = {
  who: string;
  parts: Part[];
  focus?: string;
  /* An operator filling a gap outside the six-member rotation. The part still
     shows in the running order, but `slotCount` skips it so the headcount stays
     the study's cohort of six rather than counting the operator as a seventh. */
  extra?: boolean;
};

export const EVERYONE = "전원";

/** What a session leaves behind: 발표자료, PDF, 정리본, 참고 링크. `url` is either
    an external link or a deck under /study/materials. `pending` holds the row
    open for a file that has not landed yet. */
export type StudyRecord = {
  kind: string;
  title: string;
  who?: string;
  part?: string;
  url?: string;
  pending?: boolean;
};

export type Source = { label: string; url: string; short: string };
export type Step = { n: number; t: string; d: string };
export type PrepRow = {
  when: string;
  who: string;
  what?: string;
  list?: string[];
  note?: string;
};

export type Session = {
  no: number;
  topic: string;
  title: { accent: string; rest: string };
  status: SessionStatus;
  date: string;
  source: Source | null;
  /* A double-article session reads two pieces at once, so it carries both
     links here; `source` stays the single representative one for the card and
     the metadata, and the detail page lists `sources` when it is set. */
  sources?: Source[];
  assign: Assignment[];
  records: StudyRecord[];
  /* Per-session overrides. A session that sets any of these runs differently
     from the rest, which is what `isCustom` reports so the page can say so. */
  minutesPerSlot?: number;
  steps?: Step[];
  prep?: PrepRow[];
  flowNote?: string;
};

export const STUDY_META = {
  eyebrow: "BAY Research Team",
  accent: "RWA",
  rest: "Study Archive",
  sub: "리서치팀이 Xangle RWA Series를 9주에 걸쳐 완독합니다.",
  /* A shared Notion page, once there is one — the hero's button stays hidden
     while this is empty rather than linking nowhere. */
  notionUrl: "",
} as const;

/* House rules every session inherits unless it overrides them. */
export const STUDY_DEFAULTS = {
  memberCount: 6,
  totalMinutes: 150,
  minutesPerSlot: 25,
  /* No questions submitted in advance — they are taken live in the last five
     minutes of each slot. */
  flowNote:
    "인당 25분 · 담당 설명 10분 + 막혔던 부분·추가 설명 10분 + 즉석 질문 5분",
  steps: [
    { n: 1, t: "담당 구간 설명", d: "10분" },
    { n: 2, t: "막혔던 부분 · 추가 설명", d: "10분" },
    { n: 3, t: "즉석 질문", d: "5분" },
  ] as Step[],
  prep: [
    {
      when: "D-7",
      who: "운영자",
      what: "아티클 링크 + 담당 배분표 배포,\n공용 노션 페이지 개설",
    },
    { when: "D-7 ~ D-2", who: "전원", what: "아티클 **전체 1회 통독**" },
    {
      when: "D-1까지",
      who: "전원",
      list: [
        "담당 구간 **재독**",
        "담당 구간에서 이해가 안 되는 문장·단어를 **추가 공부**하고, 그 내용을 문서화해 노션에 업로드",
        "발표에서 **추가로 설명하고 싶은 내용** 정리",
      ],
      note: "사전 질문 제출은 없습니다. 질문은 각 발표 끝 5분에 즉석으로 합니다",
    },
  ] as PrepRow[],
} as const;

export const SESSIONS: Session[] = [
  {
    no: 1,
    topic: "RWA 토큰화 생태계 분류",
    title: { accent: "RWA Ecosystem", rest: "Study Guide" },
    status: "ready",
    date: "2026-08-04",
    source: {
      label: "Xangle Research · RWA 토큰화 생태계 분류와 주요 사례",
      url: "https://xangle.io/research/detail/2479",
      short: "xangle.io/research/detail/2479"
    },
    assign: [
      {
        who: EVERYONE,
        parts: [{ n: "1.", t: "들어가며" }],
        focus: "짧은 도입이라 발표자를 두지 않습니다. 통독 때 함께 읽고 넘어갑니다"
      },
      {
        who: "이재환",
        parts: [
          { n: "2-1.", t: "스테이블코인 생태계 개요" },
          { n: "2-2.", t: "법정화폐 담보형 스테이블코인" },
          { n: "2-3.", t: "가상자산 담보형 스테이블코인" },
          { n: "2-4.", t: "합성/델타중립형 스테이블코인" }
        ],
        focus: "스테이블코인 생태계 전체 구도 / 담보형·합성형의 작동 방식과 리스크 차이"
      },
      {
        who: "배예림",
        parts: [{ n: "3-1.", t: "전통자산 토큰화 생태계 개요" }],
        focus: "전통자산 토큰화의 전체 구도: 뒤에 나오는 주식·채권을 읽는 프레임",
        /* 운영자가 채운 구간 — 인원수(6명)에는 세지 않습니다. */
        extra: true
      },
      {
        who: "신영환",
        parts: [{ n: "3-2.", t: "직접 발행형 주식" }, { n: "3-3.", t: "간접 발행형 주식" }],
        focus: "주식 토큰화의 직접·간접 발행 구분 기준과 대표 사례"
      },
      {
        who: "이성재",
        parts: [{ n: "3-4.", t: "직접 발행형 채권" }, { n: "3-5.", t: "채권 펀드/토큰화 국채 펀드" }],
        focus: "채권 토큰화 방식과 토큰화 국채 펀드의 위치"
      },
      {
        who: "장윤선",
        parts: [{ n: "4-1.", t: "대체자산 토큰화 생태계 개요" }],
        focus: "대체자산 토큰화 전체 구도: 뒤에 나오는 자산군들을 읽는 프레임"
      },
      {
        who: "노제희",
        parts: [{ n: "4-2.", t: "부동산 직접 권리·등기 연동형" }, { n: "4-3.", t: "부동산 간접 지분형" }],
        focus: "부동산 두 방식(등기 연동 vs 지분형)의 차이"
      },
      {
        who: "박의혁",
        parts: [{ n: "4-4.", t: "원자재 실물 보관형" }, { n: "4-6.", t: "수집품 실물 보관형 NFT" }],
        focus: "원자재·수집품의 실물 보관 구조와 청구권 설계"
      },
      {
        who: "배예림",
        parts: [{ n: "4-5.", t: "사모신용 펀드 지분형" }],
        focus: "사모신용 펀드 지분형의 구조",
        extra: true
      },
      {
        who: EVERYONE,
        parts: [{ n: "5.", t: "마무리" }],
        focus: "짧은 마무리라 발표자를 두지 않습니다. 통독 때 함께 읽고 넘어갑니다"
      }
    ],
    records: [
      {
        kind: "발표자료",
        title: "2-1 ~ 2-4. 스테이블코인 생태계 지도",
        who: "이재환",
        part: "3가지 유형 · 7개 레이어 · UST와 USDe 비교",
        url: "/study/materials/s1-2-1-2-4-stablecoins.html"
      },
      {
        kind: "발표자료",
        title: "3-1. 전통자산 토큰화 생태계 개요",
        who: "배예림",
        part: "9개 레이어 정리 · BUIDL 사례",
        url: "/study/materials/s1-3-1-tradfi-tokenization.html"
      },
      {
        kind: "발표자료",
        title: "3-2 · 3-3. 주식이 블록체인 위로 올라간다면?",
        who: "신영환",
        part: "성냥갑 비유 강의 · Exodus vs Backed AAPLx",
        url: "/study/materials/s1-3-2-3-3-equities.html"
      },
      {
        kind: "발표자료",
        title: "3-4. 직접 발행형 채권",
        who: "이성재",
        part: "슬라이드 9장 · EIB Bond 사례",
        url: "/study/materials/s1-3-4-direct-bonds.html"
      },
      {
        kind: "발표자료",
        title: "3-5. 채권 펀드 / 토큰화 국채 펀드",
        who: "이성재",
        part: "슬라이드 10장 · BUIDL 사례",
        url: "/study/materials/s1-3-5-bond-funds.html"
      },
      {
        kind: "발표자료",
        title: "4-1. 대체자산 토큰화 생태계 지도",
        who: "장윤선",
        part: "자산 유형 5분류 · 9개 레이어 · 회사별 수익구조",
        url: "/study/materials/s1-4-1-alt-assets-map.html"
      },
      {
        kind: "PDF",
        title: "4-2 · 4-3. 부동산 토큰화",
        who: "노제희",
        part: "슬라이드 23장 · 두바이 DLD·PRYPCO · RedSwan",
        url: "/study/materials/s1-4-2-4-3-real-estate.pdf"
      },
      {
        kind: "발표자료",
        title: "4-4 · 4-6. 원자재 · 수집품 실물 보관형 토큰화",
        who: "박의혁",
        part: "PAXG · Courtyard 사례 · 보관/청구권 설계",
        url: "/study/materials/s1-4-4-4-6-vault-backed.html"
      },
      {
        kind: "발표자료",
        title: "4-5. 사모신용 펀드 지분형 토큰화",
        who: "배예림",
        part: "Apollo ACRED · 심화자료 5편",
        url: "/study/materials/s1-4-5-private-credit.html"
      }
    ]
  },
  {
    no: 2,
    topic: "디파이 : 렌딩",
    title: { accent: "DeFi Lending", rest: "Study Guide" },
    status: "ready",
    date: "2026-08-11",
    source: {
      label: "Xangle RWA Series · 디파이 : 렌딩",
      url: "https://xangle.io/research/detail/2521",
      short: "xangle.io/research/detail/2521"
    },
    assign: [
      {
        who: EVERYONE,
        parts: [{ n: "1.", t: "토큰화의 목적은 자산의 활용" }],
        focus: "짧은 도입이라 발표자를 두지 않습니다. 통독 때 함께 읽고 넘어갑니다"
      },
      {
        who: "박의혁",
        parts: [
          { n: "2-1.", t: "가상자산을 담보로 활용하는 렌딩 프로토콜" },
          {
            n: "2-2.",
            t: "가상자산이 아닌 실물자산을 담보로 활용한다면 (렌딩과 CDP / 통합 시장과 격리 시장 / 비허가형과 허가형)"
          }
        ],
        focus: "온체인 렌딩의 기본 작동 방식 / 뒤 사례를 읽는 3개 축:\n렌딩 vs CDP, 통합 vs 격리 시장, 비허가형 vs 허가형"
      },
      {
        who: "장윤선",
        parts: [{ n: "3-1. (1)", t: "Aave Horizon : 허가형 렌딩 프로토콜" }],
        focus: "Aave Horizon의 허가형 설계: 누가 참여할 수 있는지를 프로토콜이 어떻게 통제하는가"
      },
      {
        who: "신영환",
        parts: [{ n: "3-1. (2)", t: "Morpho : 격리 시장형 렌딩 프로토콜" }],
        focus: "Morpho의 격리 시장 설계: 담보별로 시장을 나누면 위험이 어떻게 갈리는가"
      },
      {
        who: "노제희",
        parts: [{ n: "3-1. (3)", t: "Kamino : 솔라나 최대 렌딩 프로토콜" }],
        focus: "Kamino의 구조와 규모 (9회차 솔라나 편과 연결)"
      },
      {
        who: "이성재",
        parts: [
          { n: "3-1. (4)", t: "Jupiter Lend : 토큰화 주식의 렌딩 프로토콜" },
          { n: "3-1. (5)", t: "Loopscale : 금리와 만기를 지정하는 렌딩 프로토콜" }
        ],
        focus: "토큰화 주식을 담보로 받을 때의 차이 / 금리·만기 지정형 렌딩의 구조"
      },
      {
        who: "이재환",
        parts: [
          { n: "3-2. (1)", t: "Sky : 배분자가 토큰화 자산을 매입하는 CDP" },
          { n: "3-2. (2)", t: "Falcon Finance : 토큰화 자산을 직접 담보로 수용하는 CDP 프로토콜" }
        ],
        focus: "CDP 두 방식 비교: 배분자를 거치는 Sky vs 직접 담보로 받는 Falcon Finance"
      },
      {
        who: EVERYONE,
        parts: [{ n: "4.", t: "마치며: 전통 금융과 디파이의 경계가 흐려지고 있다" }],
        focus: "짧은 마무리라 발표자를 두지 않습니다. 통독 때 함께 읽고 넘어갑니다"
      }
    ],
    records: [
      {
        kind: "배경자료",
        title: "00. 2-1과 2-2 조금 더 쉽게 이해해보기",
        who: "배예림",
        part: "과담보 · 청산 · 오라클 · 시장 구조 · 큐레이터까지",
        url: "/study/materials/s2-00-lending-easy.html"
      },
      {
        kind: "PDF",
        title: "00. 2-1과 2-2 조금 더 쉽게 이해해보기 (PDF 버전)",
        who: "배예림",
        part: "위 자료와 같은 내용 · 13쪽 · 인쇄용",
        url: "/study/materials/s2-00-lending-easy.pdf"
      },
      {
        kind: "발표자료",
        title: "2-1 · 2-2. 토큰화 자산은 어떻게 담보가 되는가",
        who: "박의혁",
        part: "과담보 · LTV · 프로토콜을 가르는 3개 축 · 렌딩/CDP 비교",
        url: "/study/materials/s2-2-1-2-2-collateral.html"
      },
      {
        kind: "보충자료",
        title: "2-1 · 2-2 보충. 전당포에서 온체인까지",
        who: "박의혁",
        part: "헤어컷 · Repo · CLO 등 전통금융 담보 구조와의 대조",
        url: "/study/materials/s2-2-1-2-2-tradfi-supp.html"
      },
      {
        kind: "발표자료",
        title: "3-1 (1). Aave Horizon: 허가형 렌딩 프로토콜",
        who: "장윤선",
        part: "3가지 분류축 · 예치~차입 6단계 · 허가형 자산 + 비허가형 유동성",
        url: "/study/materials/s2-3-1-1-aave-horizon.html"
      },
      {
        kind: "발표자료",
        title: "3-1 (2). Morpho: 격리 시장 렌딩 프로토콜",
        who: "신영환",
        part: "다섯 부품으로 여는 방 · 큐레이터 · 네 프로토콜 비교",
        url: "/study/materials/s2-3-1-2-morpho.html"
      },
      {
        kind: "PDF",
        title: "3-1 (3). Kamino: 솔라나 최대 렌딩 프로토콜",
        who: "노제희",
        part: "슬라이드 9장 · 큐레이터의 역할 · ONyc 재보험 사례",
        url: "/study/materials/s2-3-1-3-kamino.pdf"
      },
      {
        kind: "발표자료",
        title: "3-1 (4). Jupiter Lend: 토큰화 주식의 렌딩 프로토콜",
        who: "이성재",
        part: "xStocks 담보 편입 · 공용 풀 + 종목별 볼트 구조",
        url: "/study/materials/s2-3-1-4-jupiter-lend.html"
      },
      {
        kind: "발표자료",
        title: "3-1 (5). Loopscale: 금리와 만기를 지정하는 렌딩",
        who: "이성재",
        part: "오더북 기반 매칭 · 체결 시점에 조건 고정 · 담보별 시장 분리",
        url: "/study/materials/s2-3-1-5-loopscale.html"
      },
      {
        kind: "발표자료",
        title: "3-2. Sky vs Falcon Finance: CDP 두 방식",
        who: "이재환",
        part: "DeFi 1.0~4.0 · Pendle · 스테이블코인 진화 · 렌딩/CDP 비교",
        url: "/study/materials/s2-3-2-sky-falcon.html"
      }
    ]
  },
  {
    no: 3,
    topic: "토큰화 주식",
    title: { accent: "Tokenized Equities", rest: "Study Guide" },
    status: "ready",
    date: "2026-08-18",
    source: {
      label: "Xangle RWA Series · 토큰화 주식",
      url: "https://xangle.io/research/detail/2496",
      short: "xangle.io/research/detail/2496"
    },
    assign: [
      {
        who: "신영환",
        parts: [
          { n: "1-1.", t: "본 리서치의 목적" },
          { n: "1-2.", t: "중요한 것은 형식이 아니라 실질이다" },
          { n: "2-1.", t: "주식 토큰화를 이해하기 위한 미국 증권 보유 구조" },
          { n: "2-2.", t: "SEC의 토큰화 증권 분류 방식" }
        ],
        focus: "미국 증권 보유 구조와 SEC 분류 기준: 뒤 5개 방식을 읽는 공통 프레임"
      },
      {
        who: "노제희",
        parts: [{ n: "3-1.", t: "직접 발행형" }, { n: "4-1.", t: "직접 발행형의 장단점 및 유의사항" }],
        focus: "직접 발행형의 상품 구조·주요 플레이어와 장단점"
      },
      {
        who: "배예림",
        parts: [{ n: "3-2.", t: "증권 권리형" }, { n: "4-2.", t: "증권 권리형의 장단점 및 유의사항" }],
        focus: "증권 권리형의 상품 구조·주요 플레이어와 장단점"
      },
      {
        who: "이성재",
        parts: [{ n: "3-3.", t: "연계 증권형" }, { n: "4-3.", t: "연계 증권형의 장단점 및 유의사항" }],
        focus: "연계 증권형의 상품 구조·주요 플레이어와 장단점"
      },
      {
        who: "장윤선",
        parts: [{ n: "3-4.", t: "파생 계약형" }, { n: "4-4.", t: "파생 계약형의 장단점 및 유의사항" }],
        focus: "파생 계약형의 상품 구조·주요 플레이어와 장단점"
      },
      {
        who: "이재환",
        parts: [
          { n: "3-5.", t: "무기한 선물형" },
          { n: "4-5.", t: "무기한 선물형의 장단점 및 유의사항" },
          { n: "5.", t: "마무리: 주식 토큰화는 결국 제도권으로 향한다" }
        ],
        focus: "무기한 선물형의 구조와 장단점 / 5개 방식 비교와 글 전체 결론"
      }
    ],
    records: [
      {
        kind: "발표자료",
        title: "1-1 ~ 2-2. 그 토큰, 진짜 주식일까?",
        who: "신영환",
        part: "약자 사전 · 3층 장부 구조 · 5방식 판별 프레임 · 케이스 훈련",
        url: "/study/materials/s3-1-1-2-2-framework.html"
      },
      {
        kind: "PDF",
        title: "3-1 · 4-1. 직접 발행형",
        who: "노제희",
        part: "슬라이드 9장 · Securitize · Superstate · 권리와 유통의 균형",
        url: "/study/materials/s3-3-1-direct-issuance.pdf"
      },
      {
        kind: "발표자료",
        title: "3-2 · 4-2. 증권 권리형",
        who: "배예림",
        part: "원문 문단별 해설 · DTC 노액션 레터 · 간접 보유 구조",
        url: "/study/materials/s3-3-2-security-entitlement.html"
      },
      {
        kind: "발표자료",
        title: "3-3 · 4-3. 연계 증권형",
        who: "이성재",
        part: "Backed xStocks vs Ondo · Rebasing vs Total Return · 의결권",
        url: "/study/materials/s3-3-3-linked-security.html"
      },
      {
        kind: "발표자료",
        title: "3-4 · 4-4. 파생 계약형",
        who: "장윤선",
        part: "CFD 구조 · 플랫폼의 헤지와 상계 · Robinhood · Bybit",
        url: "/study/materials/s3-3-4-derivative.html"
      },
      {
        kind: "발표자료",
        title: "3-5 · 4-5. 무기한 선물형과 Neobank",
        who: "이재환",
        part: "5방식 비교 · 제도권으로 향하는 이유 · RWA 유통 레이어",
        url: "/study/materials/s3-3-5-neobank.html"
      }
    ]
  },
  {
    no: 4,
    topic: "디파이 : 탈중앙화 거래소",
    title: { accent: "DeFi DEX", rest: "Study Guide" },
    status: "ready",
    date: "2026-09-01",
    source: {
      label: "Xangle RWA Series · 디파이 : 탈중앙화 거래소",
      url: "https://xangle.io/research/detail/2532",
      short: "xangle.io/research/detail/2532"
    },
    assign: [
      {
        who: "배예림",
        parts: [
          { n: "1.", t: "토큰화 자산의 거래" },
          { n: "2-1.", t: "현물 거래" },
          { n: "2-2.", t: "무기한 선물 거래" },
          { n: "3.", t: "토큰화 자산 거래시장을 설계할 때 고려할 요소" },
          { n: "6.", t: "결론 : 토큰화 자산의 거래시장은 아직 초기 단계" }
        ],
        focus: "현물·무기한 선물의 구분과 거래시장 설계 요소 · 뒤 다섯 프로토콜을 읽는 공통 프레임과 결론"
      },
      {
        who: "장윤선",
        parts: [{ n: "4-1.", t: "유동성 풀로 직접 시장을 개설하는 방식" }],
        focus: "유동성 풀로 시장을 여는 방식의 작동 원리와 한계"
      },
      {
        who: "박의혁",
        parts: [{ n: "4-2.", t: "전문 사업자가 유동성을 운영하는 방식" }],
        focus: "전문 사업자가 유동성을 운영하는 구조 / 풀 방식과의 차이"
      },
      {
        who: "이성재",
        parts: [{ n: "4-3.", t: "전문 체결자의 호가를 활용하는 방식" }],
        focus: "전문 체결자의 호가를 활용한 체결·가격 형성 구조"
      },
      {
        who: "노제희",
        parts: [{ n: "4-4.", t: "여러 거래 경로를 묶어 사용자에게 연결하는 방식" }],
        focus: "여러 경로를 묶어 연결하는 구조 · 앞 세 방식을 어떻게 조합하는가"
      },
      {
        who: "이재환",
        parts: [{ n: "5.", t: "무기한 선물 DEX 프로토콜" }],
        focus: "무기한 선물 DEX의 구조 / 현물 DEX와의 차이"
      }
    ],
    records: [
      {
        kind: "발표자료",
        title: "1 · 2 · 3 · 6. 토큰화 자산의 거래와 DEX",
        who: "배예림",
        part: "Atomic Settlement · Programmability · Composability · AMM vs CLOB · Intent 네 역할",
        url: "/study/materials/s4-1-3-6-tokenized-assets-dex.html"
      },
      {
        kind: "발표자료",
        title: "4-1. 유동성 풀로 직접 시장을 개설하는 방식",
        who: "장윤선",
        part: "Uniswap 허가형 풀·Fee Switch · PancakeSwap · Orca GLDY · Curve StableSwap",
        url: "/study/materials/s4-4-1-liquidity-pool.html"
      },
      {
        kind: "PDF",
        title: "4-2. 전문 사업자가 유동성을 운영하는 방식",
        who: "박의혁",
        part: "슬라이드 6장 · LVR · Prop AMM · Inventory Skewing · LaaS 프로토콜 사례",
        url: "/study/materials/s4-4-2-prop-amm-laas.pdf"
      },
      {
        kind: "발표자료",
        title: "4-3. 전문 체결자의 호가를 활용하는 방식",
        who: "이성재",
        part: "Intent · RFQ · UniswapX · PancakeSwapX · Native · 직접 써본 UI 비교",
        url: "/study/materials/s4-4-3-rfq-quotes.html"
      },
      {
        kind: "PDF",
        title: "4-4. 여러 거래 경로를 묶어 사용자에게 연결하는 방식",
        who: "노제희",
        part: "슬라이드 10장 · 여러 거래 경로를 묶어 사용자에게 연결하는 구조",
        url: "/study/materials/s4-4-4-routing.pdf"
      },
      {
        kind: "PDF",
        title: "5. 무기한 선물 DEX 프로토콜",
        who: "이재환",
        part: "슬라이드 10장 · Hyperliquid · Lighter · Aster 비교 · RWA Perp 시장",
        url: "/study/materials/s4-5-perp-dex.pdf"
      }
    ]
  },
  {
    no: 5,
    topic: "토큰화 채권 · 토큰화 대체자산",
    title: { accent: "Bonds & Alt Assets", rest: "Study Guide" },
    status: "ready",
    date: "2026-09-08",
    source: {
      label: "Xangle RWA Series · 토큰화 채권 · 토큰화 대체자산 (2편)",
      url: "https://xangle.io/research/detail/2508",
      short: "xangle.io/research/detail/2508"
    },
    /* Two articles read in one sitting, so both links ride along; `source`
       above is the representative one for the card and metadata. */
    sources: [
      {
        label: "토큰화 채권",
        url: "https://xangle.io/research/detail/2508",
        short: "xangle.io/research/detail/2508"
      },
      {
        label: "토큰화 대체자산",
        url: "https://xangle.io/research/detail/2517",
        short: "xangle.io/research/detail/2517"
      }
    ],
    assign: [
      {
        who: "배예림",
        parts: [
          { n: "채권 1.", t: "채권 시장의 규모 · 채권 토큰화의 출발점 (1-1 ~ 1-2)" },
          { n: "채권 4.", t: "한국의 토큰화 채권 실험과 관전 포인트 (4-1 ~ 4-2)" },
          { n: "대체 1~2.", t: "대체자산의 종류와 토큰화가 겨냥하는 문제 (1 ~ 2-2)" },
          { n: "대체 4~5.", t: "조각투자 · 토큰증권 제도화와 남은 과제 · 마무리 (4-1 ~ 5)" }
        ],
        focus: "두 아티클의 도입 프레임(시장 규모·권리 구조 / 대체자산의 범위와 문제)과 제도·결론 · 자산 방식 발표들을 앞뒤에서 묶는 역할"
      },
      {
        who: "장윤선",
        parts: [
          { n: "채권 2-1.", t: "직접 발행형" },
          { n: "채권 2-2.", t: "증권 권리형" }
        ],
        focus: "직접 발행형·증권 권리형 채권의 구조와 대표 사례"
      },
      {
        who: "이성재",
        parts: [
          { n: "채권 2-3.", t: "펀드 지분형" },
          { n: "채권 2-4.", t: "연계 증권형" }
        ],
        focus: "펀드 지분형·연계 증권형의 구조 / 앞 두 방식과의 권리 차이"
      },
      {
        who: "박의혁",
        parts: [
          { n: "채권 3.", t: "온체인 현금관리 · 디파이 담보 · 마진 담보 · 스테이블코인 준비자산 (3-1 ~ 3-4)" },
          { n: "대체 3-1.", t: "부동산: 등기와 임대수익을 온체인 지분으로" },
          { n: "대체 3-2.", t: "원자재: 금고의 실물을 온체인 청구권으로" }
        ],
        focus: "토큰화 채권이 현금관리·담보·준비자산으로 쓰이는 방식 / 등기·임대수익의 온체인 지분화 / 실물 보관과 청구권 설계"
      },
      {
        who: "노제희",
        parts: [{ n: "대체 3-3.", t: "수집품: 보관된 실물자산에 대한 권리의 토큰화" }],
        focus: "수집품 토큰화의 권리 구조 / 가치평가와 유동성 문제"
      },
      {
        who: "이재환",
        parts: [{ n: "대체 3-4.", t: "신용: 사모신용과 구조화 신용의 토큰화" }],
        focus: "사모신용·구조화 신용의 토큰화 구조 / 다른 자산군 대비 리스크 성격"
      }
    ],
    records: []
  },
  {
    no: 6,
    topic: "솔라나 RWA 주요 플레이어",
    title: { accent: "Solana RWA", rest: "Study Guide" },
    status: "ready",
    date: "2026-09-15",
    source: {
      label: "Xangle RWA Series · 솔라나 RWA : 주요 플레이어 살펴보기",
      url: "https://xangle.io/research/detail/2494",
      short: "xangle.io/research/detail/2494"
    },
    assign: [
      {
        who: "박의혁",
        parts: [{ n: "1-1.", t: "토큰화의 확산" }, { n: "1-2.", t: "인터넷 자본시장을 향하는 솔라나" }],
        focus: "RWA 시장 현황 / 솔라나가 인터넷 자본시장을 겨냥하는 방식과 체인 특성"
      },
      {
        who: "장윤선",
        parts: [{ n: "2-1.", t: "국채·MMF" }, { n: "2-2.", t: "주식" }],
        focus: "솔라나 위 국채·MMF와 주식 발행 플레이어 / 상품 구조와 규모"
      },
      {
        who: "배예림",
        parts: [{ n: "2-3.", t: "사모·구조화 신용" }, { n: "2-4.", t: "대체자산(금, 수집품)" }],
        focus: "사모·구조화 신용과 대체자산 발행 플레이어 / 다른 자산군과의 차이"
      },
      {
        who: "이재환",
        parts: [{ n: "3.", t: "오라클·데이터 플레이어" }],
        focus: "RWA에 오라클·데이터가 필요한 이유 / 주요 플레이어와 데이터 공급 구조"
      },
      {
        who: "이성재",
        parts: [{ n: "4-1.", t: "담보 대출 시장" }],
        focus: "토큰화 자산이 담보로 쓰이는 방식 / 솔라나 담보 대출 시장의 플레이어"
      },
      {
        who: "노제희",
        parts: [{ n: "4-2.", t: "거래 및 유동성" }, { n: "5.", t: "마무리" }],
        focus: "거래·유동성 레이어의 플레이어 / 솔라나 RWA 생태계 전체 정리"
      }
    ],
    records: []
  },
  {
    no: 7,
    topic: "커스터디 / KMS",
    title: { accent: "Custody & KMS", rest: "Study Guide" },
    status: "ready",
    date: "2026-09-22",
    source: {
      label: "Xangle RWA Series · 커스터디/KMS",
      url: "https://xangle.io/research/detail/2499",
      short: "xangle.io/research/detail/2499"
    },
    assign: [
      {
        who: "박의혁",
        parts: [
          { n: "1-1.", t: "전통 금융에서 커스터디가 해온 역할" },
          { n: "1-2.", t: "디지털자산에서 커스터디가 달라지는 이유" },
          { n: "1-3.", t: "디지털자산 보관 인프라를 보는 두 층위" }
        ],
        focus: "전통 커스터디와 디지털자산 커스터디의 차이 / 이 글이 쓰는 두 층위 프레임"
      },
      {
        who: "이성재",
        parts: [
          { n: "2-1.", t: "기존 금융기관의 편입 경로" },
          { n: "2-2.", t: "전용 가상자산사업자 인가 경로" },
          { n: "2-3.", t: "두 경로가 남기는 차이" }
        ],
        focus: "수탁 인가 두 경로의 요건 비교 / 기관 지위가 실제로 남기는 차이"
      },
      {
        who: "배예림",
        parts: [{ n: "3-1.", t: "자산 이전 권한: 키관리와 서명 통제" }],
        focus: "KMS의 핵심: 키 생성·보관·서명 통제 방식과 MPC·HSM 등 구현 차이"
      },
      {
        who: "장윤선",
        parts: [
          { n: "3-2.", t: "자산 귀속과 반환 가능성: 고객자산 분리 구조" },
          { n: "3-3.", t: "거래 중 자산 노출: 담보·정산 구조" },
          { n: "3-4.", t: "정리" }
        ],
        focus: "고객자산 분리와 도산격리 / 거래 중 자산이 노출되는 지점과 담보·정산 구조"
      },
      {
        who: "이재환",
        parts: [{ n: "4-1.", t: "규제 수탁기관" }, { n: "4-2.", t: "기술 인프라" }],
        focus: "규제 수탁기관과 기술 인프라 벤더의 포지션 차이 / 대표 벤더 비교"
      },
      {
        who: "노제희",
        parts: [
          { n: "4-3.", t: "표에 넣지 않은 벤더" },
          { n: "4-4.", t: "비교 결과 요약" },
          { n: "5.", t: "결론" }
        ],
        focus: "비교표에서 빠진 벤더를 왜 뺐는지 / 벤더 비교 요약과 글 전체 결론"
      }
    ],
    records: []
  },
  {
    no: 8,
    topic: "지갑 인프라",
    title: { accent: "Wallet Infra", rest: "Study Guide" },
    status: "ready",
    date: "2026-09-29",
    source: {
      label: "Xangle RWA Series · 지갑 인프라",
      url: "https://xangle.io/research/detail/2520",
      short: "xangle.io/research/detail/2520"
    },
    assign: [
      {
        who: "배예림",
        parts: [
          { n: "1.", t: "들어가며" },
          { n: "2-1.", t: "외부지갑 연결형" },
          { n: "2-2.", t: "서비스 내 지갑 제공형 (사용자 통제형 / 사업자 통제형)" }
        ],
        focus: "사용자 지갑 분류 기준 / 통제 주체가 사용자냐 사업자냐에 따라 갈리는 지점"
      },
      {
        who: "이성재",
        parts: [
          { n: "3-1.", t: "고객자산 서비스 지갑" },
          { n: "3-2.", t: "기업자산 운영 지갑 (외부수탁형 / 직접수탁형)" }
        ],
        focus: "기업형 지갑 분류 / 외부수탁과 직접수탁의 책임·리스크 차이 (4회차 커스터디와 연결)"
      },
      {
        who: "장윤선",
        parts: [
          { n: "4-1.", t: "지갑 인프라 시장의 구성" },
          { n: "4-2.", t: "사용자 지갑 인프라: Kresus · Privy · Dynamic" }
        ],
        focus: "지갑 인프라 시장 지도 / 사용자 지갑 벤더 3곳의 제품 방향 차이"
      },
      {
        who: "박의혁",
        parts: [{ n: "4-3.", t: "기업형 지갑 인프라: Anchorage Digital · BitGo · Fireblocks" }],
        focus: "기업형 지갑 벤더 3곳의 규제 지위·기술 구조·타깃 고객 비교"
      },
      {
        who: "노제희",
        parts: [
          { n: "5-1.", t: "비교 기준 (보안·규제 / 지원 네트워크·자산 / 토큰·RWA 기능 / 제품 제공 방식)" },
          { n: "5-2.", t: "사용자 지갑 인프라 비교" }
        ],
        focus: "벤더를 가르는 네 가지 비교 기준 / 사용자 지갑 인프라 비교 결과"
      },
      {
        who: "이재환",
        parts: [{ n: "5-3.", t: "기업형 지갑 / 수탁 인프라 비교" }, { n: "6.", t: "결론" }],
        focus: "기업형 지갑·수탁 인프라 비교 결과 / RWA 관점에서 지갑 인프라 선택 기준 정리"
      }
    ],
    records: []
  },
  {
    no: 9,
    topic: "컴플라이언스",
    title: { accent: "Compliance", rest: "Study Guide" },
    status: "ready",
    date: "2026-10-06",
    source: {
      label: "Xangle RWA Series · 컴플라이언스",
      url: "https://xangle.io/research/detail/2512",
      short: "xangle.io/research/detail/2512"
    },
    assign: [
      {
        who: "이성재",
        parts: [
          { n: "1.", t: "토큰화에서 컴플라이언스가 복잡해지는 이유" },
          { n: "2-1.", t: "기초자산의 권리" },
          { n: "2-2.", t: "가상자산" }
        ],
        focus: "토큰화에서 컴플라이언스가 복잡해지는 이유 / 토큰이 담은 권리에 따른 규제 구분 / VASP·AML·제재 규제의 기본 구조"
      },
      {
        who: "이재환",
        parts: [{ n: "2-3.", t: "발행과 판매 관할" }],
        focus: "미국·EU·싱가포르·ADGM의 발행·판매 규제 비교 / 관할별 핵심 차이"
      },
      {
        who: "배예림",
        parts: [{ n: "3-1.", t: "투자자 검증" }],
        focus: "투자자 검증(KYC·KYB·적격성 심사) / 각 플레이어의 역할과 책임 구조"
      },
      {
        who: "노제희",
        parts: [{ n: "3-2.", t: "자금세탁방지 · 거래 모니터링" }],
        focus: "AML·거래 모니터링(KYT·트래블룰) / 네 플레이어의 비교"
      },
      {
        who: "장윤선",
        parts: [
          { n: "3-3.", t: "전송 통제" },
          { n: "3-4.", t: "자산 검증" },
          { n: "4-1.", t: "미국을 포함하는 증권형 토큰: 블랙록 BUIDL" },
          { n: "4-2.", t: "미국을 배제하는 증권형 토큰: xStocks" }
        ],
        focus: "전송 통제·자산 검증 / BUIDL과 xStocks의 컴플라이언스 구조 비교"
      },
      {
        who: "박의혁",
        parts: [
          { n: "3-5.", t: "스마트컨트랙트 보안" },
          { n: "4-3.", t: "결제 스테이블코인: PayPal PYUSD" },
          { n: "4-4.", t: "금 담보 토큰: Matrixdock XAUm" },
          { n: "5.", t: "결론" }
        ],
        focus: "스마트컨트랙트 보안 / PYUSD·XAUm의 컴플라이언스 구조 / 글 전체 결론 정리"
      }
    ],
    records: []
  }
];

/* ---- derived values ---------------------------------------------------- */

/** "01", "09" — session numbers are set as two digits everywhere on the site. */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** `new Date("2026-08-04")` parses as UTC midnight, which in KST is already the
    4th but west of Greenwich is still the 3rd — a study that meets on Tuesday
    would print 월요일 for half the world. Passing the parts builds local
    midnight instead, so the weekday is the one on the team's calendar. */
export function sessionDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const dow = DOW[new Date(Number(y), Number(mo) - 1, Number(d)).getDay()];
  return {
    short: `${Number(mo)}/${Number(d)}`,
    long: `${Number(mo)}월 ${Number(d)}일 (${dow})`,
    dow,
  };
}

/** Distinct presenters. Parts follow the article, so one person can hold two
    and a stretch can belong to the room — the head count and the clock are
    per person, not per part. */
export function slotCount(s: Session): number {
  const people = new Set(
    s.assign
      .filter((a) => !a.extra)
      .map((a) => a.who)
      .filter((w) => w !== EVERYONE),
  );
  return people.size || STUDY_DEFAULTS.memberCount;
}

/* Optional session, like `prepOf` below: the index page describes the house
   rules and has no session to read an override from. */
export function slotMinutes(s?: Session): number {
  return s?.minutesPerSlot ?? STUDY_DEFAULTS.minutesPerSlot;
}

export function totalMinutes(s: Session): number {
  return slotCount(s) * slotMinutes(s);
}

export function stepsOf(s?: Session): readonly Step[] {
  return s?.steps ?? STUDY_DEFAULTS.steps;
}

export function prepOf(s?: Session): readonly PrepRow[] {
  return s?.prep ?? STUDY_DEFAULTS.prep;
}

export function flowNoteOf(s: Session): string {
  return s.flowNote ?? STUDY_DEFAULTS.flowNote;
}

/** Does this session depart from the house rules? Drives the "이 회차만
    다릅니다" notes, so it has to be true exactly when an override exists. */
export function isCustom(s: Session): boolean {
  return Boolean(s.steps || s.prep || s.minutesPerSlot || s.flowNote);
}

/** "01회차 · 컴플라이언스" — the pager's label and the browser title. */
export function sessionLabel(s: Session): string {
  return `${pad2(s.no)}회차 · ${s.topic}`;
}

/** The first session that has not happened yet, for the 다음 세션 badge. Takes
    the day rather than reading the clock so a page renders the same badge for
    every request inside its revalidation window. */
export function nextSessionNo(today: Date): number | null {
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  for (const s of SESSIONS) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.date);
    if (!m) continue;
    const at = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    if (at >= cutoff) return s.no;
  }
  return null;
}

export function findSession(no: string | number): Session | undefined {
  return SESSIONS.find((s) => s.no === Number(no));
}

/** Prev/next in reading order, not by number — the two only agree while nobody
    has reshuffled the array. */
export function neighbours(s: Session) {
  const i = SESSIONS.indexOf(s);
  return { prev: SESSIONS[i - 1], next: SESSIONS[i + 1] };
}


/* ---- presenters ---------------------------------------------------------- */

/** The study's people, keyed by the name the session data uses. A thin map
    over the site's member roster rather than a roster of its own: photos are
    the ones in public/members, cohorts the ones in the seed script, and the
    sessions above keep naming people by name so editing a 회차 stays a data
    edit. Someone not listed here still renders — the avatar falls back to a
    monogram — so a guest presenter doesn't need an entry to appear. */
export type StudyMember = { slug: string; cohort: number; avatar: string };

export const STUDY_MEMBERS: Record<string, StudyMember> = {
  배예림: { slug: "yerim-bae", cohort: 17, avatar: "/members/yerim-bae.webp" },
  노제희: { slug: "jehee-noh", cohort: 17, avatar: "/members/jehee-noh.webp" },
  이재환: { slug: "jaehwan-lee", cohort: 17, avatar: "/members/jaehwan-lee.webp" },
  박의혁: { slug: "uihyeok-park", cohort: 18, avatar: "/members/uihyeok-park.webp" },
  신영환: { slug: "younghwan-shin", cohort: 18, avatar: "/members/younghwan-shin.webp" },
  이성재: { slug: "seongjae-lee", cohort: 18, avatar: "/members/seongjae-lee.webp" },
  장윤선: { slug: "yunseon-jang", cohort: 18, avatar: "/members/yunseon-jang.webp" },
};

export function memberOf(name: string): StudyMember | undefined {
  return STUDY_MEMBERS[name];
}
