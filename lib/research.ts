/* Research content layer.
   Articles are block arrays, not raw HTML/markdown — Notion's API returns blocks
   in the same shape, so swapping this module for a Notion fetch later needs a
   mapper, not a rewrite of the renderer. */

export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string; cite?: string }
  | { t: "callout"; title?: string; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "divider" };

/* cover art palettes — pulled from the hero's atmosphere gradient so research
   pages read as the same site, not a bolted-on blog */
export type Accent = "blue" | "violet" | "teal" | "indigo";

export type Article = {
  slug: string;
  title: string;
  dek: string;
  tag: string;
  accent: Accent;
  date: string; // ISO
  author: string; // author slug — resolved through lib/authors.ts
  featured?: boolean;
  body: Block[];
};

/* Placeholder editorial content — replace with real BAY research.
   Bylines are mock: articles are spread across research-team members so the
   author pages have something to show. Reassign as real pieces land. */
export const ARTICLES: Article[] = [
  {
    slug: "restaking-risk-surface",
    title: "리스테이킹의 위험 표면",
    dek: "하나의 스테이크를 여러 번 담보로 쓰는 구조는 수익을 합성하는 만큼 슬래싱도 합성한다. AVS가 늘어날수록 상관관계가 어디서 터지는지 짚는다.",
    tag: "Infra",
    accent: "indigo",
    date: "2026-07-28",
    author: "yerim-bae",
    featured: true,
    body: [
      {
        t: "p",
        text: "리스테이킹은 이미 예치된 담보를 다시 담보로 쓰는 구조다. 한 번 묶인 ETH가 이더리움 합의를 지키면서 동시에 오라클, 브릿지, DA 레이어의 보안까지 맡는다. 자본 효율이라는 관점에서는 명백한 개선이다. 문제는 **수익만 합성되는 게 아니라 실패도 합성된다**는 점이다.",
      },
      {
        t: "p",
        text: "이 글은 리스테이킹 프로토콜을 비판하려는 게 아니다. 위험이 어디에 쌓이는지, 그리고 그 위험이 언제 상관관계를 갖는지를 구조적으로 분해한다.",
      },
      { t: "h2", text: "담보 한 단위가 지는 약속의 개수" },
      {
        t: "p",
        text: "전통적인 PoS에서 밸리데이터의 손실 함수는 단순하다. 이중 서명하거나 오래 오프라인이면 슬래싱된다. 조건이 하나고, 그 조건은 프로토콜 사양에 명시돼 있다.",
      },
      {
        t: "p",
        text: "리스테이킹에서는 같은 담보가 N개의 AVS(Actively Validated Service)에 동시에 등록된다. 각 AVS는 자체 슬래싱 조건을 정의한다. 담보 한 단위가 지는 약속이 1개에서 N개로 늘어나고, 그 N개는 서로 다른 팀이 서로 다른 가정 위에서 작성한 코드다.",
      },
      {
        t: "callout",
        title: "핵심",
        text: "리스테이킹의 위험은 '얼마나 많이 걸었나'가 아니라 '몇 개의 독립적이지 않은 조건에 걸었나'로 측정해야 한다.",
      },
      { t: "h2", text: "상관관계는 어디서 생기는가" },
      {
        t: "p",
        text: "AVS들이 서로 독립이라면 분산 투자와 다를 게 없다. 실제로는 세 지점에서 상관관계가 만들어진다.",
      },
      { t: "h3", text: "1. 공유 인프라" },
      {
        t: "p",
        text: "대부분의 오퍼레이터가 같은 클라우드 리전, 같은 RPC 제공자, 같은 컨테이너 이미지를 쓴다. AVS는 논리적으로 분리돼 있어도 물리적으로는 한 장애 도메인 안에 있다. 리전 하나가 내려가면 상관없어 보이던 슬래싱 조건들이 동시에 발화한다.",
      },
      { t: "h3", text: "2. 공유 코드" },
      {
        t: "p",
        text: "AVS 대다수가 같은 미들웨어 SDK 위에 올라간다. SDK의 서명 검증 로직에 버그가 있으면 그 위의 모든 서비스가 같은 방식으로 틀린다. 감사는 개별 AVS 단위로 이뤄지지만 취약점은 공통 레이어에 있다.",
      },
      { t: "h3", text: "3. 오퍼레이터 집중" },
      {
        t: "p",
        text: "위임은 성능과 브랜드를 따라 소수 오퍼레이터로 쏠린다. 상위 오퍼레이터 몇 곳이 다수 AVS의 정족수를 동시에 차지하면, 그 오퍼레이터의 운영 실수 하나가 여러 AVS의 안전성 가정을 한꺼번에 깬다.",
      },
      {
        t: "table",
        head: ["레이어", "독립적으로 보이는 이유", "실제 공유 지점"],
        rows: [
          ["합의", "각 AVS가 자체 정족수", "오퍼레이터 집합의 중첩"],
          ["실행", "각 AVS가 자체 컨트랙트", "공통 미들웨어 SDK"],
          ["운영", "각 오퍼레이터가 자체 인프라", "클라우드 리전·RPC 제공자"],
        ],
      },
      { t: "divider" },
      { t: "h2", text: "그래서 무엇을 봐야 하나" },
      {
        t: "p",
        text: "리스테이킹 프로토콜을 평가할 때 TVL과 APY는 거의 아무것도 말해주지 않는다. 대신 다음을 본다.",
      },
      {
        t: "ul",
        items: [
          "슬래싱 조건이 사양으로 명문화돼 있는가, 아니면 거버넌스가 사후에 판단하는가",
          "오퍼레이터 집합의 중첩도 — 상위 10곳이 몇 개의 AVS 정족수를 동시에 쥐고 있는가",
          "슬래싱과 인출 사이의 지연 — 위험을 인지한 예치자가 실제로 빠져나갈 시간이 있는가",
          "AVS 추가가 옵트인인가 옵트아웃인가 — 예치자가 모르는 사이 약속이 늘어나지는 않는가",
        ],
      },
      {
        t: "quote",
        text: "담보를 재사용하는 시스템에서 안전성은 총 담보량이 아니라 가장 약한 슬래싱 조건에 의해 결정된다.",
      },
      {
        t: "p",
        text: "네 번째 항목이 특히 중요하다. 옵트아웃 구조에서는 예치자가 승인한 적 없는 위험이 계속 추가되고, 그 위험은 예치자가 다음 인출 창을 기다리는 동안에도 유효하다.",
      },
      { t: "h2", text: "정리" },
      {
        t: "p",
        text: "리스테이킹은 자본 효율을 실제로 개선한다. 다만 그 대가는 위험의 총량 증가가 아니라 위험의 **구조 변경**이다. 독립적인 여러 위험이 하나의 꼬리 위험으로 접히고, 그 꼬리는 평상시 데이터에 거의 나타나지 않는다. 평가 지표를 수익률에서 상관관계로 옮기지 않으면, 우리가 측정하고 있는 것은 위험이 없다는 사실이 아니라 아직 발생하지 않았다는 사실뿐이다.",
      },
    ],
  },
  {
    slug: "zk-proving-market",
    title: "증명 시장은 어떻게 가격을 매기는가",
    dek: "ZK 증명 생성이 외주화되면서 프루버는 인프라가 아니라 시장이 됐다. 지연, 비용, 검열저항 사이의 교환비를 뜯어본다.",
    tag: "ZK",
    accent: "violet",
    date: "2026-06-14",
    author: "jaehwan-lee",
    body: [
      {
        t: "p",
        text: "롤업이 자체 프루버를 돌리던 시절은 지나가고 있다. 증명 생성은 GPU 집약적이고, 수요는 튀고, 고정 설비를 직접 소유할 이유가 점점 줄어든다. 그 결과 증명은 서비스가 되고, 서비스가 되는 순간 가격이 붙는다.",
      },
      { t: "h2", text: "증명의 원가 구조" },
      {
        t: "p",
        text: "증명 하나의 비용은 크게 세 항목이다. 회로 크기에 비례하는 연산, 증명 키를 올리는 메모리, 그리고 결과를 온체인에 검증시키는 가스다. 앞의 두 개는 하드웨어 세대에 따라 빠르게 싸지고, 마지막 하나는 L1 수수료를 따라 움직인다.",
      },
      {
        t: "ul",
        items: [
          "연산 — 회로 크기에 준선형. 하드웨어 개선의 수혜를 가장 크게 받는다",
          "메모리 — 대형 회로에서 병목. 증명 키가 수십 GB로 커지면 인스턴스 단가가 계단식으로 뛴다",
          "검증 가스 — 증명 시스템 선택으로 결정되고 프루버가 통제할 수 없다",
        ],
      },
      { t: "h2", text: "지연이 곧 가격이다" },
      {
        t: "p",
        text: "증명 시장의 핵심 교환비는 지연과 비용이다. 같은 증명을 10분 안에 받으려면 프루버는 유휴 용량을 확보해 둬야 하고, 그 유휴 용량은 요금에 얹힌다. 반대로 여섯 시간을 기다릴 수 있으면 스팟 인스턴스의 빈 시간을 쓸 수 있다.",
      },
      {
        t: "callout",
        text: "결제 롤업과 게임 롤업이 같은 증명 시장에서 같은 가격을 낼 이유가 없다. 지연 요구가 다르면 상품이 다르다.",
      },
      { t: "h2", text: "검열저항이라는 세 번째 축" },
      {
        t: "p",
        text: "단일 프루버에 의존하는 롤업은 그 프루버가 증명을 거부하면 멈춘다. 자금이 갇히지는 않지만(대개 강제 인출 경로가 있다) 체인은 사실상 정지한다. 이 위험을 없애려면 프루버 집합을 열어야 하고, 열면 최저가 입찰이 아니라 최저가 중 실제로 제출한 자에게 지불하는 구조가 필요해진다.",
      },
      {
        t: "quote",
        text: "증명을 만들 수 있는 주체가 하나뿐이라면, 그 시스템의 활성(liveness)은 암호학이 아니라 계약에 의존한다.",
      },
      { t: "h2", text: "관전 포인트" },
      {
        t: "ol",
        items: [
          "증명 요구가 스팟에서 선물로 옮겨가는가 — 롤업이 용량을 미리 사두기 시작하면 시장이 성숙했다는 신호다",
          "하드웨어 특화가 어디까지 가는가 — ASIC이 등장하면 프루버 집합이 다시 좁아진다",
          "실패한 증명의 비용을 누가 지는가 — 이 조항이 프루버 집합의 개방성을 실질적으로 결정한다",
        ],
      },
    ],
  },
  {
    slug: "intent-settlement",
    title: "인텐트는 결제 레이어를 어떻게 바꾸는가",
    dek: "사용자가 경로 대신 결과를 서명하기 시작하면 MEV, 유동성, 실패 처리의 책임이 전부 이동한다.",
    tag: "DeFi",
    accent: "blue",
    date: "2026-05-02",
    author: "jehee-noh",
    body: [
      {
        t: "p",
        text: "기존 트랜잭션은 명령이다. '이 풀에서 이 경로로 스왑하라.' 인텐트는 조건이다. '최소 이만큼 받게 해달라, 방법은 알아서.' 이 한 줄의 차이가 실행 스택 전체를 재배치한다.",
      },
      { t: "h2", text: "책임의 이동" },
      {
        t: "p",
        text: "경로를 사용자가 정하면 슬리피지도 사용자 책임이다. 결과를 서명하면 그 책임은 솔버에게 넘어간다. 솔버는 약속한 금액을 채우지 못하면 손해를 보므로, 실행 위험의 가격이 처음으로 명시적으로 매겨진다.",
      },
      {
        t: "table",
        head: ["항목", "트랜잭션 모델", "인텐트 모델"],
        rows: [
          ["경로 선택", "사용자(또는 프론트엔드)", "솔버"],
          ["슬리피지 위험", "사용자", "솔버"],
          ["실패 시 비용", "가스 소모 후 revert", "솔버가 흡수 또는 미체결"],
          ["MEV 귀속", "블록 빌더", "경매를 통해 부분 환급 가능"],
        ],
      },
      { t: "h2", text: "MEV가 사라지는 게 아니라 재분배된다" },
      {
        t: "p",
        text: "인텐트가 MEV를 없앤다는 주장은 과장이다. 정확히는 MEV를 추출하는 위치가 블록 빌더에서 솔버 경매로 옮겨간다. 경매가 경쟁적이면 초과 가치의 상당 부분이 사용자에게 환급되고, 경쟁적이지 않으면 그냥 지대가 자리를 옮긴 것에 불과하다.",
      },
      {
        t: "callout",
        title: "그래서 봐야 할 지표",
        text: "솔버 수가 아니라 낙찰 집중도. 상위 솔버 한 곳의 낙찰 점유율이 절반을 넘으면 경매가 가격을 발견하지 못하고 있다는 뜻이다.",
      },
      { t: "h2", text: "미해결 문제" },
      {
        t: "ul",
        items: [
          "부분 체결 — 대량 주문을 쪼개면 각 조각의 조건 검증이 복잡해진다",
          "크로스체인 원자성 — 두 체인에 걸친 인텐트는 결제 완결성 시차를 솔버가 떠안는다",
          "솔버 담보 — 미이행에 대한 페널티가 약하면 약속의 신뢰도가 담보 수준으로 수렴한다",
        ],
      },
      {
        t: "p",
        text: "세 번째가 가장 덜 풀렸다. 담보 없는 약속은 시장이 조용할 때만 지켜진다.",
      },
    ],
  },
  {
    slug: "onchain-governance-turnout",
    title: "온체인 거버넌스의 투표율 문제",
    dek: "위임은 참여를 늘린 게 아니라 대리했다. 정족수 미달과 소수 위임자 집중을 데이터로 본다.",
    tag: "Governance",
    accent: "teal",
    date: "2026-03-19",
    author: "jaeseo-kim",
    body: [
      {
        t: "p",
        text: "토큰 거버넌스의 초기 약속은 넓은 참여였다. 실제로 일어난 일은 위임 집중이다. 대부분의 주요 프로토콜에서 상위 열 개 위임자가 유효 투표권의 과반을 쥔다.",
      },
      { t: "h2", text: "합리적 무관심" },
      {
        t: "p",
        text: "이건 실패가 아니라 예측 가능한 결과다. 소액 보유자가 제안 하나를 제대로 읽는 데 드는 시간 비용은 그 표가 결과를 바꿀 확률에 비해 압도적으로 크다. 주주총회에서 똑같은 일이 백 년째 벌어지고 있다.",
      },
      {
        t: "quote",
        text: "투표율이 낮은 게 문제가 아니라, 투표율이 낮아도 정당성이 유지된다고 가정하는 게 문제다.",
      },
      { t: "h2", text: "정족수 설계의 함정" },
      {
        t: "p",
        text: "정족수를 높이면 안건이 통과되지 않고, 낮추면 소수가 프로토콜을 움직인다. 많은 DAO가 이 사이에서 정족수를 사후 조정하는데, 이는 규칙을 결과에 맞추는 것이라 정당성을 더 깎아먹는다.",
      },
      {
        t: "ul",
        items: [
          "안건 유형별 차등 정족수 — 파라미터 변경과 국고 집행을 같은 문턱으로 다루지 않는다",
          "위임 만료 — 위임에 기한을 두면 방치된 투표권이 자동으로 회수된다",
          "낙관적 거버넌스 — 기본 통과에 거부권을 두면 무관심이 마비로 이어지지 않는다",
        ],
      },
      {
        t: "p",
        text: "세 번째 접근이 실무적으로 가장 유망해 보이지만, 거부권을 쥔 주체를 어떻게 뽑을지가 다시 같은 문제로 돌아온다.",
      },
    ],
  },
  {
    slug: "stablecoin-reserve-transparency",
    title: "스테이블코인 준비금 공시의 해상도",
    dek: "월간 어테스테이션은 감사도, 실시간도 아니다. 공시가 실제로 커버하는 위험과 남기는 구멍.",
    tag: "Market",
    accent: "blue",
    date: "2026-01-27",
    author: "sanghyeon-kwon",
    body: [
      {
        t: "p",
        text: "대형 스테이블코인 발행사는 대부분 월간 또는 분기 어테스테이션을 낸다. 이 문서는 특정 시점의 자산 구성을 회계법인이 확인했다는 진술이다. 감사가 아니고, 지속적 보증도 아니다.",
      },
      { t: "h2", text: "어테스테이션이 답하지 않는 질문" },
      {
        t: "ul",
        items: [
          "관측 시점 사이에 준비금이 어떻게 움직였는가",
          "준비금을 보관한 은행의 집중도는 어떤가",
          "환매 요청이 몰릴 때 며칠 안에 현금화 가능한 비중은 얼마인가",
        ],
      },
      {
        t: "p",
        text: "세 번째가 실질적으로 가장 중요한데도 표준 공시에 거의 포함되지 않는다. 만기별 분포가 나와도 유동화 소요 시간은 나오지 않는다.",
      },
      {
        t: "callout",
        text: "준비금이 100% 존재한다는 사실과 100%를 이번 주에 지급할 수 있다는 사실은 다른 진술이다.",
      },
      { t: "h2", text: "온체인 공시가 개선할 수 있는 부분" },
      {
        t: "p",
        text: "토큰화된 국채 형태로 준비금을 보유하면 관측 빈도 문제는 상당 부분 해소된다. 다만 보관 위험이 사라지는 게 아니라 발행 주체와 브릿지로 옮겨간다는 점은 그대로다.",
      },
    ],
  },
  {
    slug: "modular-da-economics",
    title: "모듈러 DA의 단가 경쟁은 어디서 멈추나",
    dek: "데이터 가용성 비용이 바닥을 치면 롤업의 차별화 축은 무엇이 되는가.",
    tag: "Infra",
    accent: "indigo",
    date: "2025-11-08",
    author: "sanghyeon-kwon",
    body: [
      {
        t: "p",
        text: "블롭 도입 이후 L2의 데이터 비용은 한 자릿수 퍼센트 수준으로 떨어졌다. DA가 더 이상 병목이 아니게 되면, 롤업이 경쟁하던 축 하나가 통째로 사라진다.",
      },
      { t: "h2", text: "비용이 0에 가까워질 때 남는 것" },
      {
        t: "p",
        text: "DA 단가가 무의미해지면 남는 차별화 요소는 세 가지다. 결제 보장의 강도, 실행 환경의 특성, 그리고 유동성의 위치다. 앞의 둘은 기술이지만 마지막은 사실상 네트워크 효과라 후발 주자가 따라잡기 가장 어렵다.",
      },
      {
        t: "quote",
        text: "인프라 비용이 상품화되면 경쟁은 성능이 아니라 배치로 옮겨간다.",
      },
      { t: "h2", text: "DA 레이어 쪽의 딜레마" },
      {
        t: "p",
        text: "DA 제공자 입장에서는 수요가 늘어도 단가가 같은 속도로 떨어지면 매출이 늘지 않는다. 결국 블록 공간을 파는 대신 결제나 공유 시퀀싱 같은 상위 서비스로 올라가려 하고, 그 순간 중립적 인프라라는 포지셔닝과 충돌한다.",
      },
    ],
  },
];

