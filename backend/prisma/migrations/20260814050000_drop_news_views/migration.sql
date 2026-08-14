-- News dropped its view counter — the cards stopped showing one, and a
-- number nobody displays isn't worth the write traffic. Articles keep theirs.
ALTER TABLE "news_items" DROP COLUMN "views";
