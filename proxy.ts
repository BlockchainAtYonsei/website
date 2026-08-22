import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* research.blockchainatyonsei.com serves the research property at its own root.

   The research pages live under /research in this single app; on that host we
   rewrite the incoming path into the /research subtree so the subdomain reads
   as an independent site while the code stays one deploy. The apex
   (blockchainatyonsei.com / www) is left entirely untouched — this file only
   acts when the Host is the research subdomain — so it is safe to ship before
   the domain (or its Railway certificate) resolves, and reverting is deleting
   one file.

   In Next 16 this convention is `proxy.ts`, the renamed `middleware.ts`.

   Override RESEARCH_HOST for a preview domain. Locally:
     curl -H "Host: research.blockchainatyonsei.com" localhost:3000/         */
const RESEARCH_HOST =
  process.env.RESEARCH_HOST ?? "research.blockchainatyonsei.com";

function isResearchHost(host: string | null): boolean {
  if (!host) return false;
  return host.split(":")[0].toLowerCase() === RESEARCH_HOST;
}

export function proxy(request: NextRequest) {
  if (!isResearchHost(request.headers.get("host"))) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  /* Already inside the subtree — existing /research/* links. Serve as-is so
     in-app navigation keeps working while the clean-URL surface is young; the
     address bar just keeps the prefix on those hops. */
  if (pathname === "/research" || pathname.startsWith("/research/")) {
    return NextResponse.next();
  }

  /* The subdomain root and every clean path map into the research subtree:
     research.b.com/ → /research, research.b.com/news → /research/news. */
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/research" : `/research${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /* Skip Next internals, the API routes (shared with the apex, not part of the
     research subtree), and any path with a file extension so public assets —
     /study/cover.jpg, /logo.png, fonts — are served untouched. */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
