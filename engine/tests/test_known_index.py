from __future__ import annotations

from packages.ingest.known_index import extract_refs, indicator_code, normalize_law_name


def test_extract_refs_articles_and_sections() -> None:
    text = (
        "Article 18 of the amended Patent Law establishes ... and under s. 245(2) "
        "and Section 17 records must be kept; see also Regulation 5 and Schedule 1."
    )
    refs = extract_refs(text)
    assert "Art. 18" in refs
    assert "s. 245(2)" in refs
    assert "s. 17" in refs
    assert "reg. 5" in refs
    assert "Sch. 1" in refs


def test_extract_refs_empty() -> None:
    assert extract_refs("") == []
    assert extract_refs("No provisions are mentioned here.") == []


def test_indicator_code_from_number_and_name() -> None:
    assert indicator_code("6.4") == "P6-I4"
    assert indicator_code("Indicator 7.3 (minimum retention)") == "P7-I3"
    assert indicator_code("Conditional flow regimes") == "P6-I4"
    assert indicator_code("Lack of dedicated legal framework for cybersecurity") == "P7-I2"
    assert indicator_code("Ban & local processing requirements") == "P6-I1"
    assert indicator_code("not an indicator") is None


def test_normalize_law_name() -> None:
    assert normalize_law_name("Personal Data Protection Act 2012 (PDPA)") == \
        normalize_law_name("personal data protection act 2012")
    assert normalize_law_name("Cyber Security Act (Act 854) 2024") == "cyber security act 2024"
