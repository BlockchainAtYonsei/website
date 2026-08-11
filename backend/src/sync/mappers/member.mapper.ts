import type { PageObjectResponse } from "@notionhq/client";
import {
  checkboxOf,
  fileUrlOf,
  numberOf,
  richTextOf,
  selectOf,
  titleOf,
  urlOf,
} from "../../notion/properties";
import {
  MEMBER_PROPS as P,
  MEMBER_SOCIAL_PROPS,
  MEMBER_STATUS_MAP,
  SLUG_RE,
} from "../../notion/schema";

export type MemberData = {
  slug: string;
  name: string;
  cohort: number;
  team: string;
  position: string;
  bio: string;
  socials: { label: string; href: string }[];
  status: "active" | "alumni";
  visible: boolean;
  /* Expiring Notion URL — the syncer re-hosts it, never stores it. */
  avatarSourceUrl?: string;
};

export type MemberMapResult = { data?: MemberData; warnings: string[] };

/* 필수: 이름 · Slug · 기수. A page missing those can't be a roster entry or a
   byline, so it skips with a warning and re-syncs once fixed in Notion. */
export function pageToMember(page: PageObjectResponse): MemberMapResult {
  const warnings: string[] = [];
  const name = titleOf(page, P.name);
  const slug = richTextOf(page, P.slug)?.toLowerCase();
  const cohort = numberOf(page, P.cohort);

  const label = name ?? page.id;
  if (!name) warnings.push(`member ${label}: "${P.name}" is empty — skipped`);
  if (!slug || !SLUG_RE.test(slug)) {
    warnings.push(`member ${label}: "${P.slug}" missing or not [a-z0-9-] — skipped`);
  }
  if (cohort === undefined || !Number.isInteger(cohort)) {
    warnings.push(`member ${label}: "${P.cohort}" missing — skipped`);
  }
  if (!name || !slug || !SLUG_RE.test(slug) || cohort === undefined || !Number.isInteger(cohort)) {
    return { warnings };
  }

  const team = selectOf(page, P.team);
  if (!team) warnings.push(`member ${label}: "${P.team}" is empty`);

  const rawStatus = selectOf(page, P.status);
  const status = rawStatus ? MEMBER_STATUS_MAP[rawStatus] : "active";
  if (rawStatus && !MEMBER_STATUS_MAP[rawStatus]) {
    warnings.push(`member ${label}: unknown "${P.status}" value "${rawStatus}", using 활동`);
  }

  const socials = MEMBER_SOCIAL_PROPS.flatMap((social) => {
    const href = urlOf(page, social);
    return href ? [{ label: social, href }] : [];
  });

  return {
    data: {
      slug,
      name,
      cohort,
      team: team ?? "",
      position: selectOf(page, P.position) ?? "부원",
      bio: richTextOf(page, P.bio) ?? "",
      socials,
      status: status ?? "active",
      visible: checkboxOf(page, P.visible) ?? true,
      avatarSourceUrl: fileUrlOf(page, P.avatar),
    },
    warnings,
  };
}
