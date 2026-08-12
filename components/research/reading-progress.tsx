"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* Hairline progress bar under the sticky header. Lives in the research layout
   so it survives navigation, but only means anything on an article — the index
   is a listing, not something you read to the end. */
/* Section listings share an article's URL shape but are feeds you scan, so the
   bar would have nothing to measure — /research/author in particular sat at
   100% from the first pixel of scroll. */
const LISTINGS = new Set(["/research/author", "/research/news"]);

export default function ReadingProgress() {
  const pathname = usePathname();
  const onArticle =
    /^\/research\/[^/]+$/.test(pathname) && !LISTINGS.has(pathname);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!onArticle) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // scroll-position based, not element height: stays correct if late font
      // loading or a wide table reflows the article after mount
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max <= 0 ? 0 : Math.min(1, window.scrollY / max) * 100);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onArticle, pathname]);

  if (!onArticle) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
    >
      <div
        className="h-full bg-bay-400 shadow-[0_0_10px_rgba(95,139,255,0.9)] transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
