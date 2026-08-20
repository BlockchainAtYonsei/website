/* Team introductions, opened from the two cards in "The BAY at work" on the
   landing page (components/pillars). Carried over from the Notion recruiting
   page that this site replaces.

   Korean only, and knowingly out of step with the page it opens from: the
   landing page is written in English and carries the language switch, so an
   EN reader gets a wall of Korean here. Translating two personal bios and
   ~1,000 words of team copy was not part of moving them across, and a bad
   translation of someone's own introduction is worse than none. This is the
   file to add an EN table to when that is wanted.

   Keyed by team name. Nothing reads these keys dynamically any more —
   pillars.tsx names both directly — so a third entry needs a card to open it.

   Headings carry no emoji even though the source had one on each. Nothing else
   on this site uses them, and six emoji in a row inside the dialog fought with
   the mono section labels that already do this job.

   Personal contact details are dropped: the source ended both PM blocks with a
   private email and mobile number. Public professional links stay. */

export type TeamCopy = {
  title: string;
  /* Opening paragraphs, in the team lead's own voice. */
  intro: string[];
  sections: { heading: string; items: string[] }[];
  pm: {
    heading: string;
    name: string;
    bullets: string[];
    /* A named list inside the PM block — the research lead's own writing. */
    sublist?: { heading: string; items: string[] };
    closing: string[];
    /* Rendered as labelled chips. The CoinDesk piece was an inline link on one
       of the bullets in the source; it lands here rather than adding an
       inline-markup pass for a single URL. */
    links?: { label: string; href: string }[];
  };
  contactNote: string;
};

const CONTACT_NOTE = "팀 활동이 궁금하시면 메뉴의 Contact로 문의해 주세요.";

