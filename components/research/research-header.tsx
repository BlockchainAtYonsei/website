import Image from "next/image";
import Link from "next/link";
import ReadingProgress from "./reading-progress";

/* Standalone masthead: BAY RESEARCH reads as its own property rather than a
   breadcrumb hanging off the main site, so the wordmark is set in one weight of
   the hero's display face instead of the serif used for editorial titles.
   The logo and the wordmark are separate targets on purpose — the logo is the
   way back to the main site, the wordmark the way back to the research index. */
export default function ResearchHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center" aria-label="BAY 홈">
            <Image
              src="/logo.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <Link
            href="/research"
            className="font-display text-sm font-bold tracking-[0.15em] whitespace-nowrap text-white uppercase transition-colors hover:text-bay-300"
          >
            BAY Research
          </Link>
        </div>

        <nav>
          <Link
            href="/research/author"
            className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase transition-colors hover:text-bay-300"
          >
            Authors
          </Link>
        </nav>
      </div>
      <ReadingProgress />
    </header>
  );
}
