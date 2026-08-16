import type { PrismaService } from "../prisma/prisma.service";

/* The member roster, indexed for byline matching. 작성자 reaches both syncs as
   a name — typed by hand in the news DB, read off a related page's title for
   articles — and the roster lives in this database, so names are all there is
   to match on. The two syncs must resolve a name identically or the same
   person gets credited on one surface and dropped on the other; this is the
   one place the rule lives. */

/* Whitespace is stripped rather than trimmed — "장 동현" and "장동현" are the
   same person, and which one gets typed is a coin flip. */
export function nameKey(name: string): string {
  return name.replace(/\s+/g, "");
}

/* A name held by two members resolves to null: guessing a byline is worse
   than leaving it off. */
export async function loadRoster(prisma: PrismaService): Promise<Map<string, string | null>> {
  const members = await prisma.member.findMany({ select: { id: true, name: true } });
  const byName = new Map<string, string | null>();
  for (const m of members) {
    const key = nameKey(m.name);
    byName.set(key, byName.has(key) ? null : m.id);
  }
  return byName;
}
