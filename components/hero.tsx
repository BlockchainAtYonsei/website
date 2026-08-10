"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ApplyModal } from "./apply-modal";
import BayScene from "./bay-scene";
import ContactModal from "./contact-modal";
import { ArrowUpRight, CloseIcon, MenuIcon } from "./icons";

/* Contact has no href — it opens the dialog instead of navigating anywhere,
   so it is rendered as a button. */
const NAV_LINKS: {
  label: string;
  href?: string;
  external?: boolean;
  dialog?: true;
}[] = [
  { label: "About", href: "#about" },
  { label: "Activities", href: "#activities" },
  { label: "History", href: "#history" },
  { label: "Partners", href: "#partners" },
  { label: "Research", href: "/research" },
  { label: "Contact", dialog: true },
];

const HIDDEN = { filter: "blur(10px)", opacity: 0, y: 20 };
const VISIBLE = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  // ?snap=1 jumps straight to the assembled state (screenshots, OG capture)
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    setSnap(new URLSearchParams(window.location.search).has("snap"));
    setMounted(true);
  }, []);

  const reveal = (delay: number) => ({
    initial: snap ? false : HIDDEN,
    animate: VISIBLE,
    transition: { duration: 0.8, delay: snap ? 0 : delay, ease: "easeOut" as const },
  });

  return (
    <section className="relative h-svh w-full overflow-hidden bg-ink">
      {/* poster-style deep-blue atmosphere behind the transparent canvas */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(100% 55% at 50% -5%, #1c2c50 0%, rgba(28, 44, 80, 0) 62%),
            radial-gradient(60% 40% at 12% 22%, rgba(56, 105, 190, 0.24) 0%, rgba(56, 105, 190, 0) 60%),
            radial-gradient(55% 40% at 72% 10%, rgba(124, 98, 210, 0.14) 0%, rgba(124, 98, 210, 0) 60%),
            radial-gradient(70% 45% at 88% 30%, rgba(45, 160, 185, 0.13) 0%, rgba(45, 160, 185, 0) 60%),
            linear-gradient(180deg, #0f1a36 0%, #121d38 30%, #10192e 45%, #0a101f 100%)`,
        }}
      />
      <div className="absolute inset-0">{mounted && <BayScene snap={snap} />}</div>

      {/* bottom scrim so overlay text stays readable */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink to-transparent" />

      <header className="fixed inset-x-0 top-4 z-50 flex items-center justify-end px-6 lg:px-12">
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            aria-label="메뉴"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-white transition-all hover:bg-white/10 hover:scale-[1.05]"
          >
            {menuOpen ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  key="backdrop"
                  className="fixed inset-0 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMenuOpen(false)}
                />
                <motion.nav
                  key="panel"
                  className="absolute top-14 right-0 z-50 w-52"
                  initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="liquid-glass-strong rounded-[1.25rem] p-2">
                    {NAV_LINKS.map((link) => {
                      const cls =
                        "font-body block rounded-[0.9rem] px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white";
                      if (link.dialog) {
                        return (
                          <button
                            key={link.label}
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setContactOpen(true);
                            }}
                            className={`${cls} w-full cursor-pointer text-left`}
                          >
                            {link.label}
                          </button>
                        );
                      }
                      // route links go through Link so the research section is a
                      // client transition, not a full reload; hashes stay <a>
                      const href = link.href ?? "#";
                      return href.startsWith("/") ? (
                        <Link
                          key={link.label}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={cls}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          key={link.label}
                          href={href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noreferrer" : undefined}
                          onClick={() => setMenuOpen(false)}
                          className={cls}
                        >
                          {link.label}
                        </a>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setApplyOpen(true);
                      }}
                      className="font-body mt-1 flex w-full cursor-pointer items-center justify-between rounded-[0.9rem] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                    >
                      Apply
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* both dialogs live outside the menu's AnimatePresence — inside it they
          would unmount the moment the menu closes on click */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />

      <div className="absolute inset-x-0 bottom-[12%] z-10 flex flex-col items-center gap-5 px-6 text-center">
        <motion.h1
          {...reveal(0.5)}
          className="font-display mr-[-0.15em] text-3xl font-bold tracking-[0.15em] text-balance text-white uppercase [text-shadow:0_0_44px_rgba(47,107,255,0.55)] md:text-5xl lg:text-6xl"
        >
          Blockchain at Yonsei
          <span className="sr-only"> (BAY) — 연세대학교 블록체인 학회</span>
        </motion.h1>
        <motion.p
          {...reveal(0.75)}
          className="font-mono text-[11px] tracking-[0.45em] text-[#a5b4fc]/85 md:text-xs"
        >
          EST. 2017
        </motion.p>
      </div>

      <motion.div
        {...reveal(1.3)}
        className="absolute inset-x-0 bottom-6 z-10 flex justify-center"
      >
        <div className="animate-scroll-hint text-slate-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 4v16m0 0l-6-6m6 6l6-6" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
