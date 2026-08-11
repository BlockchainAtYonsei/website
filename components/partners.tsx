import BlurText from "./blur-text";

/* Seeded from the organizations BAY has actually worked with per the History
   section.

   `logo` points at a file in public/partners/. Brand marks are all over the
   place — some are black-on-transparent (Ethereum, XRP, NEAR), some ship as an
   opaque coloured tile (Monad, Status), some are illustrations (DoraHacks) —
   so none of them survive being dropped straight onto the ink background. The
   item normalises them instead: every mark sits on the same light backing,
   which is the background each of these logos was drawn for.

   `color` is the partner's brand colour. It lights the mark's glow, and is the
   monogram's colour for a partner with no logo file. */
export type Partner = {
  name: string;
  color: string;
  href?: string;
  logo?: string;
};

const PARTNERS: Partner[] = [
  {
    name: "Ethereum Foundation",
    color: "#7a8cf0",
    href: "https://ethereum.foundation",
    logo: "/partners/ethereum.svg",
  },
  {
    name: "XRPL",
    color: "#4fc3f7",
    href: "https://xrpl.org",
    logo: "/partners/xrpl.svg",
  },
  {
    name: "NEAR",
    color: "#00ec97",
    href: "https://near.org",
    logo: "/partners/near.svg",
  },
  {
    name: "Astar",
    color: "#00d1ff",
    href: "https://astar.network",
    logo: "/partners/astar.svg",
  },
  {
    name: "Monad",
    color: "#836ef9",
    href: "https://monad.xyz",
    logo: "/partners/monad.png",
  },
  {
    name: "Backpack",
    color: "#e33e3f",
    href: "https://backpack.exchange",
    logo: "/partners/backpack.png",
  },
  {
    name: "Status Network",
    color: "#4360df",
    href: "https://status.network",
    logo: "/partners/status.png",
  },
  {
    name: "MINA Protocol",
    color: "#ff603b",
    href: "https://minaprotocol.com",
    logo: "/partners/mina.svg",
  },
  {
    name: "CELO",
    color: "#fcff52",
    href: "https://celo.org",
    logo: "/partners/celo.svg",
  },
  {
    name: "DoraHacks",
    color: "#3b82f6",
    href: "https://dorahacks.io",
    logo: "/partners/dorahacks.svg",
  },
  /* No live site and no logo file — thublockchain.org no longer resolves, so
     this one falls back to the monogram until someone supplies both. */
  { name: "THUBA", color: "#5f8bff" },
];

/* Split across two tracks that scroll in opposite directions. The lists are
   interleaved rather than sliced in half so neither row ends up all-blue. */
const ROW_A = PARTNERS.filter((_, i) => i % 2 === 0);
const ROW_B = PARTNERS.filter((_, i) => i % 2 === 1);

/* No container. The mark and a large wordmark ride the track bare — the
   negative space between items is what makes the strip read as expensive, so
   resist boxing it. Brand colour stays on at rest; hover raises the glow and
   brings the wordmark up to full white. */
function Item({ partner }: { partner: Partner }) {
  const className =
    "partner-item group mx-7 flex shrink-0 items-center gap-4 md:mx-10";
  const style = { "--brand": partner.color } as React.CSSProperties;

  const inner = (
    <>
      {partner.logo ? (
        /* Plain <img>: these are ~28px marks, so the image optimizer buys
           nothing, and routing SVGs through it needs dangerouslyAllowSVG.

           Deliberately NOT loading="lazy". Lazy loading decides what to fetch
           from an element's laid-out position, and this track is four copies
           wide — on a phone nearly every mark sits far outside the viewport,
           so the marquee scrolls blank marks past forever. All ten files
           together are ~80KB; fetchPriority keeps them off the critical path
           instead. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={partner.logo}
          alt=""
          aria-hidden
          width={28}
          height={28}
          decoding="async"
          fetchPriority="low"
          className="partner-mark size-6 shrink-0 rounded-lg object-contain md:size-7"
        />
      ) : (
        /* Monogram placeholder, so a partner with no logo file still keeps the
           mark rhythm of the row instead of leaving a hole in it. */
        <span
          aria-hidden
          className="partner-mark partner-monogram flex size-6 shrink-0 items-center justify-center rounded-lg md:size-7"
        >
          {partner.name.charAt(0)}
        </span>
      )}
      <span className="partner-name font-display text-xl font-medium tracking-[-0.02em] whitespace-nowrap md:text-3xl">
        {partner.name}
      </span>
    </>
  );

  return partner.href ? (
    <a
      href={partner.href}
      target="_blank"
      rel="noreferrer"
      className={className}
      style={style}
      title={partner.name}
    >
      {inner}
    </a>
  ) : (
    <span className={className} style={style}>
      {inner}
    </span>
  );
}

/* One track, four identical copies. -50% is an exact multiple of the copy
   width, so the loop is seamless; four copies (rather than two) keep the track
   wide enough that no gap shows on wide displays. */
function Track({ items, reverse }: { items: Partner[]; reverse?: boolean }) {
  return (
    <div className="marquee-mask relative overflow-hidden">
      <div
        className={`${reverse ? "animate-marquee-reverse" : "animate-marquee"} flex w-max items-center py-2`}
      >
        {[0, 1, 2, 3].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy !== 0}
            className="flex shrink-0 items-center"
          >
            {items.map((p) => (
              <Item key={p.name} partner={p} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Partners() {
  return (
    <section id="partners" className="bg-ink relative pb-28 md:pb-36">
      {/* soft wash behind the tracks so the strip doesn't sit on flat black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-24 -z-0 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_50%,rgba(95,139,255,0.1),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <p className="font-body mb-6 text-sm font-light text-white/80">
          {"// Partners"}
        </p>
        <BlurText
          justify="start"
          text="Building with BAY"
          className="font-heading text-5xl leading-[1.0] tracking-[-3px] text-white md:text-6xl"
        />
        <p className="font-body mt-8 max-w-2xl leading-relaxed font-light text-slate-400">
          해커톤, 밋업, 리서치를 함께해 온 프로토콜과 파트너들입니다.
        </p>
      </div>

      {/* Full-bleed marquee: edges fade out so the loop seam never shows.
          Hairlines above and below give the band structure without putting
          anything in a box. */}
      <div className="relative mt-16">
        <div aria-hidden className="partner-hairline" />
        <div className="flex flex-col gap-2 py-8 md:gap-3 md:py-10">
          <Track items={ROW_A} />
          <Track items={ROW_B} reverse />
        </div>
        <div aria-hidden className="partner-hairline" />
      </div>
    </section>
  );
}
