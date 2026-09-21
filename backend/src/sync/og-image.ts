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

/* The crawler identity news sites see — some 403 the default undici UA. */
const CRAWLER_UA =
  "Mozilla/5.0 (compatible; BAYNewsBot/1.0; +https://www.blockchainatyonsei.com)";

/* og tags live in <head>, so the page is read up to where the head closes
   rather than to a fixed byte count. A fixed 500KB used to be the cut, and
   CoinDesk inlines about 530KB of styles and data ahead of its og:image: every
   CoinDesk story carded as generated art while declaring a perfectly good
   picture. The cap only guards a page that never closes its head. */
const HEAD_CAP = 3_000_000;

export function headOf(html: string): string {
  const end = html.search(/<\/head\s*>/i);
  return html.slice(0, end >= 0 ? end : HEAD_CAP);
}

/* MSN is a redistributor, not a publisher: its ar-<id> article pages are a
   client-rendered shell that declares no og:image to a crawler, so a story a
   curator linked through MSN would only ever card as generated art. MSN's own
   content API, though, answers a plain GET with both the original publisher's
   URL and MSN's copy of the lead image — enough to recover the picture the
   crawl couldn't see. This maps an MSN article URL to that API's URL, and
   returns undefined for anything that isn't one, which is how fetchOgImage
   stays on its normal path.

   The id rides in an "ar-<id>" segment and the locale in the "ko-kr"/"en-us"
   segment the path leads with; the API wants the id without the "ar-" prefix. */
export function msnDetailApi(pageUrl: string): string | undefined {
  let u: URL;
  try {
    u = new URL(pageUrl);
  } catch {
    return undefined;
  }
  if (!/(?:^|\.)msn\.com$/i.test(u.hostname)) return undefined;
  const segments = u.pathname.split("/").filter(Boolean);
  const idSeg = segments.find((s) => /^ar-[A-Za-z0-9]+$/.test(s));
  if (!idSeg) return undefined;
  const locale = segments.find((s) => /^[a-z]{2}-[a-z]{2}$/.test(s)) ?? "en-us";
  return `https://assets.msn.com/content/view/v2/Detail/${locale}/${idSeg.slice(3)}`;
}

/* The two image leads worth chasing out of an MSN detail response: the source
   story's URL (preferred — its own publisher sets a real og:image) and MSN's
   copy of the lead image (the fallback for when that publisher sets none or
   blocks the crawler). */
export function msnPick(json: unknown): { sourceHref?: string; image?: string } {
  const d = (json ?? {}) as { sourceHref?: unknown; imageResources?: unknown };
  const out: { sourceHref?: string; image?: string } = {};
  if (typeof d.sourceHref === "string") out.sourceHref = d.sourceHref;
  const first = (Array.isArray(d.imageResources) ? d.imageResources : []).find(
    (r): r is { url: string } => !!r && typeof (r as { url?: unknown }).url === "string",
  );
  if (first) out.image = first.url;
  return out;
}

function httpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/* Resolve an MSN detail API URL to a story image: the original publisher's
   og:image first, MSN's own copy second. sourceHref is never itself an MSN
   link, so the hop through fetchOgImageDirect bottoms out at once. */
async function fetchMsnImage(apiUrl: string): Promise<string | null> {
  try {
    const res = await fetch(apiUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": CRAWLER_UA, accept: "application/json" },
    });
    if (!res.ok) return null;
    const { sourceHref, image } = msnPick(await res.json());
    const source = httpUrl(sourceHref);
    if (source) {
      const fromSource = await fetchOgImageDirect(source);
      if (fromSource) return fromSource;
    }
    return httpUrl(image);
  } catch {
    return null;
  }
}

/* The identity a link-preview crawler presents. Some publishers (The Block)
   403 every client except the social unfurlers they want previews from, a
   plain browser included. og:image is exactly the metadata they publish for
   those previews, so a story that refused our own crawler is asked once more
   as one. Only after a refusal: our own name stays the first thing anyone
   sees, and a site that turns this away too costs nothing but the retry. */
const PREVIEW_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/* Statuses that mean "not you", as opposed to "no such page". */
export function isRefusal(status: number): boolean {
  return status === 401 || status === 403;
}

async function readOgImage(
  pageUrl: string,
  userAgent: string,
): Promise<{ status: number; image: string | null }> {
  const res = await fetch(pageUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) return { status: res.status, image: null };
  const type = res.headers.get("content-type") ?? "";
  if (type && !type.includes("html")) return { status: res.status, image: null };
  return {
    status: res.status,
    image: ogImageFrom(headOf(await res.text()), res.url || pageUrl) ?? null,
  };
}

/* Fetch a story page and read its og:image. Networked half, kept apart from
   the pure parser above so tests need no fetch. Any failure — bot-blocked,
   timeout, not HTML — is a null, never a throw: a missing cover costs a
   generated-art card, nothing more. */
async function fetchOgImageDirect(pageUrl: string): Promise<string | null> {
  try {
    const first = await readOgImage(pageUrl, CRAWLER_UA);
    if (first.image || !isRefusal(first.status)) return first.image;
    return (await readOgImage(pageUrl, PREVIEW_UA)).image;
  } catch {
    return null;
  }
}

/* The publisher's chosen image for a story, from its og:image — or, when the
   link is an MSN redistribution, by resolving MSN's content API back to that
   same publisher (and to MSN's own copy as a last resort). */
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  const msnApi = msnDetailApi(pageUrl);
  return msnApi ? fetchMsnImage(msnApi) : fetchOgImageDirect(pageUrl);
}
