/* The article body contract — mirrors `Block` in the frontend's
   lib/research.ts exactly. The renderer consumes API responses unchanged, so
   any change here is a breaking change for the site and must land in both
   places. */

export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string; cite?: string }
  | { t: "callout"; title?: string; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "divider" };
