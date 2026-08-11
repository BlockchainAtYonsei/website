import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/* Pings the Next.js site's revalidate route after a sync that changed rows,
   so publish → live is seconds, not the ISR window. Fire-and-forget: a dead
   frontend must never fail a sync run. */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly config: ConfigService) {}

  async ping(tags: string[]): Promise<void> {
    const url = this.config.get<string>("REVALIDATE_URL");
    if (!url) return;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: this.config.get<string>("REVALIDATE_SECRET") ?? "",
          tags,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) this.logger.warn(`revalidate ${tags.join(",")}: HTTP ${res.status}`);
    } catch (e) {
      this.logger.warn(`revalidate ${tags.join(",")}: ${(e as Error).message}`);
    }
  }
}
