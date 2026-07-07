"""PDF extraction router: native text layer first, OCR ONLY for scanned pages.

The rule (Build Guide §3 stage [4]): a PDF page with a real text layer is read
directly with PyMuPDF — it must NEVER be sent to the OCR service. OCR is the
fallback for image-only (scanned) pages. Detection is per PAGE, so a mixed
document (typed cover + scanned gazette body) gets native text where it exists
and OCR only where it must.

Classification heuristic per page:
  - text layer with >= MIN_TEXT_CHARS characters -> "text"  (native extraction)
  - otherwise, if the page renders anything      -> "image" (needs OCR)
Pages that are text-classified but also carry a full-page image are flagged
`embedded_text_layer` (already-OCRed scans) — we still use the text layer, but
the flag is surfaced in metadata/Notes.
"""
from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from packages.core.schemas import ExtractedPage

MIN_TEXT_CHARS = 25  # below this a page is treated as image-only


def classify_pages(file_path: str) -> list[dict]:
    """Per-page classification: [{'page': 1, 'kind': 'text'|'image', 'chars': n, 'has_image': bool}]"""
    report: list[dict] = []
    with fitz.open(file_path) as doc:
        for index, page in enumerate(doc, start=1):
            text = page.get_text().strip()
            has_image = bool(page.get_images(full=True))
            kind = "text" if len(text) >= MIN_TEXT_CHARS else "image"
            report.append(
                {"page": index, "kind": kind, "chars": len(text), "has_image": has_image}
            )
    return report


def is_scanned_pdf(file_path: str) -> bool:
    """True when NO page has a usable text layer (the whole doc needs OCR)."""
    return all(p["kind"] == "image" for p in classify_pages(file_path))


def _native_page(file_path: str, page: "fitz.Page", page_number: int, embedded_layer: bool) -> ExtractedPage:
    return ExtractedPage(
        document_id=file_path,
        page_number=page_number,
        text=page.get_text(),
        source_url=f"file://{file_path}",
        location_reference=f"page {page_number}",
        confidence=1.0,  # native text layer — not an OCR estimate
        metadata={
            "extraction": "native_text",
            "embedded_text_layer": embedded_layer,
        },
    )


def extract_pdf(file_path: str, ocr_engine=None) -> list[ExtractedPage]:
    """Route each page: native text layer -> PyMuPDF; image-only page -> OCR engine.

    `ocr_engine` may be None for text-only documents; it is REQUIRED (raises
    RuntimeError) only if an image page is actually encountered. A fully
    scanned document is sent to the OCR engine as one whole-PDF call (fast
    path); mixed documents OCR only their image pages, one page at a time.
    """
    classes = classify_pages(file_path)

    # Fast path 1: every page has a text layer -> never touches OCR.
    if all(p["kind"] == "text" for p in classes):
        with fitz.open(file_path) as doc:
            return [
                _native_page(file_path, doc[p["page"] - 1], p["page"], p["has_image"])
                for p in classes
            ]

    if ocr_engine is None:
        raise RuntimeError(
            f"{Path(file_path).name}: image-only page(s) "
            f"{[p['page'] for p in classes if p['kind'] == 'image']} need OCR, "
            "but no OCR engine was provided."
        )

    # Fast path 2: fully scanned -> one whole-document OCR call.
    if all(p["kind"] == "image" for p in classes):
        pages = ocr_engine.extract(file_path)
        for page in pages:
            page.metadata.setdefault("extraction", "ocr")
        return pages

    # Mixed document: native where text exists, OCR only the image pages.
    ocr_single = getattr(ocr_engine, "ocr_image", None)
    pages: list[ExtractedPage] = []
    with fitz.open(file_path) as doc:
        for info in classes:
            page_number = info["page"]
            page = doc[page_number - 1]
            if info["kind"] == "text":
                pages.append(_native_page(file_path, page, page_number, info["has_image"]))
            elif ocr_single is not None:
                image_bytes = page.get_pixmap(dpi=200).tobytes("png")
                extracted = ocr_single(image_bytes, page_number=page_number, document_id=file_path)
                extracted.metadata.setdefault("extraction", "ocr")
                pages.append(extracted)
            else:  # engine without per-image support: degrade to whole-doc OCR for this page set
                raise RuntimeError(
                    "Mixed text/image PDF needs an OCR engine with ocr_image() support."
                )
    return pages
