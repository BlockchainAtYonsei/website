"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ArticleCard from "./article-card";
import type { Article, ArticlePage } from "@/lib/research";

/* Paginated archive. The server renders page one; chips and 더 보기 fetch
   further pages through /api/articles (the site's proxy — the backend URL
   never reaches the browser). Filtering is server-side: at archive scale the
   client no longer holds every article, so a chip is a query, not a filter
   over what happens to be loaded.

   `initialCategory` is what the page was asked for in the URL — the home's
   topic chips link straight into a filtered archive — so `initial` is page
   one OF THAT CATEGORY, not of everything. That is why the no-refetch
   shortcut below tests against it rather than against "All". */

export default function ArticleGrid({
  initial,
  tags,
  initialCategory = "All",
}: {
  initial: ArticlePage;
  tags: string[];
  initialCategory?: string;
}) {
  const [active, setActive] = useState(initialCategory);
  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);

  async function load(category: string, nextPage: number, append: boolean) {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(nextPage),
        size: String(initial.size),
      });
      if (category !== "All") q.set("category", category);
      const res = await fetch(`/api/articles?${q}`);
      if (!res.ok) return; // keep what's on screen; the button stays retryable
      const data: ArticlePage = await res.json();
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  const pick = (tag: string) => {
    if (tag === active) return;
    setActive(tag);
    if (tag === initialCategory) {
      // page one for this tag is what the server already sent — no refetch
      setItems(initial.items);
      setTotal(initial.total);
      setPage(initial.page);
      return;
    }
    void load(tag, 1, false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const on = tag === active;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => pick(tag)}
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
          {items.map((article) => (
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

      {items.length < total && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => void load(active, page + 1, true)}
            disabled={loading}
            className="liquid-glass-strong font-body cursor-pointer rounded-full px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] disabled:cursor-default disabled:opacity-60"
          >
            {loading ? "불러오는 중…" : "더 보기"}
            <span className="font-mono ml-3 text-[10px] tracking-[0.18em] text-white/40 uppercase">
              {items.length} / {total}
            </span>
          </button>
        </div>
      )}

      {items.length === 0 && (
        <p className="font-body mt-14 text-sm font-light text-slate-500">
          이 태그의 글이 아직 없습니다.
        </p>
      )}
    </>
  );
}
