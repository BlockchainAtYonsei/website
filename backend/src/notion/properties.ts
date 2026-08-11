import type { PageObjectResponse } from "@notionhq/client";
import { plainText } from "./richtext";

/* Property extraction — every helper returns undefined for a missing property
   OR a type mismatch, so mappers can decide per-field whether that's a
   warning, a default, or a skip. Notion property lookups are by display name;
   the names live in schema.ts. */

type Prop = PageObjectResponse["properties"][string];

function get(page: PageObjectResponse, name: string): Prop | undefined {
  return page.properties[name];
}

export function titleOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type !== "title") return undefined;
  const text = plainText(p.title).trim();
  return text.length > 0 ? text : undefined;
}

export function richTextOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type !== "rich_text") return undefined;
  const text = plainText(p.rich_text).trim();
  return text.length > 0 ? text : undefined;
}

export function numberOf(page: PageObjectResponse, name: string): number | undefined {
  const p = get(page, name);
  return p?.type === "number" ? (p.number ?? undefined) : undefined;
}

/* Accepts select OR status properties: 운영진 may model "상태" as either. */
export function selectOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type === "select") return p.select?.name;
  if (p?.type === "status") return p.status?.name;
  return undefined;
}

export function urlOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  return p?.type === "url" ? (p.url ?? undefined) : undefined;
}

export function checkboxOf(page: PageObjectResponse, name: string): boolean | undefined {
  const p = get(page, name);
  return p?.type === "checkbox" ? p.checkbox : undefined;
}

/* Start date only — our dates (발행일, 원문 발행일) are single days. */
export function dateOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  return p?.type === "date" ? p.date?.start : undefined;
}

export function relationIdsOf(page: PageObjectResponse, name: string): string[] | undefined {
  const p = get(page, name);
  return p?.type === "relation" ? p.relation.map((r) => r.id) : undefined;
}

/* First file's URL — internal (expiring, must be re-hosted) or external. */
export function fileUrlOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type !== "files" || p.files.length === 0) return undefined;
  const f = p.files[0];
  if ("file" in f && f.type === "file") return f.file.url;
  if ("external" in f && f.type === "external") return f.external.url;
  return undefined;
}
