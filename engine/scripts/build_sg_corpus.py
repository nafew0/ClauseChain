"""Build the SG corpus: acquire acts from SSO, parse, and load RuleUnits into the graph.

Usage (from engine/):
    .venv/bin/python scripts/build_sg_corpus.py                  # default acts
    GRAPH_BACKEND=sqlite .venv/bin/python scripts/build_sg_corpus.py

Loads into the GraphStore selected by GRAPH_BACKEND (.env) and ALWAYS also into
SQLite (Path A parity), so both backends stay in sync.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

import os  # noqa: E402

from packages.connectors.sg_sso import acquire_act  # noqa: E402
from packages.core.rule_units import build_rule_units  # noqa: E402
from packages.extractors.html_sso import parse_sso_act  # noqa: E402
from packages.graph.store import get_graph_store  # noqa: E402

import yaml  # noqa: E402


def corpus_acts() -> list[tuple[str, str | None]]:
    pack = yaml.safe_load((Path(__file__).resolve().parents[1] /
                           "configs/jurisdictions/sg.yaml").read_text())
    return [(a["ref"], a.get("number")) for a in pack.get("corpus_acts", [])]


def load_act(act_ref: str, law_number_ref: str | None, stores) -> int:
    manifest = acquire_act(act_ref)
    html = Path(manifest["html_path"]).read_text(encoding="utf-8")
    doc = parse_sso_act(html, manifest["url"])
    units = build_rule_units(doc, economy="Singapore", act_ref=act_ref,
                             law_number_ref=law_number_ref)
    for unit in units:
        unit.metadata["archived_copy"] = manifest["html_path"]
        unit.metadata["access_date"] = manifest["access_date"]
        unit.metadata["content_sha256"] = manifest["sha256"]
    for store in stores:
        if hasattr(store, "upsert_rule_units"):   # batched (Neo4j UNWIND)
            store.upsert_rule_units(units)
        else:
            for unit in units:
                store.upsert_rule_unit(unit)
    print(f"{act_ref}: {doc.law_name!r} | current as at {doc.current_as_at} | "
          f"{len(doc.sections)} sections -> {len(units)} rule units")
    return len(units)


def main() -> int:
    backend = (os.getenv("GRAPH_BACKEND") or "sqlite").lower()
    primary = get_graph_store()
    stores = [primary]
    if backend != "sqlite":  # keep the Path A SQLite store in sync too
        from packages.graph.sqlite_graph import SqliteGraphStore

        stores.append(SqliteGraphStore())
    print(f"graph backend: {backend} (+ sqlite parity)" if len(stores) > 1
          else "graph backend: sqlite")

    total = 0
    for act_ref, number in corpus_acts():
        total += load_act(act_ref, number, stores)

    for store in stores:
        hits = store.search_provisions("transfer personal data outside Singapore",
                                       economy="Singapore", limit=5)
        top = hits[0] if hits else None
        print(f"{type(store).__name__}: search smoke -> {len(hits)} hits; "
              f"top: {top['props'].get('article_section') if top and top.get('props') else (top['provision_id'] if top else None)}")
    print(f"TOTAL rule units: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
