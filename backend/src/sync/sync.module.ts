import { Module } from "@nestjs/common";
import { NotionModule } from "../notion/notion.module";
import { StorageModule } from "../storage/storage.module";
import { ArticlesSyncService } from "./articles.sync";
import { ImageRehostService } from "./images.service";
import { NewsSyncService } from "./news.sync";
import { RevalidateService } from "./revalidate.service";
import { SyncController } from "./sync.controller";
import { SyncSchedule } from "./sync.schedule";
import { SyncService } from "./sync.service";

@Module({
  imports: [NotionModule, StorageModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncSchedule,
    ArticlesSyncService,
    NewsSyncService,
    ImageRehostService,
    RevalidateService,
  ],
})
export class SyncModule {}
