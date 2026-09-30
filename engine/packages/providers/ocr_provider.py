from __future__ import annotations

import base64
import os
import re
import struct
import time
from pathlib import Path
from typing import Iterator

import httpx

from packages.core.schemas import ExtractedPage, OCRToken

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}


def _tesseract_lines(data: dict) -> str:
    """Reconstruct reading lines from Tesseract's layout identifiers."""
    lines: dict[tuple[int, int, int], list[str]] = {}
    order: list[tuple[int, int, int]] = []
    for index, raw in enumerate(data.get("text", [])):
        word = str(raw).strip()
        if not word:
            continue
        key = tuple(int(data.get(name, [0] * len(data["text"]))[index])
                    for name in ("block_num", "par_num", "line_num"))
        if key not in lines:
            lines[key] = []
            order.append(key)
        lines[key].append(word)
    return "\n".join(" ".join(lines[key]) for key in order)


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


class TesseractOCR:
    """Local OCR fallback preserving token boxes and page numbers."""

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        import io
        import pytesseract
        from PIL import Image

        image = Image.open(io.BytesIO(image_bytes))
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        tokens = []
        for i, raw in enumerate(data.get("text", [])):
            text = str(raw).strip()
            if not text:
                continue
            confidence = float(data["conf"][i])
            confidence = confidence / 100 if confidence >= 0 else None
            x, y, w, h = (float(data[k][i]) for k in ("left", "top", "width", "height"))
            tokens.append(OCRToken(text=text, confidence=confidence,
                                   bbox=[x, y, x + w, y + h], page_number=page_number))
        confidences = [t.confidence for t in tokens if t.confidence is not None]
        return ExtractedPage(document_id=document_id, page_number=page_number,
            text=_tesseract_lines(data), source_url=f"file://{document_id}",
            location_reference=f"page {page_number}",
            confidence=sum(confidences) / len(confidences) if confidences else None,
            tokens=tokens, metadata={"ocr_engine": "tesseract", "engine_version": str(pytesseract.get_tesseract_version())})

    def extract(self, file_path: str) -> list[ExtractedPage]:
        return [self.ocr_image(image, page_no, file_path)
                for page_no, image in _rasterize(file_path)]


def _rasterize(file_path: str, dpi: int = 200) -> Iterator[tuple[int, bytes]]:
    """Yield (page_number, PNG bytes) for a PDF, or the raw bytes for an image file."""
    path = Path(file_path)
    if path.suffix.lower() in IMAGE_SUFFIXES:
        yield 1, path.read_bytes()
        return
    import fitz  # PyMuPDF — already a core dependency

    with fitz.open(file_path) as doc:
        for index, page in enumerate(doc, start=1):
            yield index, page.get_pixmap(dpi=dpi).tobytes("png")


def _region_to_bbox(region) -> list[float] | None:
    """Accept [[x,y] x4] polygons or flat [x0,y0,x1,y1] boxes."""
    try:
        if not region:
            return None
        if isinstance(region[0], (list, tuple)):
            xs = [float(pt[0]) for pt in region]
            ys = [float(pt[1]) for pt in region]
            return [min(xs), min(ys), max(xs), max(ys)]
        return [float(v) for v in region][:4]
    except Exception:
        return None


