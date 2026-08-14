-- Measured against the live Blockchain News Tracking DB: of 77 items marked
-- 홈페이지 게시, 20 carry no Source link at all. The curator's write-up is the
-- piece and the original is a courtesy, so a missing link can no longer drop
-- a story. Uniqueness survives — Postgres allows many NULLs in a unique index
-- — and notion_page_id remains the real identity.
ALTER TABLE "news_items" ALTER COLUMN "url" DROP NOT NULL;

-- Same measurement: with no link there is no host to name the source after.
ALTER TABLE "news_items" ALTER COLUMN "source_name" SET DEFAULT '';

-- The team already keeps an "이번 주 꼭 볼 것" checkbox (7 of 77 ticked).
-- Reading it beats inferring Editor's Picks from the newest curation week.
ALTER TABLE "news_items" ADD COLUMN "pick" BOOLEAN NOT NULL DEFAULT false;
