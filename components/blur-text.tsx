"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* word-by-word staggered blur-in, triggered when scrolled into view.
   ?snap=1 renders the final state immediately (screenshots, OG capture).

   A "\n" in the text forces a hard line break at that point: the words on
   either side still wrap and animate on their own, but the break is guaranteed
   — used to drop a clause to its own line without nbsp (which would overflow
   narrow screens). Text with no "\n" behaves exactly as before. */
export default function BlurText({
  text,
  className,
  justify = "center",
}: {
  text: string;
  className?: string;
  justify?: "center" | "start";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.1, once: true });
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    setSnap(new URLSearchParams(window.location.search).has("snap"));
  }, []);
  const lines = text.split("\n");
  let wordIndex = 0; // runs across lines so the stagger stays continuous

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: justify === "center" ? "center" : "flex-start",
        rowGap: "0.1em",
      }}
    >
      {lines.map((line, li) => (
        <Fragment key={li}>
          {/* full-width zero-height flex item: forces everything after it onto
              the next row without adding vertical space (rowGap handles that) */}
          {li > 0 && (
            <span aria-hidden style={{ flexBasis: "100%", height: 0 }} />
          )}
          {line.split(" ").map((word) => {
            const i = wordIndex++;
            return (
              <motion.span
                key={`${li}-${word}-${i}`}
                style={{ display: "inline-block", marginRight: "0.28em" }}
                initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
                animate={
                  snap || inView
                    ? { filter: "blur(0px)", opacity: 1, y: 0 }
                    : undefined
                }
                transition={
                  snap
                    ? { duration: 0 }
                    : { duration: 0.7, delay: i * 0.1, ease: "easeOut" }
                }
              >
                {word}
              </motion.span>
            );
          })}
        </Fragment>
      ))}
    </span>
  );
}
