"""Sol-review blockers (19 Jul): the deep-research evidence must GENUINELY flow
through the engine. These tests pin each wiring point at the builder level:
treaty eligibility + scoping, grammar profiles used by real builders, manifest
reconciliation, SG subsidiary legislation, snippet-before-gates ordering, and
the recorded (not silent) retrieval union cap.
"""
from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from packages.core.legal_controls import evidence_eligibility
from packages.ingest.seed_profiles import seed_parse_profile
from packages.extractors.pdf_act import parse_act_text
from packages.verifier.gates import finalize_snippet, g1_span_exists, g5_whole_rule


class FakePage(SimpleNamespace):
    pass


def _pages(text: str) -> list:
    return [FakePage(page_number=1, text=text, confidence=1.0,
                     metadata={"extraction": "native_text"})]


# ---------------------------------------------------------------- eligibility
def test_declared_treaty_is_eligible_in_force():
    ok, reason = evidence_eligibility(
        "CPTPP Chapter 14 (Malaysia MITI text)", "treaty", "in_force")
    assert ok, reason


def test_undeclared_agreement_name_still_rejected():
    ok, reason = evidence_eligibility(
        "Some Trade Agreement Commentary", "act", "in_force")
    assert not ok and reason == "INTERNATIONAL_AGREEMENT"


def test_draft_treaty_still_rejected():
    ok, reason = evidence_eligibility("Draft CPTPP Bill", "treaty", "in_force")
    assert not ok  # bill/draft patterns still apply to declared treaties


def test_treaty_requires_in_force():
    ok, _ = evidence_eligibility("CPTPP Chapter 14", "treaty", "unknown")
    assert not ok


# ----------------------------------------------------------- grammar profiles
def test_treaty_profile_parses_dfat_style_chapter():
    profile = seed_parse_profile({"source_type": "treaty"})
    assert profile["citation_template"] == "Art. {label}"
    text = (
        "Article 14.11: Cross-Border Transfer of Information by Electronic Means\n"
        "1. The Parties recognise that each Party may have its own regulatory "
        "requirements concerning the transfer of information by electronic means.\n"
        "Article 14.13: Location of Computing Facilities\n"
        "1. No Party shall require a covered person to use or locate computing "
        "facilities in that Party's territory as a condition for conducting "
        "business in that territory.\n"
    )
    units = parse_act_text(_pages(text), economy="Australia",
                           act_name="CPTPP Chapter 14", act_ref="cptpp14",
                           source_url="https://example.gov.au/cptpp.pdf",
                           extra_section_patterns=profile["extra_section_patterns"],
                           citation_template=profile["citation_template"])
    cites = {u.article_section for u in units}
    assert any(c.startswith("Art. 14.11") for c in cites), cites
    assert any(c.startswith("Art. 14.13") for c in cites), cites


def test_malay_profile_parses_seksyen_headings():
    profile = seed_parse_profile({"source_type": "act"}, ["malay"])
    assert profile["citation_template"] == "s. {label}"
    text = (
        "Seksyen 12A. Pemprosesan data peribadi\n"
        "Tiada seorang pun boleh memproses data peribadi melainkan mengikut "
        "peruntukan Akta ini dan apa-apa syarat yang ditetapkan.\n"
        "Seksyen 13. Perlindungan data\n"
        "Pengguna data hendaklah mengambil langkah praktik untuk melindungi "
        "data peribadi daripada apa-apa kehilangan atau penyalahgunaan.\n"
    )
    units = parse_act_text(_pages(text), economy="Malaysia",
                           act_name="Akta Perlindungan Data Peribadi 2010",
                           act_ref="a709ms", source_url="https://example.gov.my/709.pdf",
                           extra_section_patterns=profile["extra_section_patterns"],
                           citation_template=profile["citation_template"])
    cites = {u.article_section for u in units}
    assert "s. 12A" in cites and "s. 13" in cites, cites


def test_my_research_pdf_regulation_profile():
    """MY deep-research seeds (circulars/regulations) parse via the generic path."""
    profile = seed_parse_profile({"source_type": "regulation"}, ["malay"])
    assert profile["source_type"] == "regulation"
    ok, reason = evidence_eligibility(
        "Personal Data Protection (Class of Data Users) Regulations 2013",
        profile["source_type"], "in_force")
    assert ok, reason


