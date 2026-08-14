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
# scripts + generated client ride along so the roster seed can run in the
# container — the member roster's edit path is this repo, not an admin UI
COPY --from=builder /app/src/generated ./src/generated
COPY scripts ./scripts
COPY package.json prisma.config.ts ./
COPY prisma ./prisma

USER nest

ENV PORT=4000
EXPOSE 4000

# Boot: migrations, then the roster seed, then the server. Migrations are
# fatal on purpose — schema and code must land together. The seed is not:
# it's an idempotent upsert whose failure should cost a log line, never the
# whole API. Editing a member is: edit scripts/seed-members.ts, deploy.
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run seed:members || echo 'seed:members failed — roster unchanged') && node dist/main.js"]
