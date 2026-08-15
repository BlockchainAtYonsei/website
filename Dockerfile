# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# where the BAY backend lives during prerender — research/news pages fetch it
# at build time (SSG); deploy.sh passes the real value
ARG API_URL=http://localhost:4000
ENV API_URL=$API_URL
RUN npm run build

# 3. Minimal runtime image (output: "standalone")
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# --chown, because the app runs as nextjs below: a root-owned .next means the
# image optimizer (and ISR) can't create .next/cache — it fails silently and
# re-fetches every original on every request instead
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
