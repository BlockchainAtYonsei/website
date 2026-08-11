"use client";

import { useEffect } from "react";

/* Counts a page view once per browser session per article. The sessionStorage
   guard also absorbs React strict-mode's double effect in dev. */
export default function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `bay-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked — count anyway */
    }
    void fetch(`/api/views/${encodeURIComponent(slug)}`, { method: "POST" }).catch(
      () => {},
    );
  }, [slug]);

  return null;
}
