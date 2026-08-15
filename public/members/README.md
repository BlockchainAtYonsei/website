# Member photos

No S3/R2 is configured for this project (`backend/.env`'s `S3_*` vars are
blank), so there is nowhere to re-host uploaded files — member photos live
here instead, committed straight into the frontend.

To add one:

1. Square-crop the photo and convert it to a 400px WebP — the file is
   committed and served as-is (the avatar is a plain `<img>`, so Next's
   image optimizer never touches it, and a 200KB PNG stays 200KB on every
   page that shows the person):

   ```sh
   magick <photo> -strip -resize 400x400^ -gravity center -extent 400x400 \
     -quality 82 -define webp:method=6 public/members/<slug>.webp
   ```

   400px covers the largest render (96px avatar at 3×), and the batch that
   set the convention landed at 8–20KB each. `slug` is the one from
   `backend/scripts/seed-members.ts`.
2. In `seed-members.ts`, set that member's `avatarUrl: "/members/<slug>.webp"`.
3. `npm run seed:members` in `backend/`.

A member with no file here falls back to the monogram avatar — nothing
breaks, it just shows an initial until a photo lands.
