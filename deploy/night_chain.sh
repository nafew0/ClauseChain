#!/usr/bin/env bash
# ClauseChain end-to-end chain (20 Jul): 6-run sweep -> refuter v2 -> consolidate
# -> recall adjudication -> zone-3 (gold tripwire) -> graph+champion validation
# -> legal-review payload. Designed to run DETACHED on the server so it survives
# SSH disconnects:
#   cd /srv/clausechain && sudo -u clausechain setsid nohup \
#     bash deploy/night_chain.sh > engine/logs/night_chain.log 2>&1 < /dev/null &
set -uo pipefail
cd "$(dirname "$0")/../engine"
PY=.venv/bin/python
OUTS="outputs/final_si_p6 outputs/final_si_p7 outputs/final_ma_p6 outputs/final_ma_p7 outputs/final_au_p6 outputs/final_au_p7"

echo "=== SWEEP start $(date -u +%F' '%T)Z ==="
for spec in "Singapore 6 si" "Singapore 7 si" "Malaysia 6 ma" "Malaysia 7 ma" \
            "Australia 6 au" "Australia 7 au"; do
  set -- $spec
  echo "--- $1 P$2 $(date -u +%T) ---"
  $PY run.py --economy "$1" --pillar "$2" --out "outputs/final_$3_p$2" \
    || echo "RUN FAILED: $1 P$2 (continuing — failure is recorded, not silent)"
done

echo "=== REFUTER $(date -u +%T) ==="
$PY scripts/refute_new.py $OUTS || echo "REFUTER FAILED"
echo "=== CONSOLIDATE $(date -u +%T) ==="
$PY scripts/consolidate_submission.py $OUTS || echo "CONSOLIDATE FAILED"
echo "=== ADJUDICATE RECALL $(date -u +%T) ==="
$PY scripts/adjudicate_recall.py $OUTS || echo "ADJUDICATE FAILED"
echo "=== ZONE-3 $(date -u +%T) ==="
$PY scripts/zone3_score.py $OUTS || echo "ZONE3 FAILED"
echo "=== VALIDATE $(date -u +%T) ==="
$PY scripts/validate_graph.py || echo "GRAPH VALIDATION FAILED"
$PY scripts/champion_validate.py || echo "CHAMPION VALIDATION FAILED"
echo "=== PAYLOAD $(date -u +%T) ==="
$PY scripts/export_legal_review_payload.py $OUTS || echo "PAYLOAD FAILED"
echo "=== DONE $(date -u +%F' '%T)Z ==="
