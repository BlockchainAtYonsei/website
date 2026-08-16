import { describe, expect, it } from "vitest";
import type { Block } from "../notion/block-types";
import { firstReference, referenceCredit } from "./references";

const body = (...blocks: Block[]) => blocks;

describe("firstReference", () => {
  it("takes the first link under a 참고자료 heading", () => {
    const ref = firstReference(
      body(
        { t: "p", text: "본문" },
        { t: "h2", text: "참고자료" },
        {
          t: "ul",
          items: [
            "[EigenLayer](https://www.eigenlayer.xyz/) · 2026년 8월 조회",
            "[ethereum.org — 스테이킹](https://ethereum.org/en/staking/)",
          ],
        },
      ),
    );
    expect(ref).toEqual({ label: "EigenLayer", url: "https://www.eigenlayer.xyz/" });
  });

  it("ignores links in the prose above it", () => {
    const ref = firstReference(
      body(
        { t: "p", text: "스테이블코인 시총은 [DefiLlama](https://defillama.com/) 기준이다." },
        { t: "h2", text: "출처" },
        { t: "ul", items: ["[Circle](https://www.circle.com/transparency)"] },
      ),
    );
    /* the aside in the paragraph is a citation, not the piece's source list */
    expect(ref?.url).toBe("https://www.circle.com/transparency");
  });

  it("stops at the next heading", () => {
    const ref = firstReference(
      body(
        { t: "h2", text: "참고자료" },
        { t: "p", text: "링크 없음" },
        { t: "h2", text: "덧붙임" },
        { t: "ul", items: ["[Paradigm](https://www.paradigm.xyz/)"] },
      ),
    );
    expect(ref).toBeNull();
  });

  it("labels a bare URL with its site", () => {
    const ref = firstReference(
      body({ t: "h2", text: "References" }, { t: "ul", items: ["https://www.eigenlayer.xyz/docs"] }),
    );
    expect(ref).toEqual({ label: "eigenlayer.xyz", url: "https://www.eigenlayer.xyz/docs" });
  });

  it("is null on a body with no reference section", () => {
    expect(firstReference(body({ t: "p", text: "[a](https://example.com)" }))).toBeNull();
  });

  it("credits the reference with a link back", () => {
    expect(referenceCredit({ label: "Celestia", url: "https://celestia.org/" })).toBe(
      "사진: [Celestia](https://celestia.org/)",
    );
  });
});
