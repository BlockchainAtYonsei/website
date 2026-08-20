import Hero from "@/components/hero";
import ApplyTrigger from "@/components/apply-modal";
import BlurText from "@/components/blur-text";
import HistoryTimeline from "@/components/history-timeline";
// import Partners from "@/components/partners";
import Pillars from "@/components/pillars";
import SiteFooter from "@/components/site-footer";

/* hl: standout entries (awards, wins, marquee moments) render brighter */
const HISTORY: {
  year: string;
  items: { month?: string; text: string; hl?: boolean }[];
}[] = [
  {
    year: "2017",
    items: [{ month: "11월", text: "Yonsei Blockchain Lab 설립 — BAY의 시작" }],
  },
  {
    year: "2018",
    items: [
      {
        month: "4월",
        text: "이더리움 재단 MEET UP — 비탈릭 부테린과 공동 개최",
        hl: true,
      },
      { month: "10월", text: "ABF 메인행사 'Blockcamp Seoul' 주최" },
      { month: "10월", text: "'블록체인 2.0 : 금융산업의 미래' 특강 진행" },
      { text: "YSB Start-up Competition 우승", hl: true },
      { text: "'블록체인과 문화예술' 해커톤 수상", hl: true },
    ],
  },
  {
    year: "2019",
    items: [
      {
        month: "4월",
        text: "'블록체인 산업 발전방안에 관한 연구' 국책과제 수행기관 선정",
      },
    ],
  },
  {
    year: "2020",
    items: [
      { month: "2월", text: "D.STREET 블록체인 산업연구" },
      { month: "3월", text: "대학 파트너십 체결" },
      { month: "9월", text: "CODA Protocol(現 MINA Protocol) AMA 개최" },
    ],
  },
  {
    year: "2021",
    items: [
      { month: "4월", text: "CELO Mobile Make it Hackathon 3rd place", hl: true },
      { month: "11월", text: "칭화대학교 블록체인 학회 THUBA NFT 연합세션" },
    ],
  },
  {
    year: "2022",
    items: [
      { month: "4월", text: "제1회 'DAO Genesis Hackathon' 주최" },
      { month: "9월", text: "22년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'" },
    ],
  },
  {
    year: "2023",
    items: [
      { month: "9월", text: "XRPL Summer Hackathon DoraHacks 1st place", hl: true },
      { month: "9월", text: "23년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'" },
    ],
  },
  {
    year: "2024",
    items: [
      { month: "4월", text: "ETHSeoul Astar Track 2nd place", hl: true },
      { month: "4월", text: "ETHSeoul NEAR Dev Hub Track 1st place", hl: true },
    ],
  },
  {
    year: "2025",
    items: [
      { month: "6월", text: "XRPL 2025 Korea Hackathon 1st place", hl: true },
      { month: "11월", text: "Monad Blitz 1st place", hl: true },
      { month: "12월", text: "Backpack Endgame 1st place", hl: true },
    ],
  },
  {
    year: "2026",
    items: [
      { month: "2월", text: "KOBAC 2026 Pitch Award Winner", hl: true },
      { month: "4월", text: "BuidlHack 2026 Finalist — Citadel", hl: true },
      {
        month: "4월",
        text: "BuidlHack 2026 Status Network Builder Quest Winner — VESTAr",
        hl: true,
      },
      {
        month: "4월",
        text: "BuidlHack 2026 General Track 2nd place — Challengent",
        hl: true,
      },
    ],
  },
];

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Mission */}
      {/* Asymmetric vertical padding: the top gap opens the section after the
          hero, but the bottom only has to clear the label rhythm inside — the
          full py-36 left a void between the mission copy and "// What we do". */}
      <section
        id="about"
        className="relative bg-ink pt-28 pb-24 md:pt-36 md:pb-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// What is BAY"}
          </p>
          <p className="font-heading mb-8 max-w-4xl text-3xl leading-[1.15] tracking-[-1px] text-balance text-white md:mb-10 md:text-4xl lg:text-5xl">
            Where the brightest minds and talents at Yonsei University learn and
            experience blockchain.
          </p>
          <p className="font-body max-w-2xl leading-relaxed font-light text-slate-400">
            Founded at Yonsei University in 2017, Blockchain at Yonsei (BAY) is{" "}
            <span className="text-white">
              Korea’s first and largest university blockchain community
            </span>
            .
          </p>
          <p className="font-body mt-6 mb-16 max-w-2xl leading-relaxed font-light text-slate-400 md:mb-20">
            Our members explore blockchain through research, engineering, and
            ecosystem building, collaborating with leading industry partners
            while contributing to the broader Web3 ecosystem.
          </p>
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// Our mission"}
          </p>
          <BlurText
            justify="start"
            text="First movers, still moving."
            className="font-heading text-5xl leading-[1.05] tracking-[-3px] text-white md:text-6xl lg:text-[5.5rem]"
          />
          <p className="font-body mt-8 max-w-2xl leading-relaxed font-light text-slate-400">
            Our mission is to offer in-depth expertise through our research and
            to develop a tangible change by building products with hands-on
            experience, as a team of talented researchers and engineers.
          </p>
        </div>
      </section>

      {/* Capabilities — the two cards and their team dialogs */}
      <Pillars />

      {/* History — pinned; vertical scroll drives the horizontal track */}
      <HistoryTimeline history={HISTORY} />

      {/* Partners — held back on purpose. Some of the organizations listed
          are not formal partnerships, and the section shows their logos, so
          it stays off the page until the roster is confirmed. The component
          and its logo files are intact; drop the comment to bring it back. */}
      {/* <Partners /> */}

      {/* CTA */}
      <section id="apply" className="relative overflow-hidden bg-ink py-28 md:py-40">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(47,107,255,0.55), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <BlurText
            text="Be the next BAY"
            className="font-heading text-5xl tracking-[-2px] text-white md:text-7xl"
          />
          {/* label omitted on purpose — the trigger reads the language switch,
              which this server-rendered page cannot */}
          <ApplyTrigger className="liquid-glass-strong font-body mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
