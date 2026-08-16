import type { Block } from "../notion/block-types";

/* What a piece cites, read out of the piece itself.

   A research article ends with 참고자료 — it is how the team already writes,
   and it is the one place in the body where a link is a source rather than an
   aside. That makes it the honest place to get a cover from: the picture the
   first reference uses to represent itself is a picture about this subject,
   chosen by someone who knows it, instead of stock photography chosen by
   whoever last touched the seed.

   Only links under that heading count. Prose is full of links that are asides
   ("[DefiLlama](…) 기준"), and a piece whose cover came from a passing
   citation would change its picture when a sentence changed. */

export type Reference = { url: string; label: string };

const REFERENCE_HEADING = /^\s*(?:출처|참고\s*자료|참고\s*문헌|references?|sources?)\s*$/i;
/* the body microformat's link form, and a bare URL for the author who pasted
   one without making it a link */
const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/;
const BARE_URL = /https?:\/\/[^\s)\]]+/;

function linkIn(text: string): Reference | null {
  const md = MARKDOWN_LINK.exec(text);
  if (md) return { label: md[1].trim(), url: md[2] };
  const bare = BARE_URL.exec(text);
  if (!bare) return null;
  try {
    /* no label to use, so the site itself is the label — "docs.eigenlayer.xyz"
       reads as a source, the full URL does not */
    return { label: new URL(bare[0]).hostname.replace(/^www\./, ""), url: bare[0] };
  } catch {
    return null;
  }
}

/* The first link under the last 참고자료 heading, or null. The LAST one
   because a piece that discusses its sources mid-way and lists them at the
   end means the end. */
export function firstReference(body: Block[]): Reference | null {
  const start = body.reduce(
    (found, b, i) =>
      (b.t === "h2" || b.t === "h3") && REFERENCE_HEADING.test(b.text) ? i : found,
    -1,
  );
  if (start === -1) return null;

  for (const b of body.slice(start + 1)) {
    /* the section ends where the next one begins */
    if (b.t === "h2" || b.t === "h3") break;
    const texts =
      b.t === "ul" || b.t === "ol"
        ? b.items
        : b.t === "p" || b.t === "quote" || b.t === "callout"
          ? [b.text]
          : [];
    for (const text of texts) {
      const ref = linkIn(text);
      if (ref) return ref;
    }
  }
  return null;
}

/* The credit for a picture taken from a reference's link preview. It is
   someone else's image on our page, so it says whose and links back — the
   same obligation the Commons photos carry, met the same way. */
export function referenceCredit(ref: Reference): string {
  return `사진: [${ref.label}](${ref.url})`;
}
