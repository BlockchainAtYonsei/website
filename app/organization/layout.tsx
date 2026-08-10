import type { Metadata } from "next";
import OrgHeader from "@/components/org-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Organization — BAY",
  description:
    "연세대학교 블록체인 학회 BAY는 어떻게 굴러가는가 — 리서치, 빌드, 네트워크 세 팀과 기수 운영에 대해.",
};

export default function OrganizationLayout({
  children,
}: LayoutProps<"/organization">) {
  return (
    <div className="min-h-svh bg-ink">
      <OrgHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
