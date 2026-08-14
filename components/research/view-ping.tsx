"use client";

import { useEffect } from "react";

/* Counts a page view once per browser session per page. The sessionStorage
   guard also absorbs React strict-mode's double effect in dev. Articles only
   — news dropped its view counter. */
export default function ViewPing({
  kind,
  slug,
}: {
  kind: "articles";
  slug: string;
}) {
  useEffect(() => {
    const key = `bay-viewed:${kind}:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked — count anyway */
    }
    void fetch(`/api/views/${kind}/${encodeURIComponent(slug)}`, {
      method: "POST",
    }).catch(() => {});
  }, [kind, slug]);

  return null;
}
