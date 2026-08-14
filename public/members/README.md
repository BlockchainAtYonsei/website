# Member photos

No S3/R2 is configured for this project (`backend/.env`'s `S3_*` vars are
blank), so there is nowhere to re-host uploaded files — member photos live
here instead, committed straight into the frontend.

To add one:

1. Drop the file in as `<slug>.jpg` (or `.png`/`.webp`) — the same `slug`
   used in `backend/scripts/seed-members.ts`. A square crop reads best; the
   avatar renders as a circle.
2. In `seed-members.ts`, set that member's `avatarUrl: "/members/<slug>.jpg"`.
3. `npm run seed:members` in `backend/`.

A member with no file here falls back to the monogram avatar — nothing
breaks, it just shows an initial until a photo lands.
