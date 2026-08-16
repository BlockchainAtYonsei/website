import type { Accent } from "@/lib/research";

/* Generated cover art. Every article gets a distinct-but-related image without
   anyone having to produce one — the palettes are lifted from the hero's
   atmosphere gradient so the research section reads as the same site.
   Drop in real artwork later by adding a `cover` field and branching here.

   The panel carries a drawn figure, not just a wash. It used to be a wash and
   one huge word: the tag was sized at 0.9 of the container's WIDTH, which is a
   card-sized rule — at 360px it reads as typographic art, but the home's
   full-bleed panel is over 800px, where the same rule produced a 250px
   letterform that the panel's floor cut in half and left the rest of the box
   empty. The mark is now capped against the container's HEIGHT too, and the
   space it stopped filling is held by a figure seeded from the article, so two
   pieces are never the same picture and the whole set still reads as one. */

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

/* Deterministic: the same article must draw the same figure on every render,
   on the server and in the browser, or hydration reports a mismatch. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function CoverArt({
  accent,
  tag,
  seed,
  className = "",
  large = false,
}: {
  accent: Accent;
  tag: string;
  /* what the figure is drawn from — the article's slug where there is one, so
     two pieces sharing a tag still get different pictures. Falls back to the
     tag, which at least keeps categories apart. */
  seed?: string;
  className?: string;
  large?: boolean;
}) {
  const { glow, wash } = PALETTE[accent];
  const rnd = mulberry32(hash(seed ?? tag));

  /* one dial, off-centre, free to run past an edge — a figure that is cropped
     by the frame reads as composed; one floating in the middle reads as a
     sticker */
  const cx = 380 + rnd() * 200;
  const cy = 90 + rnd() * 170;
  const rings = 2 + Math.floor(rnd() * 3);
  const r0 = 32 + rnd() * 26;
  const rot = rnd() * 90;
  const reach = r0 * rings * 1.4;

  /* a line that walks the panel and drops a node where it turns */
  const n = 4 + Math.floor(rnd() * 2);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return [40 + t * 560, 300 - rnd() * 190] as const;
  });
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

  /* The mark is sized to the card rather than to a fixed scale: tags come from
     Notion, and one fixed size cannot serve both "RWA" and "Governance" — the
     size that fits the long one leaves the short one tiny, and the size that
     suits the short one runs the long one off the edge.

     Advances are Pretendard's, in ems, rounded up a touch: hangul is full
     width, caps are far wider than lowercase, and mixing them up is what makes
     an estimate overflow. The cqh term is the ceiling that keeps a wide panel
     from turning the same rule into a cropped letterform. */
  const ADVANCE = (c: string) =>
    /[ᄀ-ᇿ㄰-㆏가-힣]/.test(c) ? 1.02 : /[A-Z]/.test(c) ? 0.74 : /[0-9]/.test(c) ? 0.6 : /[a-z]/.test(c) ? 0.55 : 0.34;
  const units = [...tag].reduce((n, c) => n + ADVANCE(c), 0);
  const byWidth = `${((large ? 0.62 : 0.72) * 100) / Math.max(units, 1)}cqw`;
  const markSize = `min(${byWidth}, ${large ? 20 : 26}cqh)`;

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      /* inline-size container so the mark can be measured against the card's
         own width — the same component sits in a 3-up grid and a hero slot */
      style={{ background: wash, containerType: "size" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 60% at 18% 12%, ${glow} 0%, transparent 68%),
            radial-gradient(55% 50% at 88% 88%, ${glow} 0%, transparent 62%)`,
        }}
      />
      <div className="bg-grid absolute inset-0 opacity-70" />

      {/* preserveAspectRatio="none" would shear the circles; slice keeps them
          round and lets the frame do the cropping instead */}
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke="currentColor"
      >
        {/* non-scaling strokes: at card size the viewBox shrinks by half, and
            a hairline that shrinks with it disappears */}
        <g className="text-white/12" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {Array.from({ length: rings }, (_, i) => (
            <circle key={i} cx={cx} cy={cy} r={r0 * (i + 1) * 1.15} vectorEffect="non-scaling-stroke" />
          ))}
          <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path
              d={`M${cx} ${cy - reach} V${cy + reach} M${cx - reach} ${cy} H${cx + reach}`}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <path d={path} vectorEffect="non-scaling-stroke" />
        </g>
        <g className="text-white/25" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} vectorEffect="non-scaling-stroke" />
          ))}
          <circle cx={cx} cy={cy} r={3.5} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      {/* soft vignette keeps the mark readable against the glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      <span
        /* sits on the floor rather than hanging below it — the old -0.22em
           offset was invisible at card sizes and a crop at panel sizes */
        className="font-heading absolute bottom-4 left-5 leading-none whitespace-nowrap text-white/[0.11] select-none md:bottom-5 md:left-7"
        style={{ fontSize: markSize }}
      >
        {tag}
      </span>
    </div>
  );
}
