import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client";
import type { Block } from "./block-types";
import { plainText, toMicroformat } from "./richtext";

/* Notion page blocks → the frontend's Block[].

   Which fields carry the inline microformat and which stay plain mirrors how
   the renderer consumes them: headings, quotes, callout titles and table
   heads render raw text; paragraphs, list items, callout bodies and table
   cells go through inline(). Serializing bold into a heading would print
   literal asterisks on the site.

   Unsupported block types are skipped with a warning, never dropped
   silently — the sync run's stats surface what an author used that the site
   can't render yet. */

export type NotionBlock = BlockObjectResponse & { children?: BlockObjectResponse[] };

export type MapResult = { blocks: Block[]; warnings: string[] };

/* "— 출처" (or "- 출처") on the last line of a quote becomes the cite. */
function splitQuote(text: string): { text: string; cite?: string } {
  const lines = text.split("\n");
  if (lines.length > 1) {
    const last = lines[lines.length - 1].trim();
    const m = /^[—–-]\s*(.+)$/.exec(last);
    if (m) return { text: lines.slice(0, -1).join(" ").trim(), cite: m[1] };
  }
  return { text: lines.join(" ").trim() };
}

/* Split rich text at the first newline, preserving annotations on both sides
   — needed to lift a bold first line out of a callout as its title. */
function splitAtNewline(
  rt: RichTextItemResponse[],
): [RichTextItemResponse[], RichTextItemResponse[]] | null {
  for (let i = 0; i < rt.length; i++) {
    const idx = rt[i].plain_text.indexOf("\n");
    if (idx === -1) continue;
    const item = rt[i];
    const cut = (text: string): RichTextItemResponse => ({
      ...item,
      plain_text: text,
      ...("text" in item ? { text: { ...item.text, content: text } } : {}),
    });
    const head = [...rt.slice(0, i), cut(item.plain_text.slice(0, idx))];
    const tail = [cut(item.plain_text.slice(idx + 1)), ...rt.slice(i + 1)];
    return [head, tail];
  }
  return null;
}

function callout(rt: RichTextItemResponse[]): Block {
  const split = splitAtNewline(rt);
  if (split) {
    const [first, rest] = split;
    const title = plainText(first).trim();
    const allBold = first
      .filter((i) => i.plain_text.trim().length > 0)
      .every((i) => i.annotations.bold);
    if (title && allBold && plainText(rest).trim()) {
      return {
        t: "callout",
        title,
        text: toMicroformat(rest).replace(/\n/g, " ").trim(),
      };
    }
  }
  return { t: "callout", text: toMicroformat(rt).replace(/\n/g, " ").trim() };
}

function tableBlock(block: NotionBlock, warnings: string[]): Block | null {
  if (block.type !== "table") return null;
  const rowBlocks = (block.children ?? []).filter(
    (c): c is BlockObjectResponse & { type: "table_row" } => c.type === "table_row",
  );
  if (rowBlocks.length === 0) {
    warnings.push(`table ${block.id}: no rows fetched, skipped`);
    return null;
  }
  const cells = rowBlocks.map((r) => r.table_row.cells);
  if (block.table.has_column_header) {
    return {
      t: "table",
      head: cells[0].map((c) => plainText(c).trim()),
      rows: cells.slice(1).map((row) => row.map((c) => toMicroformat(c))),
    };
  }
  return {
    t: "table",
    head: [],
    rows: cells.map((row) => row.map((c) => toMicroformat(c))),
  };
}

export function mapBlocks(notionBlocks: NotionBlock[]): MapResult {
  const blocks: Block[] = [];
  const warnings: string[] = [];

  /* Consecutive list-item blocks fold into one ul/ol — Notion stores each
     item as its own block, the frontend renders one list block. */
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  const flushList = () => {
    if (listType !== null && listItems.length > 0) {
      blocks.push({ t: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  for (const b of notionBlocks) {
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const t = b.type === "bulleted_list_item" ? "ul" : "ol";
      const text =
        b.type === "bulleted_list_item"
          ? toMicroformat(b.bulleted_list_item.rich_text)
          : toMicroformat(b.numbered_list_item.rich_text);
      if (listType !== t) {
        flushList();
        listType = t;
      }
      if (text.trim()) listItems.push(text);
      if (b.has_children) warnings.push(`list item ${b.id}: nested items dropped`);
      continue;
    }
    flushList();

    switch (b.type) {
      case "heading_1":
        /* authors reach for h1 out of habit; the article page reserves h1
           for the title, so fold it into the section level */
        blocks.push({ t: "h2", text: plainText(b.heading_1.rich_text).trim() });
        break;
      case "heading_2":
        blocks.push({ t: "h2", text: plainText(b.heading_2.rich_text).trim() });
        break;
      case "heading_3":
        blocks.push({ t: "h3", text: plainText(b.heading_3.rich_text).trim() });
        break;
      case "paragraph": {
        const text = toMicroformat(b.paragraph.rich_text).trim();
        if (text) blocks.push({ t: "p", text });
        // empty paragraphs are author spacing, not content — skip silently
        break;
      }
      case "quote": {
        const { text, cite } = splitQuote(plainText(b.quote.rich_text));
        if (text) blocks.push({ t: "quote", text, ...(cite ? { cite } : {}) });
        break;
      }
      case "callout": {
        const block = callout(b.callout.rich_text);
        if (block.t === "callout" && (block.text || block.title)) blocks.push(block);
        break;
      }
      case "table": {
        const t = tableBlock(b, warnings);
        if (t) blocks.push(t);
        break;
      }
      case "divider":
        blocks.push({ t: "divider" });
        break;
      default:
        warnings.push(`unsupported block type "${b.type}" (${b.id}) skipped`);
    }
  }
  flushList();

  return { blocks, warnings };
}
