"use client";

import { copyFor } from "@/lib/i18n";
import ContactForm from "./contact-form";
import { useLang } from "./lang-provider";
import Modal from "./modal";

export default function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = copyFor(lang).contact;

  return (
    <Modal open={open} onClose={onClose} labelledBy="contact-modal-title">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        {t.eyebrow}
      </p>
      <h2
        id="contact-modal-title"
        className="font-heading text-3xl leading-[1.05] tracking-[-1px] text-white md:text-4xl"
      >
        {t.title}
      </h2>
      {/* no mailto anywhere in this flow — the form is the only channel, so the
          copy must not offer an alternative route */}
      <p className="font-body mt-4 mb-9 max-w-lg text-sm leading-relaxed font-light break-keep text-slate-400">
        {t.intro}
      </p>

      <ContactForm />
    </Modal>
  );
}
