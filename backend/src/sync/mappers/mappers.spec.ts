import { describe, expect, it } from "vitest";
import { page, prop } from "../../notion/test-fixtures";
import { pageToArticleMeta } from "./article.mapper";
import { pageToMember } from "./member.mapper";
import { pageToNews } from "./news.mapper";

function memberProps(over: Record<string, unknown> = {}) {
  return {
    이름: prop.title("배예림"),
    Slug: prop.richText("yerim-bae"),
    기수: prop.number(17),
    팀: prop.select("리서치팀"),
    직책: prop.select("팀장"),
    소개: prop.richText("리서치팀을 이끕니다."),
    상태: prop.select("활동"),
    "사이트 노출": prop.checkbox(true),
    GitHub: prop.url("https://github.com/yerim"),
    X: prop.url(null),
    ...over,
  };
}

describe("pageToMember", () => {
  it("maps a complete page", () => {
    const { data, warnings } = pageToMember(page(memberProps()));
    expect(warnings).toEqual([]);
    expect(data).toMatchObject({
      slug: "yerim-bae",
      name: "배예림",
      cohort: 17,
      team: "리서치팀",
      position: "팀장",
      status: "active",
      visible: true,
      socials: [{ label: "GitHub", href: "https://github.com/yerim" }],
    });
  });

  it("skips when Slug is missing or malformed", () => {
    for (const bad of [prop.richText(""), prop.richText("Yerim Bae")]) {
      const { data, warnings } = pageToMember(page(memberProps({ Slug: bad })));
      expect(data).toBeUndefined();
      expect(warnings.join()).toMatch(/Slug/);
    }
  });

  it("skips when 기수 is missing", () => {
    const { data } = pageToMember(page(memberProps({ 기수: prop.number(null) })));
    expect(data).toBeUndefined();
  });

  it("accepts a status-type 상태 property and warns on unknown values", () => {
    const viaStatus = pageToMember(page(memberProps({ 상태: prop.status("알럼나이") })));
    expect(viaStatus.data?.status).toBe("alumni");

    const unknown = pageToMember(page(memberProps({ 상태: prop.select("휴학") })));
    expect(unknown.data?.status).toBe("active");
    expect(unknown.warnings.join()).toMatch(/휴학/);
  });

  it("lowercases slugs", () => {
    const { data } = pageToMember(page(memberProps({ Slug: prop.richText("Yerim-Bae") })));
    expect(data?.slug).toBe("yerim-bae");
  });
});

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

function newsProps(over: Record<string, unknown> = {}) {
  return {
    제목: prop.title("이더리움 다음 하드포크 일정 확정"),
    URL: prop.url("https://www.theblock.co/post/12345"),
    출처: prop.select("The Block"),
    코멘트: prop.richText("일정보다 검증자 이탈률 조항이 핵심."),
    카테고리: prop.select("Infra"),
    "원문 발행일": prop.date("2026-08-01"),
    큐레이터: prop.relation(["member-page-1"]),
    상태: prop.select("발행"),
    ...over,
  };
}

describe("pageToNews", () => {
  it("maps a complete page", () => {
    const { data, warnings } = pageToNews(page(newsProps()));
    expect(warnings).toEqual([]);
    expect(data).toMatchObject({
      sourceName: "The Block",
      status: "published",
      publishedAt: "2026-08-01",
      curatorPageId: "member-page-1",
    });
  });

  it("skips on a missing or invalid URL", () => {
    for (const bad of [prop.url(null), prop.url("배포전")]) {
      const { data, warnings } = pageToNews(page(newsProps({ URL: bad })));
      expect(data).toBeUndefined();
      expect(warnings.join()).toMatch(/URL/);
    }
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

  it("falls back to the URL host when 출처 is empty", () => {
    const { data } = pageToNews(page(newsProps({ 출처: prop.select(null) })));
    expect(data?.sourceName).toBe("theblock.co");
  });

  it("warns when a published item has no curator comment", () => {
    const { data, warnings } = pageToNews(page(newsProps({ 코멘트: prop.richText("") })));
    expect(data?.summary).toBe("");
    expect(warnings.join()).toMatch(/코멘트/);
  });
});
