"""Build the Australia corpus from legislation.gov.au — fully reproducible, no browser.

Route (reverse-engineered 9 Jul, template verified with plain httpx):
  1. seed URL -> titleId (e.g. legislation.gov.au/C2004A03712)
  2. API: versions/find(titleId=...,asAtSpecification='latest') -> current
     compilation registerId + start date (this also feeds G4 currency)
  3. authorized PDF: /{titleId}/{start}/{start}/text/original/pdf
  4. generic PDF-act extractor -> RuleUnits -> graph stores

Usage: .venv/bin/python scripts/build_au_corpus.py [--all]
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

import os  # noqa: E402

import httpx  # noqa: E402

from packages.discovery.diff import normalize_law  # noqa: E402
from packages.extractors.pdf_act import extract_act_pdf  # noqa: E402
from packages.graph.sqlite_graph import SqliteGraphStore  # noqa: E402

H = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 ClauseChain-research/0.1")}
API = "https://api.prod.legislation.gov.au/v1"


def gold_act_norms() -> set[str]:
    rows = json.loads(Path("data/known_index.json").read_text())["economies"]["Australia"]
    return {a for r in rows if r.get("pillar") in ("6", "7") for a in r.get("acts_norm", [])}


def title_id(url: str) -> str | None:
    m = re.search(r"legislation\.gov\.au/([CF]\d{4}[A-Z]\d{5})", url)
    return m.group(1) if m else None


def acquire_au_act(client, tid: str, out_dir: Path) -> dict | None:
    r = client.get(f"{API}/versions/find(titleId='{tid}',asAtSpecification='latest')")
    if r.status_code != 200:
        return None
    v = r.json()
    date = (v.get("start") or "")[:10]
    reg = v.get("registerId")
    pdf_path = out_dir / f"{reg}.pdf"
    if not pdf_path.is_file():
        time.sleep(2.0)
        pdf = client.get(f"https://www.legislation.gov.au/{tid}/{date}/{date}/text/original/pdf")
        if pdf.status_code != 200 or pdf.content[:5] != b"%PDF-":
            return None
        pdf_path.write_bytes(pdf.content)
    return {"title_id": tid, "register_id": reg, "compilation_date": date,
            "name": v.get("name"), "compilation_no": v.get("compilationNumber"),
            "pdf": str(pdf_path),
            "source_url": f"https://www.legislation.gov.au/{tid}/latest"}


def main() -> int:
    fetch_all = "--all" in sys.argv
    manifest = json.loads(Path("data/raw/au/seeds_manifest.json").read_text())
    gold = gold_act_norms()
    out_dir = Path("data/raw/au")

    from packages.graph.store import get_graph_store

    stores = [get_graph_store()]
    if (os.getenv("GRAPH_BACKEND") or "sqlite").lower() != "sqlite":
        stores.append(SqliteGraphStore())
    print("graph:", ", ".join(type(s).__name__ for s in stores))

    done: set[str] = set()
    total = acts = 0
    with httpx.Client(headers=H, timeout=180, follow_redirects=True) as client:
        for url, entry in manifest.items():
            act_name = (entry.get("act") or "").strip()
            relevant = (str(entry.get("indicator_code", "")).startswith(("P6", "P7"))
                        or any(g in normalize_law(act_name) or normalize_law(act_name) in g
                               for g in gold))
            tid = title_id(url)
            if not tid or tid in done or not (relevant or fetch_all):
                continue
            done.add(tid)
            time.sleep(1.5)
            meta = acquire_au_act(client, tid, out_dir)
            if not meta:
                print(f"  SKIP {act_name[:56]} ({tid}) — version/pdf unavailable")
                continue
            try:
                units = extract_act_pdf(meta["pdf"], economy="Australia",
                                        act_name=meta["name"] or act_name,
                                        act_ref=meta["register_id"],
                                        source_url=meta["source_url"])
            except Exception as error:  # noqa: BLE001
                print(f"  FAILED {act_name[:50]}: {error}")
                continue
            for unit in units:
                unit.last_amended = meta["compilation_date"][:7]
                unit.metadata["archived_copy"] = meta["pdf"]
                unit.metadata["compilation"] = meta["compilation_no"]
                unit.metadata["current_as_at"] = meta["compilation_date"]
            for st in stores:
                if hasattr(st, "upsert_rule_units"):
                    st.upsert_rule_units(units)
                else:
                    for unit in units:
                        st.upsert_rule_unit(unit)
            acts += 1
            total += len(units)
            print(f"  {(meta['name'] or act_name)[:52]:52s} comp#{meta['compilation_no']:>4s} -> {len(units):5d} units")

    hits = stores[0].search_provisions("interference with the privacy of an individual",
                                       economy="Australia", limit=3)
    top = hits[0]["props"].get("article_section") if hits else None
    print(f"\nAU corpus: {acts} acts, {total} units | smoke top: {top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
