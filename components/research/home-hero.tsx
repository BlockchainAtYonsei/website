"use client";

import { motion } from "framer-motion";

/* The home masthead's type stack, riding in on the same staggered blur
   reveal the main site's hero uses — that shared entrance is most of what
   makes the page read as a front door rather than a listing. Client
   component for the motion only; the atmosphere behind it stays on the
   server in page.tsx.

   Centred, because it sits over three equal cards: a left-set headline above
   a symmetric row reads as a caption for the first card rather than a title
   for all three. The phrase is the hub's one piece of voice — the cards say
   what, this says why. */

const HIDDEN = { filter: "blur(10px)", opacity: 0, y: 20 };
const VISIBLE = { filter: "blur(0px)", opacity: 1, y: 0 };

const reveal = (delay: number) => ({
  initial: HIDDEN,
  animate: VISIBLE,
  transition: { duration: 0.8, delay, ease: "easeOut" as const },
});

export default function HomeHero() {
  return (
    <div className="text-center">
      <motion.h1
        {...reveal(0.16)}
        className="font-heading mx-auto max-w-4xl text-4xl leading-[1.08] tracking-[-2px] break-keep text-white md:text-6xl"
      >
        기술 너머
        <br />
        <span className="bg-gradient-to-r from-bay-100 via-bay-200 to-bay-400 bg-clip-text text-transparent">
          시장과 경제의 구조
        </span>
        를 읽어냅니다
      </motion.h1>
      <motion.p
        {...reveal(0.3)}
        className="font-body mx-auto mt-7 max-w-xl text-sm leading-relaxed font-light break-keep text-slate-400 md:text-base"
      >
        연세대학교 블록체인 학회 BAY의 리서치 및 뉴스트레킹
      </motion.p>
    </div>
  );
}
