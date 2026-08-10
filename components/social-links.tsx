import {
  InstagramIcon,
  LinkedInIcon,
  MediumIcon,
  TelegramIcon,
  XIcon,
} from "./icons";

export const SOCIALS: {
  label: string;
  href: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { label: "X", href: "https://x.com/BlockchainatYU", Icon: XIcon },
  { label: "Telegram", href: "https://t.me/blockchain_at_yonsei", Icon: TelegramIcon },
  {
    label: "LinkedIn",
    href: "https://kr.linkedin.com/company/blockchain-at-yonsei",
    Icon: LinkedInIcon,
  },
  { label: "Medium", href: "https://medium.com/yonseiblockchainlab", Icon: MediumIcon },
  {
    label: "Instagram",
    href: "https://www.instagram.com/blockchain_at_yonsei/",
    Icon: InstagramIcon,
  },
];

/* Knocked-out marks: no disc, glyph carries the colour. The 40px box keeps a
   comfortable tap target even though only the ~18px glyph is visible. */
export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-1">
      {SOCIALS.map(({ label, href, Icon }) => (
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
      ))}
    </ul>
  );
}
