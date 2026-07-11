"""Build the Malaysia corpus from fetched seed documents (PDF path).

Selects seed entries that are P6/P7-tagged OR whose act matches a gold-cited
act, extracts RuleUnits via the generic PDF-act extractor (scanned files go to
the OCR VM), and loads the graph store (SQLite for now — Neo4j VM offline).

Usage: .venv/bin/python scripts/build_my_corpus.py [--all]
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

from packages.discovery.diff import normalize_law  # noqa: E402
from packages.core.evidence import source_artifact_from_file  # noqa: E402
from packages.core.legal_controls import evidence_eligibility, resolve_status  # noqa: E402
from packages.extractors.pdf import extract_pdf, materialize_page_evidence  # noqa: E402
from packages.extractors.pdf_act import parse_act_text  # noqa: E402
from packages.graph.sqlite_graph import SqliteGraphStore  # noqa: E402
from packages.providers.model_router import resolve_ocr  # noqa: E402


def gold_act_norms() -> set[str]:
    rows = json.loads(Path("data/known_index.json").read_text())["economies"]["Malaysia"]
    return {a for r in rows if r.get("pillar") in ("6", "7") for a in r.get("acts_norm", [])}


def main() -> int:
    import os
    import yaml

    fetch_all = "--all" in sys.argv
    manifest_path = Path("data/raw/my/seeds_manifest.json")
    if not manifest_path.is_file():  # fresh clone: fetch the seed documents first
        from packages.connectors.seeds_fetch import fetch_seeds

        print("[seeds] no MY manifest — fetching P6/P7 seed documents (first run only)")
        fetch_seeds("Malaysia", ("P6", "P7"))
    manifest = json.loads(manifest_path.read_text())
    pack = yaml.safe_load(Path("configs/jurisdictions/my.yaml").read_text())
    status_assertions = pack.get("status_assertions") or {}
    official_domains = {s["domain"] for s in pack.get("official_sources", [])}
    gold = gold_act_norms()
    from packages.graph.store import get_graph_store

    primary = get_graph_store()
    stores = [primary]
    if (os.getenv("GRAPH_BACKEND") or "sqlite").lower() != "sqlite":
        stores.append(SqliteGraphStore())  # Path A parity
    print("graph:", ", ".join(type(s).__name__ for s in stores))
    for st in stores:
        if hasattr(st, "purge_ineligible_provisions"):
            removed = st.purge_ineligible_provisions("Malaysia")
            if removed:
                print(f"quarantined {removed} stale/ineligible Malaysia provisions")
    ocr = resolve_ocr("hybrid_accuracy")

    total, loaded_acts, skipped_html = 0, 0, 0
    generation = datetime.now(timezone.utc).isoformat()
    build_complete = True
    for url, entry in manifest.items():
        if entry.get("status") != "ok":
            continue
        act_name = (entry.get("act") or "").strip()
        # A1 (P3.5): seeds mislabel the ENACTED PDP (Amendment) Act A1727 2024 as a
        # "Bill" — manually confirmed enacted; rename so Bill-gates don't reject it
        # and so it never anchors rows under a Bill name.
        if "Bill" in act_name and "A1727" in act_name:
            act_name = "Personal Data Protection (Amendment) Act 2024 (Act A1727)"
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
                build_complete = False
                continue
            pdf_file = Path(file).with_suffix(".resolved.pdf")
            if not pdf_file.is_file():
                _time2.sleep(2.0)
                resp = _httpx.get(resolved, follow_redirects=True, timeout=120,
                                  headers={"User-Agent": "Mozilla/5.0 ClauseChain-research/0.1"})
                if resp.status_code != 200 or resp.content[:5] != b"%PDF-":
                    skipped_html += 1
                    build_complete = False
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
        assertion_key = (act_no.group(1).upper() if act_no else act_name)
        assertion = status_assertions.get(assertion_key) or status_assertions.get(act_name)
        if assertion and assertion.get("quotation_url"):
            quotation_url = assertion["quotation_url"]
            official_file = Path("data/raw/my") / f"official_{assertion_key}.pdf"
            if not official_file.is_file():
                import httpx as _httpx3
                response = _httpx3.get(quotation_url, follow_redirects=True, timeout=180,
                    headers={"User-Agent": "Mozilla/5.0 ClauseChain-research/0.1"})
                if response.status_code != 200 or response.content[:5] != b"%PDF-":
                    print(f"  FAILED official quotation acquisition {act_name[:45]}")
                    build_complete = False
                    continue
                official_file.write_bytes(response.content)
            file, url, source_url = str(official_file), quotation_url, quotation_url
        status = resolve_status(
            fact_url=(assertion or {}).get("fact_url", source_url),
            fact_text=(assertion or {}).get(
                "fact_text", "Official source archived; legal currentness not yet asserted"),
            current_as_at=(assertion or {}).get("current_as_at"),
            effective_date=(assertion or {}).get("effective_date"),
            explicit_status=(assertion or {}).get("status"),
        )
        eligible, reason = evidence_eligibility(act_name, "act", status.status)
        if not eligible:
            for st in stores:
                if hasattr(st, "add_discovery_lead"):
                    st.add_discovery_lead(f"my:{Path(file).stem}", reason or "INELIGIBLE",
                                          {"name": act_name, "url": url, "file": file})
            print(f"  INELIGIBLE {act_name[:52]}: {reason}")
            continue
        raw_access = str(entry.get("access_date") or "")
        try:
            accessed = datetime.fromisoformat(raw_access.replace("Z", "+00:00"))
        except ValueError:
            accessed = datetime.now(timezone.utc)
        artifact = source_artifact_from_file(
            file, original_url=url, retrieved_url=url, source_type="act",
            status_evidence=status, accessed_at=accessed,
            register_id=act_no.group(1) if act_no else None,
            official_domains=official_domains,
            expected_mime="application/pdf",
        )
        if not artifact.official:
            for st in stores:
                if hasattr(st, "add_discovery_lead"):
                    st.add_discovery_lead(f"my:{Path(file).stem}", "NON_OFFICIAL_ARCHIVE",
                                          {"name": act_name, "url": url, "file": file})
            print(f"  INELIGIBLE {act_name[:52]}: NON_OFFICIAL_ARCHIVE")
            continue
        try:
            pages = extract_pdf(file, ocr_engine=ocr)
            page_artifacts, text_spans = materialize_page_evidence(pages, artifact.id)
            units = parse_act_text(pages, economy="Malaysia", act_name=act_name,
                                   act_ref=Path(file).stem.replace("seed_", ""),
                                   source_url=artifact.retrieved_url)
        except Exception as error:  # noqa: BLE001 — one bad PDF must not kill the build
            print(f"  FAILED {act_name[:50]}: {error}")
            build_complete = False
            continue
        for unit in units:
            unit.metadata["archived_copy"] = file
            unit.metadata["access_date"] = entry.get("access_date")
            unit.metadata["inventory_url"] = url  # what ESCAP cited (audit trail)
            unit.metadata["content_sha256"] = artifact.sha256
            unit.metadata["legal_status"] = status.status
            unit.metadata["evidence_eligible"] = eligible
            unit.metadata["build_generation"] = generation
            unit.metadata["status_evidence"] = status.model_dump(mode="json")
            unit.source_artifact_id = artifact.id
            unit.raw_context = unit.text
            try:
                page_no = int(unit.location_reference.rsplit(" ", 1)[-1])
                unit.linked_span_ids = [s.id for s in text_spans if s.page_number == page_no]
                unit.metadata["citation_span_boxes"] = [list(s.bbox) for s in text_spans
                    if s.page_number == page_no and s.text.strip() and s.text.strip() in unit.text]
                page_record = next((p for p in pages if p.page_number == page_no), None)
                unit.metadata["ocr_citation_disagreement"] = bool(
                    page_record and page_record.metadata.get("citation_token_disagreement"))
            except ValueError:
                unit.linked_span_ids = []
        for st in stores:
            if hasattr(st, "upsert_source_artifact"):
                st.upsert_source_artifact(artifact)
            if hasattr(st, "upsert_page_artifacts"):
                st.upsert_page_artifacts(page_artifacts)
                st.upsert_text_spans(text_spans)
            if hasattr(st, "upsert_rule_units"):
                st.upsert_rule_units(units)
            else:
                for unit in units:
                    st.upsert_rule_unit(unit)
        if units:
            loaded_acts += 1
            total += len(units)
            print(f"  {act_name[:58]:58s} -> {len(units):4d} units")

    if build_complete:
        for st in stores:
            if hasattr(st, "prune_economy_generation"):
                st.prune_economy_generation("Malaysia", generation)
    else:
        print("MY prune skipped: at least one eligible source failed; prior generation retained")

    hits = stores[0].search_provisions("transfer personal data outside Malaysia",
                                   economy="Malaysia", limit=3)
    top = hits[0]["props"].get("article_section") if hits else None
    print(f"\nMY corpus: {loaded_acts} acts, {total} rule units "
          f"(html seeds skipped: {skipped_html}) | search smoke top: {top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
