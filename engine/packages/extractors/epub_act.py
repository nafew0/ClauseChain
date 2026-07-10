"""EPUB/XHTML act extractor: semantic-markup compilations -> RuleUnits.

Format family: legislatures that ship an EPUB (or bare XHTML) of the authorised
compilation with semantic heading classes. Structured markup eliminates the
regex-PDF failure modes (false sections from notes, page-footer headings,
decimal Schedule sections, indentation dependence).

Authority split (user-approved scope): XHTML = STRUCTURE oracle; the authorised
PDF remains the quotation/page authority — see `pdf_align.align_to_pdf` for the
page-location alignment pass.
"""
from __future__ import annotations

import io
import re
import zipfile

from packages.core.schemas import RuleUnit
from packages.extractors.textutil import clean_text

# --- legislation.gov.au markup profile (FROZEN ids — stored corpora, zone-3 ---
# scores, and refutation files reference the "au:{ref}:s..." scheme below).
# EPUB route: /{titleId}/{date}/{date}/text/original/epub — same authorised
# compilation as the PDF. Heading classes ActHead1 (Chapter/Schedule) ..
# ActHead5 (section); section numbers in CharSectno spans; TOC* classes are
# navigation-only and never match these patterns.
_ANY_HEAD = re.compile(r'<p\b[^>]*class="ActHead([1-5])"[^>]*>(.*?)</p>', re.I | re.S)
_SCHEDULE = re.compile(r"^Schedule\s+(\S+)\s*[—–-]", re.I)
_SECTNO = re.compile(r'class="CharSectno"[^>]*>(?:<[^>]+>)*([\dA-Z.]+)', re.I)
_ID_PREFIX = "au"
# --- end legislation.gov.au profile -------------------------------------------

_SUBSECTION = re.compile(r"\((\d{1,2})\)\s")


def parse_epub_act(epub_bytes: bytes, economy: str, act_name: str, act_ref: str,
                   source_url: str, law_number_ref: str | None = None) -> list[RuleUnit]:
    z = zipfile.ZipFile(io.BytesIO(epub_bytes))
    html = "".join(
        z.read(n).decode("utf-8", errors="ignore")
        for n in z.namelist() if n.endswith((".xhtml", ".html"))
    )
    units: list[RuleUnit] = []
    heads = list(_ANY_HEAD.finditer(html))
    # Schedule tracking: clause numbering restarts inside Schedules (TIA Sch 1,
    # Telecom Act Schs) and would collide with body sections. Citation style:
    # "Sch 1, cl. 5" — EXCEPT decimal-numbered Code-style sections (Criminal
    # Code Schedule), which are conventionally cited as plain sections.
    schedule: tuple[str, int] | None = None  # (schedule number, heading level)
    for idx, head in enumerate(heads):
        level = int(head.group(1))
        if level < 5:
            head_text = clean_text(head.group(2))
            sm = _SCHEDULE.match(head_text)
            if sm:
                schedule = (sm.group(1), level)
            elif schedule and level <= schedule[1]:
                schedule = None
            continue
        end = heads[idx + 1].start() if idx + 1 < len(heads) else len(html)
        section_html = html[head.start(): end]
        m = _SECTNO.search(section_html)
        if not m:
            continue
        number = m.group(1).strip().rstrip(".")
        in_schedule = schedule is not None and "." not in number
        text = clean_text(section_html)
        # heading = text up to the first subsection marker (or first sentence)
        first_sub = _SUBSECTION.search(text)
        heading = text[: first_sub.start()] if first_sub else text[:120]
        heading = re.sub(rf"^{re.escape(number)}\s*", "", heading).strip()[:120]

        markers, expected = [], 1
        for sm in _SUBSECTION.finditer(text):
            if int(sm.group(1)) == expected:
                markers.append((sm.start(), sm.group(1)))
                expected += 1
        pieces: list[tuple[str, str]] = []
        if len(markers) >= 2:
            for j, (start, label) in enumerate(markers):
                stop = markers[j + 1][0] if j + 1 < len(markers) else len(text)
                pieces.append((f"{number}({label})", text[start:stop].strip()))
        else:
            pieces.append((number, text))

        for label, piece in pieces:
            if len(piece) < 30:
                continue
            flat = label.replace("(", "-").replace(")", "")
            meta = {"heading": heading, "section_number": number,
                    "extraction": "xhtml_oracle"}
            if in_schedule:
                unit_id = f"{_ID_PREFIX}:{act_ref}:sch{schedule[0]}-cl{flat}"
                citation = f"Sch {schedule[0]}, cl. {label}"
                meta["schedule"] = schedule[0]
            else:
                unit_id = f"{_ID_PREFIX}:{act_ref}:s{flat}"
                citation = f"s. {label}"
            units.append(RuleUnit(
                id=unit_id,
                document_id=f"{_ID_PREFIX}:{act_ref}",
                economy=economy,
                law_name=act_name,
                law_number_ref=law_number_ref,
                article_section=citation,
                text=piece[:20000],
                source_url=source_url,
                location_reference="unaligned",
                metadata=meta,
            ))
    return units
