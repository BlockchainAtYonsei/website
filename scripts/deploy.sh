#!/bin/zsh
# BAY-WEB auto-deploy: polls GitHub main and redeploys the bay-web container on new commits.
# Run by launchd (com.bay-web.deploy) every 60s. State/logs live in /Users/Shared/srv/.bay-web-cicd.
set -euo pipefail
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

BASE=/Users/Shared/srv/.bay-web-cicd
REPO=https://github.com/BlockchainAtYonsei/website
CHECKOUT=$BASE/checkout
STATE=$BASE/deployed-sha
LOG=$BASE/deploy.log

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

if ! docker build -t bay-web "$CHECKOUT" >> "$LOG" 2>&1; then
  log "docker build FAILED for $REMOTE — keeping current container"
  exit 1
fi

docker rm -f bay-web >> "$LOG" 2>&1 || true
docker run -d --restart unless-stopped -p 3001:3000 --name bay-web bay-web >> "$LOG" 2>&1
echo "$REMOTE" > "$STATE"
log "deployed $REMOTE"
