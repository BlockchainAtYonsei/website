import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
