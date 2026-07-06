from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Sequence

SUPPORTED_DEVICES = {"auto", "cpu", "cuda", "mps"}


def iter_pdf_files(input_path: str | Path) -> list[Path]:
    input_path = Path(input_path)
    if input_path.is_file():
        if input_path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected a PDF file, got: {input_path}")
        return [input_path]
    return sorted(path for path in input_path.rglob("*.pdf") if path.is_file())


def _default_output_path(pdf_path: Path, input_root: Path, output_root: Path) -> Path:
    relative = pdf_path.relative_to(input_root) if input_root.is_dir() else Path(pdf_path.name)
    return output_root / relative.with_suffix(".md")


def convert_with_marker(
    pdf_path: str | Path,
    *,
    device: str = "auto",
    force_ocr: bool = False,
    paginate_output: bool = False,
    strip_existing_ocr: bool = False,
    disable_image_extraction: bool = False,
    output_format: str = "markdown",
) -> str:
    try:
        from marker.config.parser import ConfigParser
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        from marker.output import text_from_rendered
    except ImportError as error:  # pragma: no cover
        raise RuntimeError(
            "Marker is not installed. Run `uv sync --group marker` before using this script."
        ) from error

    if device != "auto":
        os.environ["TORCH_DEVICE"] = device

    config = {
        "output_format": output_format,
        "force_ocr": force_ocr,
        "paginate_output": paginate_output,
        "strip_existing_ocr": strip_existing_ocr,
        "disable_image_extraction": disable_image_extraction,
    }
    config_parser = ConfigParser(config)
    converter = PdfConverter(
        config=config_parser.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
        llm_service=config_parser.get_llm_service(),
    )
    rendered = converter(str(pdf_path))
    text, _, _ = text_from_rendered(rendered)
    return text


def write_marker_markdown(
    pdf_path: str | Path,
    markdown_path: str | Path,
    *,
    device: str = "auto",
    force_ocr: bool = False,
    paginate_output: bool = False,
    strip_existing_ocr: bool = False,
    disable_image_extraction: bool = False,
) -> Path:
    markdown = convert_with_marker(
        pdf_path,
        device=device,
        force_ocr=force_ocr,
        paginate_output=paginate_output,
        strip_existing_ocr=strip_existing_ocr,
        disable_image_extraction=disable_image_extraction,
    )
    markdown_path = Path(markdown_path)
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")
    return markdown_path


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert PDF files to Markdown with Marker."
    )
    parser.add_argument("input", help="A PDF file or a directory tree containing PDFs.")
    parser.add_argument(
        "--out",
        default="data/cache/marker",
        help="Output directory for generated Markdown files.",
    )
    parser.add_argument(
        "--device",
        default="auto",
        choices=sorted(SUPPORTED_DEVICES),
        help="Torch device override for Marker. Use `cuda` to use your NVIDIA GPU.",
    )
    parser.add_argument(
        "--force-ocr",
        action="store_true",
        help="Force OCR on the full document, even when embedded PDF text exists.",
    )
    parser.add_argument(
        "--paginate-output",
        action="store_true",
        help="Insert page break markers into the Markdown output.",
    )
    parser.add_argument(
        "--strip-existing-ocr",
        action="store_true",
        help="Discard any embedded OCR text and re-run OCR through Marker.",
    )
    parser.add_argument(
        "--disable-image-extraction",
        action="store_true",
        help="Do not extract images while rendering the document.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    input_path = Path(args.input)
    output_root = Path(args.out)
    pdf_files = iter_pdf_files(input_path)
    if not pdf_files:
        raise SystemExit(f"No PDF files found under: {input_path}")

    failures: list[tuple[Path, str]] = []
    for pdf_path in pdf_files:
        markdown_path = _default_output_path(pdf_path, input_path, output_root)
        print(f"Processing {pdf_path.name}...", flush=True)
        try:
            written = write_marker_markdown(
                pdf_path,
                markdown_path,
                device=args.device,
                force_ocr=args.force_ocr,
                paginate_output=args.paginate_output,
                strip_existing_ocr=args.strip_existing_ocr,
                disable_image_extraction=args.disable_image_extraction,
            )
        except Exception as error:
            failures.append((pdf_path, str(error)))
            print(f"Failed {pdf_path.name}: {error}", flush=True)
            continue
        print(f"Saved {written}", flush=True)

    if failures:
        print("Failures:", flush=True)
        for pdf_path, error in failures:
            print(f"  {pdf_path} -> {error}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
