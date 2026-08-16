import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { SyncResource, SyncTrigger } from "../generated/prisma/enums";
import type { SyncRunModel as SyncRun } from "../generated/prisma/models";
import { NotionService } from "../notion/notion.service";
import { PrismaService } from "../prisma/prisma.service";
import { ArticlesSyncService } from "./articles.sync";
import { NewsSyncService } from "./news.sync";
import { RevalidateService } from "./revalidate.service";
import type { RunStats } from "./sync.types";

/* Content only — the member roster is owned by this database (see
   scripts/seed-members.ts) and has no Notion counterpart to sync. */
export const RESOURCES: SyncResource[] = ["articles", "news"];

/* Notion last_edited_time is minute-granular; overlap the cursor so an edit
   landing in the same minute as the previous run isn't missed. Upserts make
   the re-processing idempotent. */
const CURSOR_OVERLAP_MS = 2 * 60 * 1000;

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  /* One sync at a time — cron + manual trigger overlapping would double-fetch
     and interleave stats for nothing. */
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notion: NotionService,
    private readonly articles: ArticlesSyncService,
    private readonly news: NewsSyncService,
    private readonly revalidate: RevalidateService,
  ) {}

  /* articles → news, both resolving their author names against the DB-owned
     member roster. */
  async run(
    resource: SyncResource | "all",
    trigger: SyncTrigger,
    full: boolean,
  ): Promise<SyncRun[]> {
    /* Nest exceptions so the manual-trigger endpoint reports real status
       codes; the cron caller just logs .message either way. */
    /* Configuration is checked per resource, not globally: news is the only
       database that has to exist for the feature that runs on it, and a
       missing NOTION_DB_ARTICLES used to silently stop news from syncing
       too. */
    const resources = resource === "all" ? RESOURCES : [resource];
    const runnable = resources.filter((r) => this.notion.configuredFor(r));
    if (runnable.length === 0) {
      throw new ServiceUnavailableException(
        `Notion is not configured for ${resources.join(", ")} (NOTION_TOKEN / NOTION_DB_* missing)`,
      );
    }
    if (this.running) {
      throw new ConflictException("a sync is already running");
    }
    this.running = true;
    try {
      const runs: SyncRun[] = [];
      for (const r of runnable) {
        runs.push(await this.runOne(r, trigger, full));
      }
      return runs;
    } finally {
      this.running = false;
    }
  }

  private syncer(resource: SyncResource) {
    return { articles: this.articles, news: this.news }[resource];
  }

  private async runOne(
    resource: SyncResource,
    trigger: SyncTrigger,
    full: boolean,
  ): Promise<SyncRun> {
    const run = await this.prisma.syncRun.create({
      data: { resource, trigger, status: "running" },
    });
    try {
      const since = full ? undefined : await this.cursor(resource);
      const stats = await this.syncer(resource).sync({ since, full });
      /* Warnings used to live only inside the run row, where reading them
         took a curl with the sync key — so a story blocked from the site for
         a day looked, from the logs, like a healthy sync. docker logs is the
         first (often only) place anyone looks; the warnings belong there. */
      for (const w of stats.warnings) this.logger.warn(`${resource}: ${w}`);
      const done = await this.prisma.syncRun.update({
        where: { id: run.id },
        data: { status: "ok", stats, finishedAt: new Date() },
      });
      if (stats.created + stats.updated + stats.archived > 0) {
        await this.revalidate.ping([resource]);
      }
      return done;
    } catch (e) {
      this.logger.error(`${resource} sync failed: ${(e as Error).message}`);
      return this.prisma.syncRun.update({
        where: { id: run.id },
        data: { status: "error", error: (e as Error).message, finishedAt: new Date() },
      });
    }
  }

  /* Incremental cursor = start of the last successful run for the resource.
     No successful run yet → full fetch (since undefined). */
  private async cursor(resource: SyncResource): Promise<Date | undefined> {
    const last = await this.prisma.syncRun.findFirst({
      where: { resource, status: "ok" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });
    return last ? new Date(last.startedAt.getTime() - CURSOR_OVERLAP_MS) : undefined;
  }

  stats(run: SyncRun): RunStats {
    return run.stats as RunStats;
  }
}
