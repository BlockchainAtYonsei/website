"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ArticleCard from "./article-card";
import type { Article } from "@/lib/research";

export default function ArticleGrid({
  articles,
  tags,
}: {
  articles: Article[];
  tags: string[];
}) {
  const [active, setActive] = useState("All");
  const shown =
    active === "All" ? articles : articles.filter((a) => a.tag === active);

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

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((article) => (
            <motion.div
              key={article.slug}
              layout
              initial={{ opacity: 0, filter: "blur(8px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(8px)", y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {shown.length === 0 && (
        <p className="font-body mt-14 text-sm font-light text-slate-500">
          이 태그의 글이 아직 없습니다.
        </p>
      )}
    </>
  );
}
