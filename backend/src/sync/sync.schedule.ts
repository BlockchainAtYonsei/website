import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NotionService } from "../notion/notion.service";
import { SyncService } from "./sync.service";

/* Cron cadence per design §4: 10-minute incremental, nightly full reconcile
   (the only pass that notices deletions). Unconfigured Notion = silent skip,
   so the read API can run standalone. */
@Injectable()
export class SyncSchedule {
  private readonly logger = new Logger(SyncSchedule.name);

  constructor(
    private readonly sync: SyncService,
    private readonly notion: NotionService,
  ) {}

  @Cron("*/10 * * * *")
  async incremental() {
    if (!this.notion.configured) return;
    try {
      await this.sync.run("all", "cron", false);
    } catch (e) {
      this.logger.warn(`incremental sync: ${(e as Error).message}`);
    }
  }

  @Cron("0 4 * * *", { timeZone: "Asia/Seoul" })
  async reconcile() {
    if (!this.notion.configured) return;
    try {
      await this.sync.run("all", "cron", true);
    } catch (e) {
      this.logger.warn(`reconcile sync: ${(e as Error).message}`);
    }
  }
}
