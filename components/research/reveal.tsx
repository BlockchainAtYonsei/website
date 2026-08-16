"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

/* Scroll-in reveal for the home's content rows: the same blur-and-rise the
   masthead enters with, fired once as the row reaches the viewport. One
   wrapper per row — staggering every child would turn a two-row page into
   a slideshow. */
export default function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
