import Image from "next/image";
import Link from "next/link";

/* Same masthead shape as ResearchHeader, minus the reading progress bar — the
   Organization page has no article to track. Kept as its own component rather
   than a shared one with a `section` prop, since the research lockup carries
   behaviour (progress) this one deliberately does not. */
export default function OrgHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="BAY 홈">
          <Image
            src="/logo.png"
            alt=""
            width={512}
            height={512}
            priority
            className="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display text-sm tracking-[0.15em] whitespace-nowrap uppercase">
            <span className="font-bold text-white">BAY</span>{" "}
            <span className="font-normal text-white/75 transition-colors group-hover:text-white">
              Organization
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
