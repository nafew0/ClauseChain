from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rename all PDFs in a folder sequentially using the folder name as prefix.")
    parser.add_argument("folder", help="Folder containing PDFs to rename.")
    parser.add_argument(
        "--start",
        type=int,
        default=1,
        help="Starting number for the sequence. Default: 1.",
    )
    parser.add_argument(
        "--prefix",
        default=None,
        help="Filename prefix. Default: folder name.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned renames without changing files.",
    )
    return parser.parse_args()


def _slugify(value: str) -> str:
    cleaned = "_".join(part for part in "".join(ch.lower() if ch.isalnum() else "_" for ch in value).split("_") if part)
    return cleaned or "pdf"


def rename_pdfs(folder: str | Path, start: int = 1, prefix: str | None = None, dry_run: bool = False) -> list[tuple[Path, Path]]:
    folder = Path(folder)
    if not folder.exists() or not folder.is_dir():
        raise ValueError(f"Folder does not exist or is not a directory: {folder}")
    if start < 1:
        raise ValueError("--start must be >= 1")

    pdfs = sorted(path for path in folder.iterdir() if path.is_file() and path.suffix.lower() == ".pdf")
    name_prefix = _slugify(prefix or folder.name)
    width = max(2, len(str(start + max(len(pdfs) - 1, 0))))

    plans: list[tuple[Path, Path]] = []
    for offset, source in enumerate(pdfs):
        number = start + offset
        plans.append((source, folder / f"{name_prefix}_{number:0{width}d}.pdf"))

    if dry_run:
        return plans

    temp_paths: list[tuple[Path, Path]] = []
    for index, (source, target) in enumerate(plans, start=1):
        temp = folder / f".__rename_tmp__{index}__.pdf"
        source.rename(temp)
        temp_paths.append((temp, target))

    for temp, target in temp_paths:
        temp.rename(target)

    return plans


def main() -> int:
    args = parse_args()
    plans = rename_pdfs(args.folder, start=args.start, prefix=args.prefix, dry_run=args.dry_run)
    if not plans:
        print("No PDF files found.")
        return 0
    for source, target in plans:
        print(f"{source.name} -> {target.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
