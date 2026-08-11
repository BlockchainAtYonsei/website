import { NextResponse } from "next/server";

/* Same relay as ../articles, pointed at the news counter. */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    await fetch(`${API_URL}/v1/news/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    /* a lost count is not an error the reader should see */
  }
  return new NextResponse(null, { status: 204 });
}
