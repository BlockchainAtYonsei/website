import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /* db + last sync in one probe: "is it up" and "is the content fresh" are
     the two questions anyone hitting this endpoint actually has. */
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const lastSync = await this.prisma.syncRun.findFirst({
        orderBy: { startedAt: "desc" },
        select: {
          resource: true,
          status: true,
          startedAt: true,
          finishedAt: true,
        },
      });
      return { status: "ok", db: "up", lastSync };
    } catch {
      return { status: "degraded", db: "down", lastSync: null };
    }
  }
}
