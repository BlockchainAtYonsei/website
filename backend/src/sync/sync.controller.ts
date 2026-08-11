import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { SyncResource } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { SyncKeyGuard } from "./sync-key.guard";
import { RESOURCES, SyncService } from "./sync.service";

@Controller("sync")
@UseGuards(SyncKeyGuard)
export class SyncController {
  constructor(
    private readonly sync: SyncService,
    private readonly prisma: PrismaService,
  ) {}

  /* POST /v1/sync/all?full=1 — manual trigger, awaited: at club scale a run
     is seconds, and the caller wants the stats. */
  @Post(":resource")
  async trigger(@Param("resource") resource: string, @Query("full") full?: string) {
    if (resource !== "all" && !RESOURCES.includes(resource as SyncResource)) {
      throw new BadRequestException(`resource must be one of: all, ${RESOURCES.join(", ")}`);
    }
    const runs = await this.sync.run(resource as SyncResource | "all", "manual", full === "1");
    return { runs };
  }

  /* Recent runs incl. warnings — where to look when content didn't show up. */
  @Get("runs")
  async runs(@Query("resource") resource?: string, @Query("limit") limit?: string) {
    const take = Math.min(Number(limit) || 20, 100);
    return {
      runs: await this.prisma.syncRun.findMany({
        where: RESOURCES.includes(resource as SyncResource)
          ? { resource: resource as SyncResource }
          : undefined,
        orderBy: { startedAt: "desc" },
        take,
      }),
    };
  }
}
