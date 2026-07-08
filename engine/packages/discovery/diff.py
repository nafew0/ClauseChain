"""NEW/KNOWN discovery diff vs the ESCAP master dataset (the 20-point lever).

Rules (10-Jun mail + 15-Jun Q&A, official):
- Baseline = the master DB (data/known_index.json, built from its Impact column).
- Granularity = (instrument + article). A new provision inside an already-recorded
  law is NEW; ESCAP's own refs are section-level ("s. 26"), so we compare at
  BASE-SECTION level: our "s. 26(1)" matches their "s. 26" -> KNOWN;
  our "s. 48E(3)" with no recorded s. 48E -> NEW.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

_SECTION_BASE = re.compile(r"(\d+[A-Z]*)")
_NON_ALNUM = re.compile(r"[^a-z0-9 ]+")


def normalize_law(name: str) -> str:
    name = _NON_ALNUM.sub(" ", name.lower())
    return re.sub(r"\s+", " ", name).strip()


def section_base(article_section: str) -> str | None:
    """'s. 26(1)' -> '26'; 'Art. 12(2)' -> '12'; 's. 48E(3)' -> '48E'."""
    match = _SECTION_BASE.search(article_section or "")
    return match.group(1) if match else None


_STOP_TOKENS = {"act", "acts", "the", "of", "and", "a", "an", "no", "pu"}


def law_tokens(name: str) -> set[str]:
    """Significant tokens of a law name — robust to '(Act 709)' insertions,
    reorderings, and filler words. 'Personal Data Protection Act (Act 709) 2010'
    and 'personal data protection act 2010' both -> {personal,data,protection,2010,709…}."""
    return {t for t in normalize_law(name).split() if t not in _STOP_TOKENS}


def laws_match(gold_act_norm: str, law_name: str) -> bool:
    gold, ours = law_tokens(gold_act_norm), law_tokens(law_name)
    if not gold or not ours:
        return False
    return gold <= ours or ours <= gold


class KnownIndex:
    def __init__(self, path: str | Path = "data/known_index.json") -> None:
        data = json.loads(Path(path).read_text())
        self._by_economy: dict[str, list[dict]] = data.get("economies", {})

    def known_sections(self, economy: str, law_name: str) -> set[str] | None:
        """Base sections ESCAP recorded for this law, or None if the law itself is unknown."""
        sections: set[str] = set()
        law_known = False
        for row in self._by_economy.get(economy, []):
            for act in row.get("acts_norm", []):
                if act and laws_match(act, law_name):
                    law_known = True
                    for ref in row.get("articles", []):
                        base = section_base(ref)
                        if base:
                            sections.add(base)
        return sections if law_known else None

    def tag(self, economy: str, law_name: str, article_section: str) -> tuple[str, str]:
        """Returns (tag, why). Provision-level: known law + unrecorded section = NEW."""
        sections = self.known_sections(economy, law_name)
        base = section_base(article_section)
        if sections is None:
            return "NEW", f"instrument not in the master dataset for {economy}"
        if base and base in sections:
            return "KNOWN", f"master dataset already records s. {base} of this law"
        return "NEW", (
            f"instrument is known but s. {base} is not among its recorded provisions "
            f"({sorted(sections) or 'none recorded'})"
        )
