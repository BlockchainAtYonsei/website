"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/research";

/* Highlights whichever heading is currently nearest the top of the viewport.
   rootMargin pins the "active" band just under the sticky header so a heading
   lights up as it arrives, not when it has already scrolled past. */
export default function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    if (entries.length === 0) return;

    const nodes = entries
      .map((e) => document.getElementById(e.id))
      .filter((n): n is HTMLElement => n !== null);

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="목차" className="sticky top-28">
      <p className="font-mono mb-5 text-[10px] tracking-[0.18em] text-white/40 uppercase">
        Contents
      </p>
      <ul className="space-y-1 border-l border-white/10">
        {entries.map((e) => {
          const on = e.id === active;
          return (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                aria-current={on ? "location" : undefined}
                className={`font-body -ml-px block border-l py-1.5 text-[13px] leading-snug break-keep transition-colors ${
                  e.level === 3 ? "pl-8" : "pl-5"
                } ${
                  on
                    ? "border-bay-400 font-normal text-white"
                    : "border-transparent font-light text-slate-500 hover:text-slate-300"
                }`}
              >
                {e.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
