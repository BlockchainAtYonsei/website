-- DropIndex
DROP INDEX "news_items_status_published_at_idx";

-- AlterTable
ALTER TABLE "news_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "news_items_status_published_at_created_at_idx" ON "news_items"("status", "published_at" DESC, "created_at" DESC);
