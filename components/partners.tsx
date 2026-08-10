import Image from "next/image";
import BlurText from "./blur-text";

/* Seeded from the organizations BAY has actually worked with per the History
   section. `logo` is optional — drop an SVG/PNG in public/partners/ and set the
   path to swap the wordmark for a real mark. */
export type Partner = { name: string; href?: string; logo?: string };

const PARTNERS: Partner[] = [
  { name: "Ethereum Foundation", href: "https://ethereum.foundation" },
  { name: "XRPL", href: "https://xrpl.org" },
  { name: "NEAR", href: "https://near.org" },
  { name: "Astar", href: "https://astar.network" },
  { name: "Monad", href: "https://monad.xyz" },
  { name: "Backpack", href: "https://backpack.exchange" },
  { name: "Status Network", href: "https://status.network" },
  { name: "MINA Protocol", href: "https://minaprotocol.com" },
  { name: "CELO", href: "https://celo.org" },
  { name: "DoraHacks", href: "https://dorahacks.io" },
  { name: "THUBA", href: "https://thublockchain.org" },
];

function Logo({ partner }: { partner: Partner }) {
  const inner = partner.logo ? (
    <Image
      src={partner.logo}
      alt={partner.name}
      width={132}
      height={32}
      className="h-7 w-auto opacity-70 transition-opacity group-hover:opacity-100 md:h-8"
    />
  ) : (
    <span className="font-display text-base font-medium tracking-[-0.01em] whitespace-nowrap text-white/60 transition-colors group-hover:text-white md:text-lg">
      {partner.name}
    </span>
  );

  const className =
    "liquid-glass group mx-3 flex shrink-0 items-center rounded-full px-7 py-3.5 transition-transform hover:scale-[1.04]";

  return partner.href ? (
    <a
      href={partner.href}
      target="_blank"
      rel="noreferrer"
      className={className}
      title={partner.name}
    >
      {inner}
    </a>
  ) : (
    <span className={className}>{inner}</span>
  );
}

export default function Partners() {
  return (
    <section id="partners" className="bg-ink pb-28 md:pb-36">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body mb-6 text-sm font-light text-white/80">
          {"// Partners"}
        </p>
        <BlurText
          justify="start"
          text="Building alongside"
          className="font-heading text-5xl leading-[0.9] tracking-[-3px] text-white italic md:text-6xl"
        />
        <p className="font-body mt-8 max-w-2xl leading-relaxed font-light text-slate-400">
          해커톤, 밋업, 리서치를 함께해 온 프로토콜과 파트너들입니다.
        </p>
      </div>

      {/* full-bleed marquee: edges fade out so the loop seam never shows */}
      <div className="marquee-mask relative mt-14 overflow-hidden">
        {/* One track, four identical copies. -50% is an exact multiple of the
            copy width, so the loop is seamless; four copies (rather than two)
            keep the track wide enough that no gap shows on wide displays. */}
        <div className="animate-marquee flex w-max items-center py-2">
          {[0, 1, 2, 3].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy !== 0}
              className="flex shrink-0 items-center"
            >
              {PARTNERS.map((p) => (
                <Logo key={p.name} partner={p} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
