#!/usr/bin/env bash
# Publish this repo's committed state to the submission repo (nafew0/clausechain-escap).
#
#   deploy/sync_submission_repo.sh                    prepare and show the changes (no commit)
#   deploy/sync_submission_repo.sh "message"          prepare and commit
#   deploy/sync_submission_repo.sh "message" --push   prepare, commit and push
#
# Only committed files are published (git archive HEAD): uncommitted work, ignored
# files, keys and local data never leave this machine. The work happens in its own
# clone (dist/clausechain-escap), never in a checkout you edit by hand. Internal
# planning files stay here (EXCLUDE); the submission repo's own pitch decks are kept
# as they are (KEEP). A secret and server-address scan aborts before any commit.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${SUBMISSION_REMOTE:-https://github.com/nafew0/clausechain-escap.git}"
WORK="${SUBMISSION_WORKDIR:-$SRC/dist/clausechain-escap}"
MSG="${1:-}"
PUSH="${2:-}"

EXCLUDE=(
  ':!docs'
  ':!docker-compose.dev.yml'
  ':!deploy/SERVER_EXECUTION_PLAN.md'
  ':!deploy/night_chain.sh'
  ':!deploy/sync_submission_repo.sh'
  ':!engine/DECISIONS.md'
)
KEEP=('ClauseChain Pitch Deck.pdf' 'ClauseChain Pitch Deck.pptx' 'ClauseChain_Pitch_Deck.pptx')

if [ -n "$(git -C "$SRC" status --porcelain --untracked-files=no)" ]; then
  echo "note: uncommitted changes in $SRC are not published (only HEAD $(git -C "$SRC" rev-parse --short HEAD) is)"
fi

if [ -d "$WORK/.git" ]; then
  git -C "$WORK" fetch -q origin
  git -C "$WORK" checkout -q main
  git -C "$WORK" reset -q --hard origin/main
else
  mkdir -p "$(dirname "$WORK")"
  git clone -q "$REMOTE" "$WORK"
fi

cd "$WORK"
git rm -r -q --ignore-unmatch -- .
for file in "${KEEP[@]}"; do git checkout -q HEAD -- "$file" 2>/dev/null || true; done
git -C "$SRC" archive --format=tar HEAD -- . "${EXCLUDE[@]}" | tar -xf - -C "$WORK"
git add -A

# Secret and server-address scan over every text file about to be published.
HITS=$(git grep --cached -I -lE \
  '103\.157\.|203\.96\.|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|sk-proj-[A-Za-z0-9_-]{20}|sk-or-v1-[a-f0-9]{20}|AIza[0-9A-Za-z_-]{30}' || true)
ENVS=$(git ls-files | grep -E '(^|/)\.env$' || true)
if [ -n "$HITS$ENVS" ]; then
  echo "SCAN FAILED: fix these in $SRC, commit, and run again:"
  printf '%s\n' $HITS $ENVS
  exit 2
fi
echo "scan clean"

git status --short | awk '{print $1}' | sort | uniq -c | awk '{printf "  %s %s", $2, $1} END {print ""}'
if [ -z "$MSG" ]; then
  echo "prepared in $WORK (not committed)"
  exit 0
fi
if git diff --cached --quiet; then
  echo "nothing to commit: the submission repo already matches"
else
  git commit -q -m "$MSG"
  git log --oneline -1
fi
if [ "$PUSH" = "--push" ]; then
  git push -q origin main
  echo "pushed to $REMOTE"
fi
