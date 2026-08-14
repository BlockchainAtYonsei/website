-- The member roster is owned by this database now: the Notion 팀원 syncer is
-- deleted, so the vestiges go too — the members sync target, the per-row
-- Notion pointer, and the "synced_at" name for what is simply updated_at.

DELETE FROM "sync_runs" WHERE "resource" = 'members';

CREATE TYPE "SyncResource_new" AS ENUM ('articles', 'news');
ALTER TABLE "sync_runs"
  ALTER COLUMN "resource" TYPE "SyncResource_new"
  USING ("resource"::text::"SyncResource_new");
ALTER TYPE "SyncResource" RENAME TO "SyncResource_old";
ALTER TYPE "SyncResource_new" RENAME TO "SyncResource";
DROP TYPE "SyncResource_old";

ALTER TABLE "members" DROP COLUMN "notion_page_id";
ALTER TABLE "members" RENAME COLUMN "synced_at" TO "updated_at";
