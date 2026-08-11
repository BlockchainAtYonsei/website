"use client";

import { useState } from "react";
import Link from "next/link";
import ArticleCard from "./article-card";
import type { NewsItem } from "@/lib/news";
import { formatDate, type Article } from "@/lib/research";

/* The profile's two bodies of work: written research and curated news.
   Same underline vocabulary as the header nav — these are tabs (places),
   not chips (filters). Research keeps the card grid; news keeps the feed's
   row shape so each format matches its own index. */

const TAB_CLASS = (on: boolean) =>
  `font-mono relative cursor-pointer pb-3 text-[11px] tracking-[0.18em] uppercase transition-colors ${
    on ? "text-white" : "text-white/45 hover:text-bay-300"
  }`;

function Underline({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-x-0 bottom-0 h-px bg-bay-400 shadow-[0_0_6px_rgba(95,139,255,0.8)] transition-opacity ${
        on ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default function AuthorTabs({
  articles,
  news,
}: {
  articles: Article[];
  news: NewsItem[];
}) {
  const [tab, setTab] = useState<"research" | "news">("research");

  return (
    <section className="mt-16 border-t border-white/8 pt-14 md:mt-20">
      <div className="mb-9 flex items-center gap-8 border-b border-white/8">
        <button type="button" onClick={() => setTab("research")} className={TAB_CLASS(tab === "research")} aria-selected={tab === "research"} role="tab">
          리서치
          <span className="ml-2 text-white/35">{articles.length}</span>
          <Underline on={tab === "research"} />
        </button>
        <button type="button" onClick={() => setTab("news")} className={TAB_CLASS(tab === "news")} aria-selected={tab === "news"} role="tab">
          뉴스
          <span className="ml-2 text-white/35">{news.length}</span>
          <Underline on={tab === "news"} />
        </button>
      </div>

      {tab === "research" &&
        (articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="font-body text-sm font-light text-slate-500">
            아직 발행된 글이 없습니다.
          </p>
        ))}

      {tab === "news" &&
        (news.length > 0 ? (
          <ul>
            {news.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/research/news/${item.slug}`}
                  className="group block border-b border-white/6 py-6 first:pt-0"
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
                  <h3 className="font-body mt-2.5 text-lg font-medium break-keep text-white transition-colors group-hover:text-bay-100">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="font-body mt-2 max-w-3xl text-sm leading-relaxed font-light break-keep text-slate-400">
                      {item.summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm font-light text-slate-500">
            아직 큐레이션한 뉴스가 없습니다.
          </p>
        ))}
    </section>
  );
}
