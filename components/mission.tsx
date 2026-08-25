"use client";

import BlurText from "./blur-text";
import { useLang, type LangCode } from "./lang-provider";

/* The mission block (#about). It used to live inline in the server-rendered
   page, hardcoded in English — so the language switch never reached it. Pulled
   out into a client component here so it can read useLang() and answer in
   Korean when the switch is on KR, the same way Pillars and the dialogs do.

   The copy keeps the page's rhythm: an eyebrow, a large heading, two body
   paragraphs, then the mission slogan and its closing line. `intro` is split
   pre/highlight/post so the one white-lit phrase survives translation.

   The "// ..." eyebrows are deliberately NOT in this table — those small
   labels stay English in both languages, so they are hardcoded in the JSX. */
type MissionCopy = {
  heading: string;
  intro: { pre: string; highlight: string; post: string };
  body: string;
  slogan: string;
  closing: string;
};

const MISSION: Record<LangCode, MissionCopy> = {
  KR: {
    heading:
      "연세대학교의 뛰어난 인재들이 블록체인을 배우고 경험하는 곳.",
    intro: {
      pre: "2017년 시작된 ",
      highlight: "국내 최초의 대학 블록체인 학회",
      post: "로서, BAY는 블록체인의 혁신성과 잠재력을 널리 알리고 그 생태계의 성장에 기여합니다.",
    },
    body: "블록체인은 신뢰를 중앙이 보장하던 기존의 구조를 근본부터 뒤흔드는, 파괴적인 잠재력을 지닌 기술입니다. BAY는 이 기술이 만들어갈 변화를 가까이에서 마주하며 깊이 있는 이해와 실질적인 경험을 함께 쌓아갑니다. Web3, DeFi, NFT, 블록체인 인프라 등 빠르게 변화하는 산업의 흐름에 발맞춰 그 가능성을 직접 경험합니다.",
    slogan: "먼저 움직였고,\n지금도 나아갑니다.",
    closing:
      "세계 유수의 기업과 인재들이 앞다투어 블록체인 산업에 뛰어드는 지금, BAY는 블록체인에 대한 소양과 통찰력을 갖춘 인재들이 함께 성장하는 공간입니다.",
  },
  EN: {
    heading:
      "Where the brightest minds and talents at Yonsei University learn and experience blockchain.",
    intro: {
      pre: "Founded at Yonsei University in 2017, Blockchain at Yonsei (BAY) is ",
      highlight: "Korea’s first university blockchain community",
      post: ", working to share the promise of blockchain and grow its ecosystem.",
    },
    body: "Blockchain is a disruptive technology that unsettles the old model in which trust was guaranteed by a central authority. BAY meets the changes it will bring up close, building deep understanding and hands-on experience together — and keeps pace with a fast-moving industry across Web3, DeFi, NFTs, and blockchain infrastructure.",
    slogan: "First movers, still moving.",
    closing:
      "As the world’s leading companies and talent race into blockchain, BAY is where people with the fluency and insight to lead it grow together.",
  },
};

export default function Mission() {
  const { lang } = useLang();
  const copy = MISSION[lang];

  return (
    /* Phrase-by-phrase: two snap panels, one per topic. "What is BAY" keeps its
       heading and the prose that answers it together on one screen — splitting
       the question from its answer across two forced pages read as a non
       sequitur. "Our mission" is the second panel. See .snap-panel /
       scroll-snap-type in globals.css. */
    <section id="about" className="relative bg-ink">
      {/* Panel 1 — "// What is BAY": eyebrow + heading + the prose that answers
          it, all on one screen. */}
      <div className="snap-panel flex min-h-svh flex-col justify-center px-6 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// What is BAY"}
          </p>
          <p className="font-heading mb-8 max-w-4xl text-3xl leading-[1.15] tracking-[-1px] text-balance break-keep text-white md:mb-10 md:text-4xl lg:text-5xl">
            {copy.heading}
          </p>
          <p className="font-body max-w-2xl leading-relaxed font-light break-keep text-slate-400">
            {copy.intro.pre}
            <span className="text-white">{copy.intro.highlight}</span>
            {copy.intro.post}
          </p>
          <p className="font-body mt-6 max-w-2xl leading-relaxed font-light break-keep text-slate-400">
            {copy.body}
          </p>
        </div>
      </div>

      {/* Panel 2 — "// Our mission" + slogan + closing, centered. BlurText's
          word-by-word reveal fires as this panel scrolls into view, so it
          doubles as the panel's entrance. */}
      <div className="snap-panel flex min-h-svh flex-col justify-center px-6 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="font-body mb-6 text-sm font-light text-white/80">
            {"// Our mission"}
          </p>
          <BlurText
            justify="start"
            text={copy.slogan}
            className="font-heading text-5xl leading-[1.05] tracking-[-3px] text-white md:text-6xl lg:text-[5.5rem]"
          />
          <p className="font-body mt-8 max-w-2xl leading-relaxed font-light break-keep text-slate-400">
            {copy.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
