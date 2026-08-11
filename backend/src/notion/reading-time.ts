import type { Block } from "./block-types";

function blockText(b: Block): string {
  switch (b.t) {
    case "h2":
    case "h3":
    case "p":
    case "quote":
      return b.text;
    case "callout":
      return `${b.title ?? ""} ${b.text}`;
    case "ul":
    case "ol":
      return b.items.join(" ");
    case "table":
      return [...b.head, ...b.rows.flat()].join(" ");
    default:
      return "";
  }
}

/* Same figure and rounding as the frontend's readingMinutes — the API
   precomputes it so the site stops needing the whole body to show a card. */
export function readingMinutes(blocks: Block[]): number {
  const chars = blocks.map(blockText).join("").length;
  return Math.max(1, Math.round(chars / 500));
}
