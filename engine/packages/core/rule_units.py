"""Build RuleUnits (the smallest quotable legal units) from parsed act documents.

One RuleUnit per SUBSECTION — paragraph-depth citations ("s. 26(1)") are a hard
rubric requirement; bare "s. 26" loses points. Section heading and Part are kept
as metadata context for retrieval and mapping prompts.
"""
from __future__ import annotations

from packages.core.schemas import RuleUnit
from packages.extractors.html_sso import SsoActDoc


def build_rule_units(
    doc: SsoActDoc,
    economy: str,
    act_ref: str,
    law_number_ref: str | None = None,
    last_amended: str | None = None,
) -> list[RuleUnit]:
    units: list[RuleUnit] = []
    for section in doc.sections:
        for sub in section.subsections:
            label = sub.label  # "26(1)" or "26"
            units.append(
                RuleUnit(
                    id=f"{economy.lower()}:{act_ref}:{sub.anchor}",
                    document_id=f"{economy.lower()}:{act_ref}",
                    economy=economy,
                    law_name=doc.law_name,
                    law_number_ref=law_number_ref,
                    last_amended=last_amended,
                    article_section=f"s. {label}",
                    text=sub.text,
                    source_url=section.anchor_url(doc.source_url),
                    location_reference=f"#{section.sec_id}",
                    metadata={
                        "heading": section.heading,
                        "part": section.part,
                        "section_number": section.number,
                        "current_as_at": doc.current_as_at,
                    },
                )
            )
    return units
