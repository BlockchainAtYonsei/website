/* Recruiting cycle numbers live here rather than in the modal that displays
   them: that modal is a client component, and a server page reading a constant
   back across the "use client" boundary gets a client-reference proxy instead
   of the string. Update these two when a cycle opens or closes. */
export const CLOSED_COHORT = "18기";
export const NEXT_COHORT = "19기";

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
