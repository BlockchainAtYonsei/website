/* End-to-end mapping fidelity: for every published news page, pull the FULL
   Notion block tree (recursive) and compare its text against what the sync
   actually stored in Postgres — properties row-by-row, body char-by-char. */
import { Client, collectPaginatedAPI, isFullBlock, isFullPage } from "@notionhq/client";
import type { BlockObjectResponse, PageObjectResponse } from "@notionhq/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pageToNews } from "../src/sync/mappers/news.mapper";

process.loadEnvFile();
const notion = new Client({ auth: process.env.NOTION_TOKEN! });
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const DB = process.env.NOTION_DB_NEWS!;

type B = BlockObjectResponse & { children?: B[] };

async function fullTree(blockId: string, depth = 0): Promise<B[]> {
  if (depth > 4) return [];
  const kids = (
    await collectPaginatedAPI(notion.blocks.children.list, { block_id: blockId, page_size: 100 })
  ).filter(isFullBlock) as B[];
  for (const k of kids) {
    if (k.has_children) k.children = await fullTree(k.id, depth + 1);
  }
  return kids;
}

const rtText = (rt: { plain_text: string }[] | undefined) =>
  (rt ?? []).map((r) => r.plain_text).join("");

/* every character an author typed anywhere in the tree */
function treeText(blocks: B[]): { text: string; types: Map<string, number>; nestedListChars: number } {
  const types = new Map<string, number>();
  let nestedListChars = 0;
  const walk = (bs: B[], insideList: boolean): string =>
    bs
      .map((b) => {
        types.set(b.type, (types.get(b.type) ?? 0) + 1);
        const data = (b as never)[b.type] as { rich_text?: { plain_text: string }[]; cells?: { plain_text: string }[][] } | undefined;
        let own = "";
        if (b.type === "table_row") own = ((data as { cells?: { plain_text: string }[][] })?.cells ?? []).map(rtText).join(" ");
        else own = rtText(data?.rich_text);
        const isListItem = b.type === "bulleted_list_item" || b.type === "numbered_list_item";
        const childText = b.children ? walk(b.children, isListItem) : "";
        if (insideList && isListItem) nestedListChars += own.length;
        return own + " " + childText;
      })
      .join(" ");
  const text = walk(blocks, false);
  return { text, types, nestedListChars };
}

/* every character the site will render from a stored body */
function bodyText(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return (body as Record<string, unknown>[])
    .map((b) => {
      const parts: string[] = [];
      for (const k of ["text", "title", "cite"]) if (typeof b[k] === "string") parts.push(b[k] as string);
      if (Array.isArray(b.items)) parts.push((b.items as string[]).join(" "));
      if (Array.isArray(b.head)) parts.push((b.head as string[]).join(" "));
      if (Array.isArray(b.rows)) parts.push((b.rows as string[][]).map((r) => r.join(" ")).join(" "));
      return parts.join(" ");
    })
    .join(" ");
}

const strip = (s: string) => s.replace(/[*_`\[\]()#>|~\s]/g, ""); // kill microformat + whitespace

async function main() {
  const pages = (
    await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: (await (async () => {
        const db = await notion.databases.retrieve({ database_id: DB });
        return ("data_sources" in db ? db.data_sources : [])[0].id;
      })()),
      page_size: 100,
    })
  ).filter(isFullPage) as PageObjectResponse[];

  const rows = await prisma.newsItem.findMany();
  const bySlugPage = new Map(rows.map((r) => [r.notionPageId, r]));

  let ok = 0, propMismatch = 0, checked = 0;
  const losses: { title: string; pct: number; lost: number; total: number; nested: number; dropped: string[] }[] = [];
  const totalTypes = new Map<string, number>();

  for (const p of pages) {
    const { data } = pageToNews(p);
    if (!data) continue; // template rows
    checked++;
    const row = bySlugPage.get(p.id);
    if (!row) { console.log(`  ✗ DB에 없음: ${data.title.slice(0, 40)}`); propMismatch++; continue; }

    /* --- property fidelity: freshly-mapped page vs stored row --- */
    const diffs: string[] = [];
    if (row.title !== data.title) diffs.push("title");
    if ((row.url ?? undefined) !== data.url) diffs.push("url");
    if (JSON.stringify(row.categories) !== JSON.stringify(data.categories)) diffs.push("categories");
    if (row.publishedAt.toISOString().slice(0, 10) !== data.publishedAt) diffs.push("date");
    if (row.pick !== data.pick) diffs.push("pick");
    if (row.status !== data.status) diffs.push("status");
    if (diffs.length) { propMismatch++; console.log(`  ✗ ${data.title.slice(0, 36)} — 속성 불일치: ${diffs.join(",")}`); }
    else ok++;

    /* --- body fidelity: full Notion tree vs stored body --- */
    if (row.status !== "published") continue;
    const tree = await fullTree(p.id);
    const t = treeText(tree);
    for (const [k, v] of t.types) totalTypes.set(k, (totalTypes.get(k) ?? 0) + v);
    const notionChars = strip(t.text).length;
    const storedChars = strip(bodyText(row.body)).length;
    if (notionChars === 0) continue;
    const lost = Math.max(0, notionChars - storedChars);
    const pct = Math.round((lost / notionChars) * 100);
    const droppedTypes = [...t.types.keys()].filter((k) =>
      ["image", "code", "embed", "video", "bookmark", "toggle", "column_list", "column"].includes(k),
    );
    if (pct > 0 || droppedTypes.length)
      losses.push({ title: data.title, pct, lost, total: notionChars, nested: t.nestedListChars, dropped: droppedTypes });
  }

  console.log(`\n속성 매핑: 일치 ${ok} / 불일치 ${propMismatch} (검사 ${checked})`);
  console.log(`\n노션 전체 블록 타입 분포:`);
  for (const [k, v] of [...totalTypes.entries()].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(22)} ${v}`);
  losses.sort((a, b) => b.pct - a.pct);
  console.log(`\n본문 텍스트 유실이 있는 페이지: ${losses.length}`);
  for (const l of losses.slice(0, 15))
    console.log(`   ${String(l.pct).padStart(3)}%  (-${String(l.lost).padStart(4)}/${String(l.total).padEnd(5)}자, 중첩목록 ${l.nested}자)  [${l.dropped.join(",") || "-"}]  ${l.title.slice(0, 34)}`);
  const totLost = losses.reduce((s, l) => s + l.lost, 0);
  const totAll = losses.reduce((s, l) => s + l.total, 0);
  console.log(`\n유실 합계: ${totLost}자 (해당 페이지들 ${totAll}자 중)`);
}

main().finally(() => prisma.$disconnect());
