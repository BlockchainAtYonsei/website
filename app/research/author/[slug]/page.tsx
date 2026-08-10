import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MediumIcon,
  TelegramIcon,
  XIcon,
} from "@/components/icons";
import ArticleCard from "@/components/research/article-card";
import {
  AUTHORS,
  authorMark,
  getArticlesByAuthor,
  getAuthor,
  type SocialLabel,
} from "@/lib/authors";

const SOCIAL_ICONS: Record<
  SocialLabel,
  (props: { className?: string }) => React.ReactElement
> = {
  X: XIcon,
  Telegram: TelegramIcon,
  LinkedIn: LinkedInIcon,
  Medium: MediumIcon,
  Instagram: InstagramIcon,
  GitHub: GitHubIcon,
  Website: GlobeIcon,
};

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  props: PageProps<"/research/author/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const author = getAuthor(slug);
  if (!author) return {};

  return {
    title: author.name,
    description: author.bio,
    openGraph: {
      title: `${author.name} — BAY Research`,
      description: author.bio,
      type: "profile",
      locale: "ko_KR",
    },
  };
}

export default async function AuthorPage(
  props: PageProps<"/research/author/[slug]">,
) {
  const { slug } = await props.params;
  const author = getAuthor(slug);
  if (!author) notFound();

  const articles = getArticlesByAuthor(slug);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-20 md:pb-32">
      <Link
        href="/research/author"
        className="font-mono inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-300"
      >
        <span aria-hidden>←</span> Authors
      </Link>

      {/* Profile */}
      <header className="mt-10 md:mt-12">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-bay-500/20 text-sm font-bold tracking-wide text-bay-200 md:h-20 md:w-20"
          >
            {authorMark(author.slug)}
          </span>
          <div>
            {/* names stay in the body face: the heading serif is Latin-only,
                so hangul would fall back with a synthetic slant */}
            <h1 className="font-body text-4xl leading-[1.05] font-semibold tracking-[-0.02em] break-keep text-white md:text-5xl">
              {author.name}
            </h1>
            <p className="font-mono mt-2 text-[10px] tracking-[0.18em] text-bay-300/80 uppercase">
              {author.role}
            </p>
          </div>
        </div>

        <p className="font-body mt-7 max-w-2xl leading-relaxed font-light break-keep text-slate-400">
          {author.bio}
        </p>

        {author.socials.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-center gap-1">
            {author.socials.map(({ label, href }) => {
              const Icon = SOCIAL_ICONS[label];
              return (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition-colors duration-200 hover:text-white"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </header>

      {/* Articles */}
      <section className="mt-16 border-t border-white/8 pt-14 md:mt-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-3xl tracking-[-1px] text-white italic md:text-4xl">
            작성한 글
          </h2>
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {articles.length} {articles.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="font-body text-sm font-light text-slate-500">
            아직 발행된 글이 없습니다.
          </p>
        )}
      </section>
    </main>
  );
}
