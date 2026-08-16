import type { Metadata } from "next";
import ResearchHeader from "@/components/research/research-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Research — BAY",
    template: "%s — BAY Research",
  },
  description:
    "연세대학교 블록체인 학회 BAY의 리서치와 뉴스트래킹. 프로토콜, ZK, DeFi, 거버넌스에 대한 구조적 분석.",
};

export default function ResearchLayout({
  children,
}: LayoutProps<"/research">) {
  /* A flex column rather than a plain block: the home page fills exactly the
     space header and footer leave (see its lg:flex-1) so it can hold a whole
     screen without scrolling, while every other page just grows past it and
     scrolls as before. */
  return (
    <div className="flex min-h-svh flex-col bg-ink">
      <ResearchHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
