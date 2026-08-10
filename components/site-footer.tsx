import SocialLinks from "./social-links";

export default function SiteFooter({ id }: { id?: string }) {
  return (
    <footer id={id} className="border-t border-white/8 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 px-6 py-10 md:flex-row">
        <SocialLinks />
        {/* plain text, not a link — the subpage headers already carry the logo
            link home, so nothing is stranded by dropping it here */}
        <p className="font-body text-xs font-light text-slate-600">
          © 2026 Blockchain at Yonsei
        </p>
      </div>
    </footer>
  );
}