export const TEAMS: Record<string, TeamCopy> = {
  개발팀: {
    title: "개발팀",
    intro: [
      "반갑습니다. BAY 18기 개발팀장 이호재입니다.",
      "2026년 현재 Web3와 블록체인은 미래의 기술이 아니라 디지털 혁신을 이끄는 현재의 핵심 기술로 자리 잡았습니다. 스테이블코인이 송금·결제부터 디파이까지 실제로 쓰이는 단계에 들어섰고, RWA(실물자산 토큰화)나 온체인 AI 에이전트 같은 새로운 흐름이 빠르게 시장을 만들어가고 있습니다.",
      "최근 몇 년 사이 개발의 풍경도 크게 바뀌었습니다. AI 도구가 발전하면서 무언가를 만드는 일 자체는 훨씬 빨라졌습니다. 이제 진짜 경쟁력은 코드를 짜는 속도가 아니라, 이 생태계에서 무엇이 비어 있고 무엇을 만들어야 하는지를 읽어내는 안목에서 나옵니다.",
      "BAY 개발팀은 이 변화에 맞춰 생태계를 깊이 읽고 그 안에서 기회를 찾아 직접 만들어 증명하는 팀입니다. 리서치로 인사이트를 발굴하고, 비어 있는 곳을 빠르게 빌드하고, 해커톤으로 증명합니다. 개발만 하는 곳이 아니라 무엇을 왜 만드는지 아는 빌더로 성장하는 곳입니다.",
    ],
    sections: [
      {
        heading: "팀 목표",
        items: [
          "생태계 리서치로 기회를 발굴하고, 그 인사이트를 직접 dApp으로 빌딩 / 배포",
          "해커톤 / 창업 프로그램 참가 + 수상",
          "AI 시대에 맞는 빠른 빌드 역량과 생태계를 읽는 안목 함께 기르기",
          "비즈니스와 개발 지식을 결합하는 법 배우기",
        ],
      },
      {
        heading: "모집 대상",
        items: [
          "Web2 개발 경험이 있고, 블록체인과 Web3로 영역을 넓혀가고 싶은 분",
          "만드는 것뿐 아니라 무엇을 만들지 고민하는 게 즐거운 분",
          "블록체인 기술에 관심이 많은 개발자 및 현직자",
          "Web3 커리어를 생각하고 계신 분",
        ],
      },
      {
        heading: "운영 방식",
        items: [
          "체인별로 팀을 나누지 않습니다. 발굴 · 설계 · 빌드 역할이 어우러진 소규모 팀으로 움직이며, 한 팀 안에서 생태계의 빈 곳을 리서치하고 그 결과를 실제 프로젝트로 만듭니다.",
          "다루는 주제(RWA, 디파이, 디핀 등)는 고정되어 있지 않고 사이클마다 팀이 새로 정합니다. 관심사가 바뀌면 다른 주제로 갈아탈 수 있습니다.",
          "매주 정규 세션에서 팀 단위로 진행 상황을 공유하고, 개발자들은 별도 개발 세션에서 기술을 함께 깊게 다룹니다.",
          "리서치 → 빌드 → 해커톤으로 이어지는 흐름 속에서 팀 단위로 최소 1회 이상 해커톤 참여를 목표로 합니다.",
        ],
      },
      {
        heading: "신규 멤버 온보딩",
        items: [
          "블록체인을 처음 접하는 분도 따라올 수 있도록, 방학 기간에 기초부터 다지는 온보딩을 운영합니다.",
          "비트코인 · 이더리움의 작동 원리, 스테이블코인, 탈중앙화 등 꼭 알아야 할 개념을 코드보다 먼저 감으로 잡습니다.",
          "이후 개발 트랙에서는 솔리디티 기본 문법과 dApp 개발을 실습과 과제로 익혀갑니다.",
          "온보딩이 끝나면 작은 결과물 하나를 직접 완성하며 자연스럽게 본 활동으로 이어집니다.",
        ],
      },
    ],
    pm: {
      heading: "PM 소개",
      name: "이호재 (BAY 18기 개발팀장)",
      bullets: [
        "現 BAY 18기 개발팀장",
        "Injective NinjaLabs 2기",
        "ChainLens 파운더 (EasyA Kickstart 선정 · Solana 메인넷 $LENS 런칭)",
        "2026 Consensus Miami EasyA 해커톤 메인스테이지 연사",
        "2026 AI Agentic Finance Forum (Injective × Ark Point) 초청 연사",
        "2026 고려대 AI·SW·블록체인 비즈니스 모델 경진대회 우수상 (VERA)",
        "2026 WorldLand 그랜츠 Track A 선정 (Top 10)",
        "2026 Solana Startup Village 학생상",
        "2025 ICPC 서울 리저널 본선 진출 (홍익대 대표)",
        "2025 SUAPC 동상",
        "홍익대 컴퓨터공학과 4학년 · 前 HiARC(홍익 알고리즘 학회) 개발팀",
      ],
      closing: [
        "저는 개발을 깊게 파는 타입이라기보다 무엇을 만들지 기획하고 아이디어를 잡는 쪽에 가깝습니다.",
        "여러분이 잘 적응하고 온보딩할 수 있도록 최선을 다해 돕겠습니다. 같이 하나씩 배워가며 성장하면 좋겠습니다!",
      ],
      links: [
        {
          label: "CoinDesk 소개",
          href: "https://www.coindesk.com/tech/2026/05/08/ai-agents-fueled-a-frenzy-of-startup-building-at-the-consensus-miami-easya-hackathon",
        },
        { label: "X", href: "https://x.com/ihojae212644" },
      ],
    },
    contactNote: CONTACT_NOTE,
  },

  리서치팀: {
    title: "리서치팀",
    intro: [
      "반갑습니다! BAY 18기 리서치팀 Lead 배예림입니다.",
      "BAY 리서치팀은 블록체인과 Web3 생태계의 다양한 주제를 심도 있게 연구하고, 명확하고 유용한 리서치 결과물을 작성하여 공유하고 있습니다. 저희는 최신 트렌드와 기술적 발전을 지속적으로 모니터링하며, 심층적인 분석과 통찰력 있는 보고서를 통해 블록체인 생태계에 가치를 더하고자 합니다.",
      "저희는 Synfutures, Eigenlayer, Uniswap 등 여러 블록체인 재단 및 혁신적인 기업들과 긴밀한 협력 관계를 구축하고 있으며, 상호 협력을 통해 블록체인 산업의 성장과 발전에 적극적으로 기여하고 있습니다. 또한 다양한 세미나, 컨퍼런스 및 커뮤니티 이벤트에 참여하여 최신 지식을 습득하고, 블록체인과 Web3 기술에 관심 있는 모든 이들과 소통하며 함께 시너지를 내기 위해 노력하고 있습니다.",
    ],
    sections: [
      {
        heading: "팀 목표",
        items: [
          "블록체인 생태계(기술, 마켓, DeFi, …)에 대한 스터디를 바탕으로 리서치 진행",
          "각 팀원마다 한 학기에 여러 편의 리서치 및 인사이트 결과물을 Medium에 게재",
        ],
      },
      {
        heading: "운영 방식",
        items: [
          "전체 리서치 팀원을 주제에 맞게 나누어 개인 혹은 팀별로 리서치를 진행할 예정입니다. 주제는 제도권 금융의 온체인 인프라 도입, RWA 및 DePIN 생태계, 크립토마켓, 블록체인 코어 기술 및 최신 기술 등이 고려되고 있습니다. 리서치 주제들은 최대한 리서치 팀원들의 의견을 반영할 계획입니다.",
          "각 팀은 조사할 세부 주제를 정하고, 리서치 팀장에게 피드백을 받은 후 최종 결과물을 제출하면 됩니다. 리서치의 작성 타임라인과 제출 기한은 내부적으로 논의 후 정해집니다.",
        ],
      },
      {
        heading: "모집 대상",
        items: [
          "학회 차원에서 팀 단위로 블록체인과 Web3 리서치를 하고 싶은 분",
          "블록체인을 심화적으로 공부하고 싶은데 어디서부터 시작해야 할지 모르는 분",
          "자신이 공부한 내용을 다른 분들과 공유하고 싶으신 분",
          "리서치 경험을 바탕으로 커리어를 발전시키고 싶으신 분",
        ],
      },
      {
        heading: "우대 사항 (필수 아님)",
        items: [
          "블록체인 리서치 경험이 있는 분",
          "영어 리서치 작성이 가능한 분",
        ],
      },
    ],
    pm: {
      heading: "PM 소개",
      name: "배예림 (BAY 17기)",
      bullets: [
        "現 BAY 리서치팀장",
        "연세대학교 경제학과 재학",
        "58회 KICPA",
        "두나무 업클래스 앰배서더 1기 (2026.04 ~ 2026.07)",
      ],
      sublist: {
        heading: "26년 작성 리서치",
        items: [
          "RWA 온체인화를 위한 오라클 아키텍처의 진화: 미들웨어 의존성 탈피와 네이티브 합의 통합",
          "CBDC라는 외생변수: 민간 스테이블코인의 영역은 어디까지인가 [1편]",
          "CBDC라는 외생변수: 민간 스테이블코인의 영역은 어디까지인가 [2편]",
        ],
      },
      closing: ["같이 하나씩 배워가며 성장하면 좋겠습니다!"],
    },
    contactNote: CONTACT_NOTE,
  },
};