def _parse_ocr_response(data: dict) -> tuple[str, float | None, list[OCRToken]]:
    """Tolerate both our micro-server schema and PaddleHub/PaddleServing-style responses."""
    if "tokens" in data:  # scripts/paddle_ocr_server.py schema
        tokens = [OCRToken(**token) for token in data.get("tokens", [])]
        return data.get("text", ""), data.get("confidence"), tokens

    results = data.get("results") or data.get("data") or data.get("result") or []

    # User's FastAPI PaddleOCR service: {"results": [{"texts": [...], "scores": [...]}]}
    if isinstance(results, list) and results and isinstance(results[0], dict) and "texts" in results[0]:
        tokens = []
        for res in results:
            texts = res.get("texts") or []
            scores = res.get("scores") or []
            boxes = res.get("boxes") or res.get("polys") or res.get("text_regions") or []
            for index, text in enumerate(texts):
                confidence = scores[index] if index < len(scores) else None
                bbox = _region_to_bbox(boxes[index]) if index < len(boxes) else None
                tokens.append(
                    OCRToken(
                        text=str(text),
                        confidence=float(confidence) if confidence is not None else None,
                        bbox=bbox,
                    )
                )
        confidences = [t.confidence for t in tokens if t.confidence is not None]
        mean_conf = sum(confidences) / len(confidences) if confidences else None
        return "\n".join(t.text for t in tokens), mean_conf, tokens

    flat: list[dict] = []
    stack = [results]
    while stack:
        item = stack.pop(0)
        if isinstance(item, dict):
            flat.append(item)
        elif isinstance(item, list):
            stack = list(item) + stack
    tokens = []
    for item in flat:
        text = item.get("text") or item.get("rec_text") or ""
        if not text:
            continue
        confidence = item.get("confidence", item.get("score"))
        bbox = _region_to_bbox(item.get("text_region") or item.get("box") or item.get("bbox"))
        tokens.append(
            OCRToken(
                text=str(text),
                confidence=float(confidence) if confidence is not None else None,
                bbox=bbox,
            )
        )
    confidences = [t.confidence for t in tokens if t.confidence is not None]
    mean_conf = sum(confidences) / len(confidences) if confidences else None
    return "\n".join(t.text for t in tokens), mean_conf, tokens


class RemotePaddleOCR:
    """OCREngine impl that calls a PaddleOCR HTTP service on a separate machine/VM.

    PDFs are rasterized locally (PyMuPDF) and sent one page-image per request.
    `endpoint` may be a base URL (``http://host:8868``) or the full OCR route
    (``http://host:8868/ocr``). If `api_key` is set it is sent as both
    ``Authorization: Bearer`` and ``X-API-Key`` headers.
    """

    def __init__(
        self,
        endpoint: str,
        api_key: str | None = None,
        timeout: float = 600.0,
        dpi: int = 200,
        request_format: str = "multipart",
        send_pdf: bool = True,
        lang: str | None = None,
        transport: httpx.BaseTransport | None = None,
        engine_name: str = "remote_paddle",
    ) -> None:
        self._request_format = request_format
        self._send_pdf = send_pdf      # upload whole PDFs (server v2.0+ rasterizes them)
        self._lang = lang              # optional per-request language (server v2.1+)
        endpoint = endpoint.rstrip("/")
        if endpoint.endswith("/ocr") or "/predict/" in endpoint:
            self._ocr_url = endpoint
            self._base = endpoint.rsplit("/", 1)[0]
        else:
            self._ocr_url = f"{endpoint}/ocr"
            self._base = endpoint
        self._endpoint = self._base  # kept for logging/metadata
        self._dpi = dpi
        self._engine_name = engine_name
        headers = {}
        if api_key:
            headers = {"Authorization": f"Bearer {api_key}", "X-API-Key": api_key}
        self._client = httpx.Client(timeout=timeout, transport=transport, headers=headers)

    def health(self) -> bool:
        for url in (f"{self._base}/health", self._base):
            try:
                if self._client.get(url).status_code < 500:
                    return True
            except httpx.HTTPError:
                continue
        return False

    def _form_data(self) -> dict | None:
        return {"lang": self._lang} if self._lang else None

    def _page_from(self, file_path: str, page_number: int, data: dict) -> ExtractedPage:
        text, confidence, tokens = _parse_ocr_response(data)
        for token in tokens:
            token.page_number = page_number
        return ExtractedPage(
            document_id=file_path,
            page_number=page_number,
            text=text,
            source_url=f"file://{file_path}",
            location_reference=f"page {page_number}",
            confidence=confidence,
            tokens=tokens,
            metadata={"ocr_engine": self._engine_name, "endpoint": self._ocr_url},
        )

    def ocr_image(
        self, image_bytes: bytes, page_number: int = 1, document_id: str = "image"
    ) -> ExtractedPage:
        """OCR one page image (used by the PDF router for the scanned pages of MIXED docs)."""
        if self._request_format == "multipart":
            response = self._client.post(
                self._ocr_url,
                files={"file": (f"page{page_number}.png", image_bytes, "image/png")},
                data=self._form_data(),
            )
        else:
            encoded = base64.b64encode(image_bytes).decode("ascii")
            response = self._client.post(
                self._ocr_url, json={"image_b64": encoded, "images": [encoded]}
            )
        response.raise_for_status()
        return self._page_from(document_id, page_number, response.json())

    def extract(self, file_path: str) -> list[ExtractedPage]:
        path = Path(file_path)
        is_pdf = path.suffix.lower() == ".pdf"

        # Preferred: upload the whole PDF once — the server rasterizes + OCRs per page.
        if self._request_format == "multipart" and is_pdf and self._send_pdf:
            response = self._client.post(
                self._ocr_url,
                files={"file": (path.name, path.read_bytes(), "application/pdf")},
                data=self._form_data(),
            )
            if response.status_code not in (413, 415):  # too big / not supported -> fallback
                response.raise_for_status()
                data = response.json()
                if data.get("type") == "pdf" and "pages" in data:
                    return [
                        self._page_from(file_path, page.get("page", i + 1),
                                        {"results": page.get("results", [])})
                        for i, page in enumerate(data["pages"])
                    ]
                return [self._page_from(file_path, 1, data)]

        # Fallback / images: rasterize locally, one page-image per request.
        pages: list[ExtractedPage] = []
        for page_number, image_bytes in _rasterize(file_path, dpi=self._dpi):
            if self._request_format == "multipart":
                response = self._client.post(
                    self._ocr_url,
                    files={"file": (f"page{page_number}.png", image_bytes, "image/png")},
                    data=self._form_data(),
                )
            else:  # json_b64 — PaddleHub-style servers
                encoded = base64.b64encode(image_bytes).decode("ascii")
                response = self._client.post(
                    self._ocr_url, json={"image_b64": encoded, "images": [encoded]}
                )
            response.raise_for_status()
            pages.append(self._page_from(file_path, page_number, response.json()))
        return pages


