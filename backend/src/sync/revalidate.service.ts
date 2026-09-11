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
      /* undici says only "fetch failed"; the network reason (ECONNREFUSED,
         ENOTFOUND, timeout) lives in `cause`, and that is the part that tells
         you whether REVALIDATE_URL points at the right port and address. */
      const cause = (e as { cause?: { code?: string; message?: string } }).cause;
      const why = cause?.code ?? cause?.message;
      this.logger.warn(
        `revalidate ${tags.join(",")}: ${(e as Error).message}${why ? ` (${why})` : ""} — ${url}`,
      );
    }
  }
}
