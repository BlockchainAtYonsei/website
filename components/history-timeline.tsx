"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import BlurText from "@/components/blur-text";
import { historyFor } from "@/lib/history";
import { useLang } from "@/components/lang-provider";

/* The timeline is a decade wide, so it scrolls sideways — but with the wheel
   the user is already turning. The section pins for as many pixels of page
   scroll as the track overflows (wrapper height = 100vh + overflow), and that
   progress drives translateX; when the last year lands, the pin releases and
   the page continues to the CTA. No inner scrollbar, no second gesture to
   learn. Until measurement (SSR, first paint) overflow is 0: full-height
   section, no pin, 2017 at the left — the correct static fallback.

   The data is read here rather than taken as a prop: it is bilingual, and the
   language switch is a client hook the server-rendered page cannot reach. When
   the language flips, the item text changes length, the track re-measures
   (ResizeObserver below), and the scroll math follows. */
export default function HistoryTimeline() {
  const { lang } = useLang();
  const history = historyFor(lang);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setOverflow(
        Math.max(0, trackRef.current.offsetWidth - window.innerWidth),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current!);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -overflow]);

  return (
    <section
      ref={sectionRef}
      id="history"
      className="bg-ink"
      style={{ height: `calc(100vh + ${overflow}px)` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// History"}
          </p>
          <BlurText
            justify="start"
            text={lang === "KR" ? "지금까지의 BAY" : "The BAY so far"}
            className="font-heading text-5xl leading-[1.0] tracking-[-3px] text-white md:text-6xl"
          />
        </div>
        {/* Padding matches the max-w-6xl container so 2017 starts under the
            heading. Year markers are 1px ticks dropping from the rail — the
            glowing dots straddled the line and read as noise. */}
        <motion.div
          style={{ x }}
          ref={trackRef}
          className="mt-14 flex min-w-max px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:mt-16"
        >
          {history.map((y) => (
            <div
              key={y.year}
              className="relative w-64 shrink-0 border-t border-white/10 pt-6 pr-8 md:w-72 md:pr-10"
            >
              <span className="absolute top-0 left-0 h-3 w-px bg-bay-300/80" />
              <h3 className="font-heading text-2xl tracking-[-1px] text-white md:text-3xl">
                {y.year}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {y.items.map((item) => (
                  <li key={item.text} className="flex items-baseline gap-3">
                    <span className="font-mono w-8 shrink-0 text-[10px] tracking-widest text-bay-300/70">
                      {item.month ?? ""}
                    </span>
                    <span
                      className={`font-body text-sm break-keep ${
                        item.hl
                          ? "font-normal text-white"
                          : "font-light text-white/65"
                      }`}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