class FallbackRemotePaddleOCR(RemotePaddleOCR):
    """Paddle primary with boxed Tesseract fallback and citation-token comparison."""

    def __init__(self, *args, fallback=None, **kwargs):
        super().__init__(*args, **kwargs)
        self._fallback = fallback or TesseractOCR()

    def extract(self, file_path: str) -> list[ExtractedPage]:
        from packages.extractors.metrics import citation_tokens_disagree
        try:
            primary = super().extract(file_path)
        except (httpx.HTTPError, OSError):
            pages = self._fallback.extract(file_path)
            for page in pages:
                page.metadata["ocr_fallback_reason"] = "Paddle unavailable"
            return pages
        if os.getenv("OCR_VERIFY_CROSS_ENGINE", "1") != "1":
            return primary
        secondary = self._fallback.extract(file_path)
        by_page = {p.page_number: p for p in secondary}
        for page in primary:
            other = by_page.get(page.page_number)
            page.metadata["citation_token_disagreement"] = bool(
                other and citation_tokens_disagree(page.text, other.text))
            page.metadata["cross_engine"] = "tesseract"
        return primary

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        from packages.extractors.metrics import citation_tokens_disagree
        try:
            primary = super().ocr_image(image_bytes, page_number, document_id)
        except (httpx.HTTPError, OSError):
            fallback = self._fallback.ocr_image(image_bytes, page_number, document_id)
            fallback.metadata["ocr_fallback_reason"] = "Paddle unavailable"
            return fallback
        if os.getenv("OCR_VERIFY_CROSS_ENGINE", "1") == "1":
            other = self._fallback.ocr_image(image_bytes, page_number, document_id)
            primary.metadata["citation_token_disagreement"] = citation_tokens_disagree(
                primary.text, other.text)
            primary.metadata["cross_engine"] = "tesseract"
        return primary


