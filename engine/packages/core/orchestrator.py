"""ClauseChain pipeline orchestrator — the real P1 pipeline (SG × Pillar 6 first).

Stages: jurisdiction pack -> corpus (acquire+parse+graph-load, cached) ->
per-indicator broad-recall retrieval -> LLM screen (bulk) -> LLM mapping (high)
-> deterministic gates G1/G3/G4 -> NEW/KNOWN diff -> MappedFinding rows.
Indicators with no surviving evidence emit an explicit "no provision found" row
citing the governing law (never blank — 15-Jun rule).
"""
from __future__ import annotations

import time
from pathlib import Path

import yaml

from packages.core.schemas import GateResult, MappedFinding, RunEnvelope

ECONOMY_NAMES = {"SG": "Singapore", "MY": "Malaysia", "AU": "Australia"}
CODE_BY_NAME = {name.upper(): code for code, name in ECONOMY_NAMES.items()}
ENGINE_ROOT = Path(__file__).resolve().parents[2]

def _pack_corpus_acts(pack: dict) -> list[tuple[str, str | None]]:
    acts = [(a["ref"], a.get("number")) for a in pack.get("corpus_acts", [])]
    return acts or [("PDPA2012", "No. 26 of 2012")]


def _load_yaml(rel_path: str) -> dict:
    return yaml.safe_load((ENGINE_ROOT / rel_path).read_text(encoding="utf-8"))


def _whitelist(pack: dict) -> set[str]:
    domains = {s["domain"].lower() for s in pack.get("official_sources", [])}
    mined = pack.get("whitelist_source")
    if mined and (ENGINE_ROOT / mined).is_file():
        import json

        data = json.loads((ENGINE_ROOT / mined).read_text())
        for economy_block in data.get("economies", {}).values():
            domains.update(d.lower() for d in economy_block.get("official_whitelist", {}))
    return domains


def _ensure_corpus(store, pack: dict, economy: str) -> list[dict]:
    """Return the economy's provision corpus, auto-building it for SG (whose
    connector is fully automatic). MY/AU corpora are built by their build
    scripts (seeds-driven PDF/HTML paths); an empty corpus raises with the
    command to run."""
    from packages.retrieval.hybrid import load_corpus

    corpus = load_corpus(store, economy)
    if corpus:
        return corpus
    if pack.get("connector") == "sg_sso":
        from packages.connectors.sg_sso import acquire_act
        from packages.core.rule_units import build_rule_units
        from packages.extractors.html_sso import parse_sso_act

        for act_ref, number in _pack_corpus_acts(pack):
            manifest = acquire_act(act_ref)
            doc = parse_sso_act(Path(manifest["html_path"]).read_text(encoding="utf-8"),
                                manifest["url"])
            units = build_rule_units(doc, economy=economy, act_ref=act_ref,
                                     law_number_ref=number)
            for unit in units:
                unit.metadata["archived_copy"] = manifest["html_path"]
                unit.metadata["access_date"] = manifest["access_date"]
            if hasattr(store, "upsert_rule_units"):
                store.upsert_rule_units(units)
            else:
                for unit in units:
                    store.upsert_rule_unit(unit)
        return load_corpus(store, economy)
    # MY/AU: auto-chain the corpus build (fresh-clone contract — one command, no
    # manual steps). The build scripts fetch seeds themselves when missing.
    import subprocess
    import sys as _sys

    script = ENGINE_ROOT / f"scripts/build_{economy[:2].lower()}_corpus.py"
    if script.is_file():
        print(f"[corpus] {economy} corpus empty — building via {script.name} (first run only)")
        result = subprocess.run([_sys.executable, str(script)], cwd=ENGINE_ROOT)
        if result.returncode == 0:
            corpus = load_corpus(store, economy)
            if corpus:
                return corpus
    raise RuntimeError(
        f"No corpus loaded for {economy}. Build it manually: "
        f".venv/bin/python scripts/build_{economy[:2].lower()}_corpus.py"
    )