# ---------------------------------------------------- SG subsidiary legislation
def test_sg_sl_print_view_parses_with_same_parser():
    from packages.extractors.html_act import parse_sso_act

    html = (
        '<title>Personal Data Protection Regulations 2021 - Singapore Statutes Online</title>'
        'Current version as at 19 Jul 2026'
        '<div class="prov1"><td class="prov1Hdr" id="pr3-"><span>Transfer of personal data</span></td>'
        '<td class="prov1Txt"><strong>3.</strong>'
        '<a name="pr3-ps1-"></a>(1) A transferring organisation must not transfer personal data '
        'outside Singapore except in accordance with these Regulations.'
        '<a name="pr3-ps2-"></a>(2) This regulation applies to every transferring organisation.'
        '</td></div>'
    )
    doc = parse_sso_act(html, "https://sso.agc.gov.sg/SL/PDPA2012-S63-2021")
    assert doc.sections and doc.sections[0].number == "3"
    assert len(doc.sections[0].subsections) == 2
    assert "must not transfer personal data" in doc.sections[0].text


def test_sg_builder_recognizes_sl_urls():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "build_sg_corpus", Path(__file__).resolve().parents[1] / "scripts/build_sg_corpus.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert mod._sso_ref("https://sso.agc.gov.sg/SL/PDPA2012-S63-2021?x=1") == (
        "SL", "PDPA2012-S63-2021")
    assert mod._sso_ref("https://sso.agc.gov.sg/Act/PDPA2012") == ("Act", "PDPA2012")
    assert mod._sso_ref("https://example.com/other") is None


# ------------------------------------------------------ snippet-before-gates
def test_final_snippet_constructed_first_then_gated():
    source = ("(1) A person must not disclose any protected information to a "
              "foreign authority unless the disclosure is authorised by an order "
              "of the court; and any such disclosure must be recorded. "
              "(2) Subsection (1) does not apply to anonymised statistics.")
    claimed = "must not disclose any protected information to a foreign"
    final = finalize_snippet(claimed, source)
    # extended to the clause boundary, never mid-phrase
    assert final.endswith("order of the court;")
    # the SAME final text passes verbatim + whole-rule gates
    assert g1_span_exists(final, source).status == "PASS"
    assert g5_whole_rule("P7-I1", final, source).status != "FAIL"
    # idempotent: gating text IS the exported text
    assert finalize_snippet(final, source) == final


def test_finalize_snippet_length_cap_respects_boundaries():
    clause = "The data user shall protect the personal data from loss. "
    source = clause * 30  # 58 chars * 30 >> 700
    # source-exact but over-long claim: capped to <=700 ON a clause boundary
    final = finalize_snippet(source[:720], source)
    assert len(final) <= 700
    assert final.endswith(".")
    assert g1_span_exists(final, source).status == "PASS"
    # a claim that is NOT source-exact comes back unchanged so G1 rejects the
    # exact text that would have been exported (no silent repair)
    fabricated = source[:100] + " fabricated tail"
    assert finalize_snippet(fabricated, source) == fabricated
    assert g1_span_exists(fabricated, source).status == "FAIL"


def test_orchestrator_has_no_post_gate_snippet_mutation():
    src = (Path(__file__).resolve().parents[1] /
           "packages/core/orchestrator.py").read_text()
    gate_pos = src.index("gate_results, ok = run_gates")
    assert "finalize_snippet" in src[:gate_pos], "snippet must be final before gates"
    assert "extend_to_clause_boundary" not in src[gate_pos:], \
        "no snippet mutation is allowed after gating"


# ------------------------------------------------------------- retrieval caps
def test_union_cap_recorded_not_silent(monkeypatch):
    from packages.retrieval import hybrid

    monkeypatch.setattr(hybrid, "UNION_CAP_PER_INDICATOR", 5)

    class StubStore:
        def search_provisions(self, *a, **k):
            return []

    class StubCache:
        def ensure(self, *a, **k):
            pass

        def dense_top(self, *a, **k):
            return []

    corpus = [{"provision_id": f"p{i}", "text": "transfer of personal data rules",
               "props": {"evidence_eligible": True, "legal_status": "in_force"}}
              for i in range(20)]
    caps: list = []
    out = hybrid.retrieve_for_indicator(
        StubStore(), StubCache(), corpus, "P6-I4",
        {"positive_cues": ["transfer of personal data"]}, "Singapore", caps_out=caps)
    assert len(out) == 5
    assert caps and caps[0]["stage"] == "retrieval_union"
    assert caps[0]["input_count"] == 20 and caps[0]["limit"] == 5