class PaddleVLCascade:
    """Scanned-page route: PaddleOCR-VL -> PaddleOCR -> Tesseract.

    The VL response is accepted as canonical OCR only when it preserves token
    boxes. Text-only/Markdown VL output remains useful diagnostically but cannot
    create CitationProof, so the deterministic OCR fallback is used instead.
    """

    def __init__(self, vl: RemotePaddleOCR, fallback: FallbackRemotePaddleOCR):
        self._vl = vl
        self._fallback = fallback

    @staticmethod
    def _proof_capable(pages: list[ExtractedPage]) -> bool:
        return bool(pages) and all(
            page.text.strip() and page.tokens
            and all(token.bbox is not None for token in page.tokens)
            for page in pages
        )

    def extract(self, file_path: str) -> list[ExtractedPage]:
        try:
            pages = self._vl.extract(file_path)
            if not self._proof_capable(pages):
                raise ValueError("PaddleOCR-VL response lacks citation-capable token boxes")
            return pages
        except (httpx.HTTPError, OSError, ValueError):
            pages = self._fallback.extract(file_path)
            for page in pages:
                page.metadata["ocr_fallback_reason"] = "PaddleOCR-VL unavailable or proof-incomplete"
            return pages

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        try:
            page = self._vl.ocr_image(image_bytes, page_number, document_id)
            if not self._proof_capable([page]):
                raise ValueError("PaddleOCR-VL response lacks citation-capable token boxes")
            return page
        except (httpx.HTTPError, OSError, ValueError):
            page = self._fallback.ocr_image(image_bytes, page_number, document_id)
            page.metadata["ocr_fallback_reason"] = (
                "PaddleOCR-VL unavailable or proof-incomplete"
            )
            return page


# Matches this OCR model's own output convention, one region per line:
#   <label> [x0, y0, x1, y1]<text...>
# e.g. "header [47, 82, 238, 103]TOP LEFT MARKER" (verified against
# baidu/Unlimited-OCR served via vLLM, 29 Sep 2026). `label` (header/footer/
# text/...) is descriptive, not load-bearing, so any word before the bracket
# is accepted. A region's text runs to end-of-line — this model doesn't
# escape newlines within a region.
_OCR_REGION = re.compile(
    r"^\s*\S+\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\](.*)$"
)
# The coordinate system verified above is a FIXED 1000x1000 canvas regardless
# of the source image's actual size — confirmed by placing marker text at
# known pixel positions on a 1000x1000 test image (near-exact 1:1 match) vs.
# an 834x313 image (returned y-values up to 482, exceeding the real 313px
# height, until rescaled by height/1000). Verify this against your own
# server/model before trusting it in production; it is not a documented,
# guaranteed API contract, just an empirically reverse-engineered one.
_OCR_MODEL_CANVAS = 1000.0


