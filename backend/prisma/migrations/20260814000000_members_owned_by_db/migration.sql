-- Members move out of Notion and into this database. The Notion 팀원 DB only
-- ever carried 제목/짧은 소개/긴 소개 — no slug, cohort, team or socials — so it
-- was never a roster source. The member syncer is off; news resolves its
-- 작성자 by name against these rows instead of by Notion relation.
--
-- Nullable notion_page_id is what lets a row exist without a Notion page. The
-- unique index still holds: Postgres allows many NULLs in a unique column.
ALTER TABLE "members" ALTER COLUMN "notion_page_id" DROP NOT NULL;
