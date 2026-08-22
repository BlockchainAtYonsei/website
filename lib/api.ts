/* Server-side client for the BAY backend (backend/ — NestJS + Postgres).
   Pages fetch through here only; components never talk to the API. */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/* A 5xx here is almost always the backend mid-boot (it migrates and seeds
   before it listens) or a transient edge error — both worth a few seconds of
   patience, never worth failing a prerender over. A 4xx is a real answer. */
const RETRIES = 4;
const BACKOFF_MS = 3000;

/* 5-minute ISR ceiling. The backend pings /api/revalidate with the same tags
   after every sync that changed rows, so publish → live is normally seconds;
   the revalidate window only matters if that ping is lost. */
export async function api<T>(path: string, tags: string[]): Promise<T | null> {
  let res: Response | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300, tags } });
    } catch (e) {
      if (attempt >= RETRIES) throw e;
      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
      continue;
    }
    if (res.status < 500 || attempt >= RETRIES) break;
    await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
  }
  if (res!.status === 404) return null;
  if (!res!.ok) throw new Error(`API ${path} responded ${res!.status}`);
  return (await res!.json()) as T;
}
