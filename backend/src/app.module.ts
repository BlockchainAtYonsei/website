import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ArticlesModule } from "./articles/articles.module";
import { validateEnv } from "./config/env";
import { HealthModule } from "./health/health.module";
import { MembersModule } from "./members/members.module";
import { NewsModule } from "./news/news.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SyncModule } from "./sync/sync.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    MembersModule,
    ArticlesModule,
    NewsModule,
    SyncModule,
  ],
})
export class AppModule {}
