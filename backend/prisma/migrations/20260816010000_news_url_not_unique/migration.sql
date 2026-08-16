-- Two curators wrote up the same Re-protocol story — one a numbered summary
-- with a glossary, the other a research-angle read — and the team ruled that
-- BOTH belong on the site: the write-up is the item, the link is shared
-- context. That overturns the premise behind any uniqueness on url, including
-- the live-rows-only index one migration up: even among visible rows, one
-- Source may back several items. Row identity is notion_page_id for the sync
-- and slug for routing; url is just a column now.
DROP INDEX "news_items_url_live_key";
