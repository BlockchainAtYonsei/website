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
    /* "max" = stale-while-revalidate: readers keep getting the cached page
       while the fresh one builds — right trade-off for a content site */
    revalidateTag(tag, "max");
  }
  return NextResponse.json({ ok: true, tags });
}
