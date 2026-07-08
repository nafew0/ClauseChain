"""Generic PDF act extractor: Malaysian/Commonwealth-style statutes -> RuleUnits.

Input PDFs come from the seeds fetcher (ministry/gazette copies). Text arrives
via the PDF router (native text layer; docling opt-in; scanned -> OCR VM).

Section detection: lines starting with "N." (optionally N letters, e.g. 116B.)
are section starts ONLY if the number is >= the previous section number
(monotonic filter — kills numbered-list false positives). Subsections split on
top-level "(n)" markers. Citations: "s. 129(1)"; Location Reference: "page N".
"""
from __future__ import annotations

import re

from packages.core.schemas import RuleUnit
from packages.extractors.pdf import extract_pdf

# Two observed statute layouts: "Section 22. Heading" (pdp.gov.my style) and
# bare "22. text" (gazette style). Parsed with both; the richer result wins.
_SECTION_PATTERNS = [
    re.compile(r"^\s{0,6}Section\s+(\d{1,3}[A-Z]{0,2})\.?\s+(.{0,120})", re.IGNORECASE),
    re.compile(r"^\s{0,6}(\d{1,3}[A-Z]{0,2})\.\s+(.{0,120})"),
]
_SUBSECTION = re.compile(r"\((\d{1,2})\)\s")


def _sec_sort_key(num: str) -> tuple[int, str]:
    match = re.match(r"(\d+)([A-Z]*)", num)
    return (int(match.group(1)), match.group(2)) if match else (0, "")


def parse_act_text(pages: list, economy: str, act_name: str, act_ref: str,
                   source_url: str, law_number_ref: str | None = None) -> list[RuleUnit]:
    """pages = ExtractedPage list; returns paragraph-depth RuleUnits."""
    # Build (page_number, line) stream
    lines: list[tuple[int, str]] = []
    for page in pages:
        for line in page.text.splitlines():
            lines.append((page.page_number, line))

    # Pass 1: find section starts with the monotonic filter; adaptive layout —
    # both patterns are tried and the one yielding more sections wins.
    best: list[dict] = []
    for pattern in _SECTION_PATTERNS:
        sections: list[dict] = []
        last_key = (0, "")
        for index, (page_no, line) in enumerate(lines):
            match = pattern.match(line)
            if not match:
                continue
            key = _sec_sort_key(match.group(1))
            if sections and (key <= last_key or key[0] > last_key[0] + 40):
                continue  # non-monotonic or absurd jump = list item / page artifact
            if not sections and key[0] == 0:
                continue
            sections.append({"number": match.group(1), "page": page_no, "line_index": index})
            last_key = key
        if len(sections) > len(best):
            best = sections
    sections = best

    units: list[RuleUnit] = []
    for pos, sec in enumerate(sections):
        end = sections[pos + 1]["line_index"] if pos + 1 < len(sections) else len(lines)
        body = "\n".join(line for _, line in lines[sec["line_index"]:end])
        body = re.sub(r"\s+", " ", body).strip()
        body = re.sub(rf"^{re.escape(sec['number'])}\.\s*", "", body)
        number = sec["number"]

        # split on top-level (1) (2) ... markers, in increasing order
        markers = []
        expected = 1
        for m in _SUBSECTION.finditer(body):
            if int(m.group(1)) == expected:
                markers.append((m.start(), m.group(1)))
                expected += 1
        pieces: list[tuple[str, str]] = []
        if len(markers) >= 2:
            head = body[: markers[0][0]].strip()
            if head:
                pieces.append((number, head))
            for j, (start, label) in enumerate(markers):
                stop = markers[j + 1][0] if j + 1 < len(markers) else len(body)
                pieces.append((f"{number}({label})", body[start:stop].strip()))
        else:
            pieces.append((number, body))

        for label, text in pieces:
            if len(text) < 30:
                continue
            units.append(RuleUnit(
                id=f"{economy[:2].lower()}:{act_ref}:s{label.replace('(', '-').replace(')', '')}",
                document_id=f"{economy[:2].lower()}:{act_ref}",
                economy=economy,
                law_name=act_name,
                law_number_ref=law_number_ref,
                article_section=f"s. {label}",
                text=text[:20000],
                source_url=source_url,
                location_reference=f"page {sec['page']}",
                extraction_confidence=pages[0].confidence if pages else None,
                metadata={"section_number": number,
                          "extraction": (pages[0].metadata.get("extraction", "native_text")
                                         if pages else "native_text")},
            ))
    return units


def extract_act_pdf(pdf_path: str, economy: str, act_name: str, act_ref: str,
                    source_url: str, law_number_ref: str | None = None,
                    ocr_engine=None) -> list[RuleUnit]:
    pages = extract_pdf(pdf_path, ocr_engine=ocr_engine)
    return parse_act_text(pages, economy, act_name, act_ref, source_url, law_number_ref)
