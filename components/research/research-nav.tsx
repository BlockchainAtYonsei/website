"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* The research property's three surfaces as one tab set. Client component
   because active state needs the pathname; the header itself stays server-
   rendered. Home isn't a tab — the logo is the way back to it — so the row
   only lights up once you've left it for one of these three. Article pages
   light up Research — they're the archive's leaves. */

const TABS = [
  { href: "/research/articles", label: "Research" },
  { href: "/research/news", label: "News" },
  { href: "/research/author", label: "Authors" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/research/articles") {
    return (
      pathname.startsWith("/research/") &&
      !pathname.startsWith("/research/news") &&
      !pathname.startsWith("/research/author")
    );
  }
  return pathname.startsWith(href);
}

export default function ResearchNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-5 md:gap-6">
      {TABS.map(({ href, label }) => {
        const on = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`font-mono relative text-[10px] tracking-[0.18em] uppercase transition-colors ${
              on ? "text-white" : "text-white/50 hover:text-bay-300"
            }`}
          >
            {label}
            {/* offset below the descender line so the underline reads as a
                tab marker, not a strikethrough */}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-1.5 h-px bg-bay-400 shadow-[0_0_6px_rgba(95,139,255,0.8)] transition-opacity ${
                on ? "opacity-100" : "opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
