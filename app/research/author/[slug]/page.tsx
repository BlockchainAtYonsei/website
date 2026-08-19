import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MediumIcon,
  TelegramIcon,
  XIcon,
} from "@/components/icons";
import AuthorTabs from "@/components/research/author-tabs";
import Avatar from "@/components/research/avatar";
import { getAuthor, getAuthors, type SocialLabel } from "@/lib/authors";

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

/* Same degradation as the article page: API down at build → prerender
   nothing, render on demand once it's back. */
export async function generateStaticParams() {
  try {
    return (await getAuthors()).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/research/author/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const author = await getAuthor(slug);
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
  const author = await getAuthor(slug);
  if (!author) notFound();

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
        <div className="flex items-center gap-6">
          <Avatar
            name={author.name}
            src={author.avatarUrl}
            className="h-20 w-20 shrink-0 text-3xl md:h-24 md:w-24 md:text-4xl"
          />
          <div>
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

      {/* Written research / curated news — the profile's two tabs. Suspense
          because AuthorTabs reads the active tab from the URL. */}
      <Suspense fallback={null}>
        <AuthorTabs articles={author.articles} news={author.news} />
      </Suspense>
    </main>
  );
}
