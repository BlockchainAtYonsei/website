-- News items become pages of their own: routable slug, article-style body,
-- and their own view counter.
ALTER TABLE "news_items" ADD COLUMN "slug" TEXT;
ALTER TABLE "news_items" ADD COLUMN "body" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "news_items" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

UPDATE "news_items" SET "slug" = lower(regexp_replace("notion_page_id", '[^a-zA-Z0-9]', '', 'g'));

ALTER TABLE "news_items" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "news_items_slug_key" ON "news_items"("slug");
