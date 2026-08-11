"use client";

import ContactForm from "./contact-form";
import Modal from "./modal";

export default function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="contact-modal-title">
      <p className="font-mono mb-4 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
        Contact
      </p>
      <h2
        id="contact-modal-title"
        className="font-heading text-3xl leading-[1.05] tracking-[-1px] text-white md:text-4xl"
      >
        Questions? Email us.
      </h2>
      {/* no mailto anywhere in this flow — the form is the only channel, so the
          copy must not offer an alternative route */}
      <p className="font-body mt-4 mb-9 max-w-lg text-sm leading-relaxed font-light break-keep text-slate-400">
        협업, 연사 초청, 스폰서십, 채용 어느 쪽이든 좋습니다.
      </p>

      <ContactForm />
    </Modal>
  );
}
