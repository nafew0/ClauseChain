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
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

import os  # noqa: E402

import httpx  # noqa: E402

from packages.discovery.diff import normalize_law  # noqa: E402
from packages.core.evidence import source_artifact_from_file  # noqa: E402
from packages.core.legal_controls import evidence_eligibility, resolve_status  # noqa: E402
from packages.extractors.pdf_act import extract_act_pdf  # noqa: E402
from packages.extractors.pdf import extract_pdf, materialize_page_evidence  # noqa: E402
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

    # Multi-volume compilations (e.g. TIA Act = 2 PDF volumes): volume list from
    # the Documents set; download route = .../text/original/pdf/{vol}.
    volumes = [0]
    docs = client.get(f"{API}/Documents?$filter=registerId eq '{reg}'")
    if docs.status_code == 200:
        pdf_vols = sorted({d.get("volumeNumber", 0) for d in docs.json().get("value", [])
                           if d.get("format") == "Pdf"})
        if pdf_vols:
            volumes = pdf_vols

    pdf_paths: list[tuple[int, Path]] = []
    for vol in volumes:
        suffix = f"/{vol}" if vol else ""
        pdf_path = out_dir / (f"{reg}_vol{vol}.pdf" if vol else f"{reg}.pdf")
        if not pdf_path.is_file():
            time.sleep(2.0)
            pdf = client.get(f"https://www.legislation.gov.au/{tid}/{date}/{date}"
                             f"/text/original/pdf{suffix}")
            if pdf.status_code != 200 or pdf.content[:5] != b"%PDF-":
                continue
            pdf_path.write_bytes(pdf.content)
        pdf_paths.append((vol, pdf_path))
    if not pdf_paths:
        return None
    epub_path = out_dir / f"{reg}.epub"
    if not epub_path.is_file():
        time.sleep(2.0)
        epub = client.get(f"https://www.legislation.gov.au/{tid}/{date}/{date}/text/original/epub")
        if epub.status_code == 200 and epub.content[:2] == b"PK":
            epub_path.write_bytes(epub.content)
    return {"title_id": tid, "register_id": reg, "compilation_date": date,
            "epub": str(epub_path) if epub_path.is_file() else None,
            "name": v.get("name"), "compilation_no": v.get("compilationNumber"),
            "pdfs": [(vol, str(p)) for vol, p in pdf_paths],
            "source_url": f"https://www.legislation.gov.au/{tid}/latest"}


def validate_compilation_bundle(meta: dict) -> str:
    register = str(meta.get("register_id") or "")
    date = str(meta.get("compilation_date") or "")
    if not register or not date:
        raise ValueError("AU bundle lacks register ID or compilation date")
    paths = [Path(p) for _, p in meta.get("pdfs", [])]
    if meta.get("epub"):
        paths.append(Path(meta["epub"]))
    if not paths or any(not p.name.startswith(register) for p in paths):
        raise ValueError("AU EPUB/PDF filenames do not share the selected register ID")
    return f"au-compilation:{register}:{date}"


