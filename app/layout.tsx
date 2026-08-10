import type { Metadata } from "next";
import {
  Space_Grotesk,
  Noto_Sans_KR,
  IBM_Plex_Mono,
  Instrument_Serif,
  Barlow,
} from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sg",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-nkr",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ipm",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-is",
});

const barlow = Barlow({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-bar",
});

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
    <html
      lang="ko"
      className={`${spaceGrotesk.variable} ${notoSansKr.variable} ${plexMono.variable} ${instrumentSerif.variable} ${barlow.variable}`}
    >
      <body className="bg-ink font-body text-slate-200 antialiased">
        {children}
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
