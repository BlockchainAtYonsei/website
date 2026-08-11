import { NextResponse } from "next/server";

/* Read proxy for the archive's client-side pagination — the browser talks to
   the site, only the server knows the backend URL. Same cache tag as the
   server-rendered pages, so a sync invalidates both together. */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const upstream = new URLSearchParams();
  // whitelist, not passthrough — this proxy serves exactly one component
  for (const key of ["category", "page", "size"] as const) {
    const v = params.get(key);
    if (v) upstream.set(key, v);
  }

  const res = await fetch(`${API_URL}/v1/articles?${upstream}`, {
    next: { revalidate: 300, tags: ["articles"] },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}
