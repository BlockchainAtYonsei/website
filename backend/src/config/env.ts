/* Env validation for @nestjs/config — hand-rolled on purpose: the surface is
   a handful of strings, not worth a schema library. Fail fast at boot for
   what the running features actually need; Notion/sync vars are checked by
   the sync module when it lands, so the API can boot without them. */

export type Env = {
  DATABASE_URL: string;
  PORT: number;
  CORS_ORIGIN: string[];
  NOTION_TOKEN?: string;
  NOTION_DB_MEMBERS?: string;
  NOTION_DB_ARTICLES?: string;
  NOTION_DB_NEWS?: string;
  SYNC_KEY?: string;
  REVALIDATE_URL?: string;
  REVALIDATE_SECRET?: string;
  S3_ENDPOINT?: string;
  S3_REGION?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_PUBLIC_URL?: string;
};

export function validateEnv(raw: Record<string, unknown>): Env {
  const str = (key: string): string | undefined => {
    const v = raw[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const databaseUrl = str("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(str("PORT") ?? 4000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer, got "${raw.PORT}"`);
  }

  return {
    DATABASE_URL: databaseUrl,
    PORT: port,
    CORS_ORIGIN: (str("CORS_ORIGIN") ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    NOTION_TOKEN: str("NOTION_TOKEN"),
    NOTION_DB_MEMBERS: str("NOTION_DB_MEMBERS"),
    NOTION_DB_ARTICLES: str("NOTION_DB_ARTICLES"),
    NOTION_DB_NEWS: str("NOTION_DB_NEWS"),
    SYNC_KEY: str("SYNC_KEY"),
    REVALIDATE_URL: str("REVALIDATE_URL"),
    REVALIDATE_SECRET: str("REVALIDATE_SECRET"),
    S3_ENDPOINT: str("S3_ENDPOINT"),
    S3_REGION: str("S3_REGION"),
    S3_BUCKET: str("S3_BUCKET"),
    S3_ACCESS_KEY_ID: str("S3_ACCESS_KEY_ID"),
    S3_SECRET_ACCESS_KEY: str("S3_SECRET_ACCESS_KEY"),
    S3_PUBLIC_URL: str("S3_PUBLIC_URL"),
  };
}
