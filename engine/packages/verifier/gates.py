"""Deterministic verification gates (P1 scope: G1 span, G3 authority, G4 currentness).

Gates are CODE, not LLM judgment (TH2OECD boundary rule). A row ships only when
every applicable gate passes; failures reject the row (never silently emitted).
"""
from __future__ import annotations

import re
import unicodedata
from datetime import datetime
from urllib.parse import urlparse

from packages.core.schemas import GateResult

_WS = re.compile(r"\s+")


def _normalize(text: str) -> str:
    """Whitespace/unicode-tolerant normalization for span comparison (OCR/entity noise)."""
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("‑", "-").replace("–", "-").replace("—", "-")
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("“", '"').replace("”", '"')
    return _WS.sub(" ", text).strip().lower()


def g1_span_exists(snippet: str, source_text: str) -> GateResult:
    """The quote must literally exist in the extracted source (the anti-hallucination gate)."""
    ok = bool(snippet.strip()) and _normalize(snippet) in _normalize(source_text)
    return GateResult(
        gate_id="G1",
        status="PASS" if ok else "FAIL",
        reason="verbatim snippet found in extracted source text" if ok
        else "snippet NOT found in source — hallucinated or edited quote",
    )


def g3_authority(source_url: str, whitelist_domains: set[str]) -> GateResult:
    host = (urlparse(source_url).hostname or "").lower()
    ok = any(host == d or host.endswith("." + d) for d in whitelist_domains)
    return GateResult(
        gate_id="G3",
        status="PASS" if ok else "FAIL",
        reason=f"source domain {host!r} is on the official whitelist" if ok
        else f"source domain {host!r} is NOT an official source",
    )


def g4_currentness(current_as_at: str | None, status: str = "in_force") -> GateResult:
    """P1 basic check: the portal's own 'Current version as at <date>' assertion.

    (Repeal/supersession graph checks land with G8 in P3'.)
    """
    if status != "in_force":
        return GateResult(gate_id="G4", status="FAIL",
                          reason=f"instrument status is {status!r}, not in force")
    if not current_as_at:
        return GateResult(gate_id="G4", status="WARN",
                          reason="no current-version assertion found on the source page")
    try:
        as_at = datetime.strptime(current_as_at, "%d %b %Y")
        reason = f"official portal asserts current version as at {as_at.date().isoformat()}"
        return GateResult(gate_id="G4", status="PASS", reason=reason)
    except ValueError:
        return GateResult(gate_id="G4", status="WARN",
                          reason=f"unparseable current-version date: {current_as_at!r}")


def g7_ban_vs_conditional(findings: list) -> tuple[list, list[GateResult]]:
    """Deterministic 6.1-vs-6.4 disambiguation (the #1 warned confusion, DoDont §6).

    A ban (6.1) and a conditional-flow regime (6.4) are mutually exclusive for the
    SAME provision: if a provision maps to both, the conditional reading wins (a
    compliance path exists, so it is not a ban) and the 6.1 row is dropped.
    """
    from packages.discovery.diff import normalize_law, section_base

    conditional_keys = {
        (normalize_law(f.law_name), section_base(f.article_section))
        for f in findings if f.indicator_id == "P6-I4"
    }
    kept, gates = [], []
    for f in findings:
        key = (normalize_law(f.law_name), section_base(f.article_section))
        if f.indicator_id == "P6-I1" and key in conditional_keys:
            gates.append(GateResult(
                gate_id="G7",
                status="FAIL",
                reason=(f"{f.law_name} {f.article_section}: also maps to P6-I4 — a provision "
                        "with a compliance path is a CONDITIONAL regime, not a ban; "
                        "6.1 row dropped (DoDont §6 disambiguation, applied as code)"),
                evidence_reference=f"P6-I1 {f.article_section}",
            ))
            continue
        kept.append(f)
    return kept, gates


def run_gates(
    snippet: str,
    source_text: str,
    source_url: str,
    whitelist_domains: set[str],
    current_as_at: str | None,
) -> tuple[list[GateResult], bool]:
    gates = [
        g1_span_exists(snippet, source_text),
        g3_authority(source_url, whitelist_domains),
        g4_currentness(current_as_at),
    ]
    all_ok = all(g.status in ("PASS", "WARN") for g in gates)
    return gates, all_ok
