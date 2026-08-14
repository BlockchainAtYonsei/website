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

  /* A list item's subtree, flattened into the flat list the renderer knows:
     the item's own line absorbs any nested prose (the write-ups indent an
     item's explanation as a child paragraph), and nested list items — either
     kind — become further items of the same list. Nesting is presentation
     here, not structure, so flattening loses indentation but no words. */
  const flattenItem = (b: NotionBlock): string[] => {
    let own =
      b.type === "bulleted_list_item"
        ? toMicroformat(b.bulleted_list_item.rich_text)
        : b.type === "numbered_list_item"
          ? toMicroformat(b.numbered_list_item.rich_text)
          : "";
    const trailing: string[] = [];
    for (const child of (b.children ?? []) as NotionBlock[]) {
      if (child.type === "bulleted_list_item" || child.type === "numbered_list_item") {
        trailing.push(...flattenItem(child));
        continue;
      }
      const rt = (child as never)[child.type] as
        | { rich_text?: RichTextItemResponse[] }
        | undefined;
      if (rt?.rich_text?.length) {
        const text = toMicroformat(rt.rich_text).replace(/\n/g, " ").trim();
        if (text) own = own ? `${own} — ${text}` : text;
      } else if (child.type !== "divider") {
        warnings.push(`unsupported block type "${child.type}" (${child.id}) skipped`);
      }
    }
    return own.trim() ? [own, ...trailing] : trailing;
  };

  for (const b of notionBlocks) {
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const t = b.type === "bulleted_list_item" ? "ul" : "ol";
      if (listType !== t) {
        flushList();
        listType = t;
      }
      listItems.push(...flattenItem(b));
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
      case "image": {
        /* The URL leaves here as whatever Notion handed over — an expiring
           signed link for uploads, permanent for external images. The sync
           re-hosts uploads after mapping; this stays pure. */
        const img = b.image;
        const url = img.type === "file" ? img.file.url : img.external.url;
        if (url) {
          const caption = plainText(img.caption).trim();
          blocks.push({ t: "image", url, ...(caption ? { caption } : {}) });
        }
        break;
      }
      case "toggle": {
        /* A toggle is a paragraph that hides its children; on a static page
           there is nothing to toggle, so both halves render in order. */
        const text = toMicroformat(b.toggle.rich_text).trim();
        if (text) blocks.push({ t: "p", text });
        break;
      }
      default: {
        /* A type the renderer has no shape for still must not cost the words
           inside it — the live pages hide heading_4s and code blocks in their
           write-ups. Text-bearing strays render as plain paragraphs and the
           warning says so; only genuinely textless blocks (image, embed) are
           skipped outright. */
        const rt = (b as never)[b.type] as
          | { rich_text?: RichTextItemResponse[] }
          | undefined;
        const text = rt?.rich_text?.length
          ? toMicroformat(rt.rich_text).replace(/\n/g, " ").trim()
          : "";
        if (text) {
          blocks.push({ t: "p", text });
          warnings.push(`block type "${b.type}" (${b.id}) rendered as plain text`);
        } else {
          warnings.push(`unsupported block type "${b.type}" (${b.id}) skipped`);
        }
      }
    }

    /* Whatever hangs beneath a prose block reads on, in order — indented
       paragraphs under a paragraph are the same authoring habit as under a
       list item. Tables are excluded: their children are the rows, already
       consumed above. */
    if (b.children?.length && b.type !== "table") {
      const nested = mapBlocks(b.children as NotionBlock[]);
      blocks.push(...nested.blocks);
      warnings.push(...nested.warnings);
    }
  }
  flushList();

  return { blocks, warnings };
}