def _png_dimensions(png_bytes: bytes) -> tuple[int, int] | None:
    """Width/height from a PNG's IHDR chunk — no imaging library needed.
    `_rasterize()` above always produces PNG, so this covers every real call;
    returns None (caller skips bbox rescaling) for anything else."""
    if len(png_bytes) < 24 or png_bytes[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    width, height = struct.unpack(">II", png_bytes[16:24])
    return width, height


class OpenAICompatibleVisionOCR:
    """Self-hosted vision-language OCR model behind an OpenAI-compatible
    /v1/chat/completions endpoint (vLLM etc.) — image in, structured regions
    out. This is the "Unlimited-OCR" option .env.example describes
    (OCR_BASE_URL / OCR_API_KEY / OCR_MODEL); it wasn't wired to any provider
    until now.

    Unlike a generic vision-chat model, the specific model this was verified
    against (baidu/Unlimited-OCR) is trained to emit its own structured
    per-region format (`<label> [x0,y0,x1,y1]<text>`, one region per line —
    see _OCR_REGION) rather than free prose, so it CAN produce per-token
    bounding boxes: _OCR_REGION parses them, rescaled from that model's fixed
    1000x1000 output canvas to the source image's real pixel dimensions (see
    _png_dimensions/_OCR_MODEL_CANVAS — verified empirically, not a
    documented API contract). A prompt asking for anything beyond a plain
    transcription instruction (e.g. "no commentary, no markdown") reliably
    made this model return empty content in testing — keep prompts minimal.

    A genuinely different, general-purpose vision-chat model behind this same
    endpoint shape would answer in free prose instead, and this parser would
    then find zero regions — ocr_image() falls back to tokens=[] (text-only,
    not citation-proof-capable, matching PaddleVLCascade._proof_capable's
    bbox-required contract) rather than fabricating boxes in that case.
    """

    RETRY_BACKOFFS_S = (5.0, 20.0)

    def __init__(self, base_url: str, model: str, api_key: str | None = None,
                 timeout: float = 120.0, prompt: str | None = None) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._api_key = api_key
        self._timeout = timeout
        # Kept deliberately minimal — see class docstring on why extra
        # instructions ("no commentary", "no markdown") broke this model.
        self._prompt = prompt or (
            "Transcribe every word of visible text on this page, in reading "
            "order. Return ONLY the transcribed text."
        )

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        import time as _time

        encoded = base64.b64encode(image_bytes).decode("ascii")
        body = {
            "model": self._model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": self._prompt},
                    {"type": "image_url",
                     "image_url": {"url": f"data:image/png;base64,{encoded}"}},
                ],
            }],
            "temperature": 0,
        }
        last_error: Exception | None = None
        response = None
        for attempt in range(1 + len(self.RETRY_BACKOFFS_S)):
            try:
                response = httpx.post(f"{self._base_url}/chat/completions",
                                      headers=self._headers(), json=body,
                                      timeout=self._timeout)
                if response.status_code == 429 or response.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"retryable {response.status_code}",
                        request=response.request, response=response)
                response.raise_for_status()
                break
            except (httpx.HTTPStatusError, httpx.TransportError) as error:
                last_error = error
                if attempt < len(self.RETRY_BACKOFFS_S):
                    _time.sleep(self.RETRY_BACKOFFS_S[attempt])
                else:
                    raise last_error
        payload = response.json()
        raw = payload["choices"][0]["message"]["content"] or ""

        dims = _png_dimensions(image_bytes)
        scale_x = (dims[0] / _OCR_MODEL_CANVAS) if dims else 1.0
        scale_y = (dims[1] / _OCR_MODEL_CANVAS) if dims else 1.0
        tokens: list[OCRToken] = []
        text_lines: list[str] = []
        for line in raw.splitlines():
            match = _OCR_REGION.match(line)
            if not match:
                continue  # preamble/non-region lines (e.g. echoed model chatter)
            x0, y0, x1, y1, region_text = match.groups()
            region_text = region_text.strip()
            if not region_text:
                continue
            text_lines.append(region_text)
            bbox = ([float(x0) * scale_x, float(y0) * scale_y,
                     float(x1) * scale_x, float(y1) * scale_y] if dims else None)
            tokens.append(OCRToken(text=region_text, confidence=None,
                                   bbox=bbox, page_number=page_number))
        # No parseable regions (e.g. a general prose-answering model behind
        # this same endpoint shape): fall back to the raw text, no tokens —
        # see class docstring.
        text = "\n".join(text_lines) if tokens else raw
        return ExtractedPage(
            document_id=document_id, page_number=page_number, text=text,
            source_url=f"file://{document_id}", location_reference=f"page {page_number}",
            confidence=None, tokens=tokens if dims else [],
            metadata={"ocr_engine": "openai_compatible_vision", "model": self._model,
                      "region_count": len(tokens), "raw_response": raw[:2000]},
        )

    def extract(self, file_path: str) -> list[ExtractedPage]:
        return [self.ocr_image(image, page_no, file_path)
                for page_no, image in _rasterize(file_path)]

    def health(self) -> bool:
        try:
            return httpx.get(f"{self._base_url}/models", headers=self._headers(),
                             timeout=10).status_code < 500
        except httpx.HTTPError:
            return False


