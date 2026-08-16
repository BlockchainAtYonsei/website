"use client";

import { useState } from "react";
import Image from "next/image";
import type { Accent } from "@/lib/research";
import CoverArt from "./cover-art";

/* The picture on a card, and what happens when it doesn't arrive.

   `sources` is ordered by how much a person chose the picture: for a news
   item that is the curator's own write-up image, then the publisher's
   crawled og:image; for an article, the figure in the piece, then its cover.
   The first two are other people's servers — publishers rename paths, and a
   Notion upload that missed re-hosting carries a signed URL that dies within
   the hour — and `onError` is the only thing that can tell us, since a 403
   from the optimizer reaches the page as a silently empty box, not as an
   exception anyone can catch server-side.

   So a failure walks down the list instead of ending it. Generated art is the
   floor, which means a card always has a picture on it; that matters more in
   a grid than anywhere else, because three columns of equal boxes with one
   empty reads as broken rather than as plain.

   State is the set of URLs that failed rather than an index into the list, so
   a card re-rendered with different content (the topic filter does this) is
   not carrying a stale "the second one is dead" flag into it. */
export default function Thumb({
  sources,
  accent,
  tag,
  seed,
  sizes,
  priority = false,
  large = false,
  className = "aspect-[16/9] w-full",
}: {
  sources: (string | null | undefined)[];
  accent: Accent;
  /* what the generated fallback prints, and what it draws its figure from —
     the slug, so two pieces under one tag don't fall back to one picture */
  tag: string;
  seed: string;
  sizes: string;
  priority?: boolean;
  large?: boolean;
  className?: string;
}) {
  const [dead, setDead] = useState<string[]>([]);

  /* Deduped: the two are the same URL whenever the piece carried no picture
     of its own, and retrying the identical URL is not a fallback. */
  const usable = [...new Set(sources)].filter((u): u is string => Boolean(u));
  const src = usable.find((u) => !dead.includes(u));

  if (!src) {
    return (
      <CoverArt
        accent={accent}
        tag={tag}
        seed={seed}
        large={large}
        className={className}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* through /_next/image, not hot-linked: publishers ship 1400px+
          originals (up to 2.2MB measured) that turned topic-switching into a
          2-3s wait — the optimizer serves card-sized WebPs from our own host
          instead */}
      <Image
        key={src}
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        onError={() => setDead((d) => [...d, src])}
        className="object-cover"
      />
      {/* the photos arrive in every temperature a newsroom ships, so the same
          bottom vignette CoverArt bakes in goes over every real photo too —
          that alone is enough to sit them beside each other. They keep their
          colour: draining it made a room of press photos read as an archive. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
    </div>
  );
}
