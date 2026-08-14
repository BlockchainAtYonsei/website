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

  /* True when anything at all can sync. The cron uses this to decide whether
     to bother; `configuredFor` decides which resources actually run. */
  get configured(): boolean {
    return (
      Boolean(this.config.get("NOTION_TOKEN")) &&
      (["articles", "news"] as const).some((r) => this.configuredFor(r))
    );
  }

  /* Per resource, because the databases arrive one at a time: news went live
     against a real Notion DB while articles were still mock, and a global
     check meant the missing one blocked the ready one. */
  configuredFor(resource: "articles" | "news"): boolean {
    const key = {
      articles: "NOTION_DB_ARTICLES",
      news: "NOTION_DB_NEWS",
    }[resource];
    return Boolean(this.config.get("NOTION_TOKEN") && this.config.get(key));
  }

  /* Env values may be bare ids or full Notion URLs — accept both. */
  databaseId(envKey: "NOTION_DB_ARTICLES" | "NOTION_DB_NEWS"): string {
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

  /* A page's title text — how the articles sync turns a 작성자 relation into a
     name it can match against the roster. Null when the page is inaccessible
     or its title is empty; the caller decides what a nameless author means. */
  async pageTitle(pageId: string): Promise<string | null> {
    const page = await this.client.pages.retrieve({ page_id: pageId });
    if (!isFullPage(page)) return null;
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "title") {
        const text = prop.title.map((r) => r.plain_text).join("").trim();
        return text || null;
      }
    }
    return null;
  }

  /* The page's full block tree. Children are fetched wherever Notion says
     they exist — the news write-ups keep most of their prose one level down,
     as indented paragraphs under numbered items, and fetching only the top
     level was silently dropping ~80% of some pages' text. Depth is capped at
     a value no real write-up reaches, purely as a runaway guard. */
  async pageBlocks(pageId: string, depth = 0): Promise<NotionBlock[]> {
    const blocks = (
      await collectPaginatedAPI(this.client.blocks.children.list, {
        block_id: pageId,
        page_size: 100,
      })
    ).filter(isFullBlock);

    if (depth >= 4) return blocks;
    return Promise.all(
      blocks.map(async (block): Promise<NotionBlock> =>
        block.has_children
          ? { ...block, children: await this.pageBlocks(block.id, depth + 1) }
          : block,
      ),
    );
  }
}
