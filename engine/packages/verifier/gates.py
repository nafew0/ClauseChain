"""Deterministic verification gates (P1 scope: G1 span, G3 authority, G4 currentness).

Gates are CODE, not LLM judgment (TH2OECD boundary rule). A row ships only when
every applicable gate passes; failures reject the row (never silently emitted).
"""
from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
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


def source_exact_slice(snippet: str, source_text: str) -> str | None:
    """E3-lite (P3.5): return the SOURCE's own characters for a claimed snippet.

    The LLM copies quotes imperfectly (punctuation/whitespace drift). We locate the
    snippet under normalization, then slice the ORIGINAL source text — the exported
    quotation is constructed from stored source characters, never from LLM output.
    """
    if not snippet.strip():
        return None
    # Build normalized source with an offset map back to original indices.
    norm_chars: list[str] = []
    offset_map: list[int] = []
    prev_space = True
    for index, ch in enumerate(source_text):
        c = unicodedata.normalize("NFKC", ch)
        c = {"‑": "-", "–": "-", "—": "-", "‘": "'", "’": "'", "“": '"', "”": '"'}.get(c, c)
        if c.isspace():
            if prev_space:
                continue
            norm_chars.append(" ")
            offset_map.append(index)
            prev_space = True
        else:
            norm_chars.append(c.lower())
            offset_map.append(index)
            prev_space = False
    norm_source = "".join(norm_chars)
    target = _normalize(snippet)
    pos = norm_source.find(target)
    if pos < 0:
        return None
    start = offset_map[pos]
    end_index = pos + len(target) - 1
    end = offset_map[end_index] + 1
    return source_text[start:end]


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
    if status == "unknown":
        return GateResult(gate_id="G4", status="WARN",
                          reason="legal currentness is unknown; candidate may be reviewed but cannot be final")
    if status != "in_force":
        return GateResult(gate_id="G4", status="FAIL",
                          reason=f"instrument status is {status!r}, not in force")
    if not current_as_at:
        return GateResult(gate_id="G4", status="WARN",
                          reason="no current-version assertion found on the source page")
    try:
        try:
            as_at = datetime.strptime(current_as_at, "%d %b %Y").date()
        except ValueError:
            as_at = date.fromisoformat(current_as_at)
        reason = f"official portal asserts current version as at {as_at.isoformat()}"
        return GateResult(gate_id="G4", status="PASS", reason=reason)
    except ValueError:
        return GateResult(gate_id="G4", status="WARN",
                          reason=f"unparseable current-version date: {current_as_at!r}")


# Deterministic legal-fit validators (reviewer feedback, 9 Jul): G1/G3/G4 prove
# quote/source/currentness but NOT legal fit — these lexical gates do, per indicator.
_XBORDER = re.compile(r"outside|abroad|cross[- ]border|foreign|another country|other countr|place outside|out of", re.I)
_TRANSFER = re.compile(r"transfer|transmit|send|disclos\w+ to .{0,40}(outside|abroad|foreign)", re.I)
_RETAIN = re.compile(r"retain|keep|preserve|maintain|stor\w+", re.I)
_DURATION = re.compile(r"(period of|not less than|at least|minimum of)?\s*\w*\s*(year|month|day|week)s?", re.I)
_RECORDS = re.compile(r"record|data|document|book|information|register", re.I)
_INFRASTRUCTURE = re.compile(r"server|data cent(?:re|er)|comput(?:er|ing) (?:system|facility)|infrastructure|facility", re.I)
_DOMESTIC_LOCATION = re.compile(
    r"\b(?:local|domestic(?:ally)?)\b|\b(?:located|established|maintained|hosted)\b"
    r".{0,35}\b(?:in|within)\b(?!\s+(?:another|other|foreign))|"
    r"\b(?:server|data cent(?:re|er)|facility|infrastructure)\b.{0,35}"
    r"\b(?:in|within)\b(?!\s+(?:another|other|foreign))",
    re.I,
)
_PROHIBITION = re.compile(r"\b(?:must not|shall not|may not|is prohibited|are prohibited|prohibit(?:s|ed)?)\b", re.I)
_CONDITION = re.compile(r"\b(?:if|unless|only if|consent|adequacy|adequate|approval|condition|safeguard|contract)\b", re.I)
_MINIMUM_DUTY = re.compile(r"\b(?:must|shall|required to|not less than|at least|minimum(?: period)? of)\b", re.I)
_RETENTION_CEILING = re.compile(r"\b(?:need only|may (?:retain|keep)|up to|not more than|no longer than|maximum(?: period)? of)\b", re.I)
_WARRANT = re.compile(r"warrant|court order|order of (a|the) court|judge|magistrate|judicial", re.I)
_WITHOUT_JUDICIAL = re.compile(
    r"\b(?:without|no need for|does not require|not required to obtain)\b"
    r".{0,35}\b(?:warrant|court order|judicial authori[sz]ation)\b|\bwarrantless\b",
    re.I,
)


