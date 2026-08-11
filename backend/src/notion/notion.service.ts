import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Client,
  collectPaginatedAPI,
  extractNotionId,
  isFullBlock,
  isFullPage,
  iteratePaginatedAPI,
  type PageObjectResponse,
} from "@notionhq/client";
import type { NotionBlock } from "./block-mapper";

/* Thin wrapper over the official SDK. Retry/backoff for 429/529 is built into
   the SDK client — this layer only adds data-source resolution, pagination
   collection, and table-children fetching.

   2025-09 API model: a database *contains* data sources, and queries target a
   data source id. Env vars hold database ids (what you copy from a Notion
   URL); the primary data source is resolved once and cached. */
@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private _client?: Client;
  private readonly dataSourceIds = new Map<string, string>();

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(
      this.config.get("NOTION_TOKEN") &&
        this.config.get("NOTION_DB_MEMBERS") &&
        this.config.get("NOTION_DB_ARTICLES") &&
        this.config.get("NOTION_DB_NEWS"),
    );
  }

  /* Env values may be bare ids or full Notion URLs — accept both. */
  databaseId(envKey: "NOTION_DB_MEMBERS" | "NOTION_DB_ARTICLES" | "NOTION_DB_NEWS"): string {
    const raw = this.config.getOrThrow<string>(envKey);
    const id = extractNotionId(raw);
    if (!id) throw new Error(`${envKey}: "${raw}" is not a Notion id or URL`);
    return id;
  }

  private get client(): Client {
    this._client ??= new Client({
      auth: this.config.getOrThrow<string>("NOTION_TOKEN"),
    });
    return this._client;
  }

  private async dataSourceId(databaseId: string): Promise<string> {
    const cached = this.dataSourceIds.get(databaseId);
    if (cached) return cached;

    const db = await this.client.databases.retrieve({ database_id: databaseId });
    const sources = "data_sources" in db ? db.data_sources : [];
    if (sources.length === 0) {
      throw new Error(`database ${databaseId} has no data sources`);
    }
    if (sources.length > 1) {
      this.logger.warn(
        `database ${databaseId} has ${sources.length} data sources; using "${sources[0].name}"`,
      );
    }
    this.dataSourceIds.set(databaseId, sources[0].id);
    return sources[0].id;
  }

  /* All pages, or only those edited since the cursor (incremental sync). */
  async queryPages(databaseId: string, editedSince?: Date): Promise<PageObjectResponse[]> {
    const dataSourceId = await this.dataSourceId(databaseId);
    const pages: PageObjectResponse[] = [];
    for await (const row of iteratePaginatedAPI(this.client.dataSources.query, {
      data_source_id: dataSourceId,
      page_size: 100,
      ...(editedSince
        ? {
            filter: {
              timestamp: "last_edited_time" as const,
              last_edited_time: { on_or_after: editedSince.toISOString() },
            },
          }
        : {}),
    })) {
      if (isFullPage(row)) pages.push(row);
    }
    return pages;
  }

  /* Top-level blocks of a page, with children attached for tables (rows live
     one level down). Other nesting is out of the v1 renderer's scope — the
     mapper warns when it drops some. */
  async pageBlocks(pageId: string): Promise<NotionBlock[]> {
    const top = (
      await collectPaginatedAPI(this.client.blocks.children.list, {
        block_id: pageId,
        page_size: 100,
      })
    ).filter(isFullBlock);

    return Promise.all(
      top.map(async (block): Promise<NotionBlock> => {
        if (block.type !== "table" || !block.has_children) return block;
        const children = (
          await collectPaginatedAPI(this.client.blocks.children.list, {
            block_id: block.id,
            page_size: 100,
          })
        ).filter(isFullBlock);
        return { ...block, children };
      }),
    );
  }
}
