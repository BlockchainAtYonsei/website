"use client";

import { useState } from "react";
import { teamCopy, type TeamKey } from "@/lib/teams";
import BlurText from "./blur-text";
import { useLang } from "./lang-provider";
import TeamModal from "./team-modal";
import ActivityModal from "./activity-modal";
import { ArrowUpRight, CodeIcon, MagnifierIcon, PeopleIcon } from "./icons";

/* "The BAY at work": the cards under the mission.

   Research and Build used to be links straight out of the page: Research to the
   research site, Build to the GitHub org. Both destinations were the whole of
   what the card said. Now each opens its team's introduction instead, and the
   link it used to be moves into that dialog's header, so the card answers "what
   is this team" first and still offers the way out, rather than only being a
   doorway to somewhere else. Team Activity is the third card; it opens a
   cohort/session/group browser rather than a team introduction. */

/* The team is held as a key, not as resolved copy: the language switch can be
   thrown while the dialog is open, and looking the copy up at render is what
   lets the open dialog follow it. `activity` cards have no team and open the
   activity browser instead. */
const PILLARS: {
  title: string;
  team?: TeamKey;
  activity?: boolean;
  /* Where the card used to go before it opened a dialog instead. Team Activity
     never was a doorway out, so it carries none. */
  link?: { label: string; href: string };
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  {
    title: "Research",
    team: "리서치팀",
    link: { label: "Research", href: "/research" },
    Icon: MagnifierIcon,
  },
  {
    title: "Build",
    team: "개발팀",
    link: { label: "GitHub", href: "https://github.com/BlockchainAtYonsei" },
    Icon: CodeIcon,
  },
  {
    title: "Team Activity",
    activity: true,
    Icon: PeopleIcon,
  },
];

export default function Pillars() {
  const [open, setOpen] = useState<(typeof PILLARS)[number] | null>(null);
  const { lang } = useLang();

  return (
    <section
      id="activities"
      className="snap-panel flex min-h-svh flex-col justify-center bg-ink py-24 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="font-body mb-6 text-sm font-light text-white/80">
          {"// What we do"}
        </p>
        <BlurText
          justify="start"
          text={lang === "KR" ? "BAY 활동" : "The BAY at work"}
          className="font-heading text-5xl leading-[1.0] tracking-[-3px] text-white md:text-6xl"
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
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
        team={open?.team ? teamCopy(lang, open.team) : null}
        link={open?.link}
        onClose={() => setOpen(null)}
      />

      <ActivityModal
        open={Boolean(open?.activity)}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}
