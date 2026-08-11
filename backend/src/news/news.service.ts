import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { isoDate } from "../content/shape";
import type {
  MemberModel as Member,
  NewsItemModel as NewsItem,
} from "../generated/prisma/models";
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

function toNewsItem(n: NewsItem & { curator: Member | null }) {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    url: n.url,
    sourceName: n.sourceName,
    summary: n.summary,
    category: n.category,
    date: isoDate(n.publishedAt),
    views: n.views,
    curator: n.curator
      ? { slug: n.curator.slug, name: n.curator.name, avatarUrl: n.curator.avatarUrl }
      : null,
  };
}

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { category?: string; from?: string; to?: string; cursor?: string; size: number }) {
    const keyset = filter.cursor ? decodeCursor(filter.cursor) : undefined;
    const items = await this.prisma.newsItem.findMany({
      where: {
        status: "published",
        ...(filter.category ? { category: filter.category } : {}),
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

  async categories() {
    const groups = await this.prisma.newsItem.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });
    return { items: groups.map((g) => g.category) };
  }

  /* Detail = the item + its body + both sidebar rails: latest overall and
     same-category, each excluding the item itself. One call renders the page. */
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
        where: { ...rail.where, category: item.category },
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
