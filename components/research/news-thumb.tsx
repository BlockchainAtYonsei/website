import type { NewsItem } from "@/lib/news";
import type { Accent } from "@/lib/research";
import Thumb from "./thumb";

/* A news card's picture: which of a story's two URLs to try, in which order,
   and what the generated fallback should say. The walk down the list — and
   the reason there has to be one — lives in <Thumb>, which articles use too.

   Order is how much a person chose the picture: the curator's own write-up
   image first, the publisher's crawled og:image second. */
export default function NewsThumb({
  item,
  ...rest
}: {
  /* slug rides along only to seed the generated fallback's figure, so two
     stories under one topic don't fall back to the same picture */
  item: Pick<NewsItem, "slug" | "imageUrl" | "coverUrl" | "categories">;
  accent: Accent;
  sizes: string;
  priority?: boolean;
  large?: boolean;
  className?: string;
}) {
  return (
    <Thumb
      sources={[item.imageUrl, item.coverUrl]}
      tag={item.categories[0] ?? "News"}
      seed={item.slug}
      {...rest}
    />
  );
}
