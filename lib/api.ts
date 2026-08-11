/* Server-side client for the BAY backend (backend/ — NestJS + Postgres).
   Pages fetch through here only; components never talk to the API. */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/* 5-minute ISR ceiling. The backend pings /api/revalidate with the same tags
   after every sync that changed rows, so publish → live is normally seconds;
   the revalidate window only matters if that ping is lost. */
export async function api<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 300, tags },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  return (await res.json()) as T;
}
