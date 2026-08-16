"use client";

import { useEffect, useState } from "react";

/* Hairline progress bar pinned to the sticky header's bottom edge.

   Rendered by the article page itself, not by the layout. It used to live in
   the header with a denylist of "these paths are listings, not articles" —
   which meant every new top-level route under /research had to remember to
   add itself, and the ones that forgot (author first, then articles) got a
   bar that measured a feed and sat at 100% from the first pixel of scroll.
   Mounting it where it applies makes that class of bug unreachable.

   Fixed rather than absolute because it no longer sits inside the header:
   top-16 is that header's height, so the bar rides its lower border. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
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
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-16 z-[51] h-px"
    >
      <div
        className="h-full bg-bay-400 shadow-[0_0_10px_rgba(95,139,255,0.9)] transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
