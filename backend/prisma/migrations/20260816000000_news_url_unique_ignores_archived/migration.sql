-- An archived news row is the residue of a Notion page that no longer exists.
-- The story it names can come back — the 리서치팀 deletes and re-enters rows as
-- part of the weekly board shuffle — and the fresh page usually carries the
-- same Source link. Under a full-table unique index the ghost row blocked that
-- re-entry forever: the insert failed every sync, silently, and the story
-- never reached the site.
--
-- The invariant worth keeping is narrower than the old index: THE SAME STORY
-- CURATED TWICE, LIVE, IS AN EDIT — NOT A SECOND ROW. Among rows a reader can
-- actually see, one URL means one item. What an archived row once linked to
-- is nobody's business but history's.
--
-- Prisma cannot express a partial index, so this one is owned by SQL and the
-- schema carries a pointer here instead of @unique.
DROP INDEX "news_items_url_key";

CREATE UNIQUE INDEX "news_items_url_live_key"
  ON "news_items"("url")
  WHERE "status" <> 'archived';
