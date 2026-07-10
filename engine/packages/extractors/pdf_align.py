"""Align RuleUnits to authorised-PDF pages (alignment-lite, format-level).

For any economy where a structured source (EPUB/XHTML/HTML) provides the
section tree but the authorised PDF is the quotation/page authority: locate
each unit's opening text in the PDF page text -> `page N` (volume-aware)
location + a `pdf_alignment` metadata flag (`exact-prefix` | `unaligned-review`).
"""
from __future__ import annotations

import re

from packages.core.schemas import RuleUnit

_WS_NORM = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _WS_NORM.sub(" ", text.lower()).strip()


def align_to_pdf(units: list[RuleUnit], pdf_paths: list[str]) -> tuple[int, int]:
    """Returns (aligned, total)."""
    import fitz

    pages: list[tuple[str, str]] = []  # (location label, normalized page text)
    for vol_index, path in enumerate(pdf_paths, start=1):
        with fitz.open(path) as doc:
            prefix = f"vol {vol_index}, " if len(pdf_paths) > 1 else ""
            for page_no, page in enumerate(doc, start=1):
                pages.append((f"{prefix}page {page_no}", _norm(page.get_text())))

    # Units arrive in document order, so alignment is monotonic: search forward
    # from the previous hit first (template offence language repeats across an
    # act — a global search would bind to the first duplicate, not the right one).
    aligned = 0
    cursor = 0
    for unit in units:
        probe = _norm(unit.text)[:60]
        if len(probe) < 25:
            continue
        hit_index = next((i for i in range(cursor, len(pages)) if probe in pages[i][1]), None)
        if hit_index is None:  # fallback: full scan (out-of-order print artifacts)
            hit_index = next((i for i in range(len(pages)) if probe in pages[i][1]), None)
        if hit_index is not None:
            unit.location_reference = pages[hit_index][0]
            unit.metadata["pdf_alignment"] = "exact-prefix"
            cursor = hit_index
            aligned += 1
        else:
            unit.metadata["pdf_alignment"] = "unaligned-review"
    return aligned, len(units)
