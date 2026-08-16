# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Generate the Prisma client and compile
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# 3. Runtime — full node_modules ships along because the boot command runs
#    `prisma migrate deploy` (the CLI is a devDependency); the image is a club
#    backend, not a fleet, so slimming it isn't worth a second lockfile.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nest

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# scripts ride along so the seeds can run in the container — the member
# roster's edit path is this repo, not an admin UI.
#
# The whole of src/ comes with them, not just the generated client. A seed is
# a tsx entry point that imports the app's own code — reading-time today,
# reference extraction and the og:image crawl now — so shipping the generated
# client alone left `npm run seed:mock` dying on MODULE_NOT_FOUND inside the
# container while working perfectly from a checkout. Sources are text next to
# a node_modules that already carries the Prisma CLI; the narrower copy buys
# nothing and breaks the next time a script imports something.
COPY --from=builder /app/src ./src
COPY scripts ./scripts
COPY package.json prisma.config.ts ./
COPY prisma ./prisma

USER nest

ENV PORT=4000
EXPOSE 4000

# Boot: migrations, the roster seed, the mock articles while there are no real
# ones, then the server. Migrations are fatal on purpose — schema and code must
# land together. Neither seed is: a seed's failure should cost a log line,
# never the whole API.
#
# The articles seed is gated on NOTION_DB_ARTICLES being empty, which is the
# database's way of saying nothing else owns this table. That is the state
# today (docs/deploy-runbook.md: research articles are intentionally mock), and
# the gate retires itself — the day that variable holds a real database id the
# sync owns articles and this stops running, without anyone remembering to
# remove it. SEED_ALLOW_REMOTE is spelled out here rather than inherited,
# because the guard it opens exists to stop an ambient DATABASE_URL from
# turning a local command into a production wipe; saying it in the image is
# that decision made once, in review.
#
# Editing a member, or the mock articles, is: edit the script, deploy. Which
# is the point — the only shell that reaches the deployed containers is on a
# machine nobody is sitting at.
CMD ["sh", "-c", "npx prisma migrate deploy \
  && (npm run seed:members || echo 'seed:members failed — roster unchanged') \
  && { [ -n \"$NOTION_DB_ARTICLES\" ] \
       && echo 'NOTION_DB_ARTICLES set — articles come from the sync, skipping the mock seed' \
       || SEED_ALLOW_REMOTE=1 npm run seed:mock \
       || echo 'seed:mock failed — articles unchanged'; } \
  && node dist/main.js"]
