import type { Metadata } from "next";
import ResearchHeader from "@/components/research/research-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Research — BAY",
    template: "%s — BAY Research",
  },
  description:
    "연세대학교 블록체인 학회 BAY의 리서치. 프로토콜, ZK, DeFi, 거버넌스에 대한 구조적 분석.",
};

export default function ResearchLayout({
  children,
}: LayoutProps<"/research">) {
  return (
    <div className="min-h-svh bg-ink">
      <ResearchHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
