#!/bin/zsh
# BAY-WEB auto-deploy: polls GitHub main and redeploys the bay containers on new commits.
# Run by launchd (com.bay-web.deploy) every 60s. State/logs live in /Users/Shared/srv/.bay-web-cicd.
#
# Topology (one Mac, plain docker — no compose):
#   bay-pg       postgres 17, private bay-net + named volume, created once
#   bay-backend  backend/Dockerfile, bay-net + host :4000, secrets from backend.env
#   bay-web      root Dockerfile, host :3001, reaches the API via host.docker.internal
#
# backend.env ($BASE/backend.env, operator-managed, never in git) needs at least:
#   POSTGRES_PASSWORD=...
#   DATABASE_URL=postgresql://bay:<same password>@bay-pg:5432/bay
#   SYNC_KEY=... REVALIDATE_SECRET=...
#   REVALIDATE_URL=http://host.docker.internal:3001/api/revalidate
#   NOTION_TOKEN=... NOTION_DB_MEMBERS=... NOTION_DB_ARTICLES=... NOTION_DB_NEWS=...
#   (optional) S3_* for avatar re-hosting
# Missing file = web-only deploy, research pages render empty until it exists.
set -euo pipefail
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

BASE=/Users/Shared/srv/.bay-web-cicd
REPO=https://github.com/BlockchainAtYonsei/website
CHECKOUT=$BASE/checkout
STATE=$BASE/deployed-sha
LOG=$BASE/deploy.log
ENV_FILE=$BASE/backend.env
API_URL=http://host.docker.internal:4000

mkdir -p "$BASE"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

if [ ! -d "$CHECKOUT/.git" ]; then
  git clone --branch main "$REPO" "$CHECKOUT" >> "$LOG" 2>&1
fi

cd "$CHECKOUT"
git fetch --quiet origin main
REMOTE=$(git rev-parse origin/main)
CURRENT=$(cat "$STATE" 2>/dev/null || echo none)

[ "$REMOTE" = "$CURRENT" ] && exit 0

log "new commit $REMOTE (deployed: $CURRENT) — building"
git reset --hard --quiet "$REMOTE"

if [ ! -f Dockerfile ]; then
  log "Dockerfile not on origin/main yet — skipping (push it to enable deploys)"
  exit 0
fi

# ---- backend (before web: the web build prerenders against the live API) ----
if [ -f backend/Dockerfile ] && [ -f "$ENV_FILE" ]; then
  docker network create bay-net >> "$LOG" 2>&1 || true

  if ! docker ps --format '{{.Names}}' | grep -q '^bay-pg$'; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    docker run -d --restart unless-stopped --name bay-pg --network bay-net \
      -e POSTGRES_USER=bay -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?backend.env: POSTGRES_PASSWORD missing}" \
      -e POSTGRES_DB=bay -v bay-pg-data:/var/lib/postgresql/data \
      postgres:17-alpine >> "$LOG" 2>&1
    log "started bay-pg (fresh volume: bay-pg-data)"
  fi

  if ! docker build -t bay-backend "$CHECKOUT/backend" >> "$LOG" 2>&1; then
    log "backend build FAILED for $REMOTE — keeping current containers"
    exit 1
  fi
  docker rm -f bay-backend >> "$LOG" 2>&1 || true
  docker run -d --restart unless-stopped --name bay-backend --network bay-net \
    -p 4000:4000 --env-file "$ENV_FILE" bay-backend >> "$LOG" 2>&1

  # migrations run on boot — wait until the API answers before building web
  for i in $(seq 1 30); do
    curl -sf -m 2 http://localhost:4000/health > /dev/null 2>&1 && break
    sleep 2
    [ "$i" = 30 ] && { log "bay-backend never became healthy — aborting"; exit 1; }
  done
  log "bay-backend healthy"
elif [ -f backend/Dockerfile ]; then
  # The web build prerenders against the API, so without a backend there is
  # no successful web build either — stop with a clear reason instead of
  # letting docker build fail cryptically every 60 seconds.
  log "BLOCKED: backend.env missing at $ENV_FILE — create it (template in scripts/deploy.sh header), deploys resume automatically"
  exit 1
fi

# ---- web ----
if ! docker build -t bay-web --build-arg API_URL="$API_URL" "$CHECKOUT" >> "$LOG" 2>&1; then
  log "docker build FAILED for $REMOTE — keeping current container"
  exit 1
fi

docker rm -f bay-web >> "$LOG" 2>&1 || true
WEB_ENV=()
if [ -f "$ENV_FILE" ]; then
  # the web runtime needs only these two; the rest of backend.env stays out
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  WEB_ENV=(-e API_URL="$API_URL" -e REVALIDATE_SECRET="${REVALIDATE_SECRET:-}")
fi
docker run -d --restart unless-stopped -p 3001:3000 --name bay-web "${WEB_ENV[@]}" bay-web >> "$LOG" 2>&1
echo "$REMOTE" > "$STATE"
log "deployed $REMOTE"
