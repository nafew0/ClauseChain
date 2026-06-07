from __future__ import annotations

from packages.core.schemas import ExtractedPage


class LocalOCRPlaceholder:
    """P0 local OCR placeholder. It treats text files as already extracted text."""

    def extract(self, file_path: str) -> list[ExtractedPage]:
        return [
            ExtractedPage(
                document_id=file_path,
                page_number=1,
                text="",
                source_url=f"file://{file_path}",
                location_reference="local file page 1",
                confidence=None,
            )
        ]

