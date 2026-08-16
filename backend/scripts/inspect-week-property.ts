/* What is actually in the news DB's Week column?

   npx tsx scripts/inspect-week-property.ts     (needs NOTION_TOKEN + NOTION_DB_NEWS)

   The site derives weeks from Date of issue (lib/news.ts weekOf) while the
   리서치팀 keeps its own Week value per row ("2026.08.09~2026.08.15"). Before
   the site can read theirs instead, three things have to be true, and only the
   database can say whether they are:

     1. the column is filled — a blank Week has nothing to group by
     2. the values are one shape, not five
     3. they agree with the date the row already carries

   (3) is the interesting one. Date of issue is the ORIGINAL story's publication
   date, so a write-up of last Tuesday's article filed in this week's session
   carries last week's date: the session and the date genuinely disagree, and no
   choice of week boundary reconciles them. This script counts how often that
   happens and which way.

   Read-only. Prints raw values rather than normalising them — the point is to
   see the column as the team types it, not as a parser wishes it were. */

import { Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { NEWS_PROPS as P } from "../src/notion/schema";

/* Same handling as seed-members.ts, and for the same reason: the container
   this is most useful inside gets its environment from docker, not from a
   .env on disk, and an unguarded loadEnvFile turns "no file here" into a
   stack trace before the script can say what it actually wants. */
try {
  process.loadEnvFile();
} catch {
  /* env comes from the shell */
}

const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_DB_NEWS;
if (!TOKEN || !DB_ID) {
  console.error(
    `NOTION_TOKEN / NOTION_DB_NEWS 가 필요합니다. 셋 중 하나로 주세요:\n` +
      `  docker exec bay-backend npx tsx scripts/inspect-week-property.ts   # 서버, env는 컨테이너에\n` +
      `  NOTION_TOKEN=... NOTION_DB_NEWS=... npx tsx scripts/inspect-week-property.ts\n` +
      `  backend/.env 를 두고 이 디렉터리에서 실행\n` +
      `현재: NOTION_TOKEN=${TOKEN ? "설정됨" : "없음"}, NOTION_DB_NEWS=${DB_ID ? "설정됨" : "없음"}`,
  );
  process.exit(1);
}

const notion = new Client({ auth: TOKEN });
/* Annotated rather than inferred: the narrowing above does not survive into
   main()'s closure, and `DB!` at the use site hides the guard that earns it. */
const DB: string = DB_ID;
const WEEK_PROP = "Week";

/* Whatever Notion is holding it as — the column could be rich_text today and a
   formula tomorrow, and the answer to "what's in it" must survive that. */
function readText(page: PageObjectResponse, name: string): string {
  const prop = page.properties[name] as
    | { type: string; [k: string]: unknown }
    | undefined;
  if (!prop) return "";
  const rt = (v: unknown) =>
    Array.isArray(v) ? (v as { plain_text?: string }[]).map((r) => r.plain_text ?? "").join("") : "";
  switch (prop.type) {
    case "rich_text":
      return rt(prop.rich_text);
    case "title":
      return rt(prop.title);
    case "select":
      return (prop.select as { name?: string } | null)?.name ?? "";
    case "multi_select":
      return ((prop.multi_select as { name: string }[]) ?? []).map((o) => o.name).join(", ");
    case "formula": {
      const f = prop.formula as { type: string; string?: string; date?: { start?: string } };
      return f?.string ?? f?.date?.start ?? "";
    }
    case "date": {
      const d = prop.date as { start?: string; end?: string } | null;
      return d ? [d.start, d.end].filter(Boolean).join("~") : "";
    }
    default:
      return "";
  }
}

function propType(page: PageObjectResponse, name: string): string {
  return (page.properties[name] as { type?: string } | undefined)?.type ?? "(no such column)";
}

/* Any two yyyy?mm?dd in the cell, in the order typed. Deliberately loose about
   the separator and deliberately silent about everything else: a value this
   cannot read is reported as unparsed, never guessed at. */
function datesIn(value: string): string[] {
  return [...value.matchAll(/(\d{4})[.\-/ ]\s*(\d{1,2})[.\-/ ]\s*(\d{1,2})/g)].map(
    (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
  );
}

const dayName = (iso: string) =>
  ["일", "월", "화", "수", "목", "금", "토"][new Date(`${iso}T00:00:00Z`).getUTCDay()];

/* The two candidate boundaries, as the start date of the week `iso` falls in. */
function weekStart(iso: string, anchor: "sun" | "mon"): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const back = anchor === "sun" ? d.getUTCDay() : (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const db = await notion.databases.retrieve({ database_id: DB });
  const dataSourceId = ("data_sources" in db ? db.data_sources : [])[0].id;
  const pages = (
    await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: dataSourceId,
      page_size: 100,
    })
  ).filter(isFullPage) as PageObjectResponse[];

  /* Rows with neither a headline nor a date are next week's empty slots. */
  const rows = pages
    .map((p) => ({
      title: readText(p, P.title),
      date: (p.properties[P.publishedAt] as { date?: { start?: string } | null } | undefined)?.date
        ?.start?.slice(0, 10),
      week: readText(p, WEEK_PROP).trim(),
      type: propType(p, WEEK_PROP),
    }))
    .filter((r) => r.title || r.date);

  const type = rows.find((r) => r.type !== "(no such column)")?.type ?? "(no such column)";
  const filled = rows.filter((r) => r.week);
  console.log(`\n행 ${rows.length}건 (빈 슬롯 제외) — "${WEEK_PROP}" 속성 타입: ${type}`);
  console.log(`채워짐 ${filled.length} / 비어있음 ${rows.length - filled.length}`);

  const counts = new Map<string, number>();
  for (const r of filled) counts.set(r.week, (counts.get(r.week) ?? 0) + 1);
  console.log(`\n원본 값 (고유 ${counts.size}종, 많은 순):`);
  for (const [v, n] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 20))
    console.log(`   ${String(n).padStart(3)}건  ${JSON.stringify(v)}`);

  /* Per value: what seven days does it name, and do the rows filed under it
     actually fall inside? A bucket whose dates spill months before its own
     start is a batch marker — "entered in this session" — not a week. */
  console.log(`\n값별 상세 (오래된 순):`);
  const buckets = new Map<string, string[]>();
  for (const r of filled) {
    if (r.date) buckets.set(r.week, [...(buckets.get(r.week) ?? []), r.date]);
  }
  for (const [w, ds] of [...buckets].sort()) {
    const [s, e] = datesIn(w);
    const span = s && e ? (Date.parse(e) - Date.parse(s)) / 86400000 + 1 : NaN;
    const inside = ds.filter((d) => s && e && d >= s && d <= e).length;
    const sorted = [...ds].sort();
    console.log(
      `   ${w}  [${s ? dayName(s) : "?"}~${e ? dayName(e) : "?"}, ${span}일]  ` +
        `${String(ds.length).padStart(3)}건  범위안 ${inside} 밖 ${ds.length - inside}` +
        `   발행일 ${sorted[0]} ~ ${sorted[sorted.length - 1]}`,
    );
  }

  /* Two different questions, and the earlier version of this script conflated
     them. (1) Which weekday does the team start a week on — answered by the
     anchor tally, and answered wrongly for any bucket that isn't a full seven
     days, since its start can't equal a Sunday no matter where the row sits.
     (2) Would reading Week move a story to a different week than its date
     already puts it in — answered only by containment. */
  let sun = 0, mon = 0, other = 0, unparsed = 0;
  let inside = 0, before = 0, after = 0;
  const off: string[] = [];
  const gaps: number[] = [];
  for (const r of filled) {
    const [s, e] = datesIn(r.week);
    if (!s) {
      unparsed++;
      continue;
    }
    if (!r.date) continue;
    if (s === weekStart(r.date, "sun")) sun++;
    else if (s === weekStart(r.date, "mon")) mon++;
    else other++;

    if (!e) continue;
    if (r.date >= s && r.date <= e) inside++;
    else if (r.date < s) {
      before++;
      gaps.push(Math.round((Date.parse(s) - Date.parse(r.date)) / 86400000));
      if (off.length < 15)
        off.push(`   발행일 ${r.date}  Week=${r.week}  ${r.title.slice(0, 34)}`);
    } else after++;
  }

  console.log(`\n① 주 시작 요일 — Week 값의 시작일 vs 발행일에서 계산한 주 시작일`);
  console.log(`   일요일 앵커와 일치 : ${sun}`);
  console.log(`   월요일 앵커와 일치 : ${mon}`);
  console.log(`   둘 다 아님         : ${other}   (7일이 아닌 버킷은 여기로 샌다)`);
  console.log(`   날짜를 못 읽음     : ${unparsed}`);

  console.log(`\n② 매핑 시 이동량 — 발행일이 그 행의 Week 범위 안에 있는가`);
  console.log(`   범위 안   : ${inside}`);
  console.log(`   범위 이전 : ${before}   ← 지난 기사를 나중 세션에 정리한 행`);
  console.log(`   범위 이후 : ${after}`);
  if (gaps.length) {
    gaps.sort((a, b) => a - b);
    console.log(`   이전인 행의 격차(일): 중앙값 ${gaps[Math.floor(gaps.length / 2)]}, 최대 ${gaps.at(-1)}`);
  }
  if (off.length) {
    console.log(`\n범위 이전인 행 (최대 15건):`);
    for (const l of off) console.log(l);
  }
  console.log(
    `\n판단: ①이 주차 경계를 정한다. ②의 "범위 이전"이 크고 고유 Week 값이\n` +
      `적다면 Week는 주차가 아니라 배치 기록이므로, 아카이브 그룹핑에 쓰면\n` +
      `오래된 기사가 최근 주차로 뭉친다 — 그때는 매핑하지 않는 쪽이 맞다.\n`,
  );
}

main();
