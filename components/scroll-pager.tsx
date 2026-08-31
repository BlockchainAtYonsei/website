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
    let target = 0;
    let started = 0;
    let lastTs = 0; // timestamp of the previous wheel event, for inertia gating
    const EDGE = 4; // px tolerance when testing "am I at this boundary"
    // A new, deliberate gesture starts after a quiet gap; a trackpad's inertia
    // tail fires events far closer together than this. Events that arrive with
    // a smaller gap in the paged zone are treated as inertia and swallowed, so
    // one hard fling still advances exactly one panel. Raise if a strong fling
    // still double-steps; lower if a quick second flick feels dropped.
    const IDLE = 130;

    const top = (el: Element) =>
      Math.round(el.getBoundingClientRect().top + window.scrollY);

    // Release the lock the instant the smooth scroll reaches its target, not on
    // a fixed timer — so the very next flick lands immediately and the page
    // never feels stuck. A hard cap guards against a scroll that never settles.
    const releaseWhenSettled = () => {
      if (!locked) return;
      if (
        Math.abs(window.scrollY - target) <= 2 ||
        performance.now() - started > 800
      ) {
        locked = false;
        return;
      }
      requestAnimationFrame(releaseWhenSettled);
    };

    const go = (y: number) => {
      target = y;
      started = performance.now();
      locked = true;
      window.scrollTo({ top: y, behavior: "smooth" });
      requestAnimationFrame(releaseWhenSettled);
    };

    const onWheel = (e: WheelEvent) => {
      // a modal locks body scroll and scrolls its own content — never hijack it
      if (document.querySelector('[aria-modal="true"]')) return;
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      // track inter-event spacing for the inertia gate below; keep it current
      // even while locked so the gap is measured from the last inertia event
      const gap = performance.now() - lastTs;
      lastTs = performance.now();
      if (locked) {
        // ignore input while the current page-scroll is still animating; do NOT
        // extend the lock — that was what made a second flick feel swallowed
        e.preventDefault();
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

      // Paged zone — advance exactly one panel. Swallow anything that arrives
      // too soon after the previous event: that's a trackpad's inertia tail,
      // not a fresh flick, and acting on it double-steps.
      e.preventDefault();
      if (gap < IDLE) return;
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
      locked = false;
    };
  }, []);

  return null;
}
