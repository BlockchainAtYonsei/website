import Link from "next/link";
import Hero from "@/components/hero";
import ApplyTrigger from "@/components/apply-modal";
import BlurText from "@/components/blur-text";
import Partners from "@/components/partners";
import SiteFooter from "@/components/site-footer";
import {
  ArrowUpRight,
  CodeIcon,
  GlobeIcon,
  MagnifierIcon,
} from "@/components/icons";

const PILLARS: {
  title: string;
  body: string;
  href: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  {
    title: "Research",
    body: "프로토콜 설계를 뜯어보고 숫자가 감추는 것을 확인합니다.",
    href: "/research",
    Icon: MagnifierIcon,
  },
  {
    title: "Build",
    body: "해커톤과 사이드 프로젝트로 리서치를 제품까지 밀어붙입니다.",
    href: "#history",
    Icon: CodeIcon,
  },
  {
    title: "Network",
    body: "학회, 재단, 기업을 잇는 자리를 직접 만듭니다.",
    href: "#history",
    Icon: GlobeIcon,
  },
];

/* hl: standout entries (awards, wins, marquee moments) render brighter */
const HISTORY: {
  year: string;
  items: { month?: string; text: string; hl?: boolean }[];
}[] = [
  {
    year: "2026",
    items: [
      {
        month: "4월",
        text: "BuidlHack 2026 General Track 2nd place — Challengent",
        hl: true,
      },
      {
        month: "4월",
        text: "BuidlHack 2026 Status Network Builder Quest Winner — VESTAr",
        hl: true,
      },
      { month: "4월", text: "BuidlHack 2026 Finalist — Citadel", hl: true },
      { month: "2월", text: "KOBAC 2026 Pitch Award Winner", hl: true },
    ],
  },
  {
    year: "2025",
    items: [
      { month: "12월", text: "Backpack Endgame 1st place", hl: true },
      { month: "11월", text: "Monad Blitz 1st place", hl: true },
      { month: "6월", text: "XRPL 2025 Korea Hackathon 1st place", hl: true },
    ],
  },
  {
    year: "2024",
    items: [
      { month: "4월", text: "ETHSeoul NEAR Dev Hub Track 1st place", hl: true },
      { month: "4월", text: "ETHSeoul Astar Track 2nd place", hl: true },
    ],
  },
  {
    year: "2023",
    items: [
      { month: "9월", text: "23년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'" },
      { month: "9월", text: "XRPL Summer Hackathon DoraHacks 1st place", hl: true },
    ],
  },
  {
    year: "2022",
    items: [
      { month: "9월", text: "22년 정기 연고전 기념 NFT 프로젝트 '버미와 수리'" },
      { month: "4월", text: "제1회 'DAO Genesis Hackathon' 주최" },
    ],
  },
  {
    year: "2021",
    items: [
      { month: "11월", text: "칭화대학교 블록체인 학회 THUBA NFT 연합세션" },
      { month: "4월", text: "CELO Mobile Make it Hackathon 3rd place", hl: true },
    ],
  },
  {
    year: "2020",
    items: [
      { month: "9월", text: "CODA Protocol(現 MINA Protocol) AMA 개최" },
      { month: "3월", text: "대학 파트너십 체결" },
      { month: "2월", text: "D.STREET 블록체인 산업연구" },
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
    year: "2018",
    items: [
      { month: "10월", text: "'블록체인 2.0 : 금융산업의 미래' 특강 진행" },
      { text: "'블록체인과 문화예술' 해커톤 수상", hl: true },
      { text: "YSB Start-up Competition 우승", hl: true },
      { month: "10월", text: "ABF 메인행사 'Blockcamp Seoul' 주최" },
      {
        month: "4월",
        text: "이더리움 재단 MEET UP — 비탈릭 부테린과 공동 개최",
        hl: true,
      },
    ],
  },
  {
    year: "2017",
    items: [{ month: "11월", text: "Yonsei Blockchain Lab 설립 — BAY의 시작" }],
  },
];

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Mission */}
      <section id="about" className="relative bg-ink py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// What is BAY"}
          </p>
          <p className="font-heading mb-16 max-w-4xl text-3xl leading-[1.05] tracking-[-1px] text-balance text-white italic md:mb-20 md:text-4xl lg:text-5xl">
            Where the brightest minds and talents at Yonsei University learn and
            experience blockchain.
          </p>
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// Our mission"}
          </p>
          <BlurText
            justify="start"
            text="We stack blocks, we chain people."
            className="font-heading text-5xl leading-[0.95] tracking-[-3px] text-white italic md:text-6xl lg:text-[5.5rem]"
          />
          <p className="font-body mt-8 max-w-2xl leading-relaxed font-light text-slate-400">
            Founded in 2017, Blockchain at Yonsei is the first blockchain
            academy to engage and inspire young talents{" "}
            <span className="text-white">to build innovative solutions</span> in
            the blockchain and cryptocurrency industry.
          </p>
          <p className="font-body mt-6 max-w-2xl leading-relaxed font-light text-slate-400">
            Our mission is to offer in-depth expertise through our research and
            to develop a tangible change by building products with hands-on
            experience, as a team of talented researchers and engineers.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section id="activities" className="bg-ink pb-28 md:pb-36">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// What we do"}
          </p>
          <BlurText
            justify="start"
            text="Onchain craft, end to end"
            className="font-heading text-5xl leading-[0.9] tracking-[-3px] text-white italic md:text-6xl"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PILLARS.map(({ title, body, href, Icon }) => (
              <Link
                key={title}
                href={href}
                className="group liquid-glass flex min-h-[230px] flex-col justify-between rounded-[1.25rem] p-6 transition-transform duration-300 hover:scale-[1.02]"
              >
                <Icon className="h-6 w-6 text-bay-300 transition-colors group-hover:text-bay-100" />
                <div>
                  <h3 className="font-heading flex items-center gap-2 text-3xl leading-none tracking-[-1px] text-white italic md:text-4xl">
                    {title}
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bay-200" />
                  </h3>
                  {/* reserve two lines so the three titles stay on one
                      baseline regardless of how long each blurb runs */}
                  <p className="font-body mt-3 min-h-[2.9rem] text-sm leading-relaxed font-light break-keep text-slate-400">
                    {body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section id="history" className="bg-ink pb-28 md:pb-36">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// History"}
          </p>
          <BlurText
            justify="start"
            text="Building since 2017"
            className="font-heading text-5xl leading-[0.9] tracking-[-3px] text-white italic md:text-6xl"
          />
          <div className="relative mt-14 max-w-3xl border-l border-white/10 pl-10">
            {HISTORY.map((y) => (
              <div key={y.year} className="relative pb-12 last:pb-0">
                <span className="absolute top-3 -left-[44px] h-2 w-2 rounded-full bg-bay-400 shadow-[0_0_12px_rgba(95,139,255,0.9)]" />
                <h3 className="font-heading text-3xl tracking-[-1px] text-white italic md:text-4xl">
                  {y.year}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {y.items.map((item) => (
                    <li key={item.text} className="flex items-baseline gap-4">
                      <span className="font-mono w-9 shrink-0 text-[10px] tracking-widest text-bay-300/70">
                        {item.month ?? ""}
                      </span>
                      <span
                        className={`font-body text-sm break-keep ${
                          item.hl
                            ? "font-normal text-white"
                            : "font-light text-white/65"
                        }`}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Partners />

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
            text="Be the next BAY."
            className="font-heading text-5xl tracking-[-2px] text-white italic md:text-7xl"
          />
          <ApplyTrigger className="liquid-glass-strong font-body mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]">
            지원하기
            <ArrowUpRight className="h-4 w-4" />
          </ApplyTrigger>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
