-- Topic is a multi-select in the 리서치팀's Notion DB: a story is "보안" and
-- "DeFi" at once, and holding one column meant every extra tag was dropped at
-- sync time. Existing rows carry their single category into the array, so
-- nothing published so far loses its topic.
ALTER TABLE "news_items" ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "news_items" SET "categories" = ARRAY["category"] WHERE "category" <> '';

ALTER TABLE "news_items" DROP COLUMN "category";

-- Filtering is now "carries this topic" rather than "equals this topic".
CREATE INDEX "news_items_categories_idx" ON "news_items" USING GIN ("categories");
