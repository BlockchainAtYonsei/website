"use client";

import type { TeamCopy } from "@/lib/teams";
import { ArrowUpRight } from "./icons";
import Modal from "./modal";

/* The team introduction behind a roster header on /organization.

   Long-form and read top to bottom, so nothing here collapses: someone who
   opened 개발팀 wants the whole thing, unlike the recruiting FAQ where seven
   questions were a menu to pick one from. The dialog scrolls instead. */

const EYEBROW = "font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase";

const BULLET = "font-body text-sm leading-relaxed font-light break-keep text-slate-300";

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          {/* A rule rather than a disc: the items run long enough to wrap, and
              a dot at the head of a four-line paragraph reads as noise. */}
          <span
            aria-hidden
            className="mt-[0.6em] h-px w-2.5 shrink-0 bg-bay-300/60"
          />
          <span className={BULLET}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TeamModal({
  team,
  onClose,
}: {
  team: TeamCopy | null;
  onClose: () => void;
}) {
  return (
    <Modal open={team !== null} onClose={onClose} labelledBy="team-title">
      {team && (
        <>
          <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
            Team
          </p>
          <h2
            id="team-title"
            className="font-heading text-3xl leading-[1.15] tracking-[-1px] break-keep text-white md:text-4xl"
          >
            {team.title}
          </h2>

          <div className="mt-6 space-y-4">
            {team.intro.map((p) => (
              <p
                key={p}
                className="font-body max-w-xl leading-relaxed font-light break-keep text-slate-400"
              >
                {p}
              </p>
            ))}
          </div>

          {team.sections.map(({ heading, items }) => (
            <section key={heading} className="mt-9">
              <h3 className={`${EYEBROW} mb-3.5`}>{heading}</h3>
              <Bullets items={items} />
            </section>
          ))}

          <section className="mt-10 border-t border-white/10 pt-8">
            <h3 className={`${EYEBROW} mb-3.5`}>{team.pm.heading}</h3>
            <p className="font-body mb-4 text-base font-medium break-keep text-white">
              {team.pm.name}
            </p>
            <Bullets items={team.pm.bullets} />

            {team.pm.sublist && (
              <div className="mt-6 rounded-[0.9rem] border border-white/10 px-5 py-4">
                <p className={`${EYEBROW} mb-3`}>{team.pm.sublist.heading}</p>
                <Bullets items={team.pm.sublist.items} />
              </div>
            )}

            <div className="mt-6 space-y-3">
              {team.pm.closing.map((p) => (
                <p
                  key={p}
                  className="font-body max-w-xl text-sm leading-relaxed font-light break-keep text-slate-400"
                >
                  {p}
                </p>
              ))}
            </div>

            {team.pm.links && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {team.pm.links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-body inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                    >
                      {label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* no mailto, no phone number — both PM blocks ended with one in the
              source, and the form is the only inquiry channel this site has */}
          <p className="font-body mt-9 text-xs leading-relaxed font-light break-keep text-slate-500">
            {team.contactNote}
          </p>
        </>
      )}
    </Modal>
  );
}
