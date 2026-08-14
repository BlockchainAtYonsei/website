import { createHash } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { mapBlocks } from "../notion/block-mapper";
import type { Block } from "../notion/block-types";
import { NotionService } from "../notion/notion.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { pageToNews } from "./mappers/news.mapper";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

const IMG_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

@Injectable()
export class NewsSyncService {
  private readonly logger = new Logger(NewsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
    private readonly storage: StorageService,
  ) {}

  /* Body images use expiring Notion file URLs, so what gets stored has to be
     our own copy — same content-hash scheme the avatars use, so re-syncing
     the same bytes never re-uploads. Without storage configured the Notion
     URL stays, with a warning: fine for local work, dead within the hour, so
     never what prod should run on. External (pasted-by-URL) images are
     already permanent and pass through untouched. */
  private async rehostImages(
    slug: string,
    blocks: Block[],
    warnings: string[],
  ): Promise<Block[]> {
    const isNotionFile = (url: string) => /amazonaws\.com|notion\.so/.test(url);
    let warnedUnconfigured = false;

    return Promise.all(
      blocks.map(async (b): Promise<Block> => {
        if (b.t !== "image" || !isNotionFile(b.url)) return b;
        if (!this.storage.configured) {
          if (!warnedUnconfigured) {
            warnedUnconfigured = true;
            warnings.push(
              `news ${slug}: storage not configured — image URLs will expire (S3_* env vars missing)`,
            );
          }
          return b;
        }
        try {
          const res = await fetch(b.url);
          if (!res.ok) throw new Error(`fetch ${res.status}`);
          const bytes = new Uint8Array(await res.arrayBuffer());
          const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
          const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
          const key = `news/${slug}-${hash}.${IMG_EXT[contentType] ?? "img"}`;
          return { ...b, url: await this.storage.putImage(key, bytes, contentType || "application/octet-stream") };
        } catch (e) {
          warnings.push(`news ${slug}: image re-host failed (${(e as Error).message}), kept Notion URL`);
          return b;
        }
      }),
    );
  }

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_NEWS"),
      opts.since,
    );

    /* 작성자 is a name typed in Notion, so the roster is indexed by name.
       Whitespace is stripped rather than trimmed — "장 동현" and "장동현" are
       the same person, and which one gets typed is a coin flip. A name held
       by two members resolves to neither: guessing a byline is worse than
       leaving it off. */
    const members = await this.prisma.member.findMany({ select: { id: true, name: true } });
    const memberIdByName = new Map<string, string | null>();
    for (const m of members) {
      const key = m.name.replace(/\s+/g, "");
      memberIdByName.set(key, memberIdByName.has(key) ? null : m.id);
    }

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
        curatorId = memberIdByName.get(data.curatorName.replace(/\s+/g, "")) ?? null;
        if (!curatorId) {
          stats.warnings.push(
            `news ${data.slug}: 작성자 "${data.curatorName}" matches no member — byline left empty`,
          );
        }
      }

      /* 요약/인사이트 live in the Notion page body — same Block[] contract as
         articles. An empty page is a link-only item, not an error. */
      let body: unknown = [];
      try {
        const mapped = mapBlocks(await this.notion.pageBlocks(page.id));
        stats.warnings.push(...mapped.warnings.map((w) => `news ${data.slug}: ${w}`));
        body = await this.rehostImages(data.slug, mapped.blocks, stats.warnings);
      } catch (e) {
        stats.warnings.push(
          `news ${data.slug}: body fetch failed (${(e as Error).message}), kept link-only`,
        );
      }

      const row = {
        slug: data.slug,
        title: data.title,
        url: data.url ?? null,
        sourceName: data.sourceName,
        summary: data.summary,
        body: body as object,
        categories: data.categories,
        pick: data.pick,
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