def main() -> int:
    fetch_all = "--all" in sys.argv
    manifest_path = Path("data/raw/au/seeds_manifest.json")
    if not manifest_path.is_file():  # fresh clone: fetch seed landing pages first
        from packages.connectors.seeds_fetch import fetch_seeds

        print("[seeds] no AU manifest — fetching P6/P7 seeds (first run only)")
        fetch_seeds("Australia", ("P6", "P7"))
    manifest = json.loads(manifest_path.read_text())
    gold = gold_act_norms()
    out_dir = Path("data/raw/au")

    from packages.graph.store import get_graph_store

    stores = [get_graph_store()]
    if (os.getenv("GRAPH_BACKEND") or "sqlite").lower() != "sqlite":
        stores.append(SqliteGraphStore())
    print("graph:", ", ".join(type(s).__name__ for s in stores))
    for st in stores:
        if hasattr(st, "purge_ineligible_provisions"):
            st.purge_ineligible_provisions("Australia")

    done: set[str] = set()
    generation = datetime.now(timezone.utc).isoformat()
    build_complete = True
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
                build_complete = False
                continue
            bundle_id = validate_compilation_bundle(meta)
            status = resolve_status(
                fact_url=meta["source_url"],
                fact_text=(f"Federal Register of Legislation latest in-force compilation "
                           f"{meta['register_id']} commencing {meta['compilation_date']}"),
                current_as_at=meta["compilation_date"], explicit_status="in_force",
            )
            eligible, reason = evidence_eligibility(meta["name"] or act_name, "act", status.status)
            if not eligible:
                for st in stores:
                    if hasattr(st, "add_discovery_lead"):
                        st.add_discovery_lead(f"au:{tid}", reason or "INELIGIBLE",
                                              {"name": meta["name"] or act_name, "url": url})
                print(f"  INELIGIBLE {act_name[:52]}: {reason}")
                continue
            artifacts, evidence_by_index = [], {}
            for pdf_index, (vol, pdf_path) in enumerate(meta["pdfs"], start=1):
                suffix = f"/{vol}" if vol else ""
                exact_pdf_url = (f"https://www.legislation.gov.au/{tid}/{meta['compilation_date']}/"
                                 f"{meta['compilation_date']}/text/original/pdf{suffix}")
                pdf_artifact = source_artifact_from_file(
                    pdf_path, original_url=url, retrieved_url=exact_pdf_url,
                    source_type="act", status_evidence=status,
                    accessed_at=datetime.now(timezone.utc), register_id=meta["register_id"],
                    version_id=f"{meta['compilation_date']}:vol{vol or 1}",
                    official_domains={"legislation.gov.au"}, expected_mime="application/pdf",
                    metadata={"compilation_bundle_id": bundle_id,
                              "authority_role": "quotation_authority"},
                )
                native_pages = extract_pdf(pdf_path)
                page_artifacts, text_spans = materialize_page_evidence(native_pages, pdf_artifact.id)
                artifacts.append(pdf_artifact)
                evidence_by_index[pdf_index] = (page_artifacts, text_spans)
            structure_artifact = None
            if meta.get("epub"):
                exact_epub_url = (f"https://www.legislation.gov.au/{tid}/{meta['compilation_date']}/"
                                  f"{meta['compilation_date']}/text/original/epub")
                structure_artifact = source_artifact_from_file(
                    meta["epub"], original_url=url, retrieved_url=exact_epub_url,
                    source_type="structure_oracle", status_evidence=status,
                    accessed_at=datetime.now(timezone.utc), register_id=meta["register_id"],
                    version_id=meta["compilation_date"], official_domains={"legislation.gov.au"},
                    expected_mime="application/epub+zip",
                    metadata={"compilation_bundle_id": bundle_id,
                              "authority_role": "structure_oracle"},
                )
            units = []
            try:
                if meta.get("epub"):
                    # P3.5 R3/R4-lite: XHTML structure oracle + authorised-PDF alignment
                    from packages.extractors.epub_act import parse_epub_act
                    from packages.extractors.pdf_align import align_to_pdf

                    units = parse_epub_act(Path(meta["epub"]).read_bytes(), "Australia",
                                           meta["name"] or act_name, meta["register_id"],
                                           meta["source_url"])
                    aligned, n_units = align_to_pdf(units, [p for _, p in meta["pdfs"]])
                    print(f"    xhtml oracle: {n_units} units, {aligned} PDF-aligned")
                if not units:  # fallback: regex parse of the authorised PDF
                    for vol, pdf in meta["pdfs"]:
                        vol_units = extract_act_pdf(pdf, economy="Australia",
                                                    act_name=meta["name"] or act_name,
                                                    act_ref=f"{meta['register_id']}v{vol}" if vol else meta["register_id"],
                                                    source_url=meta["source_url"])
                        if vol:
                            for u in vol_units:
                                u.location_reference = f"vol {vol}, {u.location_reference}"
                        units.extend(vol_units)
            except Exception as error:  # noqa: BLE001
                print(f"  FAILED {act_name[:50]}: {error}")
                build_complete = False
                continue
            for unit in units:
                import re as _re3
                vm = _re3.search(r"vol\s+(\d+)", unit.location_reference, _re3.I)
                artifact_index = int(vm.group(1)) if vm else 1
                artifact = artifacts[min(max(artifact_index, 1), len(artifacts)) - 1]
                page_artifacts, text_spans = evidence_by_index[artifact_index]
                unit.last_amended = meta["compilation_date"][:7]
                unit.metadata["archived_copy"] = artifact.local_path
                unit.metadata["compilation"] = meta["compilation_no"]
                unit.metadata["compilation_bundle_id"] = bundle_id
                unit.metadata["structure_artifact_id"] = (structure_artifact.id
                                                          if structure_artifact else None)
                unit.metadata["current_as_at"] = meta["compilation_date"]
                unit.metadata["content_sha256"] = artifact.sha256
                unit.metadata["access_date"] = artifact.accessed_at.date().isoformat()
                unit.metadata["legal_status"] = status.status
                unit.metadata["evidence_eligible"] = True
                unit.metadata["build_generation"] = generation
                unit.metadata["status_evidence"] = status.model_dump(mode="json")
                unit.source_artifact_id = artifact.id
                unit.raw_context = unit.raw_context or unit.text
                pm = _re3.search(r"page\s+(\d+)", unit.location_reference, _re3.I)
                start_page = int(pm.group(1)) if pm else None
                end_page = int(unit.metadata.get("alignment_end_page") or start_page or 0)
                unit.linked_span_ids = ([s.id for s in text_spans
                                         if start_page <= s.page_number <= end_page]
                                        if start_page else [])
            for st in stores:
                for artifact in artifacts:
                    if hasattr(st, "upsert_source_artifact"):
                        st.upsert_source_artifact(artifact)
                if structure_artifact and hasattr(st, "upsert_source_artifact"):
                    st.upsert_source_artifact(structure_artifact)
                if hasattr(st, "upsert_page_artifacts"):
                    for page_artifacts, text_spans in evidence_by_index.values():
                        st.upsert_page_artifacts(page_artifacts)
                        st.upsert_text_spans(text_spans)
                if hasattr(st, "upsert_rule_units"):
                    st.upsert_rule_units(units)
                else:
                    for unit in units:
                        st.upsert_rule_unit(unit)
            acts += 1
            total += len(units)
            print(f"  {(meta['name'] or act_name)[:52]:52s} comp#{meta['compilation_no']:>4s} -> {len(units):5d} units")

    if build_complete:
        for st in stores:
            if hasattr(st, "prune_economy_generation"):
                st.prune_economy_generation("Australia", generation)
    else:
        print("AU prune skipped: at least one eligible source failed; prior generation retained")

    hits = stores[0].search_provisions("interference with the privacy of an individual",
                                       economy="Australia", limit=3)
    top = hits[0]["props"].get("article_section") if hits else None
    print(f"\nAU corpus: {acts} acts, {total} units | smoke top: {top}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
