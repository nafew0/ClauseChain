"""Eval harness skeleton: grade an output.csv against the KNOWN baseline.

Reports (per economy + pillar):
- KNOWN-provision recall vs the master dataset (provision level where articles were parsed)
- NEW row count
- field-format checks (indicator code, article paragraph depth, URL, snippet, tag)

Usage (from engine/):
    uv run python scripts/eval_vs_master.py --output outputs/demo/output.csv --economy Singapore --pillar 6
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.ingest.known_index import base_ref, extract_refs, normalize_law_name  # noqa: E402

INDICATOR_RE = re.compile(r"^P(\d{1,2})-I\d{1,2}$")
PARAGRAPH_RE = re.compile(r"\(\w{1,3}\)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="outputs/demo/output.csv")
    parser.add_argument("--index", default="data/known_index.json")
    parser.add_argument("--economy", required=True, help="Economy name as in the master DB, e.g. Singapore")
    parser.add_argument("--pillar", required=True, type=int)
    args = parser.parse_args()

    index = json.loads(Path(args.index).read_text(encoding="utf-8"))
    entries = index["economies"].get(args.economy, [])
    known = [
        e for e in entries
        if e["source"] == "master"
        and (e["indicator_code"] or "").startswith(f"P{args.pillar}-")
    ]
    # a master row may pack several laws into one Act cell — match against each
    known_laws = {name for e in known for name in e.get("acts_norm", [e["act_norm"]])}
    known_provisions = {
        (name, base_ref(article))
        for e in known
        for name in e.get("acts_norm", [e["act_norm"]])
        for article in e["articles"]
    }

    with open(args.output, newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    rows = [r for r in rows if r.get("Economy", "").strip().lower() == args.economy.lower()
            and (r.get("Indicator ID", "").startswith(f"P{args.pillar}-"))]

    matched_provisions = set()
    matched_laws = set()
    new_rows = 0
    format_failures: list[str] = []

    for i, row in enumerate(rows, start=1):
        law_norm = normalize_law_name(row.get("Law Name", ""))
        refs = [base_ref(r) for r in extract_refs(row.get("Article / Section", ""))]
        if law_norm in known_laws:
            matched_laws.add(law_norm)
        for article in refs:
            if (law_norm, article) in known_provisions:
                matched_provisions.add((law_norm, article))
        if row.get("Discovery Tag") == "NEW":
            new_rows += 1

        # field checks (absence rows — "No provision found" — are a legitimate
        # ESCAP pattern: score-0 with the governing law cited; skip depth/snippet checks)
        is_absence = row.get("Verbatim Snippet", "").strip().lower().startswith("no provision found")
        if not INDICATOR_RE.match(row.get("Indicator ID", "")):
            format_failures.append(f"row {i}: bad Indicator ID {row.get('Indicator ID')!r}")
        if not is_absence and not PARAGRAPH_RE.search(row.get("Article / Section", "")):
            format_failures.append(f"row {i}: Article/Section lacks paragraph depth "
                                   f"({row.get('Article / Section')!r}) — template demands Art. 26(2) style")
        if not row.get("Source URL", "").startswith("http"):
            format_failures.append(f"row {i}: Source URL not http(s)")
        if not is_absence and len(row.get("Verbatim Snippet", "")) < 20:
            format_failures.append(f"row {i}: Verbatim Snippet suspiciously short")
        if row.get("Discovery Tag") not in {"NEW", "KNOWN"}:
            format_failures.append(f"row {i}: Discovery Tag must be NEW or KNOWN")

    print(f"=== eval vs master — {args.economy} P{args.pillar} ===")
    print(f"output rows (this economy+pillar): {len(rows)}  |  NEW: {new_rows}")
    print(f"master KNOWN laws: {len(known_laws)}  -> matched: {len(matched_laws)} "
          f"({(len(matched_laws) / len(known_laws) * 100) if known_laws else 0:.0f}% law-level recall)")
    print(f"master KNOWN provisions (with parsed articles): {len(known_provisions)} "
          f"-> matched: {len(matched_provisions)} "
          f"({(len(matched_provisions) / len(known_provisions) * 100) if known_provisions else 0:.0f}% provision-level recall)")
    if format_failures:
        print(f"FORMAT FAILURES ({len(format_failures)}):")
        for failure in format_failures[:20]:
            print(f"  - {failure}")
    else:
        print("format checks: all pass")
    print("NOTE: P0/P1 recall will be near zero until the real pipeline lands — "
          "this scoreboard exists so every P1+ change moves a number.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
