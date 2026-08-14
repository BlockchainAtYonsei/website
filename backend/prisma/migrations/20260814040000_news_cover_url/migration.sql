-- The original story's og:image, collected at sync time as the card-image
-- fallback for write-ups that carry no picture of their own.
ALTER TABLE "news_items" ADD COLUMN "cover_url" TEXT;
