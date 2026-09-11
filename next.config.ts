import type { NextConfig } from "next";

/* One id per deploy, from the commit Railway is building (Dockerfile passes
   it through as a build ARG). Next stamps it onto asset URLs (`?dpl=`) and
   into a response header the client compares against its own build; a
   mismatch after a deploy forces a full reload instead of a client-side
   navigation that would keep showing the tab's old pages. Locally there is
   no SHA and no id, which is also the pre-existing behaviour. */
const deploymentId = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 12) || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId,
  /* Same id for plain <img src="/…"> tags (lib/asset-url.ts), which next/image
     handles on its own. Inlined at build time in both server and client code. */
  env: { NEXT_PUBLIC_DEPLOYMENT_ID: deploymentId ?? "" },
  images: {
    /* News thumbnails come from whatever site the curator linked — tokenpost,
       blockmedia, medium, wikimedia, … an unbounded set, so the hostname has
       to be open. The optimizer is what makes card loads fast: publishers
       ship 1400px+ originals (measured up to 2.2MB) into ~360px card slots;
       proxied through /_next/image they arrive as card-sized WebPs from our
       own host. https-only keeps plain-http origins out. */
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
