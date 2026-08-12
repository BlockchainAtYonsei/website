/* Copy for the two overlay dialogs — Contact and Apply — in both languages.

   Deliberately a hand-written table rather than an i18n runtime: these two
   dialogs are the only translated surfaces, so a dictionary keyed by the
   language switch carries the whole feature without a dependency. When a third
   surface lands, this is the file that grows first; reach for a real i18n
   library once the tables stop fitting in one screen. */

import { cohortWordmark } from "./cohort";
import type { LangCode } from "@/components/lang-provider";

/* What the contact API can go wrong with. The route answers with one of these
   codes so the message the reader sees is chosen here, in their language,
   rather than being whatever Korean string the server happened to send. */
export type ContactErrorCode =
  | "bad_request"
  | "missing_fields"
  | "bad_email"
  | "send_failed"
  | "network";

/* The submitted value stays Korean in both languages: the notification mail is
   written in Korean either way, so translating the label the reader picks from
   would only split the inbox into two vocabularies for the same topic. */
export const CONTACT_TOPICS = [
  { value: "협업 제안", EN: "Collaboration" },
  { value: "연사 · 세션 요청", EN: "Speaking / sessions" },
  { value: "스폰서십", EN: "Sponsorship" },
  { value: "채용 · 인턴", EN: "Hiring / internships" },
  { value: "기타 문의", EN: "Something else" },
] as const;

export function topicLabel(
  topic: (typeof CONTACT_TOPICS)[number],
  lang: LangCode,
): string {
  return lang === "EN" ? topic.EN : topic.value;
}

type DialogCopy = {
  close: string;
  /* Label on the landing page's CTA button. It lives with the dialog copy
     because the button only opens that dialog — and because the page it sits
     on is a server component, so the label has to be picked client-side. */
  applyCta: string;
  apply: {
    eyebrow: string;
    /* "18기" reads as the cohort in Korean; English wants the ordinal
       wordmark ("BAY 18th"), so the label is built per language. */
    cohort: (cohort: string) => string;
    title: (closedCohort: string) => string;
    body: (nextCohort: string) => string;
    followEyebrow: string;
    contactNote: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    intro: string;
    name: string;
    email: string;
    affiliation: string;
    affiliationPlaceholder: string;
    topic: string;
    message: string;
    submit: string;
    submitting: string;
    replyNote: string;
    sentEyebrow: string;
    sentTitle: string;
    sentBody: string;
    sendAnother: string;
    errors: Record<ContactErrorCode, string>;
  };
};

const KR: DialogCopy = {
  close: "닫기",
  applyCta: "지원하기",
  apply: {
    eyebrow: "Recruiting",
    cohort: (cohort) => cohort,
    title: (closed) => `${closed} 모집이 마감되었습니다.`,
    body: (next) =>
      `다음 ${next}에 BAY가 되어주세요. 모집 공고는 아래 채널로 가장 먼저 전해드립니다.`,
    followEyebrow: "Follow for updates",
    contactNote:
      "모집 일정이나 지원 자격이 궁금하시면 메뉴의 Contact로 문의해 주세요.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Questions? Email us.",
    intro: "협업, 연사 초청, 스폰서십, 채용 어느 쪽이든 좋습니다.",
    name: "이름 *",
    email: "이메일 *",
    affiliation: "소속",
    affiliationPlaceholder: "선택 사항",
    topic: "문의 유형",
    message: "메시지 *",
    submit: "문의 보내기",
    submitting: "보내는 중…",
    replyNote: "남겨주시면 입력하신 메일로 회신드립니다.",
    sentEyebrow: "Sent",
    sentTitle: "문의가 전송되었습니다.",
    sentBody: "입력하신 메일 주소로 회신드리겠습니다. 보통 며칠 안에 답장이 갑니다.",
    sendAnother: "다른 문의 보내기",
    errors: {
      bad_request: "잘못된 요청입니다.",
      missing_fields: "이름, 이메일, 메시지를 모두 입력해주세요.",
      bad_email: "이메일 주소를 확인해주세요.",
      send_failed: "전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
      network: "네트워크 오류입니다. 연결을 확인하고 다시 시도해주세요.",
    },
  },
};

const EN: DialogCopy = {
  close: "Close",
  applyCta: "Apply",
  apply: {
    eyebrow: "Recruiting",
    cohort: (cohort) => cohortWordmark(cohort),
    title: (closed) => `Applications for ${closed} are closed.`,
    body: (next) =>
      `Join us for ${next}. The next call for applications goes out on the channels below first.`,
    followEyebrow: "Follow for updates",
    contactNote:
      "For questions about the schedule or who can apply, reach us through Contact in the menu.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Questions? Email us.",
    intro:
      "Collaborations, speaking invitations, sponsorships, hiring — all welcome.",
    name: "Name *",
    email: "Email *",
    affiliation: "Affiliation",
    affiliationPlaceholder: "Optional",
    topic: "Topic",
    message: "Message *",
    submit: "Send message",
    submitting: "Sending…",
    replyNote: "We will reply to the address you leave here.",
    sentEyebrow: "Sent",
    sentTitle: "Your message is on its way.",
    sentBody:
      "We will reply to the address you gave us. It usually takes a few days.",
    sendAnother: "Send another message",
    errors: {
      bad_request: "That request could not be read. Please try again.",
      missing_fields: "Name, email and message are all required.",
      bad_email: "Please check the email address.",
      send_failed: "Sending failed. Please try again in a moment.",
      network: "Network error. Check your connection and try again.",
    },
  },
};

const COPY: Record<LangCode, DialogCopy> = { KR, EN };

export function copyFor(lang: LangCode): DialogCopy {
  return COPY[lang];
}
