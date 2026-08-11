import { Injectable, Logger } from "@nestjs/common";
import { mapBlocks } from "../notion/block-mapper";
import { NotionService } from "../notion/notion.service";
import { PrismaService } from "../prisma/prisma.service";
import { pageToNews } from "./mappers/news.mapper";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

@Injectable()
export class NewsSyncService {
  private readonly logger = new Logger(NewsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
  ) {}

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_NEWS"),
      opts.since,
    );

    const members = await this.prisma.member.findMany({
      select: { id: true, notionPageId: true },
    });
    const memberIdByPage = new Map(members.map((m) => [m.notionPageId, m.id]));

    for (const page of pages) {
      const { data, warnings } = pageToNews(page);
      stats.warnings.push(...warnings);
      if (!data) {
        stats.skipped++;
        continue;
      }

      /* An unknown curator degrades to null — unlike an article byline, the
         item is complete without it. */
      let curatorId: string | null = null;
      if (data.curatorPageId) {
        curatorId = memberIdByPage.get(data.curatorPageId) ?? null;
        if (!curatorId) {
          stats.warnings.push(`news ${data.title}: 큐레이터 not found among synced members`);
        }
      }

      /* 요약/인사이트 live in the Notion page body — same Block[] contract as
         articles. An empty page is a link-only item, not an error. */
      let body: unknown = [];
      try {
        const mapped = mapBlocks(await this.notion.pageBlocks(page.id));
        stats.warnings.push(...mapped.warnings.map((w) => `news ${data.slug}: ${w}`));
        body = mapped.blocks;
      } catch (e) {
        stats.warnings.push(
          `news ${data.slug}: body fetch failed (${(e as Error).message}), kept link-only`,
        );
      }

      const row = {
        slug: data.slug,
        title: data.title,
        url: data.url,
        sourceName: data.sourceName,
        summary: data.summary,
        body: body as object,
        category: data.category,
        publishedAt: new Date(data.publishedAt),
        status: data.status,
        curatorId,
      };
      try {
        const existing = await this.prisma.newsItem.findUnique({
          where: { notionPageId: page.id },
          select: { id: true },
        });
        await this.prisma.newsItem.upsert({
          where: { notionPageId: page.id },
          create: { ...row, notionPageId: page.id },
          update: row,
        });
        existing ? stats.updated++ : stats.created++;
      } catch (e) {
        stats.skipped++;
        stats.warnings.push(`news ${data.title}: upsert failed (${(e as Error).message})`);
      }
    }

    if (opts.full) {
      const archived = await this.prisma.newsItem.updateMany({
        where: {
          notionPageId: { notIn: pages.map((p) => p.id) },
          status: { not: "archived" },
        },
        data: { status: "archived" },
      });
      stats.archived = archived.count;
    }

    this.logger.log(
      `news: +${stats.created} ~${stats.updated} -${stats.archived} skip ${stats.skipped}`,
    );
    return stats;
  }
}
