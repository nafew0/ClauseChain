"""Build the Malaysia corpus from fetched seed documents (PDF path).

Selects seed entries that are P6/P7-tagged OR whose act matches a gold-cited
act, extracts RuleUnits via the generic PDF-act extractor (scanned files go to
the OCR VM), and loads the graph store (SQLite for now — Neo4j VM offline).

Usage: .venv/bin/python scripts/build_my_corpus.py [--all]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

from packages.discovery.diff import normalize_law  # noqa: E402
from packages.extractors.pdf_act import extract_act_pdf  # noqa: E402
from packages.graph.sqlite_graph import SqliteGraphStore  # noqa: E402
from packages.providers.model_router import resolve_ocr  # noqa: E402


def gold_act_norms() -> set[str]:
    rows = json.loads(Path("data/known_index.json").read_text())["economies"]["Malaysia"]
    return {a for r in rows if r.get("pillar") in ("6", "7") for a in r.get("acts_norm", [])}


def main() -> int:
    fetch_all = "--all" in sys.argv
    manifest = json.loads(Path("data/raw/my/seeds_manifest.json").read_text())
    gold = gold_act_norms()
    store = SqliteGraphStore()
    ocr = resolve_ocr("hybrid_accuracy")

    total, loaded_acts, skipped_html = 0, 0, 0
    for url, entry in manifest.items():
        if entry.get("status") != "ok":
            continue
        act_name = (entry.get("act") or "").strip()
        relevant = (str(entry.get("indicator_code", "")).startswith(("P6", "P7"))
                    or any(g in normalize_law(act_name) for g in gold))
        if not (relevant or fetch_all):
            continue
        file = entry.get("file", "")
        if not file.endswith(".pdf"):
            skipped_html += 1
            continue
        try:
            units = extract_act_pdf(file, economy="Malaysia", act_name=act_name,
                                    act_ref=Path(file).stem.replace("seed_", ""),
                                    source_url=url, ocr_engine=ocr)
        except Exception as error:  # noqa: BLE001 — one bad PDF must not kill the build
            print(f"  FAILED {act_name[:50]}: {error}")
            continue
        for unit in units:
            unit.metadata["archived_copy"] = file
            unit.metadata["access_date"] = entry.get("access_date")
            store.upsert_rule_unit(unit)
        if units:
            loaded_acts += 1
            total += len(units)
            print(f"  {act_name[:58]:58s} -> {len(units):4d} units")

    hits = store.search_provisions("transfer personal data outside Malaysia",
                                   economy="Malaysia", limit=3)
    top = hits[0]["props"].get("article_section") if hits else None
    print(f"\nMY corpus: {loaded_acts} acts, {total} rule units "
          f"(html seeds skipped: {skipped_html}) | search smoke top: {top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
