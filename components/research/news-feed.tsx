"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "@/components/icons";
import type { NewsItem } from "@/lib/news";
import { formatDate } from "@/lib/research";

/* Rows, not cards — news is a feed you scan, research is work you choose.
   The visual weight goes to the curator's comment, since the headline is
   one click away anyway. Same chip/filter mechanics as ArticleGrid so the
   two indexes feel like one property. */

/* The club curates in weekly sessions, so the feed's time axis is the week:
   Monday-anchored, labeled the way meetings are ("8월 1주차" = the week whose
   Monday is the month's first). A week straddling a month boundary belongs to
   its Monday's month — same as how the session would be named. */
function weekOf(iso: string): { key: string; label: string; range: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
  const sunday = new Date(d);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const nth = Math.floor((d.getUTCDate() - 1) / 7) + 1;
  const dd = (x: Date) =>
    `${String(x.getUTCMonth() + 1).padStart(2, "0")}.${String(x.getUTCDate()).padStart(2, "0")}`;
  return {
    key: d.toISOString().slice(0, 10),
    label: `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${nth}주차`,
    range: `${dd(d)} – ${dd(sunday)}`,
  };
}

export default function NewsFeed({ items }: { items: NewsItem[] }) {
  const tags = ["All", ...Array.from(new Set(items.map((n) => n.category)))];
  const [active, setActive] = useState("All");
  const shown = active === "All" ? items : items.filter((n) => n.category === active);

  const weeks: { key: string; label: string; range: string; items: NewsItem[] }[] = [];
  for (const item of shown) {
    const w = weekOf(item.date);
    const last = weeks[weeks.length - 1];
    if (last?.key === w.key) last.items.push(item);
    else weeks.push({ ...w, items: [item] });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const on = tag === active;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setActive(tag)}
              aria-pressed={on}
              className={`font-mono cursor-pointer rounded-full border px-4 py-2 text-[10px] tracking-[0.18em] uppercase transition-colors ${
                on
                  ? "border-transparent bg-white text-black"
                  : "border-white/12 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="popLayout">
          {weeks.map(({ key, label, range, items: weekItems }) => (
            <motion.section
              key={`${active}-${key}`}
              layout
              initial={{ opacity: 0, filter: "blur(8px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(8px)", y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="font-mono mt-10 flex items-baseline gap-3 text-[10px] tracking-[0.18em] text-bay-300/80 uppercase first:mt-4">
                {label}
                <span className="text-white/30">{range}</span>
              </h2>
              <ul className="mt-2">
                {weekItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block border-b border-white/6 py-6"
                    >
                      <div className="font-mono flex flex-wrap items-center gap-3 text-[10px] tracking-[0.18em] text-white/40 uppercase">
                        <span>{formatDate(item.date)}</span>
                        <span aria-hidden className="h-px w-4 bg-white/20" />
                        <span>{item.sourceName}</span>
                        <span className="text-bay-300/70">{item.category}</span>
                      </div>
                      <h3 className="font-body mt-2.5 flex items-start gap-2 text-lg font-medium break-keep text-white transition-colors group-hover:text-bay-100 md:text-xl">
                        {item.title}
                        <ArrowUpRight className="mt-1.5 h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-bay-300" />
                      </h3>
                      {item.summary && (
                        <p className="font-body mt-2 max-w-3xl text-sm leading-relaxed font-light break-keep text-slate-400">
                          {item.summary}
                        </p>
                      )}
                      {item.curator && (
                        <p className="font-mono mt-3 text-[10px] tracking-[0.18em] text-white/35 uppercase">
                          Curated by {item.curator.name}
                        </p>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {shown.length === 0 && (
        <p className="font-body mt-14 text-sm font-light text-slate-500">
          아직 큐레이션된 뉴스가 없습니다.
        </p>
      )}
    </>
  );
}
