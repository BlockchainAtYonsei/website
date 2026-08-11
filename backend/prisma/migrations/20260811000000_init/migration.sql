-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'alumni');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "Accent" AS ENUM ('blue', 'violet', 'teal', 'indigo');

-- CreateEnum
CREATE TYPE "SyncResource" AS ENUM ('members', 'articles', 'news');

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM ('cron', 'manual', 'webhook');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('running', 'ok', 'error');

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cohort" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "socials" JSONB NOT NULL DEFAULT '[]',
    "avatar_url" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "notion_page_id" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dek" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accent" "Accent" NOT NULL DEFAULT 'blue',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "published_at" DATE,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "body" JSONB NOT NULL,
    "reading_minutes" INTEGER NOT NULL DEFAULT 1,
    "cover_url" TEXT,
    "medium_url" TEXT,
    "notion_page_id" TEXT NOT NULL,
    "notion_last_edited_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_authors" (
    "article_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_authors_pkey" PRIMARY KEY ("article_id","member_id")
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "published_at" DATE NOT NULL,
    "curator_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "notion_page_id" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" UUID NOT NULL,
    "resource" "SyncResource" NOT NULL,
    "trigger" "SyncTrigger" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'running',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_slug_key" ON "members"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "members_notion_page_id_key" ON "members"("notion_page_id");

-- CreateIndex
CREATE INDEX "members_cohort_team_idx" ON "members"("cohort", "team");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_notion_page_id_key" ON "articles"("notion_page_id");

-- CreateIndex
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "news_items_url_key" ON "news_items"("url");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_notion_page_id_key" ON "news_items"("notion_page_id");

-- CreateIndex
CREATE INDEX "news_items_status_published_at_idx" ON "news_items"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "sync_runs_resource_started_at_idx" ON "sync_runs"("resource", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

