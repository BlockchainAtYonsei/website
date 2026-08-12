import Image from "next/image";
import Link from "next/link";
import ReadingProgress from "./reading-progress";
import ResearchNav from "./research-nav";

/* Standalone masthead: BAY RESEARCH reads as its own property rather than a
   breadcrumb hanging off the main site, so the wordmark is set in one weight of
   the hero's display face instead of the serif used for editorial titles.
   Both the logo and the wordmark lead to the research index, not to the main
   site: research is opened in a new tab, so the way back to the main site is
   the tab it was opened from, and a masthead that navigates away from the
   property would strand the reader in the wrong tab. */
export default function ResearchHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/research"
            className="group flex items-center"
            aria-label="BAY Research 홈"
          >
            <Image
              src="/logo.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* hidden on phones: the Research tab already leads home, and the
              wordmark plus three tabs don't fit 390px side by side */}
          <Link
            href="/research"
            className="font-display hidden text-sm font-bold tracking-[0.15em] whitespace-nowrap text-white uppercase transition-colors hover:text-bay-300 sm:block"
          >
            BAY Research
          </Link>
        </div>

        <ResearchNav />
      </div>
      <ReadingProgress />
    </header>
  );
}
