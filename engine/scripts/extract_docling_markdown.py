from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Sequence

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".html", ".md", ".txt"}
SUPPORTED_DEVICES = {"auto", "cpu", "cuda", "mps", "xpu"}


def iter_input_files(input_path: str | Path) -> list[Path]:
    input_path = Path(input_path)
    if input_path.is_file():
        if input_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {input_path}")
        return [input_path]
    return sorted(
        path
        for path in input_path.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def _default_output_path(
    source_path: Path, input_root: Path, output_root: Path, suffix: str
) -> Path:
    relative = (
        source_path.relative_to(input_root)
        if input_root.is_dir()
        else Path(source_path.name)
    )
    return output_root / relative.with_suffix(suffix)


def _resolve_docling_document(result: Any) -> Any:
    if hasattr(result, "document"):
        return result.document
    return result


def _export_markdown(document: Any) -> str:
    for method_name in ("export_to_markdown", "to_markdown"):
        method = getattr(document, method_name, None)
        if callable(method):
            return method()
    raise RuntimeError(
        "Docling document object does not expose a Markdown export method."
    )


def _export_json(document: Any) -> dict[str, Any]:
    for method_name in ("export_to_dict", "model_dump"):
        method = getattr(document, method_name, None)
        if callable(method):
            data = method()
            if isinstance(data, dict):
                return data
    json_method = getattr(document, "json", None)
    if callable(json_method):
        payload = json_method()
        return json.loads(payload) if isinstance(payload, str) else payload
    raise RuntimeError(
        "Docling document object does not expose a JSON/dict export method."
    )


def _build_pdf_converter(
    *,
    device: str,
    num_threads: int,
    page_batch_size: int,
    ocr_batch_size: int,
    layout_batch_size: int,
    table_batch_size: int,
):
    from docling.datamodel.accelerator_options import (
        AcceleratorDevice,
        AcceleratorOptions,
    )
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import ThreadedPdfPipelineOptions
    from docling.datamodel.settings import settings
    from docling.document_converter import DocumentConverter, PdfFormatOption

    accelerator_options = AcceleratorOptions(
        num_threads=num_threads,
        device=AcceleratorDevice(device),
    )
    pipeline_options = ThreadedPdfPipelineOptions(
        accelerator_options=accelerator_options,
        ocr_batch_size=ocr_batch_size,
        layout_batch_size=layout_batch_size,
        table_batch_size=table_batch_size,
    )
    settings.perf.page_batch_size = page_batch_size
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )


def _build_default_converter():
    from docling.document_converter import DocumentConverter

    return DocumentConverter()


def convert_with_docling(
    source_path: str | Path,
    *,
    device: str = "auto",
    num_threads: int = 4,
    page_batch_size: int = 4,
    ocr_batch_size: int = 4,
    layout_batch_size: int = 4,
    table_batch_size: int = 4,
) -> tuple[str, dict[str, Any]]:
    try:
        import docling  # noqa: F401
    except ImportError as error:  # pragma: no cover
        raise RuntimeError(
            "Docling is not installed. Run `uv sync --group docling` before using this script."
        ) from error

    source_path = Path(source_path)
    if source_path.suffix.lower() == ".pdf":
        converter = _build_pdf_converter(
            device=device,
            num_threads=num_threads,
            page_batch_size=page_batch_size,
            ocr_batch_size=ocr_batch_size,
            layout_batch_size=layout_batch_size,
            table_batch_size=table_batch_size,
        )
    else:
        converter = _build_default_converter()

    result = converter.convert(str(source_path))
    document = _resolve_docling_document(result)
    return _export_markdown(document), _export_json(document)


def write_docling_outputs(
    source_path: str | Path,
    markdown_path: str | Path,
    *,
    write_json: bool = True,
    json_path: str | Path | None = None,
    device: str = "auto",
    num_threads: int = 4,
    page_batch_size: int = 4,
    ocr_batch_size: int = 4,
    layout_batch_size: int = 4,
    table_batch_size: int = 4,
) -> tuple[Path, Path | None]:
    markdown, payload = convert_with_docling(
        source_path,
        device=device,
        num_threads=num_threads,
        page_batch_size=page_batch_size,
        ocr_batch_size=ocr_batch_size,
        layout_batch_size=layout_batch_size,
        table_batch_size=table_batch_size,
    )
    markdown_path = Path(markdown_path)
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    written_json: Path | None = None
    if write_json:
        written_json = Path(json_path) if json_path else markdown_path.with_suffix(
            ".json"
        )
        written_json.parent.mkdir(parents=True, exist_ok=True)
        written_json.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return markdown_path, written_json


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert documents with Docling to Markdown (and optional JSON) to inspect structure preservation quality."
    )
    parser.add_argument(
        "input", help="A document file or a directory tree containing supported files."
    )
    parser.add_argument(
        "--out",
        default="data/cache/docling",
        help="Output directory for Markdown/JSON exports.",
    )
    parser.add_argument(
        "--no-json",
        action="store_true",
        help="Skip JSON export and only write Markdown.",
    )
    parser.add_argument(
        "--device",
        default="auto",
        choices=sorted(SUPPORTED_DEVICES),
        help="Docling accelerator device for PDFs. Use `cuda` to enable GPU when CUDA-enabled PyTorch is installed.",
    )
    parser.add_argument(
        "--num-threads",
        type=int,
        default=4,
        help="Worker thread count for the PDF pipeline.",
    )
    parser.add_argument(
        "--page-batch-size",
        type=int,
        default=4,
        help="Docling page batch size. Increase cautiously on GPU; 4 or 8 is a reasonable starting point on 6 GB VRAM.",
    )
    parser.add_argument(
        "--ocr-batch-size",
        type=int,
        default=4,
        help="OCR batch size for PDF pages.",
    )
    parser.add_argument(
        "--layout-batch-size",
        type=int,
        default=4,
        help="Layout model batch size for PDF pages.",
    )
    parser.add_argument(
        "--table-batch-size",
        type=int,
        default=4,
        help="Table extraction batch size for PDF pages.",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_root = Path(args.out)
    files = iter_input_files(input_path)
    if not files:
        raise SystemExit(f"No supported files found under: {input_path}")

    failures: list[tuple[Path, str]] = []
    for source_path in files:
        markdown_path = _default_output_path(
            source_path, input_path, output_root, ".md"
        )
        print(f"Processing {source_path.name}...", flush=True)
        try:
            written_md, written_json = write_docling_outputs(
                source_path,
                markdown_path,
                write_json=not args.no_json,
                device=args.device,
                num_threads=args.num_threads,
                page_batch_size=args.page_batch_size,
                ocr_batch_size=args.ocr_batch_size,
                layout_batch_size=args.layout_batch_size,
                table_batch_size=args.table_batch_size,
            )
        except Exception as error:
            failures.append((source_path, str(error)))
            print(f"Failed {source_path.name}: {error}", flush=True)
            continue
        print(f"Saved {written_md}", flush=True)
        if written_json is not None:
            print(f"Saved {written_json}", flush=True)

    if failures:
        print("Failures:", flush=True)
        for source_path, error in failures:
            print(f"  {source_path} -> {error}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
