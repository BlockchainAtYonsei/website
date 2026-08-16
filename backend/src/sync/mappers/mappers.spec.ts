import { describe, expect, it } from "vitest";
import { page, prop } from "../../notion/test-fixtures";
import { pageToArticleMeta } from "./article.mapper";
import { pageToNews } from "./news.mapper";

function articleProps(over: Record<string, unknown> = {}) {
  return {
    제목: prop.title("리스테이킹의 위험 표면"),
    Slug: prop.richText("restaking-risk-surface"),
    Dek: prop.richText("수익을 합성하는 만큼 슬래싱도 합성한다."),
    카테고리: prop.select("Infra"),
    Accent: prop.select("indigo"),
    상태: prop.select("발행"),
    발행일: prop.date("2026-07-28"),
    Featured: prop.checkbox(true),
    작성자: prop.relation(["member-page-1"]),
    "Medium URL": prop.url("https://medium.com/x"),
    ...over,
  };
}

describe("pageToArticleMeta", () => {
  it("maps a complete page with Korean status labels", () => {
    const { meta, warnings } = pageToArticleMeta(page(articleProps()));
    expect(warnings).toEqual([]);
    expect(meta).toMatchObject({
      slug: "restaking-risk-surface",
      status: "published",
      accent: "indigo",
      publishedAt: "2026-07-28",
      featured: true,
      authorPageIds: ["member-page-1"],
    });
  });

  it("maps 커버 and keeps the credit's hyperlink as inline markup", () => {
    const { meta, warnings } = pageToArticleMeta(
      page(
        articleProps({
          커버: prop.filesExternal("https://example.com/photo.jpg"),
          "커버 출처": prop.link("Wikimedia Commons", "https://commons.wikimedia.org/x"),
        }),
      ),
    );
    expect(warnings).toEqual([]);
    expect(meta?.coverUrl).toBe("https://example.com/photo.jpg");
    /* the renderer's link form, so the source is clickable under the picture
       rather than a name the reader has to go and look up */
    expect(meta?.coverCredit).toBe("[Wikimedia Commons](https://commons.wikimedia.org/x)");
  });

  it("warns when a cover ships without a credit", () => {
    const { meta, warnings } = pageToArticleMeta(
      page(articleProps({ 커버: prop.files("https://notion.so/upload.png") })),
    );
    expect(meta?.coverUrl).toBe("https://notion.so/upload.png");
    expect(meta?.coverCredit).toBeUndefined();
    expect(warnings.join()).toMatch(/커버 출처/);
  });

  it("says nothing about credits when there is no cover", () => {
    const { meta, warnings } = pageToArticleMeta(page(articleProps()));
    expect(meta?.coverUrl).toBeUndefined();
    expect(warnings.join()).not.toMatch(/커버/);
  });

  it("skips when the 작성자 relation is empty", () => {
    const { meta, warnings } = pageToArticleMeta(
      page(articleProps({ 작성자: prop.relation([]) })),
    );
    expect(meta).toBeUndefined();
    expect(warnings.join()).toMatch(/작성자/);
  });

  it("derives a deterministic accent from the category when unset", () => {
    const a = pageToArticleMeta(page(articleProps({ Accent: prop.select(null) })));
    const b = pageToArticleMeta(page(articleProps({ Accent: prop.select(null) })));
    expect(a.meta?.accent).toBe(b.meta?.accent);
    expect(["blue", "violet", "teal", "indigo"]).toContain(a.meta?.accent);
  });

  it("falls back to page creation date and warns when 발행일 is empty on a published piece", () => {
    const { meta, warnings } = pageToArticleMeta(
      page(articleProps({ 발행일: prop.date(null) })),
    );
    expect(meta?.publishedAt).toBe("2026-08-01"); // fixture created_time
    expect(warnings.join()).toMatch(/발행일/);
  });

  it("keeps unknown 상태 values as draft", () => {
    const { meta, warnings } = pageToArticleMeta(
      page(articleProps({ 상태: prop.select("검토중") })),
    );
    expect(meta?.status).toBe("draft");
    expect(warnings.join()).toMatch(/검토중/);
  });
});

/* Columns and property TYPES are the 리서치팀's Blockchain News Tracking DB
   verbatim, read off the live database — Title is rich_text rather than the
   title property (that one is Insight, a scratch field), Source is rich_text
   holding a link, and Status is a multi_select. Guessing any of those wrong
   silently syncs nothing, which is what these fixtures exist to catch. */
function newsProps(over: Record<string, unknown> = {}) {
  return {
    Insight: prop.title("insight"),
    Title: prop.richText("이더리움 다음 하드포크 일정 확정"),
    Source: prop.richText("https://www.theblock.co/post/12345"),
    "Content Summary": prop.richText("일정보다 검증자 이탈률 조항이 핵심."),
    Topic: prop.multiSelect(["보안", "DeFi"]),
    "Date of issue": prop.date("2026-08-01"),
    Author: prop.multiSelect(["장동현"]),
    Status: prop.multiSelect(["홈페이지 게시"]),
    Pick: prop.checkbox(false),
    Week: prop.richText("2026.07.27~2026.08.02"),
    ...over,
  };
}