def test_union_cap_env_overridable():
    import importlib
    import os

    os.environ["UNION_CAP_PER_INDICATOR"] = "777"
    try:
        from packages.retrieval import hybrid
        importlib.reload(hybrid)
        assert hybrid.UNION_CAP_PER_INDICATOR == 777
    finally:
        del os.environ["UNION_CAP_PER_INDICATOR"]
        from packages.retrieval import hybrid
        importlib.reload(hybrid)


# ------------------------------------------------------------- treaty scoping
def test_treaty_candidates_scoped_to_optin_indicators():
    import yaml

    rubric = yaml.safe_load(
        (Path(__file__).resolve().parents[1] / "configs/rdtii/pillar_6.yaml").read_text())
    assert rubric["indicators"]["P6-I5"].get("allow_treaty_sources") is True
    assert not rubric["indicators"]["P6-I1"].get("allow_treaty_sources")
    for pillar in ("6", "7"):
        r = yaml.safe_load((Path(__file__).resolve().parents[1] /
                            f"configs/rdtii/pillar_{pillar}.yaml").read_text())
        optins = [k for k, v in r["indicators"].items() if v.get("allow_treaty_sources")]
        assert optins == (["P6-I5"] if pillar == "6" else [])


# ------------------------------------------------- manifest reconciliation
def test_fetch_seeds_reconciles_metadata_without_refetch(tmp_path, monkeypatch):
    from packages.connectors import seeds_fetch

    monkeypatch.chdir(tmp_path)
    seeds = {"economies": {"Malaysia": [
        {"act": "Test Act", "url": "https://example.gov.my/a.pdf",
         "indicator_code": "P6-I5", "policy": "x", "coverage": "y",
         "source_type": "treaty", "cluster": "Data governance"},
    ]}}
    (tmp_path / "data").mkdir()
    (tmp_path / "data/seeds.json").write_text(json.dumps(seeds))
    raw = tmp_path / "data/raw/my"
    raw.mkdir(parents=True)
    # prior manifest entry: ok but WITHOUT source_type (pre-research state)
    (raw / "seeds_manifest.json").write_text(json.dumps({
        "https://example.gov.my/a.pdf": {"act": "Test Act", "status": "ok",
                                         "file": "data/raw/my/seed_x.pdf"}}))

    class StubClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return None

        def get(self, url):
            raise AssertionError("cached-ok row must not be refetched")

    monkeypatch.setattr(seeds_fetch.httpx, "Client", StubClient)
    manifest = seeds_fetch.fetch_seeds("Malaysia", ("P6",))
    entry = manifest["https://example.gov.my/a.pdf"]
    assert entry["source_type"] == "treaty"          # metadata refreshed
    assert entry["status"] == "ok"                    # never refetched
    recon = json.loads((raw / "seeds_reconciliation.json").read_text())
    assert recon["already_ok"] == 1 and recon["refreshed_metadata"] == 1


# ----------------------------------------------------------- restamp guard
def test_restamp_keeps_unchanged_artifact_units_across_generations(tmp_path):
    from packages.core.schemas import RuleUnit
    from packages.graph.sqlite_graph import SqliteGraphStore

    store = SqliteGraphStore(db_path=str(tmp_path / "g.db"))
    unit = RuleUnit(
        id="my:test:s1", document_id="my:test", economy="Malaysia",
        law_name="Test Act", article_section="s. 1",
        text="A person must not process personal data without consent under this Act.",
        source_url="https://example.gov.my/a.pdf", location_reference="page 1",
        metadata={"content_sha256": "abc123", "build_generation": "g1",
                  "legal_status": "in_force", "evidence_eligible": True},
    )
    store.upsert_rule_unit(unit)
    assert store.restamp_artifact_generation("Malaysia", "abc123", "g2") == 1
    assert store.prune_economy_generation("Malaysia", "g2") == 0  # survived
    assert store.restamp_artifact_generation("Malaysia", "missing", "g3") == 0
    assert store.prune_economy_generation("Malaysia", "g3") == 1  # changed doc pruned
