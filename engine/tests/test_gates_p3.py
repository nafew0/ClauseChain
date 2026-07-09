from __future__ import annotations

from packages.verifier.gates import (citation_tier, g2_location, g5_whole_rule,
                                     g6_meaning_support, g7_indicator_fit,
                                     g8_counter_and_dangling)

BAN_WITH_EXCEPTION = ("An organisation must not transfer any personal data outside Singapore "
                      "unless the prescribed requirements are met.")


def test_g2_anchor_must_match_section():
    assert g2_location("s. 26(1)", "#pr26-").status == "PASS"
    assert g2_location("s. 27(1)", "#pr26-").status == "FAIL"
    assert g2_location("s. 129(1)", "page 42").status == "PASS"


def test_g5_ban_with_exception_outside_snippet_fails():
    snippet = "An organisation must not transfer any personal data outside Singapore"
    assert g5_whole_rule("P6-I1", snippet, BAN_WITH_EXCEPTION).status == "FAIL"
    # snippet that carries the exception passes
    assert g5_whole_rule("P6-I1", BAN_WITH_EXCEPTION, BAN_WITH_EXCEPTION).status == "PASS"
    # non-ban indicators only warn
    assert g5_whole_rule("P6-I4", snippet, BAN_WITH_EXCEPTION).status == "WARN"


def test_g6_permissive_may_misread_as_mandate_warns():
    r = g6_meaning_support("This section requires operators to retain records",
                           "An operator may keep records of calls", "An operator may keep records.")
    assert r.status == "WARN"
    assert g6_meaning_support("This section requires retention",
                              "An operator must retain records", "").status == "PASS"


def test_g8_dangling_reference_warns():
    text = "Nothing in this section limits the powers under section 999 of this Act."
    r = g8_counter_and_dangling("snippet", text, "X Act", {"25", "26"})
    assert r.status == "WARN" and "999" in r.reason
    ok = g8_counter_and_dangling("snippet", "see section 25 for details", "X Act", {"25"})
    assert ok.status == "PASS"


def test_g7_bill_names_hard_fail():
    r = g7_indicator_fit("P7-I1", "any", "any text", "Personal Data Protection Bill 2024")
    assert r.status == "FAIL" and "Bill" in r.reason


def test_citation_tiers():
    assert citation_tier("s. 26(1)") == "[verify-pinpoint]"
    assert citation_tier("s. 26") == "[verify]"
