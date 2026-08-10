import ApplyTrigger, { CLOSED_COHORT, NEXT_COHORT } from "@/components/apply-modal";
import BlurText from "@/components/blur-text";
import {
  ArrowUpRight,
  CodeIcon,
  GlobeIcon,
  MagnifierIcon,
} from "@/components/icons";

/* The three teams are the same three pillars the home page links to — this is
   the long version of that grid, so the copy stays consistent with it. */
const TEAMS: {
  name: string;
  role: string;
  body: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  {
    name: "Research",
    role: "읽고 쓴다",
    body: "프로토콜 설계와 온체인 데이터를 뜯어보고 글로 남깁니다. 결과물은 Medium에 공개 발행되고, 내부 세션에서 먼저 반박당합니다.",
    Icon: MagnifierIcon,
  },
  {
    name: "Build",
    role: "만든다",
    body: "리서치에서 나온 아이디어를 제품까지 밀어붙입니다. 해커톤과 사이드 프로젝트가 주 무대이고, 대부분의 수상 기록이 여기서 나옵니다.",
    Icon: CodeIcon,
  },
  {
    name: "Network",
    role: "연결한다",
    body: "밋업과 해커톤을 직접 주최합니다. 이더리움 재단 밋업, ABF Blockcamp Seoul, DAO Genesis Hackathon이 이 팀에서 나왔습니다.",
    Icon: GlobeIcon,
  },
];

const FACTS: { value: string; label: string }[] = [
  { value: "2017", label: "설립" },
  { value: CLOSED_COHORT, label: "지금까지의 기수" },
  { value: "3", label: "팀" },
];

export default function OrganizationPage() {
  return (
    <main>
      {/* Masthead */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[420px]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 40%, rgba(47,107,255,0.20) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-20 md:pb-16">
          {/* the header lockup already reads "BAY Organization" — repeating it
              as a visible h1 would just say it twice */}
          <h1 className="sr-only">BAY Organization</h1>
          <p className="font-body mb-5 text-sm font-light text-white/80">
            {"// Organization"}
          </p>
          <p className="font-body max-w-2xl text-lg leading-relaxed font-light break-keep text-slate-300 md:text-xl">
            BAY는 세 팀으로 굴러갑니다. 읽는 사람, 만드는 사람, 잇는 사람이{" "}
            <span className="text-white">같은 테이블에 앉아 있는 것</span>이
            학회의 전부입니다.
          </p>
        </div>
      </section>

      {/* Teams */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <BlurText
          justify="start"
          text="Three teams, one table"
          className="font-heading text-5xl leading-[0.9] tracking-[-3px] text-white italic md:text-6xl"
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TEAMS.map(({ name, role, body, Icon }) => (
            <div
              key={name}
              className="liquid-glass flex min-h-[260px] flex-col justify-between rounded-[1.25rem] p-6"
            >
              <Icon className="h-6 w-6 text-bay-300" />
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-bay-300/70 uppercase">
                  {role}
                </p>
                <h2 className="font-heading mt-2 text-3xl leading-none tracking-[-1px] text-white italic md:text-4xl">
                  {name}
                </h2>
                <p className="font-body mt-3 text-sm leading-relaxed font-light break-keep text-slate-400">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cohorts */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <p className="font-body mb-6 text-sm font-light text-white/80">
          {"// Cohorts"}
        </p>
        <BlurText
          justify="start"
          text="A new class every cycle"
          className="font-heading text-5xl leading-[0.9] tracking-[-3px] text-white italic md:text-6xl"
        />
        <p className="font-body mt-8 max-w-2xl leading-relaxed font-light break-keep text-slate-400">
          BAY는 기수제로 운영됩니다. 새 기수가 들어오면 팀을 정하고, 한 사이클
          동안 세션과 프로젝트를 함께 끌고 갑니다. 지금까지 {CLOSED_COHORT}가
          거쳐 갔고, 다음은 {NEXT_COHORT}입니다.
        </p>

        <dl className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FACTS.map(({ value, label }) => (
            <div
              key={label}
              className="border-l border-white/10 pl-6"
            >
              <dt className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
                {label}
              </dt>
              <dd className="font-heading mt-2 text-4xl tracking-[-1px] text-white italic md:text-5xl">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-28 md:pb-36">
        <div className="liquid-glass flex flex-col items-start justify-between gap-8 rounded-[1.5rem] px-8 py-12 md:flex-row md:items-center md:px-12">
          <div>
            <h2 className="font-heading text-3xl tracking-[-1px] break-keep text-white italic md:text-4xl">
              다음 기수로 합류하세요
            </h2>
            <p className="font-body mt-3 max-w-md text-sm leading-relaxed font-light break-keep text-slate-400">
              어느 팀으로 시작할지는 들어와서 정해도 됩니다. 모집 일정은 공식
              채널로 가장 먼저 공지됩니다.
            </p>
          </div>
          <ApplyTrigger className="liquid-glass-strong font-body inline-flex shrink-0 items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]">
            지원하기
            <ArrowUpRight className="h-4 w-4" />
          </ApplyTrigger>
        </div>
      </section>
    </main>
  );
}
