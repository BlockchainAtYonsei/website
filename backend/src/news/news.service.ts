import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { isoDate, toNewsItem } from "../content/shape";
import type { NewsItemModel as NewsItem } from "../generated/prisma/models";
import { PrismaService } from "../prisma/prisma.service";

/* Keyset cursor over (publishedAt desc, id desc) — a feed that only grows
   shouldn't shift under the reader the way offset pages do. */
function encodeCursor(item: NewsItem): string {
  return Buffer.from(`${isoDate(item.publishedAt)}|${item.id}`).toString("base64url");
}

function decodeCursor(cursor: string): { date: Date; id: string } {
  const raw = Buffer.from(cursor, "base64url").toString();
  const [date, id] = raw.split("|");
  const d = new Date(date);
  if (!id || Number.isNaN(d.getTime())) throw new BadRequestException("invalid cursor");
  return { date: d, id };
}

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { category?: string; from?: string; to?: string; cursor?: string; size: number }) {
    const keyset = filter.cursor ? decodeCursor(filter.cursor) : undefined;
    const items = await this.prisma.newsItem.findMany({
      where: {
        status: "published",
        /* "carries this topic", not "is this topic" — a story tagged 보안 and
           DeFi has to answer to both chips. */
        ...(filter.category ? { categories: { has: filter.category } } : {}),
        ...(filter.from ? { publishedAt: { gte: new Date(filter.from) } } : {}),
        ...(filter.to ? { publishedAt: { lte: new Date(filter.to) } } : {}),
        ...(keyset
          ? {
              OR: [
                { publishedAt: { lt: keyset.date } },
                { publishedAt: keyset.date, id: { lt: keyset.id } },
              ],
            }
          : {}),
      },
      include: { curator: true },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: filter.size + 1, // one extra to know whether a next page exists
    });

    const page = items.slice(0, filter.size);
    return {
      items: page.map(toNewsItem),
      nextCursor: items.length > filter.size ? encodeCursor(page[page.length - 1]) : null,
    };
  }

  /* Topics by how often they are used. groupBy cannot reach inside an array
     column, so the counting happens in Postgres via unnest — one row per tag
     per story, then grouped. */
  async categories() {
    const rows = await this.prisma.$queryRaw<{ category: string }[]>`
      SELECT unnest(categories) AS category
      FROM news_items
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count(*) DESC, category ASC
    `;
    return { items: rows.map((r) => r.category) };
  }

  /* Detail = the item + its body + both sidebar rails: latest overall and
     topic-adjacent, each excluding the item itself. One call renders the
     page. */
  async bySlug(slug: string) {
    const item = await this.prisma.newsItem.findFirst({
      where: { status: "published", slug },
      include: { curator: true },
    });
    if (!item) throw new NotFoundException();

    const rail = {
      where: { status: "published" as const, id: { not: item.id } },
      include: { curator: true },
      orderBy: [{ publishedAt: "desc" as const }, { id: "desc" as const }],
      take: 3,
    };
    const [latest, related] = await Promise.all([
      this.prisma.newsItem.findMany(rail),
      this.prisma.newsItem.findMany({
        ...rail,
        /* Overlapping topics, not an exact match: with several tags per item
           "same category" is a shared one. */
        where: { ...rail.where, categories: { hasSome: item.categories } },
      }),
    ]);

    return {
      ...toNewsItem(item),
      body: item.body,
      latest: latest.map(toNewsItem),
      related: related.map(toNewsItem),
    };
  }

  async registerView(slug: string) {
    await this.prisma.newsItem.updateMany({
      where: { status: "published", slug },
      data: { views: { increment: 1 } },
    });
  }
}
