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
  headerAction,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /* Sits beside the close button, outside the scrolling body, so it stays put
     while the content moves under it. */
  headerAction?: ReactNode;
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
            /* The panel never outgrows the window — it caps at the viewport
               less the wrapper's own padding, and the body below scrolls
               inside it. Long content used to stretch the panel and hand the
               scrolling to the window behind it, which meant the close button
               travelled off the top of the screen. */
            className="liquid-glass-strong relative flex max-h-[calc(100svh-5rem)] w-full max-w-2xl flex-col rounded-[1.5rem] outline-none md:my-auto md:max-h-[calc(100svh-8rem)]"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* In flow, not floating. Absolutely placed it sat over the body,
                which was invisible while the panel grew to fit its content —
                but the body scrolls under it now, and every line that passed
                beneath came out printed through the close button. */}
            <div className="flex shrink-0 items-center justify-end gap-1 px-5 pt-5">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                aria-label={t.close}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {/* Padding lives here rather than on the panel so the content
                scrolls clear of both edges instead of stopping short. */}
            <div className="modal-scroll overflow-y-auto overscroll-contain px-7 pt-4 pb-9 md:px-11 md:pt-5 md:pb-12">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
