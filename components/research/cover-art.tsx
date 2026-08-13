import type { Accent } from "@/lib/research";

/* Generated cover art. Every article gets a distinct-but-related image without
   anyone having to produce one — the palettes are lifted from the hero's
   atmosphere gradient so the research section reads as the same site.
   Drop in real artwork later by adding a `cover` field and branching here. */

const PALETTE: Record<Accent, { glow: string; wash: string }> = {
  blue: {
    glow: "rgba(56, 105, 190, 0.55)",
    wash: "linear-gradient(140deg, #16233f 0%, #0f1a30 55%, #0a101f 100%)",
  },
  violet: {
    glow: "rgba(124, 98, 210, 0.5)",
    wash: "linear-gradient(140deg, #1d1b3d 0%, #141631 55%, #0a101f 100%)",
  },
  teal: {
    glow: "rgba(45, 160, 185, 0.45)",
    wash: "linear-gradient(140deg, #102a34 0%, #0d1d2c 55%, #0a101f 100%)",
  },
  indigo: {
    glow: "rgba(47, 107, 255, 0.5)",
    wash: "linear-gradient(140deg, #16264f 0%, #101a38 55%, #0a101f 100%)",
  },
};

export default function CoverArt({
  accent,
  tag,
  className = "",
  large = false,
}: {
  accent: Accent;
  tag: string;
  className?: string;
  large?: boolean;
}) {
  const { glow, wash } = PALETTE[accent];

  /* The mark is sized to the card rather than to a fixed scale: tags come from
     Notion, and one fixed size cannot serve both "RWA" and "Governance" — the
     size that fits the long one leaves the short one tiny, and the size that
     suits the short one runs the long one off the edge.

     Advances are Pretendard's, in ems, rounded up a touch: hangul is full
     width, caps are far wider than lowercase, and mixing them up is what makes
     a estimate overflow. 0.86 leaves room for the left inset and a margin. */
  const ADVANCE = (c: string) =>
    /[ᄀ-ᇿ㄰-㆏가-힣]/.test(c) ? 1.02 : /[A-Z]/.test(c) ? 0.74 : /[0-9]/.test(c) ? 0.6 : /[a-z]/.test(c) ? 0.55 : 0.34;
  const units = [...tag].reduce((n, c) => n + ADVANCE(c), 0);
  const markSize = `${((large ? 0.9 : 0.86) * 100) / Math.max(units, 1)}cqw`;

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      /* inline-size container so the mark can be measured against the card's
         own width — the same component sits in a 3-up grid and a hero slot */
      style={{ background: wash, containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 60% at 18% 12%, ${glow} 0%, transparent 68%),
            radial-gradient(55% 50% at 88% 88%, ${glow} 0%, transparent 62%)`,
        }}
      />
      <div className="bg-grid absolute inset-0 opacity-70" />
      {/* soft vignette keeps the mark readable against the glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      <span
        /* a mark cropped mid-word reads as a bug, not as a crop — see markSize */
        className="font-heading absolute -bottom-[0.22em] left-4 leading-none whitespace-nowrap text-white/[0.10] select-none"
        style={{ fontSize: markSize }}
      >
        {tag}
      </span>
    </div>
  );
}
