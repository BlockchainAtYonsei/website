import Image from "next/image";
import Link from "next/link";
import ReadingProgress from "./reading-progress";

/* Standalone masthead: BAY RESEARCH reads as its own property rather than a
   breadcrumb hanging off the main site, so the lockup points at /research and
   uses the hero's display face instead of the serif used for editorial titles. */
export default function ResearchHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/research"
          className="group flex items-center gap-3"
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
          <span className="font-display text-sm tracking-[0.15em] whitespace-nowrap uppercase">
            <span className="font-bold text-white">BAY</span>{" "}
            <span className="font-normal text-white/75 transition-colors group-hover:text-white">
              Research
            </span>
          </span>
        </Link>

        <nav>
          <a
            href="https://medium.com/yonseiblockchainlab"
            target="_blank"
            rel="noreferrer"
            className="font-body text-xs font-light text-slate-400 transition-colors hover:text-bay-300"
          >
            Medium
          </a>
        </nav>
      </div>
      <ReadingProgress />
    </header>
  );
}
