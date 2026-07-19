"""Seed-entry parse profiles: seeds.json data -> extractor configuration.

Every builder consults this instead of hard-coding per-document behavior. The
authority for WHAT a document is lives in data (`source_type` on the seed row,
copied into the fetch manifest); this module only translates that declaration
into generic extractor parameters (section grammar, citation template) and the
eligibility source type. Unknown/absent declarations default to "act" — byte-
identical behavior for every pre-existing seed row.
"""
from __future__ import annotations

import re

from packages.extractors.pdf_act import CITATION_TEMPLATES, SECTION_GRAMMARS

VALID_SOURCE_TYPES = {"act", "statute", "regulation", "official_code",
                      "official_instrument", "treaty"}


def seed_source_type(entry: dict) -> str:
    declared = str(entry.get("source_type") or "").strip().lower()
    return declared if declared in VALID_SOURCE_TYPES else "act"


def seed_parse_profile(entry: dict,
                       jurisdiction_grammars: list[str] | None = None) -> dict:
    """Return {source_type, extra_section_patterns, citation_template} for a
    manifest/seed entry. `jurisdiction_grammars` come from the jurisdiction pack
    (e.g. my.yaml `section_grammars: ["malay"]`) and are appended for every
    document of that economy; the seed's own source_type adds its grammar on top
    (treaty -> Article grammar + "Art. {label}" citations)."""
    source_type = seed_source_type(entry)
    patterns: list[re.Pattern] = []
    for name in jurisdiction_grammars or []:
        patterns.extend(SECTION_GRAMMARS.get(str(name).strip().lower(), []))
    if source_type in SECTION_GRAMMARS:
        patterns.extend(SECTION_GRAMMARS[source_type])
    return {
        "source_type": source_type,
        "extra_section_patterns": patterns or None,
        "citation_template": CITATION_TEMPLATES.get(source_type, "s. {label}"),
    }
