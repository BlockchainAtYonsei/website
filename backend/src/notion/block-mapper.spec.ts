import { describe, expect, it } from "vitest";
import { mapBlocks } from "./block-mapper";
import { block, rt, tableRow } from "./test-fixtures";

describe("mapBlocks", () => {
  it("maps paragraphs with inline microformat", () => {
    const { blocks, warnings } = mapBlocks([
      block("paragraph", [rt("실패도 "), rt("합성된다", { bold: true })]),
    ]);
    expect(blocks).toEqual([{ t: "p", text: "실패도 **합성된다**" }]);
    expect(warnings).toEqual([]);
  });

  it("skips empty paragraphs silently (author spacing)", () => {
    const { blocks, warnings } = mapBlocks([block("paragraph", [])]);
    expect(blocks).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("maps headings as plain text and folds h1 into h2", () => {
    const { blocks } = mapBlocks([
      block("heading_1", [rt("큰 제목")]),
      block("heading_2", [rt("굵은 소제목", { bold: true })]),
      block("heading_3", [rt("소소제목")]),
    ]);
    expect(blocks).toEqual([
      { t: "h2", text: "큰 제목" },
      { t: "h2", text: "굵은 소제목" }, // no ** in headings — renderer prints raw
      { t: "h3", text: "소소제목" },
    ]);
  });

  it("folds consecutive list items into one list, split by type", () => {
    const { blocks } = mapBlocks([
      block("bulleted_list_item", [rt("하나")]),
      block("bulleted_list_item", [rt("둘")]),
      block("numbered_list_item", [rt("첫째")]),
      block("numbered_list_item", [rt("둘째")]),
      block("paragraph", [rt("사이")]),
      block("bulleted_list_item", [rt("셋")]),
    ]);
    expect(blocks).toEqual([
      { t: "ul", items: ["하나", "둘"] },
      { t: "ol", items: ["첫째", "둘째"] },
      { t: "p", text: "사이" },
      { t: "ul", items: ["셋"] },
    ]);
  });

  it("folds a nested paragraph into its list item — the write-ups' main shape", () => {
    /* item title, explanation indented beneath it: the item absorbs the
       prose, so no words are lost even though the flat list loses the
       indent */
    const { blocks, warnings } = mapBlocks([
      block("numbered_list_item", [rt("가격 이슈보다 인프라 이슈")], {}, {
        children: [block("paragraph", [rt("이 뉴스는 결제·은행 인프라 변화에 더 중요합니다.")])],
      }),
    ]);
    expect(warnings).toEqual([]);
    expect(blocks).toEqual([
      { t: "ol", items: ["가격 이슈보다 인프라 이슈 — 이 뉴스는 결제·은행 인프라 변화에 더 중요합니다."] },
    ]);
  });

  it("flattens nested list items into the parent list, order preserved", () => {
    const { blocks } = mapBlocks([
      block("bulleted_list_item", [rt("부모")], {}, {
        children: [
          block("bulleted_list_item", [rt("자식 하나")]),
          block("bulleted_list_item", [rt("자식 둘")], {}, {
            children: [block("bulleted_list_item", [rt("손자")])],
          }),
        ],
      }),
      block("bulleted_list_item", [rt("다음 항목")]),
    ]);
    expect(blocks).toEqual([
      { t: "ul", items: ["부모", "자식 하나", "자식 둘", "손자", "다음 항목"] },
    ]);
  });

  it("reads on through a paragraph's indented children", () => {
    const { blocks } = mapBlocks([
      block("paragraph", [rt("본문")], {}, {
        children: [block("paragraph", [rt("들여쓴 부연")])],
      }),
    ]);
    expect(blocks).toEqual([
      { t: "p", text: "본문" },
      { t: "p", text: "들여쓴 부연" },
    ]);
  });

  it("renders a toggle as its line plus its children, in order", () => {
    const { blocks } = mapBlocks([
      block("toggle", [rt("더 보기")], {}, {
        children: [block("paragraph", [rt("숨겨져 있던 내용")])],
      }),
    ]);
    expect(blocks).toEqual([
      { t: "p", text: "더 보기" },
      { t: "p", text: "숨겨져 있던 내용" },
    ]);
  });


  it("maps an image with its caption; the URL passes through untouched", () => {
    const { blocks, warnings } = mapBlocks([
      {
        object: "block", id: "img-1", type: "image", has_children: false,
        image: { type: "file", file: { url: "https://prod-files.notion-static.com/x.png", expiry_time: "" }, caption: [rt("그림 설명")] },
      } as never,
    ]);
    expect(warnings).toEqual([]);
    expect(blocks).toEqual([
      { t: "image", url: "https://prod-files.notion-static.com/x.png", caption: "그림 설명" },
    ]);
  });

  it("splits a quote's trailing — line into cite", () => {
    const { blocks } = mapBlocks([
      block("quote", [rt("안전성은 가장 약한 조건이 결정한다.\n— 어느 감사 보고서")]),
    ]);
    expect(blocks).toEqual([
      {
        t: "quote",
        text: "안전성은 가장 약한 조건이 결정한다.",
        cite: "어느 감사 보고서",
      },
    ]);
  });

  it("keeps a single-line quote cite-less", () => {
    const { blocks } = mapBlocks([block("quote", [rt("한 줄 인용")])]);
    expect(blocks).toEqual([{ t: "quote", text: "한 줄 인용" }]);
  });

  it("lifts a bold first line out of a callout as its title", () => {
    const { blocks } = mapBlocks([
      block("callout", [rt("핵심", { bold: true }), rt("\n본문 내용이 이어진다")]),
    ]);
    expect(blocks).toEqual([
      { t: "callout", title: "핵심", text: "본문 내용이 이어진다" },
    ]);
  });

  it("keeps a callout without bold first line title-less", () => {
    const { blocks } = mapBlocks([block("callout", [rt("제목 없는 콜아웃")])]);
    expect(blocks).toEqual([{ t: "callout", text: "제목 없는 콜아웃" }]);
  });

  it("maps a table with a header row", () => {
    const { blocks } = mapBlocks([
      block("table", [], { has_column_header: true }, {
        children: [
          tableRow([[rt("레이어")], [rt("공유 지점")]]),
          tableRow([[rt("합의")], [rt("오퍼레이터 중첩", { bold: true })]]),
        ],
      }),
    ]);
    expect(blocks).toEqual([
      {
        t: "table",
        head: ["레이어", "공유 지점"], // heads render raw — plain text
        rows: [["합의", "**오퍼레이터 중첩**"]], // cells go through inline()
      },
    ]);
  });

  it("maps a headerless table with empty head", () => {
    const { blocks } = mapBlocks([
      block("table", [], { has_column_header: false }, {
        children: [tableRow([[rt("a")], [rt("b")]])],
      }),
    ]);
    expect(blocks).toEqual([{ t: "table", head: [], rows: [["a", "b"]] }]);
  });

  it("maps dividers", () => {
    expect(mapBlocks([block("divider")]).blocks).toEqual([{ t: "divider" }]);
  });

  it("skips textless unsupported blocks with a warning, never silently", () => {
    const { blocks, warnings } = mapBlocks([
      block("embed", [], { url: "https://x" }),
      block("paragraph", [rt("살아남은 문단")]),
    ]);
    expect(blocks).toEqual([{ t: "p", text: "살아남은 문단" }]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/unsupported block type "embed"/);
  });
});
