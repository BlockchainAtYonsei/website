import { describe, expect, it } from "vitest";
import { plainText, toMicroformat } from "./richtext";
import { rt } from "./test-fixtures";

/* The renderer's inline regex is the contract:
   /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/ — non-nesting. */

describe("toMicroformat", () => {
  it("passes plain text through", () => {
    expect(toMicroformat([rt("그냥 텍스트")])).toBe("그냥 텍스트");
  });

  it("serializes bold as **…**", () => {
    expect(toMicroformat([rt("전제"), rt("굵게", { bold: true })])).toBe("전제**굵게**");
  });

  it("serializes code as `…`", () => {
    expect(toMicroformat([rt("disclose()", { code: true })])).toBe("`disclose()`");
  });

  it("serializes links as [label](href)", () => {
    expect(toMicroformat([rt("문서", { href: "https://a.b/c" })])).toBe(
      "[문서](https://a.b/c)",
    );
  });

  it("link wins over bold (renderer cannot nest)", () => {
    expect(toMicroformat([rt("굵은 링크", { bold: true, href: "https://a.b" })])).toBe(
      "[굵은 링크](https://a.b)",
    );
  });

  it("code wins over link and bold", () => {
    expect(
      toMicroformat([rt("x", { code: true, bold: true, href: "https://a.b" })]),
    ).toBe("`x`");
  });

  it("strips characters that would break the renderer's matchers", () => {
    expect(toMicroformat([rt("a*b", { bold: true })])).toBe("**ab**");
    expect(toMicroformat([rt("a`b", { code: true })])).toBe("`a'b`");
    expect(toMicroformat([rt("[label]", { href: "https://a.b" })])).toBe(
      "[label](https://a.b)",
    );
  });

  it("drops empty segments", () => {
    expect(toMicroformat([rt(""), rt("살아남음")])).toBe("살아남음");
    expect(toMicroformat([rt("*", { bold: true })])).toBe("");
  });
});

describe("plainText", () => {
  it("joins plain_text, ignoring annotations", () => {
    expect(plainText([rt("굵게", { bold: true }), rt(" 옆")])).toBe("굵게 옆");
  });
});