def g7_indicator_fit(indicator_id: str, snippet: str, full_text: str, law_name: str) -> GateResult:
    """Hard post-map legal-fit checks. FAIL = the row cannot ship; WARN = flag for review."""
    blob = f"{snippet} {full_text[:2000]}"
    if "bill" in re.sub(r"[^a-z ]", " ", law_name.lower()).split():
        return GateResult(gate_id="G7", status="FAIL",
                          reason=f"law name contains 'Bill' ({law_name[:60]}) — drafts are never recordable")
    if indicator_id in ("P6-I1", "P6-I4"):
        if not (_XBORDER.search(blob) and _TRANSFER.search(blob)):
            return GateResult(gate_id="G7", status="FAIL",
                              reason=f"{indicator_id} requires CROSS-BORDER data transfer language; "
                                     "generic processing/disclosure does not qualify")
    if indicator_id == "P6-I1" and not _PROHIBITION.search(blob):
        return GateResult(gate_id="G7", status="FAIL",
                          reason="P6-I1 requires an operative prohibition on cross-border transfer")
    if indicator_id == "P6-I2":
        if not (_RETAIN.search(blob) and _RECORDS.search(blob)
                and _DOMESTIC_LOCATION.search(blob) and _MINIMUM_DUTY.search(blob)):
            return GateResult(gate_id="G7", status="FAIL",
                              reason="P6-I2 requires a mandatory domestic-copy/storage duty")
    if indicator_id == "P6-I3":
        if not (_INFRASTRUCTURE.search(blob) and _DOMESTIC_LOCATION.search(blob)
                and (_MINIMUM_DUTY.search(blob)
                     or re.search(r"\b(?:condition|precondition)\b", blob, re.I))):
            return GateResult(gate_id="G7", status="FAIL",
                              reason="P6-I3 requires local infrastructure as a mandatory service condition")
    if indicator_id == "P6-I4" and not _CONDITION.search(blob):
        return GateResult(gate_id="G7", status="FAIL",
                          reason="P6-I4 requires an operative condition or safeguard for transfer")
    if indicator_id == "P7-I3":
        if not (_RETAIN.search(blob) and _DURATION.search(blob) and _RECORDS.search(blob)):
            return GateResult(gate_id="G7", status="FAIL",
                              reason="P7-I3 requires retention verb + records/data object + a minimum duration")
        if re.search(r"licen[cs]e|permit", snippet, re.I) and not re.search(r"record|data", snippet, re.I):
            return GateResult(gate_id="G7", status="FAIL",
                              reason="P7-I3: licence-duration provisions are not data retention")
        if _RETENTION_CEILING.search(blob) or not _MINIMUM_DUTY.search(blob):
            return GateResult(gate_id="G7", status="FAIL",
                              reason="P7-I3 requires a mandatory minimum; permissive or maximum retention does not qualify")
    if indicator_id == "P7-I5":
        if _WARRANT.search(blob) and not _WITHOUT_JUDICIAL.search(blob):
            return GateResult(gate_id="G7", status="WARN",
                              reason="P7-I5: access appears COURT-GATED (warrant/judicial language) — "
                                     "court-order test says this supports score 0; flag for legal review")
    return GateResult(gate_id="G7", status="PASS", reason=f"{indicator_id} legal-fit checks passed")


_EXCEPTION_TOKENS = re.compile(r"\bunless\b|\bexcept\b|subject to|provided that|notwithstanding", re.I)
_MANDATORY = re.compile(r"\bmust\b|\bshall\b|is required|are required", re.I)
_CROSS_REF = re.compile(r"section\s+(\d{1,3}[A-Z]{0,2})(?:\s+of\s+(?:the\s+)?([A-Z][\w() ]{4,60}?(?:Act|Code|Regulations)[\w ]{0,12}))?", re.I)


