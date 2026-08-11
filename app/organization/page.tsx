import OrgChart, {
  type Member,
  type Officer,
  type Team,
} from "@/components/org-chart";
import { CLOSED_COHORT, cohortWordmark } from "@/lib/cohort";

/* Roster data. Names and cohorts only — the source sheet also carries phone
   numbers, emails and majors, and none of that belongs on a public page.
   Per-person `links` feed the profile dialog, and officers show their set as
   icons on the card itself; add keys from the Links type (github / linkedin /
   telegram / x / instagram / website) as people hand them in. Store share
   URLs stripped of their utm_* tracking tail. */
const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, "ko");

const EXEC: Officer[] = [
  {
    role: "학회장",
    name: "구예모",
    cohort: "16기",
    links: {
      linkedin: "https://www.linkedin.com/in/yemo-koo-407a02352",
      telegram: "https://t.me/yemokooo",
      x: "https://x.com/yemokoo2001",
    },
  },
  { role: "부학회장", name: "이재근", cohort: "16기" },
];

/* One column per team, 가나다 order within each. `weight` is the column's
   relative width — the two staff roles on the left carry no members, which
   frees the extra room for the two rosters on the right. */
const TEAMS: Team[] = [
  {
    lead: {
      role: "홍보부장",
      name: "권상현",
      cohort: "17기",
      links: {
        github: "https://github.com/0xSHKWON",
        linkedin: "https://www.linkedin.com/in/sanghyeon-kwon-31623438a",
        telegram: "https://t.me/perfect_attendance",
        x: "https://x.com/httpskshcokr",
        medium: "https://medium.com/@kwonsanghyeon3245",
        website: "https://shkwon.com",
      },
    },
    team: "홍보",
    weight: 1,
    members: [],
  },
  {
    lead: {
      role: "온보딩팀장",
      name: "이주호",
      cohort: "17기",
      links: {
        github: "https://github.com/lejuho",
        linkedin: "https://www.linkedin.com/in/juho-lee-a85a40263",
        telegram: "https://t.me/givmetwo",
        x: "https://x.com/juholee__",
      },
    },
    team: "온보딩",
    weight: 1,
    members: [],
  },
  {
    lead: {
      role: "개발팀장",
      name: "이호재",
      cohort: "17기",
      links: {
        github: "https://github.com/ghwo336",
        linkedin: "https://www.linkedin.com/in/hojae-lee-99400a368",
        telegram: "https://t.me/ghwo336",
        x: "https://x.com/ihojae212644",
      },
    },
    team: "개발팀",
    weight: 2.6,
    members: [
      { name: "강동인", cohort: "17기" },
      { name: "김다현", cohort: "17기" },
      { name: "김민지", cohort: "17기" },
      { name: "류민주", cohort: "17기" },
      { name: "박훈일", cohort: "17기" },
      { name: "백우헌", cohort: "17기" },
      { name: "윤민섭", cohort: "17기" },
      { name: "정연욱", cohort: "17기" },
      { name: "정윤호", cohort: "17기" },
      { name: "최석훈", cohort: "17기" },
      { name: "곽동윤", cohort: "18기" },
      { name: "김건우", cohort: "18기" },
      { name: "안정우", cohort: "18기" },
      { name: "유태연", cohort: "18기" },
      { name: "이채영", cohort: "18기" },
      { name: "전영호", cohort: "18기" },
      { name: "정연한", cohort: "18기" },
      { name: "최승원", cohort: "18기" },
      { name: "최준우", cohort: "18기" },
      { name: "최현수", cohort: "18기" },
    ].sort(byName),
  },
  {
    lead: {
      role: "리서치팀장",
      name: "배예림",
      cohort: "17기",
      links: {
        github: "https://github.com/yerim-Bae",
        linkedin:
          "https://www.linkedin.com/in/%EC%98%88%EB%A6%BC-%EB%B0%B0-6120b2288/",
        telegram: "https://t.me/DeFi_Auditor",
        medium: "https://medium.com/@yelim8694",
        website: "https://yerim-accounting.vercel.app/",
      },
    },
    team: "리서치팀",
    weight: 1.6,
    members: [
      { name: "노제희", cohort: "17기" },
      { name: "이재환", cohort: "17기" },
      { name: "김재서", cohort: "18기" },
      { name: "박의혁", cohort: "18기" },
      { name: "신영환", cohort: "18기" },
      { name: "이성재", cohort: "18기" },
      { name: "임채윤", cohort: "18기" },
      { name: "장동현", cohort: "18기" },
      { name: "장윤선", cohort: "18기" },
      { name: "조현채", cohort: "18기" },
    ].sort(byName),
  },
];

const ROOT = cohortWordmark(CLOSED_COHORT);
const MEMBER_COUNT = TEAMS.reduce((sum, t) => sum + t.members.length, 0);
const OFFICER_COUNT = EXEC.length + TEAMS.length;

export default function OrganizationPage() {
  return (
    <main className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      {/* atmosphere: a single blue bloom behind the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 10%, rgba(47,107,255,0.16) 0%, transparent 70%)",
        }}
      />

      <h1 className="sr-only">BAY Organization</h1>

      {/* full-bleed within a sane cap: the whole tree wants the width, so the
          page runs far wider than the site's usual 6xl column */}
      <div className="relative mx-auto w-full max-w-[100rem] px-6 py-14 lg:px-12">
        <p className="font-mono mb-3 text-center text-[11px] tracking-[0.35em] text-bay-200 uppercase">
          Blockchain at Yonsei
        </p>

        <OrgChart root={ROOT} exec={EXEC} teams={TEAMS} />

        <p className="font-mono mt-12 text-center text-[11px] tracking-[0.3em] text-white/55 uppercase">
          {OFFICER_COUNT} officers · {MEMBER_COUNT} members
        </p>
      </div>
    </main>
  );
}
