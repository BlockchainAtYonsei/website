import OrgChart, {
  type Links,
  type Member,
  type Officer,
  type Team,
} from "@/components/org-chart";
import { getRoster, type Author, type Social } from "@/lib/authors";
import { CLOSED_COHORT, cohortWordmark } from "@/lib/cohort";

/* The people come from the members API (backend Postgres, edited via
   backend/scripts/seed-members.ts) — the same rows that power the research
   author pages, so a link handed in once shows up in both places. What stays
   here is presentation: which columns exist, their order, and how much width
   each gets. `weight` is the column's relative width — the two staff roles on
   the left carry no members, which frees the extra room for the two rosters
   on the right. */
const COLUMNS = [
  { team: "홍보팀", label: "홍보", weight: 1 },
  { team: "온보딩팀", label: "온보딩", weight: 1 },
  { team: "개발팀", label: "개발팀", weight: 2.6 },
  { team: "리서치팀", label: "리서치팀", weight: 1.6 },
];

const EXEC_ORDER = ["학회장", "부학회장"];

const LINK_KEYS: Record<string, keyof Links> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  Telegram: "telegram",
  X: "x",
  Instagram: "instagram",
  Medium: "medium",
  Website: "website",
};

function toLinks(socials: Social[]): Links | undefined {
  if (socials.length === 0) return undefined;
  const links: Links = {};
  for (const s of socials) {
    const key = LINK_KEYS[s.label];
    if (key && !links[key]) links[key] = s.href;
  }
  return links;
}

const toMember = (m: Author): Member => ({
  name: m.name,
  cohort: `${m.cohort}기`,
  links: toLinks(m.socials),
});

const officer = (m: Author, role: string): Officer => ({
  role,
  ...toMember(m),
});

const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, "ko");

export default async function OrganizationPage() {
  const roster = await getRoster();

  const exec: Officer[] = roster
    .filter((m) => EXEC_ORDER.includes(m.position))
    .sort((a, b) => EXEC_ORDER.indexOf(a.position) - EXEC_ORDER.indexOf(b.position))
    .map((m) => officer(m, m.position));

  const teams: Team[] = COLUMNS.flatMap(({ team, label, weight }) => {
    const crew = roster.filter((m) => m.team === team);
    const lead = crew.find((m) => m.position !== "부원");
    if (!lead) return [];
    return [
      {
        /* "홍보팀"+"부장" → "홍보부장" — same composition the API's role uses */
        lead: officer(lead, `${team.replace(/팀$/, "")}${lead.position}`),
        team: label,
        weight,
        members: crew.filter((m) => m.position === "부원").map(toMember).sort(byName),
      },
    ];
  });

  const memberCount = teams.reduce((sum, t) => sum + t.members.length, 0);

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

        {roster.length > 0 ? (
          <>
            <OrgChart root={cohortWordmark(CLOSED_COHORT)} exec={exec} teams={teams} />

            <p className="font-mono mt-12 text-center text-[11px] tracking-[0.3em] text-white/55 uppercase">
              {exec.length + teams.length} officers · {memberCount} members
            </p>
          </>
        ) : (
          <p className="font-body mt-10 text-center text-sm font-light text-slate-400">
            명단을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}
      </div>
    </main>
  );
}
