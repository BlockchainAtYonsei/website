import type { PageObjectResponse } from "@notionhq/client";
import { plainText, toMicroformat } from "./richtext";

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

/* Rich text with its formatting kept, in the same microformat the body blocks
   use. For the one-line fields where a link is the point — a photo credit is
   "사진: 이름 / 출처 (라이선스)" with the source word hyperlinked — so the
   curator writes it in Notion the way they write anything else, rather than
   typing markdown into a cell. */
export function microformatOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type !== "rich_text") return undefined;
  const text = toMicroformat(p.rich_text).trim();
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

/* A link out of a text column. The news DB keeps its Source as rich_text with
   the headline as the visible text and the article behind it as a hyperlink,
   so reading the plain text gets the headline and throws the link away — the
   href is the actual value. Falls back to the text for the rows where someone
   pasted a bare URL instead. */
export function linkOf(page: PageObjectResponse, name: string): string | undefined {
  const p = get(page, name);
  if (p?.type === "url") return p.url ?? undefined;
  if (p?.type !== "rich_text") return undefined;

  const href = p.rich_text.find((r) => r.href)?.href;
  if (href) return href;

  const text = plainText(p.rich_text).trim();
  return /^https?:\/\//i.test(text) ? text : undefined;
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

/* Tags, when 운영진 model a category as many rather than one. */
export function multiSelectOf(page: PageObjectResponse, name: string): string[] | undefined {
  const p = get(page, name);
  return p?.type === "multi_select" ? p.multi_select.map((o) => o.name) : undefined;
}

/* Human names out of whichever property type a column happens to be.

   Author columns get modelled every which way — a Notion person, a
   multi-select of names typed by hand, a plain select, sometimes just text —
   and which one it is tends to change without warning. Reading all of them
   means a column flipped from multi-select to person keeps resolving instead
   of silently emptying every byline.

   Relations are the one shape not covered: they carry page ids, not names,
   and resolving those needs a fetch the mapper cannot do. */
export function namesOf(page: PageObjectResponse, name: string): string[] {
  const p = get(page, name);
  if (!p) return [];
  switch (p.type) {
    case "people":
      return p.people.map((u) => ("name" in u && u.name ? u.name : "")).filter(Boolean);
    case "multi_select":
      return p.multi_select.map((o) => o.name);
    case "select":
      return p.select ? [p.select.name] : [];
    case "status":
      return p.status ? [p.status.name] : [];
    case "rich_text": {
      const text = plainText(p.rich_text).trim();
      /* "신영환, 장동현" and "신영환 · 장동현" are both one cell holding two
         people — split so the second name is not lost. */
      return text ? text.split(/[,·・/]|\s{2,}/).map((s) => s.trim()).filter(Boolean) : [];
    }
    case "title": {
      const text = plainText(p.title).trim();
      return text ? [text] : [];
    }
    default:
      return [];
  }
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