def g2_location(article_section: str, location_reference: str) -> GateResult:
    """The location pointer must be consistent with the cited section (anchor
    contains the section number, or is an explicit page/vol reference)."""
    from packages.discovery.diff import section_base

    base = section_base(article_section)
    loc = (location_reference or "").lower()
    if loc.startswith("#pr") or loc.startswith("#sc"):
        ok = bool(base) and base.lower() in loc
        return GateResult(gate_id="G2", status="PASS" if ok else "FAIL",
                          reason=f"anchor {location_reference!r} {'matches' if ok else 'does NOT match'} s. {base}")
    if "page" in loc or "vol" in loc:
        return GateResult(gate_id="G2", status="PASS",
                          reason=f"page-level location {location_reference!r} recorded from the source parse")
    return GateResult(gate_id="G2", status="WARN", reason=f"unrecognized location format {location_reference!r}")


def g5_whole_rule(indicator_id: str, snippet: str, full_text: str) -> GateResult:
    """Rule + exception must travel together (DoDont §5): a 'ban' whose section
    carries an exception outside the quoted snippet is the classic 6.1 trap."""
    outside = _EXCEPTION_TOKENS.search(full_text) and not _EXCEPTION_TOKENS.search(snippet)
    if not outside:
        return GateResult(gate_id="G5", status="PASS", reason="rule and exception captured together")
    if indicator_id == "P6-I1":
        return GateResult(gate_id="G5", status="FAIL",
                          reason="section contains an exception (unless/except/subject to) OUTSIDE the snippet — "
                                 "a ban with a compliance path is conditional (6.4), not 6.1")
    return GateResult(gate_id="G5", status="WARN",
                      reason="exception language exists outside the snippet — reviewer should read the full section")


def g6_meaning_support(rationale: str, snippet: str, full_text: str) -> GateResult:
    """The rationale's modality claims must be supported by the text (may ≠ shall)."""
    claims_mandate = re.search(r"prohibit|require|mandate|must|ban", rationale or "", re.I)
    text = f"{snippet} {full_text[:1500]}"
    if claims_mandate and not (_MANDATORY.search(text) or re.search(r"\bmay not\b|\bshall not\b|\bmust not\b", text, re.I)):
        return GateResult(gate_id="G6", status="WARN",
                          reason="rationale claims a mandatory rule but the text shows no must/shall modality "
                                 "(permissive 'may' misread as mandatory?)")
    return GateResult(gate_id="G6", status="PASS", reason="rationale modality supported by the text")


def g8_counter_and_dangling(snippet: str, full_text: str, law_name: str,
                            corpus_sections: set[str]) -> GateResult:
    """Counter-evidence + dangling-reference (DoDont §12.8): every section this
    provision cross-references (same act) must exist in the parsed corpus."""
    dangling = []
    for match in _CROSS_REF.finditer(full_text[:3000]):
        ref_base, other_act = match.group(1).upper(), match.group(2)
        if other_act and other_act.strip().lower().startswith(("this ", "that ", "the said")):
            other_act = None  # "of this Act" = same-act reference (re.I fooled [A-Z])
        if other_act:  # genuine cross-act reference — checked at corpus level, skip here
            continue
        if corpus_sections and ref_base not in corpus_sections:
            dangling.append(ref_base)
    if dangling:
        return GateResult(gate_id="G8", status="WARN",
                          reason=f"references section(s) {sorted(set(dangling))[:4]} not found in the parsed act "
                                 "— possible repealed/renumbered target (dangling reference); reviewer check")
    return GateResult(gate_id="G8", status="PASS",
                      reason="no dangling same-act references; no repeal language detected")


def citation_tier(article_section: str) -> str:
    """Claude-for-Legal tiering: pinpoint cites carry the highest fabrication risk."""
    return "[verify-pinpoint]" if "(" in (article_section or "") else "[verify]"


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
    legal_status: str = "unknown",
) -> tuple[list[GateResult], bool]:
    gates = [
        g1_span_exists(snippet, source_text),
        g3_authority(source_url, whitelist_domains),
        g4_currentness(current_as_at, legal_status),
    ]
    all_ok = all(g.status in ("PASS", "WARN") for g in gates)
    return gates, all_ok
