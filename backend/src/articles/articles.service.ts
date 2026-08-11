import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ARTICLE_INCLUDE,
  toArticleDetail,
  toArticleListItem,
} from "../content/shape";
import { PrismaService } from "../prisma/prisma.service";

const PUBLISHED = { status: "published" as const };

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { category?: string; author?: string; page: number; size: number }) {
    const where = {
      ...PUBLISHED,
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.author
        ? { authors: { some: { member: { slug: filter.author } } } }
        : {}),
    };
    const [total, articles] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: "desc" },
        skip: (filter.page - 1) * filter.size,
        take: filter.size,
      }),
    ]);
    return {
      items: articles.map(toArticleListItem),
      total,
      page: filter.page,
      size: filter.size,
    };
  }

  /* Same rule as the frontend's getFeatured: the flagged piece, else newest. */
  async featured() {
    const article =
      (await this.prisma.article.findFirst({
        where: { ...PUBLISHED, featured: true },
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: "desc" },
      })) ??
      (await this.prisma.article.findFirst({
        where: PUBLISHED,
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: "desc" },
      }));
    if (!article) throw new NotFoundException();
    return toArticleListItem(article);
  }

  /* Tag-chip list — same derivation as the frontend's TAGS (distinct over
     published articles), ordered by usage so chips stay stable-ish. */
  async categories() {
    const groups = await this.prisma.article.groupBy({
      by: ["category"],
      where: PUBLISHED,
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });
    return { items: groups.map((g) => g.category) };
  }

  /* Fire-and-forget page-view counter. updateMany so an unknown or draft
     slug is a no-op instead of an exception — the endpoint is public and
     must stay boring. Club-scale honesty: no dedup beyond the client's
     per-session guard. */
  async registerView(slug: string) {
    await this.prisma.article.updateMany({
      where: { ...PUBLISHED, slug },
      data: { views: { increment: 1 } },
    });
  }

  async bySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { ...PUBLISHED, slug },
      include: ARTICLE_INCLUDE,
    });
    if (!article) throw new NotFoundException();

    /* Same-tag first, then most recent — mirrors the frontend's getRelated.
       The published pool is small (a club's archive); fetching metas and
       sorting in process beats a two-query union dance. */
    const pool = await this.prisma.article.findMany({
      where: { ...PUBLISHED, slug: { not: slug } },
      include: ARTICLE_INCLUDE,
      orderBy: { publishedAt: "desc" },
    });
    const related = [
      ...pool.filter((a) => a.category === article.category),
      ...pool.filter((a) => a.category !== article.category),
    ]
      .slice(0, 3)
      .map(toArticleListItem);

    return { ...toArticleDetail(article), related };
  }
}
