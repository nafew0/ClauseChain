from __future__ import annotations

from packages.core.schemas import ExtractedPage
from packages.extractors.pdf_act import parse_act_text


def _page(number: int, text: str) -> ExtractedPage:
    return ExtractedPage(document_id="d", page_number=number, text=text,
                         source_url="file://d", location_reference=f"page {number}",
                         confidence=1.0)


SECTION_STYLE = """Section 128. Regulations
(1) The Minister may make regulations under this Act.
(2) Regulations may prescribe transfer conditions for personal data.
Section 129. Transfer of personal data to places outside Malaysia
(1) A data user shall not transfer any personal data of a data subject to a place outside
Malaysia unless to such place as specified by the Minister.
(2) Notwithstanding subsection (1), a data user may transfer personal data if consent is given.
"""

BARE_STYLE = """116B. Access to computerized data
(1) A police officer may access any computerized data whether stored in a computer or otherwise.
(2) In this section, access includes making a copy of the data.
117. Detention pending investigation
Nothing in this section limits the powers under section 116B.
"""


def test_parse_section_style_with_subsections():
    units = parse_act_text([_page(1, SECTION_STYLE)], "Malaysia",
                           "Personal Data Protection Act 2010", "Act709", "https://x")
    labels = [u.article_section for u in units]
    assert "s. 129(1)" in labels and "s. 129(2)" in labels
    u = next(u for u in units if u.article_section == "s. 129(1)")
    assert "outside Malaysia unless" in u.text
    assert u.location_reference == "page 1"


def test_parse_bare_style_and_letter_sections():
    units = parse_act_text([_page(3, BARE_STYLE)], "Malaysia",
                           "Criminal Procedure Code", "Act593", "https://x")
    labels = [u.article_section for u in units]
    assert "s. 116B(1)" in labels          # letter suffix + monotonic filter survive
    assert any(l.startswith("s. 117") for l in labels)


def test_monotonic_filter_kills_list_numbers():
    noisy = "5. Real section start here with enough text to pass the length filter easily.\n" \
            "3. this is a numbered list item, section numbers went backwards\n" \
            "6. Next real section with enough words to be kept as a provision unit."
    units = parse_act_text([_page(1, noisy)], "Malaysia", "X Act", "X", "https://x")
    numbers = {u.metadata["section_number"] for u in units}
    assert numbers == {"5", "6"}