def _absence_row(economy: str, indicator_id: str, governing_law: str,
                 source_url: str, model_version: str) -> MappedFinding:
    return MappedFinding(
        economy=economy,
        law_name=governing_law,
        indicator_id=indicator_id,
        article_section="n/a",
        discovery_tag="KNOWN",
        location_reference="n/a",
        verbatim_snippet="No provision found",
        mapping_rationale=(
            f"No qualifying provision found for {indicator_id} after a full-corpus sweep. "
            "The general governing law is cited as the reference basis (score-0 pattern)."
        ),
        source_url=source_url,
        confidence=0.6,
        notes="Absence row: recorded so the indicator is never blank (15-Jun rule); "
              "score 0 — general governing law cited as reference basis.",
        coverage="Horizontal",
        status="in_force",
        model_version=model_version,
    )


def _stub_envelope(code: str, economy: str, pillar: int, provider_profile: str) -> RunEnvelope:
    """Deterministic offline envelope: schema/contract tests + keyless sandboxes (no network, no LLM)."""
    finding = MappedFinding(
        economy=economy,
        law_name="Personal Data Protection Act 2012",
        law_number_ref="No. 26 of 2012",
        last_amended="2020",
        indicator_id=f"P{pillar}-I4" if pillar == 6 else f"P{pillar}-I1",
        article_section="s. 26(1)",
        discovery_tag="KNOWN",
        location_reference="#pr26-",
        verbatim_snippet=(
            "An organisation must not transfer any personal data to a country or territory "
            "outside Singapore except in accordance with requirements prescribed under this Act"
        ),
        mapping_rationale="Stub row (CLAUSECHAIN_PIPELINE=stub): proves the export contract offline.",
        source_url="https://sso.agc.gov.sg/Act/PDPA2012#pr26-",
        confidence=0.99,
        notes="Offline stub mode — no live crawling or LLM calls.",
        coverage="Horizontal",
        status="in_force",
        model_version="stub",
    )
    return RunEnvelope(
        run_id=f"stub-{code.lower()}-p{pillar}",
        country=code,
        pillar=pillar,
        provider_profile=provider_profile,
        findings=[finding],
        gates=[GateResult(gate_id="G0", status="PASS", reason="stub mode")],
        warnings=["CLAUSECHAIN_PIPELINE=stub: deterministic offline output."],
        metadata={"graph_required": False, "live_llm_calls": False, "live_ocr_calls": False},
    )


