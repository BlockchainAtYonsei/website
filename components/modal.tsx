"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "./icons";
import { useLang } from "./lang-provider";
import { copyFor } from "@/lib/i18n";

/* Shared dialog shell: backdrop, panel, Escape, scroll lock, focus handling.
   Both the contact and apply overlays need identical behaviour, so it lives
   here rather than being written twice.

   The backdrop is deliberately inert. Closing on a stray click outside would
   throw away a half-typed inquiry, so the close button is the only pointer
   route out. Escape still works — it is a deliberate keystroke, not a slip,
   and keyboard users have no other way to dismiss the dialog. */
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const { lang } = useLang();
  const t = copyFor(lang);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    // stop the page behind from scrolling while the dialog owns the screen
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus the first field if there is one, otherwise the panel itself, so
    // keyboard users start inside the dialog rather than behind it
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input:not([tabindex='-1']),textarea,select",
    );
    /* preventScroll, or the browser scrolls the target into view and a panel
       taller than the viewport opens part-way down its own content. */
    (first ?? panelRef.current)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      restoreTo.current?.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  /* Rendered into <body> rather than in place. A dialog should look the same
     wherever its trigger happens to sit — inline, it inherits things like the
     CTA section's text-center and can be clipped by an ancestor's overflow. */
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          /* Centring is done with the panel's own auto margins below, not with
             items-center here. In a scroll container, align-items: center on a
             child taller than the viewport pushes the overflow out both ends
             and the top half becomes unreachable — you cannot scroll above the
             start edge. Auto margins collapse to zero once the free space is
             gone, so a tall panel simply starts at the top and scrolls. */
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-ink/80 px-4 py-10 text-left backdrop-blur-xl md:py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className="liquid-glass-strong relative w-full max-w-2xl rounded-[1.5rem] px-7 py-9 outline-none md:my-auto md:px-11 md:py-12"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="absolute top-5 right-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
