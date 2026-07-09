"""Regression suite from DoDont §13's worked-example bank (P3-F).

Every ❌ trap ESCAP demonstrated becomes a deterministic test against our gates —
these are the exact failures the judges showed teams missing.
"""
from __future__ import annotations

from packages.core.schemas import MappedFinding
from packages.verifier.gates import (g1_span_exists, g5_whole_rule, g7_ban_vs_conditional,
                                     g7_indicator_fit)


def _finding(indicator: str, law: str = "Personal Data Protection Act 2012",
             article: str = "s. 26(1)") -> MappedFinding:
    return MappedFinding(
        economy="Singapore", law_name=law, indicator_id=indicator,
        article_section=article, discovery_tag="KNOWN", location_reference="#pr26-",
        verbatim_snippet="x", mapping_rationale="x", source_url="https://sso.agc.gov.sg/x",
        confidence=0.9)


def test_w2_hallucinated_quote_fails_g1():
    """§13 W2: 'IT Act s.70B(1)' text that does not exist in the source."""
    source = "70B. The agency shall serve as the national nodal agency."
    fake = "70B(4) may impose penalties for non-compliance with directions"
    assert g1_span_exists(fake, source).status == "FAIL"
    assert g1_span_exists("national nodal agency", source).status == "PASS"


def test_w6_lost_exception_kills_the_false_ban():
    """§13 W6: dropping the 'unless' turns 6.4 into a false 6.1 — two layers catch it."""
    full = "must not transfer personal data outside Singapore unless prescribed requirements are met"
    snippet = "must not transfer personal data outside Singapore"
    # layer 1: G5 whole-rule fails the ban row
    assert g5_whole_rule("P6-I1", snippet, full).status == "FAIL"
    # layer 2: if both mappings exist, the 6.1 row is dropped deterministically
    kept, gates = g7_ban_vs_conditional([_finding("P6-I1"), _finding("P6-I4")])
    assert [f.indicator_id for f in kept] == ["P6-I4"]
    assert gates and gates[0].gate_id == "G7"


def test_w4_style_business_transfer_never_a_data_transfer():
    """P2 scale-regression trap: bank BUSINESS transfers leaked into P6-I4."""
    text = ("The transferor must transfer the whole or any part of its business to the "
            "transferee under a scheme approved by the Minister.")
    assert g7_indicator_fit("P6-I4", text[:120], text, "Banking Act 1970").status == "FAIL"


def test_bill_as_measure_hard_fails():
    """DoDont §4: drafts/bills are never recordable (MY inventory cites one)."""
    r = g7_indicator_fit("P6-I4", "transfer outside Malaysia", "x",
                         "Personal Data Protection Bill 2024")
    assert r.status == "FAIL"


def test_w5_confidentiality_is_not_localization():
    """§13 W5: a banking confidentiality duty is not a transfer ban/condition."""
    text = ("An officer of the bank must not disclose customer information to any "
            "other person except as expressly provided in this Act.")
    # no cross-border transfer language -> the P6 fit gate rejects it
    assert g7_indicator_fit("P6-I1", text[:100], text, "Banking Act 1970").status == "FAIL"
