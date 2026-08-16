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
  /* A flex column so a short page still pushes the footer to the bottom of
     the screen. The page slot itself is a plain block: a page whose <main>
     centers itself with mx-auto would, as a flex item, have its auto margins
     beat align-self:stretch and collapse to fit-content — so the column's
     width would follow whatever text happened to be on the page instead of
     max-w-6xl. As a block child it fills the line box and mx-auto only
     centers within the cap. */
  return (
    <div className="flex min-h-svh flex-col bg-ink">
      <ResearchHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
