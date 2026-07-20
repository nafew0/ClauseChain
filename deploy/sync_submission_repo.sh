#!/usr/bin/env bash
# Sync the curated submission repo (clausechain-escap) from this dev repo.
#
#   bash deploy/sync_submission_repo.sh                # sync + show diff (NO commit)
#   bash deploy/sync_submission_repo.sh "msg"          # sync + commit
#   bash deploy/sync_submission_repo.sh "msg" --push   # sync + commit + push
#
# The submission repo is a curated snapshot, not a fork: this script re-copies
# the allowed paths, prunes internal files, runs a secret/IP scan (aborts on
# hits), and leaves git to you unless a message is given.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="$(dirname "$SRC")/clausechain-escap"
MSG="${1:-}"
PUSH="${2:-}"

[ -d "$DST/.git" ] || { echo "submission repo not found at $DST"; exit 1; }

rsync -a --delete \
  --exclude='.git' --exclude='.venv' --exclude='venv' --exclude='__pycache__' \
  --exclude='.pytest_cache' --exclude='data/raw' --exclude='data/cache' \
  --exclude='data/tmp' --exclude='*.db' --exclude='*.db-wal' --exclude='*.db-shm' \
  --exclude='.env' --exclude='DECISIONS.md' \
  --exclude='docs/Pillar-6-deep-research-report*' \
  --exclude='docs/Pillar-7-deep-research-report*' \
  "$SRC/engine/" "$DST/engine/"
rsync -a --delete \
  --exclude='.git' --exclude='venv' --exclude='node_modules' --exclude='.env' \
  --exclude='db.sqlite3' --exclude='staticfiles' --exclude='__pycache__' \
  "$SRC/backend/" "$DST/backend/"
rsync -a --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env*' \
  "$SRC/frontend/" "$DST/frontend/"
cp "$SRC/README_SUBMISSION.md" "$DST/README.md"
cp "$SRC/ClauseChain_Pitch_Deck.pptx" "$DST/"
cp "$SRC/README_WEB.md" "$DST/" 2>/dev/null || true

# Sanitary scan: server IPs, private keys, real-looking API keys, .env files.
HITS=$(grep -rlE "103\.157\.13[0-9]|BEGIN (RSA|OPENSSH) PRIVATE|sk-[A-Za-z0-9]{30,}|clausechain_deploy" \
        "$DST" --exclude-dir=.git 2>/dev/null || true)
ENVS=$(find "$DST" -name ".env" -not -path "*/.git/*" | head -5)
if [ -n "$HITS$ENVS" ]; then
  echo "❌ SANITARY SCAN FAILED — fix before committing:"; echo "$HITS"; echo "$ENVS"; exit 2
fi
echo "✓ sanitary scan clean"

cd "$DST"
git add -A
git status --short | head -30
echo "---"
if [ -z "$MSG" ]; then
  echo "dry sync complete (staged, not committed). Commit with: bash deploy/sync_submission_repo.sh \"message\" [--push]"
  exit 0
fi
if git diff --cached --quiet; then
  echo "nothing to commit — submission repo already up to date"
else
  git commit -q -m "$MSG"
  git log --oneline -1
fi
[ "$PUSH" = "--push" ] && git push -q origin main && echo "PUSHED to github.com/nafew0/clausechain-escap"
exit 0
