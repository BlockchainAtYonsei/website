import { Injectable, Logger } from "@nestjs/common";
import { mapBlocks, stripLeadLabel } from "../notion/block-mapper";
import type { Block } from "../notion/block-types";
import { NotionService } from "../notion/notion.service";
import { PrismaService } from "../prisma/prisma.service";
import { ImageRehostService } from "./images.service";
import { pageToNews } from "./mappers/news.mapper";
import { fetchOgImage } from "./og-image";
import { loadRoster, nameKey } from "./roster";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

@Injectable()
export class NewsSyncService {
  private readonly logger = new Logger(NewsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
    private readonly images: ImageRehostService,
  ) {}

  /* The original story's og:image, fetched once per item — the card picture
     for a write-up that carries none, and the fallback under one that does.
     Re-hosted when storage is
     configured; kept as the publisher's CDN URL otherwise — unlike Notion
     files those don't expire, so local work needs no warning. An existing
     cover is reused unless the Source link changed, which keeps the nightly
     full reconcile from re-crawling every publisher. */
  private async coverFor(
    data: { slug: string; url?: string; cover?: string },
    existing: { url: string | null; coverUrl: string | null } | null,
    warnings: string[],
  ): Promise<string | null> {
    /* A link someone pasted into Cover beats anything crawled — it is the one
       case where a person looked at the story and chose the picture, and the
       only cover the stories with no Source (or a PDF one, or a publisher
       that 403s us) will ever get. Stored as pasted rather than re-hosted:
       these point at Wikimedia and company CDNs, which don't expire the way
       a Notion upload does, and copying them would re-upload every run. */
    if (data.cover) return data.cover;
    if (!data.url) return null;
    if (existing?.coverUrl && existing.url === data.url) return existing.coverUrl;

    const og = await fetchOgImage(data.url);
    if (!og) return null;
    return this.images.configured
      ? this.images.store(`news/${data.slug}`, `news ${data.slug}`, og, warnings)
      : og;
  }

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_NEWS"),
      opts.since,
    );

    /* Deletions reconcile BEFORE the upserts, not after. The team deletes
       rows and re-enters their stories as fresh pages in one board shuffle;
       running the archive last meant a run's own upserts raced whatever
       constraint the ghosts still satisfied, and a failed insert waited a
       full day for the next reconcile. Nothing unique rides on news url any
       more, but ordering reconciliation first is simply the honest shape of
       a full sync — the page list is already complete before the loop. */
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

    const memberIdByName = await loadRoster(this.prisma);

    for (const page of pages) {
      const { data, warnings } = pageToNews(page);
      stats.warnings.push(...warnings);
      if (!data) {
        stats.skipped++;
        continue;
      }

      /* An unknown curator degrades to null — unlike an article byline, the
         item is complete without it, and a typo in one cell must not cost the
         story. The warning is how the name gets fixed. */
      let curatorId: string | null = null;
      if (data.curatorName) {
        curatorId = memberIdByName.get(nameKey(data.curatorName)) ?? null;
        if (!curatorId) {
          stats.warnings.push(
            `news ${data.slug}: 작성자 "${data.curatorName}" matches no member — byline left empty`,
          );
        }
      }

      /* 요약/인사이트 live in the Notion page body — same Block[] contract as
         articles. An empty page is a link-only item, not an error. */
      let body: Block[] = [];
      try {
        const mapped = mapBlocks(await this.notion.pageBlocks(page.id));
        stats.warnings.push(...mapped.warnings.map((w) => `news ${data.slug}: ${w}`));
        /* top level only — a nested list's children are not the page's own
           opening, so this cannot run inside mapBlocks' recursion */
        const blocks = stripLeadLabel(mapped.blocks);
        body = await this.images.rehost(
          `news/${data.slug}`,
          `news ${data.slug}`,
          blocks,
          stats.warnings,
        );
      } catch (e) {
        stats.warnings.push(
          `news ${data.slug}: body fetch failed (${(e as Error).message}), kept link-only`,
        );
      }

      try {
        const existing = await this.prisma.newsItem.findUnique({
          where: { notionPageId: page.id },
          select: { id: true, url: true, coverUrl: true },
        });

        /* Both pictures are kept, and the render picks: the curator's own
           beats the publisher's og:image every time (content/shape.ts), but
           nulling the loser here meant one dead image left the card with
           nothing at all to show — which is exactly what shipped. Two URLs
           per row is the cheapest insurance there is against a picture that
           stops resolving, and publishers do rename paths. */
        const coverUrl = await this.coverFor(data, existing, stats.warnings);

        const row = {
          slug: data.slug,
          title: data.title,
          url: data.url ?? null,
          sourceName: data.sourceName,
          summary: data.summary,
          body: body as unknown as object,
          categories: data.categories,
          pick: data.pick,
          coverUrl,
          publishedAt: new Date(data.publishedAt),
          status: data.status,
          curatorId,
        };
        await this.prisma.newsItem.upsert({
          where: { notionPageId: page.id },
          create: { ...row, notionPageId: page.id },
          update: row,
        });
        existing ? stats.updated++ : stats.created++;
      } catch (e) {
        /* failed, not skipped: this page mapped as content the site should
           have, and the write is what refused. The story is missing until
           someone acts, and the count + warning are how anyone finds out. */
        stats.failed++;
        stats.warnings.push(`news ${data.title}: upsert failed (${(e as Error).message})`);
      }
    }

    this.logger.log(
      `news: +${stats.created} ~${stats.updated} -${stats.archived} skip ${stats.skipped} FAIL ${stats.failed}`,
    );
    return stats;
  }
}
