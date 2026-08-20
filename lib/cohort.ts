/* Recruiting cycle numbers live here rather than in the modal that displays
   them: that modal is a client component, and a server page reading a constant
   back across the "use client" boundary gets a client-reference proxy instead
   of the string. Update these two when a cycle opens or closes. */
export const CLOSED_COHORT = "18기";
export const NEXT_COHORT = "19기";

/* Whether a cycle is currently taking applications. Typed as boolean rather
   than the literal so both branches stay meaningful to the type checker while
   this sits at false.

   False parks the Apply overlay in its closed state: the requirements stay up,
   since they hold whichever round is running, but the whole how-to-apply
   section goes so nobody submits into a shut form. */
export const RECRUITING_OPEN: boolean = false;

/* The application form, kept beside the cycle numbers so opening the next one
   is an edit in this file rather than a hunt through the copy table. Rendered
   only while RECRUITING_OPEN; the URL below is 18기's and has to be replaced
   along with it. */
export const APPLY_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScOCLjPOjNRxRbZ6bI0vrieiNmYlwiI_NqECcJiMhwbV9GFVg/viewform?usp=header";

/* "18기" → "BAY 18th". Falls back to the bare wordmark if the cohort ever
   stops starting with a number. */
export function cohortWordmark(cohort: string): string {
  const n = Number.parseInt(cohort, 10);
  if (Number.isNaN(n)) return "BAY";

  const tens = n % 100;
  const ones = n % 10;
  const suffix =
    tens >= 11 && tens <= 13
      ? "th"
      : ones === 1
        ? "st"
        : ones === 2
          ? "nd"
          : ones === 3
            ? "rd"
            : "th";

  return `BAY ${n}${suffix}`;
}
