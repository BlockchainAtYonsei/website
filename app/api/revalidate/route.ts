import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/* Called by the backend after a sync run that changed rows (design §4) —
   tags mirror the sync resources: members | articles | news. The fetch tags
   in lib/api.ts must stay in that vocabulary. */

const VALID_TAGS = new Set(["members", "articles", "news"]);

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = (await req.json().catch(() => null)) as {
    secret?: string;
    tags?: unknown;
  } | null;

  /* no secret configured = closed, not open */
  if (!secret || body?.secret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && VALID_TAGS.has(t))
    : [];
  for (const tag of tags) {
    /* expire: 0, not "max". "max" only marks the entry stale, so the next
       visitor is served the *old* page while the fresh one builds in the
       background — publish → live becomes "reload once and hope". The docs
       point external callers like our sync at { expire: 0 }: the entry is
       dropped, and the first request after a sync blocks on fresh data. One
       slow render per sync is the right price for never showing stale. */
    revalidateTag(tag, { expire: 0 });
  }
  return NextResponse.json({ ok: true, tags });
}