def run(country: str, pillar: int, provider_profile: str = "hybrid_accuracy") -> RunEnvelope:
    import os as _os

    raw0 = country.strip().upper()
    code0 = CODE_BY_NAME.get(raw0, raw0)
    if _os.getenv("CLAUSECHAIN_PIPELINE", "").lower() == "stub":
        return _stub_envelope(code0, ECONOMY_NAMES.get(code0, country.strip()), pillar, provider_profile)

    from packages.discovery.diff import KnownIndex
    from packages.graph.store import get_graph_store
    from packages.providers.model_router import resolve_embedding, resolve_llm
    from packages.rdtii.mapper import SCREEN_CAP_PER_INDICATOR, map_candidate, screen_candidates
    from packages.retrieval.hybrid import EmbeddingCache, retrieve_for_indicator
    from packages.verifier.gates import run_gates

    started = time.time()
    raw = country.strip().upper()
    code = CODE_BY_NAME.get(raw, raw)
    economy = ECONOMY_NAMES.get(code, country.strip())
    if code not in ECONOMY_NAMES:
        raise ValueError(f"Unknown Round-1 economy: {country!r} (SG/MY/AU)")

    pack = _load_yaml(f"configs/jurisdictions/{code.lower()}.yaml")
    rubric = _load_yaml(f"configs/rdtii/pillar_{pillar}.yaml")
    whitelist = _whitelist(pack)
    store = get_graph_store()
    corpus = _ensure_corpus(store, pack, economy)

    llm_bulk = resolve_llm(provider_profile, tier="bulk")
    llm_high = resolve_llm(provider_profile, tier="high_reasoning")
    embedder = resolve_embedding(provider_profile)
    cache = EmbeddingCache(embedder, f"data/cache/embeddings_{code.lower()}.json")
    known = KnownIndex()
    model_version = f"{getattr(llm_high.primary, 'model', 'llm')}+{getattr(embedder, 'model', 'emb')}"

    findings: list[MappedFinding] = []
    gates_out: list[GateResult] = []
    warnings: list[str] = []
    stats = {"candidates": 0, "screened_in": 0, "mapped": 0, "gate_rejected": 0}

    for indicator_id, cfg in rubric.get("indicators", {}).items():
        if cfg.get("regulatory") is False:
            continue  # 6.5: non-regulatory — engine does not extract
        candidates = retrieve_for_indicator(store, cache, corpus, indicator_id, cfg, economy)
        # KNOWN-RECALL INJECTION (reviewer, 9 Jul): every master-known (law+section)
        # for this economy must reach the mapper regardless of retrieval rank. Missing
        # from the corpus entirely -> loud warning (a recall hole to fix, never silent).
        have_ids = {c.provision_id for c in candidates}
        from packages.discovery.diff import laws_match as _lm, section_base as _sb
        known_rows = [r for r in known._by_economy.get(economy, [])
                      if str(r.get("pillar")) == str(pillar)]
        for krow in known_rows:
            for ref in krow.get("articles", []):
                kbase = _sb(ref)
                if not kbase:
                    continue
                matches = [c for c in corpus
                           if any(_lm(a, c["props"].get("law_name", "")) for a in krow.get("acts_norm", []))
                           and _sb(c["props"].get("article_section", "")) == kbase]
                if not matches:
                    hole = (f"RECALL HOLE: master-known {krow.get('act','')[:40]} "
                            f"{ref} not in the {economy} corpus")
                    if hole not in warnings:
                        warnings.append(hole)
                    continue
                for m in matches:
                    if m["provision_id"] not in have_ids:
                        from packages.retrieval.hybrid import Candidate as _Cand
                        candidates.append(_Cand(m["provision_id"], m["text"], m["props"],
                                                matched_queries=["known-injection"]))
                        have_ids.add(m["provision_id"])
        stats["candidates"] += len(candidates)
        if len(candidates) > SCREEN_CAP_PER_INDICATOR:
            warnings.append(
                f"{indicator_id}: screened top {SCREEN_CAP_PER_INDICATOR} of "
                f"{len(candidates)} retrieval candidates (cap logged, not silent)"
            )
        # KNOWN-anchor bypass: candidates matching a (law + section) that the master
        # dataset itself records are human-confirmed terrain — they go straight to the
        # mapper and must never be screen-dropped (reproducing KNOWN proves recall).
        from packages.discovery.diff import section_base

        anchors, rest = [], []
        for candidate in candidates:
            props = candidate.props
            sections = known.known_sections(economy, props.get("law_name", ""))
            base = section_base(props.get("article_section", ""))
            if sections is not None and base and base in sections:
                anchors.append(candidate)
            else:
                rest.append(candidate)
        survivors = anchors + screen_candidates(llm_bulk, indicator_id, cfg, rest)
        stats["screened_in"] += len(survivors)
        stats["known_anchors"] = stats.get("known_anchors", 0) + len(anchors)

        indicator_rows = 0
        for candidate in survivors:
            decision = map_candidate(llm_high, indicator_id, cfg, candidate)
            if not decision.applies:
                continue
            props = candidate.props
            gate_results, ok = run_gates(
                snippet=decision.verbatim_snippet,
                source_text=candidate.text,
                source_url=props.get("source_url", ""),
                whitelist_domains=whitelist,
                current_as_at=props.get("current_as_at")
                or (props.get("props") or {}).get("current_as_at"),
            )
            from packages.verifier.gates import g7_indicator_fit

            fit = g7_indicator_fit(indicator_id, decision.verbatim_snippet,
                                   candidate.text, props.get("law_name", ""))
            gate_results.append(fit)
            ok = ok and fit.status != "FAIL"
            for g in gate_results:
                g.evidence_reference = f"{indicator_id} {props.get('article_section', '')}"
            gates_out.extend(gate_results)
            if not ok:
                stats["gate_rejected"] += 1
                warnings.append(
                    f"REJECTED by gates: {indicator_id} {props.get('article_section')} "
                    f"({[g.gate_id for g in gate_results if g.status == 'FAIL']})"
                )
                continue
            tag, why = known.tag(economy, props.get("law_name", ""),
                                 props.get("article_section", ""))
            findings.append(
                MappedFinding(
                    economy=economy,
                    law_name=props.get("law_name", ""),
                    law_number_ref=props.get("law_number_ref"),
                    last_amended=props.get("last_amended"),
                    indicator_id=indicator_id,
                    article_section=props.get("article_section", ""),
                    discovery_tag=tag,
                    location_reference=props.get("location_reference", "n/a") or "n/a",
                    verbatim_snippet=decision.verbatim_snippet,
                    mapping_rationale=decision.rationale[:300],
                    source_url=props.get("source_url", ""),
                    confidence=decision.confidence,
                    notes=f"Discovery: {why}. Modality: {decision.modality or 'n/a'}; "
                          f"exceptions: {'; '.join(decision.exceptions) or 'none'}",
                    coverage=(decision.coverage + (f" ({decision.sector})" if decision.sector else "")),
                    status="in_force",
                    model_version=model_version,
                )
            )
            indicator_rows += 1
            stats["mapped"] += 1

        if indicator_rows == 0 and not any(f.indicator_id == indicator_id for f in findings):
            anchor_law = corpus[0]["props"].get("law_name", "Personal Data Protection Act 2012") if corpus else "Personal Data Protection Act 2012"
            anchor_url = corpus[0]["props"].get("source_url", "https://sso.agc.gov.sg/Act/PDPA2012") if corpus else "https://sso.agc.gov.sg/Act/PDPA2012"
            findings.append(_absence_row(economy, indicator_id, anchor_law,
                                         anchor_url.split("#")[0], model_version))

    # Post-pass: deterministic 6.1-vs-6.4 disambiguation (drops false ban rows),
    # then guarantee every regulatory indicator still has at least one row.
    if pillar == 6:
        from packages.verifier.gates import g7_ban_vs_conditional

        findings, g7_gates = g7_ban_vs_conditional(findings)
        gates_out.extend(g7_gates)
    for indicator_id, cfg in rubric.get("indicators", {}).items():
        if cfg.get("regulatory") is False:
            continue
        if not any(f.indicator_id == indicator_id for f in findings):
            anchor_law = corpus[0]["props"].get("law_name", "Personal Data Protection Act 2012") if corpus else "Personal Data Protection Act 2012"
            anchor_url = (corpus[0]["props"].get("source_url", "https://sso.agc.gov.sg/Act/PDPA2012") or "").split("#")[0] if corpus else "https://sso.agc.gov.sg/Act/PDPA2012"
            findings.append(_absence_row(economy, indicator_id, anchor_law, anchor_url, model_version))
    findings.sort(key=lambda f: f.indicator_id)

    from packages.providers import cost

    run_id = f"run-{code.lower()}-p{pillar}-{int(started)}"
    cost_entry = cost.append_log(run_id, {"economy": economy, "pillar": pillar,
                                          "elapsed_seconds": round(time.time() - started, 1)})
    return RunEnvelope(
        run_id=run_id,
        country=code,
        pillar=pillar,
        provider_profile=provider_profile,
        findings=findings,
        gates=gates_out,
        warnings=warnings,
        metadata={
            "corpus_provisions": len(corpus),
            "pipeline_stats": stats,
            "elapsed_seconds": round(time.time() - started, 1),
            "live_llm_calls": True,
            "graph_backend": type(store).__name__,
            "cost_report": cost_entry,
        },
    )
