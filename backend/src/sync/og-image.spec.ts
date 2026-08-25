import { describe, expect, it } from "vitest";
import { msnDetailApi, msnPick, ogImageFrom } from "./og-image";

const PAGE = "https://news.example.com/story/123";

describe("ogImageFrom", () => {
  it("reads a plain og:image", () => {
    expect(
      ogImageFrom(`<meta property="og:image" content="https://cdn.example.com/a.jpg"/>`, PAGE),
    ).toBe("https://cdn.example.com/a.jpg");
  });

  it("prefers og:image over twitter:image regardless of order", () => {
    const html = `
      <meta name="twitter:image" content="https://cdn.example.com/tw.jpg">
      <meta property="og:image" content="https://cdn.example.com/og.jpg">`;
    expect(ogImageFrom(html, PAGE)).toBe("https://cdn.example.com/og.jpg");
  });

  it("falls back to twitter:image when og:image is absent", () => {
    expect(
      ogImageFrom(`<meta name="twitter:image" content="https://cdn.example.com/tw.jpg">`, PAGE),
    ).toBe("https://cdn.example.com/tw.jpg");
  });

  it("absolutizes a path against the page URL", () => {
    expect(ogImageFrom(`<meta property="og:image" content="/img/cover.png">`, PAGE)).toBe(
      "https://news.example.com/img/cover.png",
    );
  });

  it("survives attribute-order variance and single quotes", () => {
    expect(
      ogImageFrom(`<meta content='https://cdn.example.com/b.webp' property='og:image'>`, PAGE),
    ).toBe("https://cdn.example.com/b.webp");
  });

  it("decodes &amp; in query strings — CDNs sign URLs with them", () => {
    expect(
      ogImageFrom(
        `<meta property="og:image" content="https://cdn.example.com/c.jpg?w=1200&amp;h=630">`,
        PAGE,
      ),
    ).toBe("https://cdn.example.com/c.jpg?w=1200&h=630");
  });

  it("returns undefined for a page that declares nothing", () => {
    expect(ogImageFrom(`<html><head><title>hi</title></head></html>`, PAGE)).toBeUndefined();
  });

  it("ignores non-http schemes", () => {
    expect(
      ogImageFrom(`<meta property="og:image" content="data:image/png;base64,AAAA">`, PAGE),
    ).toBeUndefined();
  });
});

describe("msnDetailApi", () => {
  it("maps an MSN article URL to its content API, stripping ar- and keeping the locale", () => {
    expect(
      msnDetailApi(
        "https://www.msn.com/ko-kr/news/other/some-title/ar-AA2aMSKi?ocid=BingNewsSerp",
      ),
    ).toBe("https://assets.msn.com/content/view/v2/Detail/ko-kr/AA2aMSKi");
  });

  it("defaults the locale to en-us when the path has none", () => {
    expect(msnDetailApi("https://www.msn.com/news/ar-AB12cd34")).toBe(
      "https://assets.msn.com/content/view/v2/Detail/en-us/AB12cd34",
    );
  });

  it("returns undefined for a non-MSN host", () => {
    expect(msnDetailApi("https://www.insight.co.kr/news/569767")).toBeUndefined();
  });

  it("returns undefined for an MSN URL with no ar- article id", () => {
    expect(msnDetailApi("https://www.msn.com/ko-kr/news")).toBeUndefined();
  });

  it("does not match a look-alike host", () => {
    expect(msnDetailApi("https://www.msn.com.evil.example/ar-AA1")).toBeUndefined();
  });
});

describe("msnPick", () => {
  it("reads sourceHref and the first image resource", () => {
    expect(
      msnPick({
        sourceHref: "https://www.insight.co.kr/news/569767",
        imageResources: [
          { url: "https://img-s-msn-com.akamaized.net/a.img" },
          { url: "https://img-s-msn-com.akamaized.net/b.img" },
        ],
      }),
    ).toEqual({
      sourceHref: "https://www.insight.co.kr/news/569767",
      image: "https://img-s-msn-com.akamaized.net/a.img",
    });
  });

  it("returns an empty object when the payload carries neither", () => {
    expect(msnPick({})).toEqual({});
    expect(msnPick(null)).toEqual({});
    expect(msnPick({ imageResources: [] })).toEqual({});
  });
});
