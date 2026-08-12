import type { Metadata } from "next";
import LangProvider from "@/components/lang-provider";
/* Pretendard is the only typeface on the site — Latin and hangul, display
   through mono. Its @font-face rules are self-hosted in ./pretendard.css,
   which globals.css imports, so there is no next/font wiring left here. */
import "./globals.css";

export const metadata: Metadata = {
  title: "BAY — Blockchain at Yonsei",
  description:
    "연세대학교 블록체인 학회 BAY(Blockchain at Yonsei). 2017년부터 리서치, 개발, 네트워킹으로 블록체인의 다음 장을 씁니다.",
  openGraph: {
    title: "BAY — Blockchain at Yonsei",
    description: "연세대학교 블록체인 학회 BAY(Blockchain at Yonsei)",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-ink font-body text-slate-200 antialiased">
        {/* wraps everything so the switch in the hero menu and the dialogs that
            read it can sit on different pages; children stay server-rendered */}
        <LangProvider>{children}</LangProvider>
        {/* film grain — kills gradient banding, adds texture everywhere */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[90] opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </body>
    </html>
  );
}
