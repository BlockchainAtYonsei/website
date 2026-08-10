"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* word-by-word staggered blur-in, triggered when scrolled into view.
   ?snap=1 renders the final state immediately (screenshots, OG capture). */
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
  const words = text.split(" ");

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
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
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
      ))}
    </span>
  );
}
