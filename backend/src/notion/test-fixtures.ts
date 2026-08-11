import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";
import type { NotionBlock } from "./block-mapper";

/* Notion-shaped fixture builders for unit tests. Shapes follow the SDK's
   response types; the casts at the end paper over response-only fields
   (request ids, colors) that the code under test never reads. */

export function rt(
  text: string,
  o: { bold?: boolean; code?: boolean; href?: string } = {},
): RichTextItemResponse {
  return {
    type: "text",
    text: { content: text, link: o.href ? { url: o.href } : null },
    annotations: {
      bold: o.bold ?? false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: o.code ?? false,
      color: "default",
    },
    plain_text: text,
    href: o.href ?? null,
  } as RichTextItemResponse;
}

let blockSeq = 0;

export function block(
  type: string,
  richText: RichTextItemResponse[] = [],
  extra: Record<string, unknown> = {},
  opts: { children?: NotionBlock[]; hasChildren?: boolean } = {},
): NotionBlock {
  return {
    object: "block",
    id: `block-${++blockSeq}`,
    type,
    has_children: opts.hasChildren ?? Boolean(opts.children?.length),
    ...(opts.children ? { children: opts.children } : {}),
    [type]: { rich_text: richText, ...extra },
  } as unknown as NotionBlock;
}

export function tableRow(cells: RichTextItemResponse[][]): NotionBlock {
  return {
    object: "block",
    id: `block-${++blockSeq}`,
    type: "table_row",
    has_children: false,
    table_row: { cells },
  } as unknown as NotionBlock;
}

/* --- page property fixtures --- */

export const prop = {
  title: (text: string) => ({ type: "title", title: text ? [rt(text)] : [] }),
  richText: (text: string) => ({ type: "rich_text", rich_text: text ? [rt(text)] : [] }),
  number: (n: number | null) => ({ type: "number", number: n }),
  select: (name: string | null) => ({ type: "select", select: name ? { name } : null }),
  status: (name: string | null) => ({ type: "status", status: name ? { name } : null }),
  url: (url: string | null) => ({ type: "url", url }),
  checkbox: (checked: boolean) => ({ type: "checkbox", checkbox: checked }),
  date: (start: string | null) => ({ type: "date", date: start ? { start } : null }),
  relation: (ids: string[]) => ({ type: "relation", relation: ids.map((id) => ({ id })) }),
  files: (url: string) => ({
    type: "files",
    files: [{ type: "file", name: "f", file: { url, expiry_time: "" } }],
  }),
};

let pageSeq = 0;

export function page(properties: Record<string, unknown>): PageObjectResponse {
  return {
    object: "page",
    id: `page-${++pageSeq}`,
    created_time: "2026-08-01T09:00:00.000Z",
    last_edited_time: "2026-08-02T09:00:00.000Z",
    archived: false,
    properties,
  } as unknown as PageObjectResponse;
}