describe("pageToNews", () => {
  it("maps a complete page", () => {
    const { data, warnings } = pageToNews(page(newsProps()));
    expect(warnings).toEqual([]);
    expect(data).toMatchObject({
      title: "이더리움 다음 하드포크 일정 확정",
      url: "https://www.theblock.co/post/12345",
      status: "published",
      publishedAt: "2026-08-01",
      curatorName: "장동현",
    });
  });

  it("reads 홈페이지 게시 as published and unfinished states as draft", () => {
    expect(pageToNews(page(newsProps())).data?.status).toBe("published");
    for (const wip of ["미완성", "In progress", "Not started"]) {
      const { data, warnings } = pageToNews(page(newsProps({ Status: prop.multiSelect([wip]) })));
      expect(data?.status).toBe("draft");
      expect(warnings).toEqual([]);
    }
  });

  it("keeps a story that has no Source link — a fifth of them have none", () => {
    const { data, warnings } = pageToNews(page(newsProps({ Source: prop.richText("") })));
    expect(data?.url).toBeUndefined();
    expect(data?.title).toBe("이더리움 다음 하드포크 일정 확정");
    expect(data?.sourceName).toBe("");
    expect(warnings).toEqual([]);
  });

  it("takes the link out of a Source hyperlink, not its visible text", () => {
    /* How the DB actually holds it: the headline is the text, the article is
       the href. Reading the text would store the headline as the URL. */
    const { data, warnings } = pageToNews(
      page(newsProps({ Source: prop.link("칼시 열풍…순손실", "https://www.blockmedia.co.kr/archives/1118567") })),
    );
    expect(data?.url).toBe("https://www.blockmedia.co.kr/archives/1118567");
    expect(data?.sourceName).toBe("blockmedia.co.kr");
    expect(warnings).toEqual([]);
  });

  it("treats unlinked text in Source as no link, quietly", () => {
    const { data, warnings } = pageToNews(page(newsProps({ Source: prop.richText("추후 추가") })));
    expect(data?.url).toBeUndefined();
    expect(warnings).toEqual([]);
  });

  it("passes the Pick checkbox through", () => {
    expect(pageToNews(page(newsProps())).data?.pick).toBe(false);
    expect(pageToNews(page(newsProps({ Pick: prop.checkbox(true) }))).data?.pick).toBe(true);
  });

  it("skips the board's blank filler rows without filing a warning", () => {
    const { data, warnings } = pageToNews(
      page(newsProps({ Title: prop.richText(""), Status: prop.multiSelect([]) })),
    );
    expect(data).toBeUndefined();
    expect(warnings).toEqual([]);
  });

  it("keeps every Topic, in the curator's order", () => {
    expect(pageToNews(page(newsProps())).data?.categories).toEqual(["보안", "DeFi"]);
  });

  it("buckets an untagged story rather than leaving it unfindable", () => {
    const { data } = pageToNews(page(newsProps({ Topic: prop.multiSelect([]) })));
    expect(data?.categories).toEqual(["기타"]);
  });

  it("reads Topic and Author whichever property type they are", () => {
    const asSelect = pageToNews(
      page(newsProps({ Topic: prop.select("기관"), Author: prop.select("배예림") })),
    );
    expect(asSelect.data).toMatchObject({ categories: ["기관"], curatorName: "배예림" });

    const asPeople = pageToNews(page(newsProps({ Author: prop.people(["이성재"]) })));
    expect(asPeople.data?.curatorName).toBe("이성재");

    const asText = pageToNews(page(newsProps({ Author: prop.richText("노제희, 이재환") })));
    expect(asText.data?.curatorName).toBe("노제희");
  });

  it("derives a slug from the page id when Slug is absent", () => {
    const { data, warnings } = pageToNews(page(newsProps()));
    expect(data?.slug).toMatch(/^page\d+$/);
    expect(warnings).toEqual([]);
  });

  it("uses an explicit Slug property when valid", () => {
    const { data } = pageToNews(page(newsProps({ Slug: prop.richText("joint-crypto-unit") })));
    expect(data?.slug).toBe("joint-crypto-unit");
  });

  it("falls back to the URL host for the source name — their DB has no 출처", () => {
    expect(pageToNews(page(newsProps())).data?.sourceName).toBe("theblock.co");
  });

  it("warns when a published item has no write-up", () => {
    const { data, warnings } = pageToNews(
      page(newsProps({ "Content Summary": prop.richText("") })),
    );
    expect(data?.summary).toBe("");
    expect(warnings.join()).toMatch(/Content Summary/);
  });

  it("reads a hand-picked Cover, as a URL cell or as linked text", () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/x.jpg";
    expect(pageToNews(page(newsProps({ Cover: prop.url(url) }))).data?.cover).toBe(url);
    expect(pageToNews(page(newsProps({ Cover: prop.link("표지", url) }))).data?.cover).toBe(url);
  });

  it("has no Cover until the column exists — the lever is opt-in", () => {
    const { data, warnings } = pageToNews(page(newsProps()));
    expect(data?.cover).toBeUndefined();
    expect(warnings).toEqual([]);
  });

  it("drops a Cover that is not a URL rather than shipping a broken image", () => {
    const { data, warnings } = pageToNews(page(newsProps({ Cover: prop.richText("나중에 찾기") })));
    expect(data?.cover).toBeUndefined();
    expect(warnings.join()).toMatch(/"Cover" is not a URL/);
  });
});
