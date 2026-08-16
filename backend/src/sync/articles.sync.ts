import { Injectable, Logger } from "@nestjs/common";
import { mapBlocks } from "../notion/block-mapper";
import type { Block } from "../notion/block-types";
import { NotionService } from "../notion/notion.service";
import { readingMinutes } from "../notion/reading-time";
import { PrismaService } from "../prisma/prisma.service";
import { ImageRehostService } from "./images.service";
import { pageToArticleMeta } from "./mappers/article.mapper";
import { loadRoster, nameKey } from "./roster";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

@Injectable()
export class ArticlesSyncService {
  private readonly logger = new Logger(ArticlesSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
    private readonly images: ImageRehostService,
  ) {}

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_ARTICLES"),
      opts.since,
    );

    /* Deletions reconcile before the upserts, same as the news sync, so a
       page deleted and replaced in one edit session settles in one run. Note
       the trap this does NOT clear: slug here is unique across archived rows
       too, so re-entering a deleted article under the same Slug property
       stays blocked until someone renames or purges the ghost. News dropped
       url uniqueness over this class of problem; slug is routing identity and
       can't, until the readers of findUnique(slug) prefer the live row. */
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

    /* 작성자 is a relation to Notion pages this database knows nothing about —
       the roster lives here, not in Notion. So each related page's title is
       fetched once and matched against member names (roster.ts — the same
       rule the news sync applies to its typed-in names). */
    const memberIdByName = await loadRoster(this.prisma);
    const titleCache = new Map<string, string | null>();
    const authorId = async (pageId: string): Promise<string | undefined> => {
      if (!titleCache.has(pageId)) {
        titleCache.set(pageId, await this.notion.pageTitle(pageId).catch(() => null));
      }
      const name = titleCache.get(pageId);
      return (name && memberIdByName.get(nameKey(name))) || undefined;
    };

    for (const page of pages) {
      const { meta, warnings } = pageToArticleMeta(page);
      stats.warnings.push(...warnings);
      if (!meta) {
        stats.skipped++;
        continue;
      }

      const authorIds = await Promise.all(meta.authorPageIds.map(authorId));
      if (authorIds.some((id) => id === undefined)) {
        stats.skipped++;
        stats.warnings.push(
          `article ${meta.slug}: 작성자 matches no member in the roster — add them via seed-members and re-sync`,
        );
        continue;
      }

      let body: Block[];
      let minutes: number;
      try {
        const mapped = mapBlocks(await this.notion.pageBlocks(page.id));
        stats.warnings.push(...mapped.warnings.map((w) => `article ${meta.slug}: ${w}`));
        /* same re-hosting as news bodies — an uploaded figure's Notion URL
           dies within the hour, and articles lean on figures harder */
        body = await this.images.rehost(
          `articles/${meta.slug}`,
          `article ${meta.slug}`,
          mapped.blocks,
          stats.warnings,
        );
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
        /* failed, not skipped: mapped content the database refused — the one
           number that means a story is missing from the site. */
        stats.failed++;
        stats.warnings.push(`article ${meta.slug}: upsert failed (${(e as Error).message})`);
      }
    }

    this.logger.log(
      `articles: +${stats.created} ~${stats.updated} -${stats.archived} skip ${stats.skipped} FAIL ${stats.failed}`,
    );
    return stats;
  }
}
