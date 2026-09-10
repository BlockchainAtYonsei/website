-- Articles dropped their view counter too: the cards show reading time now,
-- and a number nobody displays isn't worth the write traffic. Mirrors the
-- earlier 20260814050000_drop_news_views.
ALTER TABLE "articles" DROP COLUMN "views";
