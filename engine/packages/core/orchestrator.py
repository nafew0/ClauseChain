from __future__ import annotations

from packages.core.schemas import GateResult, MappedFinding, RunEnvelope


ECONOMY_NAMES = {
    "SG": "Singapore",
    "MY": "Malaysia",
    "AU": "Australia",
}


def run(country: str, pillar: int, provider_profile: str = "cheap_default") -> RunEnvelope:
    """Return a deterministic dummy envelope that proves the P0 contracts."""
    normalized_country = country.strip().upper()
    economy = ECONOMY_NAMES.get(normalized_country, normalized_country)

    finding = MappedFinding(
        economy=economy,
        law_name="Personal Data Protection Act 2012",
        law_number_ref="No. 26 of 2012",
        last_amended="2020",
        indicator_id=f"P{pillar}-I1",
        article_section="s. 26(1)",
        discovery_tag="KNOWN",
        location_reference="sso.agc.gov.sg, section 26(1)",
        verbatim_snippet=(
            "An organisation shall not transfer any personal data to a country or territory "
            "outside Singapore except in accordance with requirements prescribed under this Act."
        ),
        mapping_rationale=(
            "Dummy P0 row: this provision is used to prove the export contract for a "
            "cross-border data-transfer obligation under Pillar 6."
        ),
        source_url="https://sso.agc.gov.sg/Act/PDPA2012",
        confidence=0.99,
        notes="P0 dummy data; replace with verified live extraction in P1.",
        graph_path=[
            "Economy:Singapore",
            "Instrument:Personal Data Protection Act 2012",
            "Section:s. 26(1)",
            f"Indicator:P{pillar}-I1",
        ],
    )

    gates = [
        GateResult(
            gate_id="G0",
            status="PASS",
            reason="P0 dummy row satisfies schema and export contract.",
            evidence_reference="dummy://sg/pdpa/s26-1",
        ),
        GateResult(
            gate_id="G4",
            status="NOT_RUN",
            reason="Currentness verification is not implemented in P0.",
        ),
    ]

    return RunEnvelope(
        run_id=f"p0-{normalized_country}-p{pillar}",
        country=normalized_country,
        pillar=pillar,
        provider_profile=provider_profile,
        findings=[finding],
        gates=gates,
        warnings=["P0 skeleton uses deterministic dummy data only."],
        metadata={
            "graph_required": False,
            "live_llm_calls": False,
            "live_ocr_calls": False,
        },
    )

