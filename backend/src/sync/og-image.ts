/* The one thing this module knows: given a news article's HTML, which image
   the publisher chose to represent it. og:image is what every news site sets
   for link previews, so it is exactly the "one picture for this story" the
   cards need — with twitter:image as the dialect some sites speak instead.

   Parsing is two regexes over the head-ish part of the page, not an HTML
   parser: meta tags are single self-contained tags, attribute order is the
   only variance that matters, and a dependency for that trade is not worth
   it. */

const META_RE =
  /<meta\s+[^>]*?(?:property|name)\s*=\s*["'](og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*?>/gi;
const CONTENT_RE = /content\s*=\s*["']([^"']+)["']/i;

/* order of preference among whatever the page declares */
const RANK: Record<string, number> = {
  "og:image:secure_url": 0,
  "og:image": 1,
  "twitter:image": 2,
  "twitter:image:src": 3,
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* The best image URL the page declares, absolutized against the page's own
   URL (some sites emit paths), or undefined when it declares none. */
export function ogImageFrom(html: string, pageUrl: string): string | undefined {
  let best: { rank: number; url: string } | undefined;
  for (const tag of html.matchAll(META_RE)) {
    const rank = RANK[tag[1].toLowerCase()] ?? 9;
    const content = CONTENT_RE.exec(tag[0])?.[1];
    if (!content || (best && best.rank <= rank)) continue;
    try {
      const url = new URL(decodeEntities(content.trim()), pageUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        best = { rank, url: url.href };
      }
    } catch {
      /* a malformed content value is the page's problem, not a crash */
    }
  }
  return best?.url;
}

/* Fetch a story page and read its og:image. Networked half, kept apart from
   the pure parser above so tests need no fetch. Any failure — bot-blocked,
   timeout, not HTML — is a null, never a throw: a missing cover costs a
   generated-art card, nothing more. */
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        /* some news sites 403 the default undici UA */
        "user-agent": "Mozilla/5.0 (compatible; BAYNewsBot/1.0; +https://www.blockchainatyonsei.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !type.includes("html")) return null;
    /* og tags live in <head>; half a megabyte reaches it on any real page */
    const html = (await res.text()).slice(0, 500_000);
    return ogImageFrom(html, res.url || pageUrl) ?? null;
  } catch {
    return null;
  }
}
