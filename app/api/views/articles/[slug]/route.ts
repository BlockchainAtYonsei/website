import { NextResponse } from "next/server";

/* View-counter relay: the article page's ViewPing posts here, the server
   forwards to the backend. Always 204 — a counter has no readable outcome. */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    await fetch(`${API_URL}/v1/articles/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    /* a lost count is not an error the reader should see */
  }
  return new NextResponse(null, { status: 204 });
}
