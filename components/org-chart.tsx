"use client";

import { useState } from "react";
import BlurText from "./blur-text";
import Modal from "./modal";
import {
  ArrowUpRight,
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MediumIcon,
  TelegramIcon,
  XIcon,
} from "./icons";

export type Links = {
  github?: string;
  linkedin?: string;
  telegram?: string;
  x?: string;
  instagram?: string;
  medium?: string;
  website?: string;
};
export type Officer = {
  role: string;
  name: string;
  cohort: string;
  links?: Links;
};
export type Member = { name: string; cohort: string; links?: Links };
export type Team = {
  lead: Officer;
  team: string;
  weight: number;
  members: Member[];
};

/* What the profile dialog needs to know about whoever was tapped — `label` is
   the role for officers and the team for members. */
type Person = { name: string; cohort: string; label: string; links?: Links };

const LINK_META: {
  key: keyof Links;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { key: "github", label: "GitHub", Icon: GitHubIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "telegram", label: "Telegram", Icon: TelegramIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "medium", label: "Medium", Icon: MediumIcon },
  { key: "website", label: "Website", Icon: GlobeIcon },
];

/* Grid gap between nodes, in px — the connector maths needs it as a number,
   so `gap-6` below and this constant have to move together. */
const GAP = 24;

type Pos = { pct: number; offset: number };

/* Horizontal centre of each column in a weighted grid, as a percentage of the
   row plus a pixel nudge. The nudge exists because the gaps eat into the
   columns: with gaps, column centres are NOT at the plain fractional marks,
   and lines pinned to those marks miss every box but a dead-centre one. */
function columnCentres(weights: number[]): Pos[] {
  const total = weights.reduce((a, b) => a + b, 0);
  let before = 0;
  return weights.map((weight, i) => {
    const fraction = (before + weight / 2) / total;
    before += weight;
    return {
      pct: fraction * 100,
      offset: GAP * (i - (weights.length - 1) * fraction),
    };
  });
}

const left = ({ pct, offset }: Pos) =>
  `calc(${pct}% ${offset < 0 ? "-" : "+"} ${Math.abs(offset)}px)`;

/* The exec row borrows a 4-track grid so both cards sit near the centre while
   sharing the same coordinate space as every other tier — the outer tracks
   are just spacers. Keeping one container is what lets columnCentres line the
   connectors up without measuring anything. */
const EXEC_TRACKS = [0.55, 1.45, 1.45, 0.55];

const ROOT_CENTRE = columnCentres([1]);
const EXEC_CENTRES = columnCentres(EXEC_TRACKS).slice(1, 3);

/* the hover-revealed corner arrow every clickable card shares */
function CornerHint() {
  return (
    <ArrowUpRight className="absolute top-3.5 right-3.5 h-3.5 w-3.5 text-white/0 transition-colors duration-300 group-hover:text-white/45" />
  );
}

/* Which links a person has, right on the card, so you can tell what's there
   without opening the dialog. Decorative — the card is a button, so these
   can't be anchors; the dialog behind it holds the real, labelled links. */
function LinkGlyphs({
  links,
  reserve = false,
  className = "",
}: {
  links?: Links;
  /* keep the row's height even when empty, so cards sitting side by side in
     the team tier stay level whether or not their lead has handed links in */
  reserve?: boolean;
  className?: string;
}) {
  const has = LINK_META.filter(({ key }) => links?.[key]);
  if (has.length === 0 && !reserve) return null;

  return (
    <span
      aria-hidden
      className={`flex h-3.5 items-center gap-2 text-white/40 transition-colors duration-300 group-hover:text-white/75 ${className}`}
    >
      {has.map(({ key, Icon }) => (
        <Icon key={key} className="h-3.5 w-3.5" />
      ))}
    </span>
  );
}

