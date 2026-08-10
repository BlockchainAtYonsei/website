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

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{ background: wash }}
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
        /* sized so the longest tag still fits a 3-up card — a mark cropped
           mid-word reads as a bug, not as a crop */
        className={`font-heading absolute -bottom-[0.22em] left-4 leading-none text-white/[0.10] italic select-none ${
          large ? "text-[7rem] md:text-[11rem]" : "text-[3.25rem] md:text-[4rem]"
        }`}
      >
        {tag}
      </span>
    </div>
  );
}
