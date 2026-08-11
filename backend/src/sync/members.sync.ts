import { createHash } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { NotionService } from "../notion/notion.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { pageToMember } from "./mappers/member.mapper";
import { newStats, type RunStats, type SyncOptions } from "./sync.types";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

@Injectable()
export class MembersSyncService {
  private readonly logger = new Logger(MembersSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
    private readonly storage: StorageService,
  ) {}

  async sync(opts: SyncOptions): Promise<RunStats> {
    const stats = newStats();
    const pages = await this.notion.queryPages(
      this.notion.databaseId("NOTION_DB_MEMBERS"),
      opts.since,
    );

    let storageWarned = false;
    for (const page of pages) {
      const { data, warnings } = pageToMember(page);
      stats.warnings.push(...warnings);
      if (!data) {
        stats.skipped++;
        continue;
      }

      const existing = await this.prisma.member.findUnique({
        where: { notionPageId: page.id },
        select: { id: true, avatarUrl: true },
      });

      let avatarUrl: string | null = existing?.avatarUrl ?? null;
      if (data.avatarSourceUrl) {
        if (this.storage.configured) {
          try {
            avatarUrl = await this.rehostAvatar(data.slug, data.avatarSourceUrl, avatarUrl);
          } catch (e) {
            stats.warnings.push(
              `member ${data.slug}: avatar re-host failed (${(e as Error).message}), keeping previous`,
            );
          }
        } else if (!storageWarned) {
          storageWarned = true;
          stats.warnings.push(
            "storage not configured — avatars not re-hosted (S3_* env vars missing)",
          );
        }
      } else {
        avatarUrl = null;
      }

      const row = {
        slug: data.slug,
        name: data.name,
        cohort: data.cohort,
        team: data.team,
        position: data.position,
        bio: data.bio,
        socials: data.socials,
        status: data.status,
        visible: data.visible,
        avatarUrl,
      };
      try {
        await this.prisma.member.upsert({
          where: { notionPageId: page.id },
          create: { ...row, notionPageId: page.id },
          update: row,
        });
        existing ? stats.updated++ : stats.created++;
      } catch (e) {
        stats.skipped++;
        stats.warnings.push(`member ${data.slug}: upsert failed (${(e as Error).message})`);
      }
    }

    if (opts.full) {
      /* Page gone from Notion (deleted/archived) → hide from the roster.
         The row stays so existing bylines keep resolving. */
      const gone = await this.prisma.member.findMany({
        where: { notionPageId: { notIn: pages.map((p) => p.id) }, visible: true },
        select: { slug: true },
      });
      if (gone.length > 0) {
        await this.prisma.member.updateMany({
          where: { slug: { in: gone.map((m) => m.slug) } },
          data: { visible: false },
        });
        stats.archived = gone.length;
        stats.warnings.push(
          `hidden (page removed in Notion): ${gone.map((m) => m.slug).join(", ")}`,
        );
      }
    }

    this.logger.log(
      `members: +${stats.created} ~${stats.updated} -${stats.archived} skip ${stats.skipped}`,
    );
    return stats;
  }

  /* Content-hashed key: same bytes → same key → skip the upload. The Notion
     signed URL changes every fetch, so the URL itself can never be the
     dedupe key. */
  private async rehostAvatar(
    slug: string,
    sourceUrl: string,
    currentUrl: string | null,
  ): Promise<string> {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const key = `avatars/${slug}-${hash}.${EXT[contentType] ?? "img"}`;
    if (currentUrl?.endsWith(key)) return currentUrl;
    return this.storage.putImage(key, bytes, contentType || "application/octet-stream");
  }
}
