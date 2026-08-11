"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { weekOf, type NewsItem } from "@/lib/news";
import { formatDate } from "@/lib/research";

/* Rows, not cards — news is a feed you scan, research is work you choose.
   Rows link to the item's own page (요약/인사이트); the original story is the
   원문 button there. Weekly groups mirror the club's curation sessions. */

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
                    <Link
                      href={`/research/news/${item.slug}`}
                      className="group block border-b border-white/6 py-6"
                    >
                      <div className="font-mono flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-[0.18em] text-white/40 uppercase">
                        <span className="flex items-center gap-3">
                          <span>{formatDate(item.date)}</span>
                          <span aria-hidden className="h-px w-4 bg-white/20" />
                          <span>{item.sourceName}</span>
                          <span className="text-bay-300/70">{item.category}</span>
                        </span>
                        <span>{item.views.toLocaleString("en-US")} views</span>
                      </div>
                      <h3 className="font-body mt-2.5 text-lg font-medium break-keep text-white transition-colors group-hover:text-bay-100 md:text-xl">
                        {item.title}
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
                    </Link>
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
