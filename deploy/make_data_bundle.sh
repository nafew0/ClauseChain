#!/usr/bin/env bash
# Build the data bundle that deploy.sh / deploy.ps1 download: the corpus database,
# the run outputs and the archived source downloads — everything the app needs
# that is not in git. Embedding caches are left out (rebuilt on first use).
#
#   deploy/make_data_bundle.sh [output.tar.gz]
#
# Upload the .tar.gz, then put its link and the printed SHA-256 into
# deploy/data_bundle.cfg.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-dist/clausechain-data-$(date +%Y%m%d).tar.gz}"
mkdir -p "$(dirname "$OUT")"

# Fold any pending SQLite write-ahead log into the database file first.
engine/.venv/bin/python - <<'PY'
import sqlite3
connection = sqlite3.connect("engine/data/graph_v2.db")
connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
connection.close()
PY

GZIP_CMD="gzip -6"
command -v pigz >/dev/null 2>&1 && GZIP_CMD="pigz -6"
echo "Packing (this takes a few minutes) -> $OUT"
# COPYFILE_DISABLE stops macOS tar from adding ._ metadata files.
COPYFILE_DISABLE=1 tar -cf - \
  --exclude='.DS_Store' --exclude='engine/outputs/final_r2__p*' \
  engine/data/graph_v2.db engine/data/raw engine/outputs | $GZIP_CMD > "$OUT"

if command -v sha256sum >/dev/null 2>&1; then SUM=$(sha256sum "$OUT" | awk '{print $1}'); else SUM=$(shasum -a 256 "$OUT" | awk '{print $1}'); fi
echo "$SUM  $(basename "$OUT")" > "$OUT.sha256"
echo
echo "Bundle:  $OUT ($(du -h "$OUT" | awk '{print $1}'))"
echo "SHA-256: $SUM"
echo "Next: upload it, then set CLAUSECHAIN_DATA_URL and CLAUSECHAIN_DATA_SHA256 in deploy/data_bundle.cfg"
