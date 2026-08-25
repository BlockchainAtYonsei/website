"use client";

import { useEffect } from "react";

/* One flick, one page.
 *
 * CSS scroll-snap alone can't guarantee it: a single large wheel delta (a hard
 * trackpad fling) sails past several panels before it settles, even with
 * scroll-snap-stop: always. So on pointer devices we take the wheel over and
 * step exactly one panel per gesture, then lock out the inertia tail.
 *
 * The HistoryTimeline is the deliberate exception — it scrubs a decade sideways
 * off raw vertical scroll, so inside it we hand the wheel back to the browser
 * and only re-take paging at its two edges (top → previous panel, bottom → CTA).
 *
 * Wheel only. Touch (mobile) and keyboard keep the native CSS scroll-snap, and
 * the whole thing stands down while a modal owns the screen or the visitor
 * prefers reduced motion.
 */
export default function ScrollPager() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    let locked = false;
    let unlock: ReturnType<typeof setTimeout>;
    const EDGE = 4; // px tolerance when testing "am I at this boundary"

    const top = (el: Element) =>
      Math.round(el.getBoundingClientRect().top + window.scrollY);

    const go = (y: number) => {
      locked = true;
      window.scrollTo({ top: y, behavior: "smooth" });
      clearTimeout(unlock);
      // long enough to cover the smooth scroll and swallow the inertia tail of
      // the same gesture, short enough that a deliberate next flick lands
      unlock = setTimeout(() => (locked = false), 650);
    };

    const onWheel = (e: WheelEvent) => {
      // a modal locks body scroll and scrolls its own content — never hijack it
      if (document.querySelector('[aria-modal="true"]')) return;
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      if (locked) {
        // swallow the momentum tail of the gesture that's already paging, and
        // keep the lock alive until the wheel actually goes quiet — otherwise a
        // strong fling's inertia trips a second page the instant the timer ends
        e.preventDefault();
        clearTimeout(unlock);
        unlock = setTimeout(() => (locked = false), 650);
        return;
      }

      const y = window.scrollY;
      const vh = window.innerHeight;
      const panels = [...document.querySelectorAll(".snap-panel")]
        .map(top)
        .sort((a, b) => a - b);
      if (!panels.length) return;
      const cta = panels[panels.length - 1];

      const tl = document.getElementById("history");
      const tlTop = tl ? top(tl) : Infinity;
      const tlBottom = tl ? tlTop + tl.offsetHeight : -Infinity; // == cta top

      // Inside the timeline scrub: let it move freely, but hand back to paging
      // at the edges. Up uses the predicted landing (y + deltaY) so a coarse
      // fling that would jump clean over the top still clicks into the previous
      // panel instead of dumping the visitor mid-pillars; down fires once the
      // viewport bottom meets the timeline's end (the scrub is complete).
      const inTimeline = y >= tlTop - EDGE && y < cta - EDGE;
      if (inTimeline) {
        if (dir < 0) {
          if (y + e.deltaY <= tlTop + EDGE) {
            e.preventDefault();
            go(panels.filter((t) => t < tlTop).pop() ?? 0);
          }
        } else if (y + vh >= tlBottom - EDGE) {
          e.preventDefault();
          go(cta);
        }
        // otherwise: native scrub, don't touch it
        return;
      }

      // Paged zone — advance exactly one panel.
      e.preventDefault();
      let idx = 0;
      for (let i = 0; i < panels.length; i++) if (y >= panels[i] - 6) idx = i;

      if (dir > 0) {
        // the panel right before the CTA is the pillars: stepping down from it
        // enters the timeline rather than skipping to the CTA
        if (panels[idx] < tlTop && panels[idx + 1] === cta) {
          go(tlTop);
          return;
        }
        go(panels[Math.min(idx + 1, panels.length - 1)]);
      } else {
        // stepping up from the CTA re-enters the timeline at its scrubbed end
        if (panels[idx] === cta && tl) {
          go(tlBottom - vh);
          return;
        }
        go(panels[Math.max(idx - 1, 0)]);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      clearTimeout(unlock);
    };
  }, []);

  return null;
}