const BY_DATE = [...ARTICLES].sort((a, b) => (a.date < b.date ? 1 : -1));

export const TAGS = ["All", ...Array.from(new Set(ARTICLES.map((a) => a.tag)))];

export function getArticles(): Article[] {
  return BY_DATE;
}

export function getFeatured(): Article {
  return BY_DATE.find((a) => a.featured) ?? BY_DATE[0];
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/* Same tag first, then most recent. Never returns the article itself. */
export function getRelated(slug: string, limit = 3): Article[] {
  const self = getArticle(slug);
  if (!self) return BY_DATE.slice(0, limit);
  const pool = BY_DATE.filter((a) => a.slug !== slug);
  return [
    ...pool.filter((a) => a.tag === self.tag),
    ...pool.filter((a) => a.tag !== self.tag),
  ].slice(0, limit);
}

function blockText(b: Block): string {
  switch (b.t) {
    case "h2":
    case "h3":
    case "p":
      return b.text;
    case "quote":
      return b.text;
    case "callout":
      return `${b.title ?? ""} ${b.text}`;
    case "ul":
    case "ol":
      return b.items.join(" ");
    case "table":
      return [...b.head, ...b.rows.flat()].join(" ");
    default:
      return "";
  }
}

/* Korean reads slower per character than English per word; 500 chars/min is the
   figure Korean publishing tools generally use. Always at least 1. */
export function readingMinutes(a: Article): number {
  const chars = a.body.map(blockText).join("").length;
  return Math.max(1, Math.round(chars / 500));
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

/* Headings become TOC anchors. Korean is valid in an id and in a URL fragment,
   so keep it rather than dropping to an opaque index. */
export function headingId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug ? `${slug}-${index}` : `section-${index}`;
}

export type TocEntry = { id: string; text: string; level: 2 | 3 };

export function getToc(a: Article): TocEntry[] {
  return a.body.flatMap((b, i) =>
    b.t === "h2" || b.t === "h3"
      ? [{ id: headingId(b.text, i), text: b.text, level: b.t === "h2" ? 2 : 3 } as const]
      : [],
  );
}