class GoogleVisionOCR:
    """Google Cloud Vision OCR at minimum billable cost.

    Exactly ONE feature per request — DOCUMENT_TEXT_DETECTION (dense-text OCR).
    No logo/label/face/landmark features are ever requested: Vision bills per
    feature-unit per image, so each page costs exactly one OCR unit.
    Fail-closed: API errors raise; any fallback is an explicit router decision,
    never a silent substitution.
    """

    ENDPOINT = "https://vision.googleapis.com/v1/images:annotate"

    def __init__(self, api_key: str, language_hints: list[str] | None = None,
                 timeout: float = 90.0):
        if not api_key:
            raise ValueError("GoogleVisionOCR requires an api key "
                             "(GOOGLE_VISION_API_KEY in engine/.env)")
        self._key = api_key
        self._hints = [h for h in (language_hints or []) if h]
        self._timeout = timeout

    RETRY_DELAYS_S = (3.0, 10.0)

    def _post_with_retry(self, body: dict) -> httpx.Response:
        """Transient failures (timeout, transport error, 429/5xx) are retried twice
        with backoff; one 502 must not drop an 89-page scanned code from the corpus
        (TL CPP, 29 Sep). Other errors — and the last failed attempt — still raise."""
        for delay in (*self.RETRY_DELAYS_S, None):
            try:
                response = httpx.post(f"{self.ENDPOINT}?key={self._key}", json=body,
                                      timeout=self._timeout)
            except (httpx.TimeoutException, httpx.TransportError):
                if delay is None:
                    raise
            else:
                if response.status_code != 429 and response.status_code < 500 or delay is None:
                    return response
            time.sleep(delay)
        raise AssertionError("unreachable")

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        request: dict = {
            "image": {"content": base64.b64encode(image_bytes).decode("ascii")},
            "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
        }
        if self._hints:
            request["imageContext"] = {"languageHints": self._hints}
        response = self._post_with_retry({"requests": [request]})
        response.raise_for_status()
        payload = (response.json().get("responses") or [{}])[0]
        if payload.get("error"):
            raise RuntimeError(f"google_vision error: {payload['error'].get('message', 'unknown')}")
        annotation = payload.get("fullTextAnnotation") or {}
        text = annotation.get("text", "")
        tokens: list[OCRToken] = []
        page_confidences: list[float] = []
        for vpage in annotation.get("pages", []):
            if vpage.get("confidence") is not None:
                page_confidences.append(float(vpage["confidence"]))
            for block in vpage.get("blocks", []):
                for paragraph in block.get("paragraphs", []):
                    for word in paragraph.get("words", []):
                        word_text = "".join(s.get("text", "") for s in word.get("symbols", []))
                        if not word_text.strip():
                            continue
                        vertices = (word.get("boundingBox") or {}).get("vertices") or []
                        bbox = None
                        if vertices:
                            xs = [float(v.get("x", 0)) for v in vertices]
                            ys = [float(v.get("y", 0)) for v in vertices]
                            bbox = [min(xs), min(ys), max(xs), max(ys)]
                        tokens.append(OCRToken(
                            text=word_text,
                            confidence=(float(word["confidence"])
                                        if word.get("confidence") is not None else None),
                            bbox=bbox, page_number=page_number))
        word_confidences = [t.confidence for t in tokens if t.confidence is not None]
        confidence = (sum(page_confidences) / len(page_confidences) if page_confidences
                      else (sum(word_confidences) / len(word_confidences)
                            if word_confidences else None))
        return ExtractedPage(
            document_id=document_id, page_number=page_number, text=text,
            source_url=f"file://{document_id}",
            location_reference=f"page {page_number}",
            confidence=confidence, tokens=tokens,
            metadata={"ocr_engine": "google_vision",
                      "feature": "DOCUMENT_TEXT_DETECTION", "billed_units": 1,
                      **({"language_hints": self._hints} if self._hints else {})})

    def extract(self, file_path: str) -> list[ExtractedPage]:
        return [self.ocr_image(image, page_no, file_path)
                for page_no, image in _rasterize(file_path)]


def _script_chars(text: str, script: str) -> int:
    ranges = {"thai": ("฀", "๿"), "devanagari": ("ऀ", "ॿ"),
              "lao": ("຀", "໿"), "cyrillic": ("Ѐ", "ӿ")}
    lo, hi = ranges.get(script, ("", ""))
    return sum(1 for ch in text if lo <= ch <= hi) if lo else 0


class HybridScriptOCR:
    """Cost-first routing: free self-hosted Paddle for Latin-script pages,
    Google Vision only where Paddle cannot read (non-Latin scripts) or where
    its output fails the confidence/script sanity checks.

    route="vision-first": pages go straight to Vision (no double spend — used
    for Thai/Devanagari documents where Paddle is known-blind).
    route="paddle-first": Paddle runs first; a page escalates to Vision when
    confidence < conf_floor, the text is empty, or an expected script is
    absent. Every escalation is recorded in page metadata — never silent.
    """

    def __init__(self, paddle, vision, route: str = "paddle-first",
                 expect_script: str | None = None, conf_floor: float = 0.85):
        self._paddle, self._vision = paddle, vision
        self._route = route
        self._expect = expect_script
        self._floor = conf_floor

    def ocr_image(self, image_bytes: bytes, page_number: int = 1,
                  document_id: str = "image") -> ExtractedPage:
        if self._route == "vision-first":
            page = self._vision.ocr_image(image_bytes, page_number, document_id)
            page.metadata["ocr_route"] = "vision-first"
            return page
        try:
            page = self._paddle.ocr_image(image_bytes, page_number, document_id)
            reason = None
            if not page.text.strip():
                reason = "empty paddle output"
            elif page.confidence is not None and page.confidence < self._floor:
                reason = f"paddle confidence {page.confidence:.2f} < {self._floor}"
            elif self._expect and _script_chars(page.text, self._expect) == 0:
                reason = f"expected {self._expect} script absent from paddle output"
        except (httpx.HTTPError, OSError) as error:
            page, reason = None, f"paddle unavailable: {type(error).__name__}"
        if reason is None:
            page.metadata["ocr_route"] = "paddle-first"
            return page
        escalated = self._vision.ocr_image(image_bytes, page_number, document_id)
        escalated.metadata.update(ocr_route="paddle-first",
                                  ocr_escalated_from="remote_paddle",
                                  ocr_escalation_reason=reason)
        return escalated

    def extract(self, file_path: str) -> list[ExtractedPage]:
        return [self.ocr_image(image, page_no, file_path)
                for page_no, image in _rasterize(file_path)]


