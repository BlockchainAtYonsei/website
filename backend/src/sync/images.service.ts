import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Block } from "../notion/block-types";
import { StorageService } from "../storage/storage.service";

const IMG_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/* Image re-hosting for synced content — news and articles bodies share the
   same Block[] contract and the same problem: Notion file URLs are expiring
   signed links, so what gets stored has to be our own copy.

   `keyPrefix` namespaces the stored object ("news/slug", "articles/slug");
   `label` prefixes warnings the way the calling sync already does ("news
   slug", "article slug"). */
@Injectable()
export class ImageRehostService {
  constructor(private readonly storage: StorageService) {}

  get configured(): boolean {
    return this.storage.configured;
  }

  /* Download an image and store our own content-hash copy; the same bytes
     re-syncing never re-upload. Falls back to the source URL when the fetch
     or upload fails — a card image is never worth failing an item over. */
  async store(
    keyPrefix: string,
    label: string,
    url: string,
    warnings: string[],
  ): Promise<string> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
      const key = `${keyPrefix}-${hash}.${IMG_EXT[contentType] ?? "img"}`;
      return await this.storage.putImage(key, bytes, contentType || "application/octet-stream");
    } catch (e) {
      warnings.push(`${label}: image re-host failed (${(e as Error).message}), kept source URL`);
      return url;
    }
  }

  /* Every Notion-hosted image in a body, replaced with our copy. Without
     storage configured the Notion URL stays, with a warning: fine for local
     work, dead within the hour, so never what prod should run on. External
     (pasted-by-URL) images are already permanent and pass through untouched. */
  async rehost(
    keyPrefix: string,
    label: string,
    blocks: Block[],
    warnings: string[],
  ): Promise<Block[]> {
    const isNotionFile = (url: string) => /amazonaws\.com|notion\.so/.test(url);
    let warnedUnconfigured = false;

    return Promise.all(
      blocks.map(async (b): Promise<Block> => {
        if (b.t !== "image" || !isNotionFile(b.url)) return b;
        if (!this.storage.configured) {
          if (!warnedUnconfigured) {
            warnedUnconfigured = true;
            warnings.push(
              `${label}: storage not configured — image URLs will expire (S3_* env vars missing)`,
            );
          }
          return b;
        }
        return { ...b, url: await this.store(keyPrefix, label, b.url, warnings) };
      }),
    );
  }
}
