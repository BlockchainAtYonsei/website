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
COPY package.json prisma.config.ts ./
COPY prisma ./prisma

USER nest

ENV PORT=4000
EXPOSE 4000

# migrations apply on boot — a new schema version and its code always land
# together, and a failed migration stops the old container from being replaced
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
