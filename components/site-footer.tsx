import Link from "next/link";
import SocialLinks from "./social-links";

export default function SiteFooter({ id }: { id?: string }) {
  return (
    <footer id={id} className="border-t border-white/8 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 px-6 py-10 md:flex-row">
        <SocialLinks />
        {/* the only route back to the main site from a research page */}
        <Link
          href="/"
          className="font-body text-xs font-light text-slate-600 transition-colors hover:text-slate-400"
        >
          © 2026 Blockchain at Yonsei
        </Link>
      </div>
    </footer>
  );
}
