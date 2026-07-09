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
    import os

    fetch_all = "--all" in sys.argv
    manifest_path = Path("data/raw/my/seeds_manifest.json")
    if not manifest_path.is_file():  # fresh clone: fetch the seed documents first
        from packages.connectors.seeds_fetch import fetch_seeds

        print("[seeds] no MY manifest — fetching P6/P7 seed documents (first run only)")
        fetch_seeds("Malaysia", ("P6", "P7"))
    manifest = json.loads(manifest_path.read_text())
    gold = gold_act_norms()
    from packages.graph.store import get_graph_store

    primary = get_graph_store()
    stores = [primary]
    if (os.getenv("GRAPH_BACKEND") or "sqlite").lower() != "sqlite":
        stores.append(SqliteGraphStore())  # Path A parity
    print("graph:", ", ".join(type(s).__name__ for s in stores))
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
            # HTML landing page (e.g. pdp.gov.my Codes of Practice): resolve to
            # the embedded PDF on the SAME official domain and fetch it once.
            import re as _re2
            import time as _time2
            from urllib.parse import urljoin, urlparse

            import httpx as _httpx

            resolved = None
            try:
                html = Path(file).read_text(encoding="utf-8", errors="ignore")
                for link in _re2.findall(r'href="([^"]+\.pdf[^"]*)"', html, _re2.I):
                    pdf_url = urljoin(url, link)
                    if (urlparse(pdf_url).hostname or "") == (urlparse(url).hostname or ""):
                        resolved = pdf_url
                        break
            except OSError:
                pass
            if not resolved:
                skipped_html += 1
                continue
            pdf_file = Path(file).with_suffix(".resolved.pdf")
            if not pdf_file.is_file():
                _time2.sleep(2.0)
                resp = _httpx.get(resolved, follow_redirects=True, timeout=120,
                                  headers={"User-Agent": "Mozilla/5.0 ClauseChain-research/0.1"})
                if resp.status_code != 200 or resp.content[:5] != b"%PDF-":
                    skipped_html += 1
                    continue
                pdf_file.write_bytes(resp.content)
            file = str(pdf_file)
            url = resolved  # cite the official PDF we actually parsed
        # SOURCE UPGRADE (audit rule): the inventory cites non-official mirrors
        # (e.g. mohre.um.edu.my for the PDPA — 8×). When the act number is known,
        # cite the OFFICIAL Laws-of-Malaysia portal page instead; the mirror stays
        # only as our archived text copy. G3 enforces this.
        import re as _re

        act_no = _re.search(r"\(Act\s+(A?\d+)\)", act_name, _re.I)
        source_url = (f"https://lom.agc.gov.my/act-detail.php?act={act_no.group(1)}"
                      if act_no else url)
        try:
            units = extract_act_pdf(file, economy="Malaysia", act_name=act_name,
                                    act_ref=Path(file).stem.replace("seed_", ""),
                                    source_url=source_url, ocr_engine=ocr)
        except Exception as error:  # noqa: BLE001 — one bad PDF must not kill the build
            print(f"  FAILED {act_name[:50]}: {error}")
            continue
        for unit in units:
            unit.metadata["archived_copy"] = file
            unit.metadata["access_date"] = entry.get("access_date")
            unit.metadata["inventory_url"] = url  # what ESCAP cited (audit trail)
        for st in stores:
            if hasattr(st, "upsert_rule_units"):
                st.upsert_rule_units(units)
            else:
                for unit in units:
                    st.upsert_rule_unit(unit)
        if units:
            loaded_acts += 1
            total += len(units)
            print(f"  {act_name[:58]:58s} -> {len(units):4d} units")

    hits = stores[0].search_provisions("transfer personal data outside Malaysia",
                                   economy="Malaysia", limit=3)
    top = hits[0]["props"].get("article_section") if hits else None
    print(f"\nMY corpus: {loaded_acts} acts, {total} rule units "
          f"(html seeds skipped: {skipped_html}) | search smoke top: {top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