def build_ocr(config: dict | None):
    """Factory keyed on the profile's ocr.provider (models.yaml) — the config-only swap."""
    config = config or {}
    provider = str(config.get("provider", "local")).strip().lower()
    if provider in {"tesseract", "local_tesseract"}:
        return TesseractOCR()
    if provider in {"hybrid_script", "hybrid"}:
        paddle = build_ocr({**config, "provider": "remote_paddle"})
        vision = build_ocr({**config, "provider": "google_vision"})
        return HybridScriptOCR(paddle, vision,
                               route=str(config.get("route", "paddle-first")),
                               expect_script=config.get("expect_script"),
                               conf_floor=float(config.get("conf_floor", 0.85)))
    if provider in {"google_vision", "gvision"}:
        hints = config.get("language_hints") or os.getenv("GOOGLE_VISION_LANG_HINTS", "")
        if isinstance(hints, str):
            hints = [h.strip() for h in hints.split(",") if h.strip()]
        return GoogleVisionOCR(
            api_key=config.get("api_key") or os.getenv("GOOGLE_VISION_API_KEY", ""),
            language_hints=hints)
    if provider in {"openai_compatible", "unlimited", "vllm_vision"}:
        # "Unlimited-OCR" in .env.example — a self-hosted OpenAI-compatible
        # vision chat endpoint (vLLM etc). Text-only: see
        # OpenAICompatibleVisionOCR's docstring for why it can't produce
        # citation-proof-capable (bbox-anchored) pages.
        base_url = config.get("base_url") or os.getenv("OCR_BASE_URL", "")
        if not base_url:
            raise RuntimeError("OCR_BASE_URL is not set")
        return OpenAICompatibleVisionOCR(
            base_url=base_url,
            model=config.get("model") or os.getenv("OCR_MODEL", "unlimited-ocr"),
            api_key=config.get("api_key") or os.getenv("OCR_API_KEY") or None,
            timeout=float(config.get("timeout") or os.getenv("OCR_TIMEOUT_S", "120")),
        )
    if provider in {"remote_paddle", "paddle_remote", "remote"}:
        endpoint = config.get("endpoint") or os.getenv("OCR_ENDPOINT", "http://localhost:8089")
        api_key = (config.get("api_key") or os.getenv("PADDLE_OCR_API_KEY")
                   or os.getenv("OCR_API_KEY") or None)
        request_format = (
            config.get("request_format") or os.getenv("OCR_REQUEST_FORMAT") or "multipart"
        )
        lang = config.get("lang") or os.getenv("OCR_LANG") or None
        standard = FallbackRemotePaddleOCR(
            endpoint, api_key=api_key, request_format=request_format, lang=lang
        )
        vl_endpoint = config.get("vl_endpoint") or os.getenv("OCR_VL_ENDPOINT")
        if vl_endpoint:
            vl_request_format = (
                config.get("vl_request_format") or
                os.getenv("OCR_VL_REQUEST_FORMAT") or request_format
            )
            vl = RemotePaddleOCR(
                vl_endpoint, api_key=(config.get("vl_api_key") or
                                      os.getenv("OCR_VL_API_KEY") or api_key),
                request_format=vl_request_format, lang=lang,
                engine_name="remote_paddle_vl",
            )
            return PaddleVLCascade(vl, standard)
        return standard
    return LocalOCRPlaceholder()