/* Horizontal card — exec tier on desktop, every officer on mobile */
function NodeRow({
  role,
  name,
  cohort,
  links,
  strong,
  onClick,
}: Officer & { strong?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={`${
        strong
          ? "liquid-glass-strong shadow-[0_0_44px_rgba(47,107,255,0.16)]"
          : "liquid-glass"
      } group relative flex w-full cursor-pointer items-center overflow-hidden rounded-[1.25rem] px-5 py-4 text-left transition-transform duration-300 hover:-translate-y-1`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          strong ? "via-bay-300/70" : "via-bay-300/35"
        }`}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-bay-200">
          {role}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-body text-lg font-medium tracking-[-0.01em] whitespace-nowrap text-white md:text-xl">
            {name}
          </span>
          <span className="font-mono text-[11px] tracking-[0.15em] text-white/60">
            {cohort}
          </span>
        </span>
      </span>
      <LinkGlyphs links={links} className="mt-auto ml-auto pl-4" />
      <CornerHint />
    </button>
  );
}

/* Compact vertical card — the team tier on desktop, where columns run narrow */
function NodeCol({
  role,
  name,
  cohort,
  links,
  onClick,
}: Officer & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="liquid-glass group relative flex w-full cursor-pointer flex-col items-center gap-2.5 overflow-hidden rounded-[1.25rem] px-3 py-6 text-center transition-transform duration-300 hover:-translate-y-1"
    >
      <span
        aria-hidden
        className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-bay-300/35 to-transparent"
      />
      <span className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-bay-200">
          {role}
        </span>
        <span className="font-body text-lg font-medium tracking-[-0.01em] whitespace-nowrap text-white">
          {name}
        </span>
      </span>
      <span className="font-mono text-[11px] tracking-[0.2em] text-white/60">
        {cohort}
      </span>
      <LinkGlyphs links={links} reserve className="justify-center" />
      <CornerHint />
    </button>
  );
}

/* One person, one row: name, cohort. Quiet on purpose — the roster sits
   inside a whisper of a container so the tree's cards stay the loudest thing
   on the page. */
function MemberChip({
  name,
  cohort,
  onClick,
}: Member & { onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
      >
        <span className="font-body text-[15px] whitespace-nowrap text-white">
          {name}
        </span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.1em] whitespace-nowrap text-white/55">
          {cohort}
        </span>
      </button>
    </li>
  );
}

function Roster({
  team,
  members,
  onSelect,
}: {
  team: string;
  members: Member[];
  onSelect: (m: Member) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 px-1 pb-2.5">
        <span className="font-mono text-[11px] tracking-[0.25em] text-bay-200">
          {team}
        </span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-white/60">
          {members.length}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-x-2 gap-y-1">
        {members.map((member) => (
          <MemberChip
            key={member.name}
            {...member}
            onClick={() => onSelect(member)}
          />
        ))}
      </ul>
    </div>
  );
}

/* A stub down from every node above, one horizontal bus, a stub down into
   every node below, and a small joint where each branch leaves the bus. The
   joint stays in the lines' own tonal range — a bright glowing bead would be
   the loudest thing on the page, which inverts the hierarchy: the connector
   is the least important element in the chart. The bus spans the outermost
   stub on either side, so it reaches the wide row when the two rows differ
   in width. */
function Connector({ from, to }: { from: Pos[]; to: Pos[] }) {
  const all = [...from, ...to];
  const start = all.reduce((a, b) => (a.pct <= b.pct ? a : b));
  const end = all.reduce((a, b) => (a.pct >= b.pct ? a : b));
  const spanPx = end.offset - start.offset;

  return (
    <div aria-hidden className="relative h-14">
      {from.map((pos) => (
        <span
          key={`from-${pos.pct}`}
          className="absolute top-0 h-7 w-px -translate-x-1/2 bg-gradient-to-b from-bay-300/40 to-bay-300/15"
          style={{ left: left(pos) }}
        />
      ))}
      <span
        className="absolute top-7 h-px bg-bay-300/20"
        style={{
          left: left(start),
          width: `calc(${end.pct - start.pct}% ${
            spanPx < 0 ? "-" : "+"
          } ${Math.abs(spanPx)}px)`,
        }}
      />
      {to.map((pos) => (
        <span key={`to-${pos.pct}`}>
          <span
            className="absolute top-7 h-7 w-px -translate-x-1/2 bg-gradient-to-b from-bay-300/15 to-bay-400/50"
            style={{ left: left(pos) }}
          />
          <span
            className="absolute top-7 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bay-300/45"
            style={{ left: left(pos) }}
          />
        </span>
      ))}
    </div>
  );
}

export default function OrgChart({
  root,
  exec,
  teams,
}: {
  root: string;
  exec: Officer[];
  teams: Team[];
}) {
  const [person, setPerson] = useState<Person | null>(null);

  const tierWeights = teams.map((t) => t.weight);
  const tierCentres = columnCentres(tierWeights);

  const pickOfficer = (o: Officer) =>
    setPerson({ name: o.name, cohort: o.cohort, label: o.role, links: o.links });
  const pickMember = (team: string) => (m: Member) =>
    setPerson({ name: m.name, cohort: m.cohort, label: team, links: m.links });

  const links = LINK_META.filter(({ key }) => person?.links?.[key]);

  return (
    <>
      {/* Desktop: root, two execs, then staff stack | dev roster | research
          roster — every tier shares one grid container so the connector maths
          holds without measuring */}
      <div className="hidden md:block">
        <div className="flex min-h-[76px] items-center justify-center">
          <BlurText
            text={root}
            className="font-display text-4xl font-bold tracking-[0.14em] whitespace-nowrap text-white uppercase [text-shadow:0_0_44px_rgba(47,107,255,0.55)] lg:text-6xl"
          />
        </div>

        <Connector from={ROOT_CENTRE} to={EXEC_CENTRES} />

        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: EXEC_TRACKS.map((w) => `${w}fr`).join(" "),
          }}
        >
          <span aria-hidden />
          {exec.map((officer) => (
            <NodeRow
              key={officer.role}
              {...officer}
              strong
              onClick={() => pickOfficer(officer)}
            />
          ))}
          <span aria-hidden />
        </div>

        <Connector from={EXEC_CENTRES} to={tierCentres} />

        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: tierWeights.map((w) => `${w}fr`).join(" "),
          }}
        >
          {teams.map(({ lead, team, members }) => (
            <div key={lead.role} className="flex flex-col">
              <NodeCol {...lead} onClick={() => pickOfficer(lead)} />
              {members.length > 0 && (
                <>
                  <span
                    aria-hidden
                    className="mx-auto h-7 w-px bg-gradient-to-b from-bay-300/40 to-bay-400/50"
                  />
                  <Roster
                    team={team}
                    members={members}
                    onSelect={pickMember(team)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: same tree, folded onto a left spine. The team tier is
          stepped in — without the indent the two groups read as one flat
          list, since the spine alone carries no hierarchy. */}
      <div className="md:hidden">
        <div className="mb-10 flex justify-center">
          <BlurText
            text={root}
            className="font-display text-3xl font-bold tracking-[0.14em] whitespace-nowrap text-white uppercase [text-shadow:0_0_44px_rgba(47,107,255,0.55)]"
          />
        </div>
        <ul className="relative space-y-4 border-l border-bay-300/25 pl-7">
          {exec.map((officer) => (
            <li key={officer.role} className="relative">
              <span
                aria-hidden
                className="absolute top-1/2 -left-7 h-px w-7 bg-bay-300/25"
              />
              <NodeRow {...officer} strong onClick={() => pickOfficer(officer)} />
            </li>
          ))}
        </ul>
        <ul className="relative mt-8 ml-5 space-y-4 border-l border-bay-300/25 pl-7">
          {teams.map(({ lead, team, members }) => (
            <li key={lead.role} className="relative">
              <span
                aria-hidden
                className="absolute top-9 -left-7 h-px w-7 bg-bay-300/25"
              />
              <NodeRow {...lead} onClick={() => pickOfficer(lead)} />
              {members.length > 0 && (
                <div className="mt-3 ml-4">
                  <Roster
                    team={team}
                    members={members}
                    onSelect={pickMember(team)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* One dialog for the whole chart, fed by whoever was tapped last */}
      <Modal
        open={person !== null}
        onClose={() => setPerson(null)}
        labelledBy="profile-title"
      >
        {person && (
          <>
            <div>
              <p className="font-mono mb-1.5 text-[10px] tracking-[0.18em] text-bay-200 uppercase">
                Profile
              </p>
              <h2
                id="profile-title"
                className="font-body text-3xl leading-none font-semibold tracking-[-0.02em] text-white md:text-4xl"
              >
                {person.name}
              </h2>
            </div>

            <p className="font-body mt-6 text-[15px] font-light text-slate-300">
              {person.label} <span className="text-white/35">·</span>{" "}
              {person.cohort}
            </p>

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="font-mono mb-3 text-[10px] tracking-[0.18em] text-white/55 uppercase">
                Links
              </p>
              {links.length > 0 ? (
                <ul className="flex flex-wrap items-center gap-1">
                  {links.map(({ key, label, Icon }) => (
                    <li key={key}>
                      <a
                        href={person.links?.[key]}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        title={label}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-sm font-light text-slate-500">
                  등록된 링크가 아직 없습니다.
                </p>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
