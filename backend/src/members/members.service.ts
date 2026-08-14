import { Injectable, NotFoundException } from "@nestjs/common";
import type { MemberStatus } from "../generated/prisma/enums";
import {
  ARTICLE_INCLUDE,
  toArticleListItem,
  toAuthor,
  toNewsItem,
} from "../content/shape";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /* Roster: visible members only. `writers` narrows to people with published
     work — articles or curated news, since a 리서치팀원 whose output so far is
     all news tracking still has a profile page worth finding. The directory
     is for finding writing, not reproducing the org chart. Every item carries
     its published counts so the frontend can order by output without N+1
     calls. */
  async list(filter: {
    cohort?: number;
    team?: string;
    status?: MemberStatus;
    writers?: boolean;
  }) {
    const published = { article: { status: "published" as const } };
    const publishedNews = { status: "published" as const };
    const members = await this.prisma.member.findMany({
      where: {
        visible: true,
        ...(filter.cohort !== undefined ? { cohort: filter.cohort } : {}),
        ...(filter.team ? { team: filter.team } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.writers
          ? {
              OR: [
                { articles: { some: published } },
                { curated: { some: publishedNews } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            articles: { where: published },
            curated: { where: publishedNews },
          },
        },
      },
      orderBy: [{ cohort: "asc" }, { name: "asc" }],
    });
    return {
      items: members.map((m) => ({
        ...toAuthor(m),
        articleCount: m._count.articles,
        newsCount: m._count.curated,
      })),
    };
  }

  /* Byline resolution ignores `visible` — a hidden member's published
     articles still need a working author page (frontend degrades a missing
     author to plain text, but a present one should resolve). */
  async bySlug(slug: string) {
    const member = await this.prisma.member.findUnique({ where: { slug } });
    if (!member) throw new NotFoundException();

    /* both tabs of the profile in one call: written research + curated news */
    const [articles, news] = await Promise.all([
      this.prisma.article.findMany({
        where: { status: "published", authors: { some: { memberId: member.id } } },
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: "desc" },
      }),
      this.prisma.newsItem.findMany({
        where: { status: "published", curatorId: member.id },
        include: { curator: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);
    return {
      ...toAuthor(member),
      /* counts the list endpoint promises on every Author — the profile's
         stats panel reads them, and articles/news.length is their
         definition here */
      articleCount: articles.length,
      newsCount: news.length,
      articles: articles.map(toArticleListItem),
      news: news.map(toNewsItem),
    };
  }
}
