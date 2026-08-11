import type { RichTextItemResponse } from "@notionhq/client";

/* Notion rich text → the frontend's inline microformat.

   The renderer (article-body.tsx) parses exactly three inline forms —
   **bold**, `code`, [label](href) — with a non-nesting regex. So this
   serializer emits at most one form per segment, by precedence:
   code > link > bold. A bold link keeps the link and drops the bold; that is
   the renderer's ceiling, not a sync limitation. */

export function plainText(rt: RichTextItemResponse[]): string {
  return rt.map((item) => item.plain_text).join("");
}

function segment(item: RichTextItemResponse): string {
  const text = item.plain_text;
  if (text.length === 0) return "";

  if (item.annotations.code) {
    // a backtick inside code would break the renderer's `[^`]+` matcher
    return `\`${text.replace(/`/g, "'")}\``;
  }
  if (item.href) {
    // square brackets/parens inside the label or URL would break the matcher
    const label = text.replace(/[[\]]/g, "");
    const href = item.href.replace(/[()]/g, encodeURIComponent);
    return label ? `[${label}](${href})` : "";
  }
  if (item.annotations.bold) {
    // `**[^*]+**` — an asterisk inside would end the match early
    const inner = text.replace(/\*/g, "");
    return inner ? `**${inner}**` : "";
  }
  return text;
}

export function toMicroformat(rt: RichTextItemResponse[]): string {
  return rt.map(segment).join("");
}
