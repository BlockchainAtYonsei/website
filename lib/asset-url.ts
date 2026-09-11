/* Cache-busting for files served from public/ through a plain <img>.

   Those files keep their names across deploys, and the club's Cloudflare zone
   (proxying blockchainatyonsei.com) stamps every image it fronts with a 4-hour
   browser TTL no matter what Next sends — Next says max-age=0, visitors'
   browsers are told 14400. Replace a member photo or partner mark and the old
   one lingers until that clock runs out. A URL that changes with the deploy is
   the one cache key every layer honours; next/image already appends
   `&dpl=<deploymentId>` for local sources, this does the same for raw tags. */
export function publicAsset(path: string): string {
  const id = process.env.NEXT_PUBLIC_DEPLOYMENT_ID;
  return id ? `${path}?dpl=${id}` : path;
}
