"use client";

import { useEffect, useState } from "react";

/* Right-edge dot navigation for the full-viewport pager.
 *
 * One dot per [data-nav] section, in document order. The active dot is the
 * section currently crossing the viewport's horizontal centre — found with an
 * IntersectionObserver whose root is collapsed to that centre line
 * (rootMargin -50%/-50%), so exactly one section owns it at a time, including
 * the tall pinned timeline for the whole of its scrub. Clicking a dot scrolls
 * to that section; the wheel pager (which only hijacks wheel events) stays out
 * of the way of the programmatic scroll.
 *
 * Desktop only — on touch the thumb is the navigation, and the labels need the
 * hover they don't have.
 */
type Item = { el: HTMLElement; label: string };

export default function SectionNav() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-nav]")];
    els.sort(
      (a, b) =>
        a.getBoundingClientRect().top +
        window.scrollY -
        (b.getBoundingClientRect().top + window.scrollY),
    );
    const list = els.map((el) => ({ el, label: el.dataset.nav ?? "" }));
    setItems(list);
    if (!list.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = list.findIndex((it) => it.el === e.target);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    list.forEach((it) => io.observe(it.el));
    return () => io.disconnect();
  }, []);

  if (!items.length) return null;

  const goTo = (el: HTMLElement) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: "smooth",
    });

  return (
    <nav
      aria-label="Section navigation"
      className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex"
    >
      {items.map((it, i) => {
        const on = i === active;
        return (
          <button
            key={i}
            type="button"
            onClick={() => goTo(it.el)}
            aria-label={it.label}
            aria-current={on}
            className="group relative flex h-4 cursor-pointer items-center"
          >
            {/* label slides in on hover, to the left of the tick */}
            <span className="font-mono pointer-events-none absolute right-6 rounded-md bg-white/10 px-2 py-1 text-[10px] tracking-[0.14em] whitespace-nowrap text-white/80 uppercase opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
              {it.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                on
                  ? "h-6 w-[3px] bg-white"
                  : "h-[3px] w-[3px] bg-white/30 group-hover:bg-white/60"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
