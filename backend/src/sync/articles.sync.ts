import { Injectable, Logger } from "@nestjs/common";
import { mapBlocks } from "../notion/block-mapper";
import { NotionService } from "../notion/notion.service";
import { readingMinutes } from "../notion/reading-time";
import { PrismaService } from "../prisma/prisma.service";
import { pageToArticleMeta } from "./mappers/article.mapper";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

@Injectable()
export class ArticlesSyncService {
  private readonly logger = new Logger(ArticlesSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
  ) {}

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_ARTICLES"),
      opts.since,
    );

    /* 작성자 relation resolves against members already synced — the orchestrator
       runs members first. A page pointing at a not-yet-synced member skips
       with a warning and lands on the next run. */
    const members = await this.prisma.member.findMany({
      select: { id: true, notionPageId: true },
    });
    const memberIdByPage = new Map(members.map((m) => [m.notionPageId, m.id]));

    for (const page of pages) {
      const { meta, warnings } = pageToArticleMeta(page);
      stats.warnings.push(...warnings);
      if (!meta) {
        stats.skipped++;
        continue;
      }

      const authorIds = meta.authorPageIds.map((id) => memberIdByPage.get(id));
      if (authorIds.some((id) => id === undefined)) {
        stats.skipped++;
        stats.warnings.push(
          `article ${meta.slug}: 작성자 not found among synced members — will retry next run`,
        );
        continue;
      }

      let body: unknown;
      let minutes: number;
      try {
        const mapped = mapBlocks(await this.notion.pageBlocks(page.id));
        stats.warnings.push(...mapped.warnings.map((w) => `article ${meta.slug}: ${w}`));
        body = mapped.blocks;
        minutes = readingMinutes(mapped.blocks);
      } catch (e) {
        stats.skipped++;
        stats.warnings.push(`article ${meta.slug}: body fetch failed (${(e as Error).message})`);
        continue;
      }

      const row = {
        slug: meta.slug,
        title: meta.title,
        dek: meta.dek,
        category: meta.category,
        accent: meta.accent,
        status: meta.status,
        publishedAt: new Date(meta.publishedAt),
        featured: meta.featured,
        body: body as object,
        readingMinutes: minutes,
        mediumUrl: meta.mediumUrl ?? null,
        notionLastEditedAt: new Date(page.last_edited_time),
      };
      try {
        const existing = await this.prisma.article.findUnique({
          where: { notionPageId: page.id },
          select: { id: true },
        });
        await this.prisma.$transaction(async (tx) => {
          const article = await tx.article.upsert({
            where: { notionPageId: page.id },
            create: { ...row, notionPageId: page.id },
            update: row,
          });
          /* replace, not merge — Notion's relation order is the byline order */
          await tx.articleAuthor.deleteMany({ where: { articleId: article.id } });
          await tx.articleAuthor.createMany({
            data: (authorIds as string[]).map((memberId, ord) => ({
              articleId: article.id,
              memberId,
              ord,
            })),
          });
        });
        existing ? stats.updated++ : stats.created++;
      } catch (e) {
        stats.skipped++;
        stats.warnings.push(`article ${meta.slug}: upsert failed (${(e as Error).message})`);
      }
    }

    if (opts.full) {
      const archived = await this.prisma.article.updateMany({
        where: {
          notionPageId: { notIn: pages.map((p) => p.id) },
          status: { not: "archived" },
        },
        data: { status: "archived" },
      });
      stats.archived = archived.count;
    }

    this.logger.log(
      `articles: +${stats.created} ~${stats.updated} -${stats.archived} skip ${stats.skipped}`,
    );
    return stats;
  }
}
