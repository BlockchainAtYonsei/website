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
    /* Carries no cohort: the requirements below it hold from cycle to cycle,
       and the one number that matters — which round just closed — is named
       once, at the bottom. */
    title: string;
    intro: string;
    /* The only part of the Notion recruiting page that outlives its cycle.
       The 18기 schedule that sat beside it there is deliberately not here: a
       list of dates that have all passed is not reference, it is clutter that
       contradicts the closed notice. It survives in
       .context/notion-migration/notion-source.md if the next cycle wants the
       shape of one. */
    requirementsEyebrow: string;
    requirements: string[];
    /* Shown only while RECRUITING_OPEN — without a live form to point at, the
       instructions have nothing to instruct. */
    howEyebrow: string;
    howBody: string;
    formCta: string;
    /* The Notion recruiting FAQ. Collapsed in the dialog, so the "Q."/"A."
       prefixes the source carried are dropped: an accordion already says which
       half is the question. */
    faqEyebrow: string;
    faq: { q: string; a: string }[];
    /* Shown while RECRUITING_OPEN is false — the notice that explains why the
       schedule above is in the past. */
    closedTitle: (closedCohort: string) => string;
    closedBody: (nextCohort: string) => string;
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
    title: "BAY 학회원 모집",
    intro: "타 학교 지원 가능합니다.",
    requirementsEyebrow: "지원 요건",
    requirements: [
      "2개 이상의 팀 프로젝트에 성실하게 참여 가능한 분",
      "2학기 연속 활동이 가능한 분",
      "매주 목요일 오후 7시 30분 연세대학교 신촌캠퍼스에서 열리는 정규 세션에 참여 가능한 분",
    ],
    howEyebrow: "지원 방법",
    howBody: "구글 폼에 주어진 서식대로 작성해 주시면 됩니다.",
    formCta: "지원서 작성하기",
    faqEyebrow: "자주 묻는 질문",
    faq: [
      {
        q: "유예생, 졸업생, 휴학생, 대학원생, 직장인 모두 지원 가능한가요?",
        a: "네, 모두 지원 가능합니다. 기존 Blockchain at Yonsei 멤버 분들 중 졸업생, 대학원생, 현직 개발자 모두 있었습니다. 정기 회의 및 팀 프로젝트에 성실하게 참여할 수 있다면 모두 지원 가능합니다.",
      },
      {
        q: "활동 기간이 어떻게 되나요? 비연속 2학기도 가능한가요?",
        a: "연속 2학기 활동을 마쳐야 졸업이 가능합니다. 특별한 사유가 없는 한, 비연속 2학기는 불가능합니다.",
      },
      /* The one answer with a shelf life — bump the semester alongside the
         cohort numbers in lib/cohort.

         "총 30명" is not the roster and is not meant to match it: /organization
         counts everyone on the list (37 at the time of writing), while this is
         how many actually turn up. An applicant asking how big the society is
         wants the second number. Do not "fix" either side to agree. */
      {
        q: "학회 활동 인원이 얼마나 되나요? 이번 학기에는 얼마나 선발할 예정인가요?",
        a: "26-2학기 활동 예정인 기존 부원은 현재 20명 내외입니다. 매 기수마다 15-20명의 인원을 선발하여 총 30명 정도의 인원이 활동합니다.",
      },
      {
        q: "학회 활동은 언제 어디서 진행되나요?",
        a: "학회 정규 세션은 매주 목요일 오후 7시 30분, 연세대학교 신촌캠퍼스에서 진행될 예정입니다. 이외에 본인이 속한 팀의 스케줄에 따라 유동적으로 학회 활동이 이뤄집니다.",
      },
      {
        q: "개발자만 지원 가능한가요?",
        a: "아닙니다. 현재 다양한 전공의 부원들이 활동하고 있습니다.",
      },
      /* Left in English in the Korean table too: it is the one question aimed
         at readers who cannot read the rest of it. */
      {
        q: "Can foreigners/exchange students apply?",
        a: "Yes. If you need any translation of the notice, reach us through Contact in the menu.",
      },
      /* The source ended this one with a personal mobile number to text. No
         phone numbers on the site, and the form is the only channel — so the
         route out is Contact, same as everywhere else. */
      {
        q: "면접은 대면 면접인가요?",
        a: "네. 신촌 지역에서 진행될 예정입니다. 자세한 장소는 추후 공지될 예정입니다. 불가피한 사유로 대면 면접이 어려운 경우, 메뉴의 Contact로 사유와 함께 문의해 주세요.",
      },
    ],
    closedTitle: (closed) => `${closed} 모집은 마감되었습니다.`,
    closedBody: (next) =>
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
    title: "Join BAY",
    intro: "Students from other universities are welcome to apply.",
    requirementsEyebrow: "Requirements",
    requirements: [
      "Able to commit to two or more team projects",
      "Able to stay with us for two consecutive semesters",
      "Able to attend the weekly session — Thursdays 19:30, Yonsei University Sinchon campus",
    ],
    howEyebrow: "How to apply",
    howBody: "Fill in the Google form, following the format it gives you.",
    formCta: "Open the application form",
    faqEyebrow: "Frequently asked",
    faq: [
      {
        q: "Can graduates, students on leave, postgraduates and working professionals apply?",
        a: "Yes, all of them. Blockchain at Yonsei has had graduates, postgraduate students and working developers among its members. Anyone who can commit to the regular meetings and the team projects is welcome to apply.",
      },
      {
        q: "How long is the commitment? Can the two semesters be non-consecutive?",
        a: "You need two consecutive semesters to graduate from the society. Without a specific reason, non-consecutive semesters are not possible.",
      },
      {
        q: "How many members are there, and how many will you take this cycle?",
        a: "Around 20 existing members are continuing into the 26-2 semester. We take 15–20 people each cycle, for about 30 active members in total.",
      },
      {
        q: "When and where do activities take place?",
        a: "The regular session runs Thursdays at 19:30 on Yonsei University's Sinchon campus. Everything beyond that follows your own team's schedule.",
      },
      {
        q: "Do I have to be a developer?",
        a: "No. Our members come from a wide range of majors.",
      },
      {
        q: "Can foreigners/exchange students apply?",
        a: "Yes. If you need any translation of the notice, reach us through Contact in the menu.",
      },
      {
        q: "Are interviews held in person?",
        a: "Yes, in the Sinchon area. The exact venue is announced closer to the date. If you genuinely cannot attend in person, reach us through Contact in the menu with your reason.",
      },
    ],
    closedTitle: (closed) => `Applications for ${closed} are closed.`,
    closedBody: (next) =>
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
