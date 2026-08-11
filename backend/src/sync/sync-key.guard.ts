import { timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

/* Shared-secret guard for the sync endpoints — the only non-public surface.
   No SYNC_KEY configured = closed, not open. */
@Injectable()
export class SyncKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const key = this.config.get<string>("SYNC_KEY");
    if (!key) throw new ServiceUnavailableException("SYNC_KEY not configured");

    const header = ctx.switchToHttp().getRequest<Request>().header("x-sync-key") ?? "";
    const a = Buffer.from(header);
    const b = Buffer.from(key);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
