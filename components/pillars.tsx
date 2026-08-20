"use client";

import { useState } from "react";
import { TEAMS, type TeamCopy } from "@/lib/teams";
import BlurText from "./blur-text";
import TeamModal from "./team-modal";
import { ArrowUpRight, CodeIcon, MagnifierIcon } from "./icons";

/* "The BAY at work" — the two cards under the mission.

   They used to be links straight out of the page: Research to the research
   site, Build to the GitHub org. Both destinations were the whole of what the
   card said. Now each card opens its team's introduction instead, and the link
   it used to be moves into that dialog's header — so the card answers "what is
   this team" first and still offers the way out, rather than only being a
   doorway to somewhere else. */

const PILLARS: {
  title: string;
  team: TeamCopy;
  link: { label: string; href: string };
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  {
    title: "Research",
    team: TEAMS.리서치팀,
    link: { label: "Research", href: "/research" },
    Icon: MagnifierIcon,
  },
  {
    title: "Build",
    team: TEAMS.개발팀,
    link: { label: "GitHub", href: "https://github.com/BlockchainAtYonsei" },
    Icon: CodeIcon,
  },
];

export default function Pillars() {
  const [open, setOpen] = useState<(typeof PILLARS)[number] | null>(null);

  return (
    <section id="activities" className="bg-ink pb-28 md:pb-36">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body mb-6 text-sm font-light text-white/80">
          {"// What we do"}
        </p>
        <BlurText
          justify="start"
          text="The BAY at work"
          className="font-heading text-5xl leading-[1.0] tracking-[-3px] text-white md:text-6xl"
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {PILLARS.map((pillar) => {
            const { title, Icon } = pillar;
            return (
              <button
                key={title}
                type="button"
                onClick={() => setOpen(pillar)}
                aria-haspopup="dialog"
                className="group liquid-glass relative flex min-h-[200px] cursor-pointer flex-col justify-between overflow-hidden rounded-[1.25rem] p-6 text-left transition-transform duration-300 hover:scale-[1.02] md:min-h-[220px]"
              >
                {/* Same three layers the research cover art uses — grid, glow,
                    oversized mark — so these cards read as the same site. The
                    mark runs off the corner on purpose: cropped, it is texture
                    rather than a second icon competing with the real one. */}
                <div
                  aria-hidden
                  className="bg-grid absolute inset-0 opacity-60"
                />
                <Icon
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -bottom-10 h-48 w-48 text-white/[0.045] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(75% 90% at 10% 0%, rgba(47,107,255,0.20) 0%, transparent 70%)",
                  }}
                />

                <Icon className="relative h-6 w-6 text-bay-300 transition-colors group-hover:text-bay-100" />
                <h3 className="font-heading relative flex items-center gap-2 text-3xl leading-none tracking-[-1px] text-white md:text-4xl">
                  {title}
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bay-200" />
                </h3>
              </button>
            );
          })}
        </div>
      </div>

      <TeamModal
        team={open?.team ?? null}
        link={open?.link}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}
