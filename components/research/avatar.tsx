/* Avatar with a monogram fallback — a missing photo renders as the first
   character of the name on a bay-tinted disc, so rosters and bylines keep
   one silhouette whether or not everyone has handed a photo in.
   Size and type scale come in through className (h-*, w-*, text-*). */
export default function Avatar({
  name,
  src,
  className = "",
}: {
  name: string;
  src: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <img src={src} alt="" className={`rounded-full object-cover ${className}`} />
    );
  }
  return (
    <span
      aria-hidden
      className={`font-body flex items-center justify-center rounded-full bg-bay-500/15 font-medium text-bay-200 select-none ${className}`}
    >
      {name.charAt(0)}
    </span>
  );
}
