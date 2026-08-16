import type { Article } from "@/lib/research";
import Thumb from "./thumb";

/* An article's picture, on every surface that shows one — the home's pinned
   slot, the archive's featured card, the grid, the piece's own header.

   Articles used to draw generated art everywhere, because the sync writes no
   cover and nothing surfaced the figures inside a piece. Now `imageUrl` is
   the first figure in the body, falling back to the stored cover, and the
   generated art is the floor under both. Going through one component is what
   keeps a piece from wearing a photo on the home page and a drawing in the
   archive — the same rule the news feed already runs on. */
export default function ArticleThumb({
  article,
  ...rest
}: {
  article: Pick<Article, "slug" | "tag" | "accent" | "imageUrl" | "coverUrl">;
  sizes: string;
  priority?: boolean;
  large?: boolean;
  className?: string;
}) {
  return (
    <Thumb
      sources={[article.imageUrl, article.coverUrl]}
      accent={article.accent}
      tag={article.tag}
      seed={article.slug}
      {...rest}
    />
  );
}
