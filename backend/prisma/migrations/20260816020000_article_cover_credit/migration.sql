-- Attribution for an article's cover picture. A stock or press photo is
-- licensed on the condition that it is credited, so the credit has to travel
-- with the URL rather than live in whoever's head chose the file. Free text:
-- the credit is rendered through the body's inline markup, so the author, the
-- source link and the licence all fit in one line.
ALTER TABLE "articles" ADD COLUMN "cover_credit" TEXT;
