from __future__ import annotations

import argparse
from pathlib import Path

from packages.core.orchestrator import run
from packages.export.csv_writer import write_csv
from packages.export.json_writer import write_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ClauseChain engine skeleton.")
    parser.add_argument("--country", required=True, help="Economy code, e.g. SG, MY, AU.")
    parser.add_argument("--pillar", required=True, type=int, help="RDTII pillar number, e.g. 6.")
    parser.add_argument(
        "--out",
        default="outputs/demo",
        help="Output directory for output.csv and output.json.",
    )
    parser.add_argument(
        "--provider-profile",
        default="cheap_default",
        help="Provider profile from configs/models.yaml.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    envelope = run(
        country=args.country,
        pillar=args.pillar,
        provider_profile=args.provider_profile,
    )

    write_csv(envelope.findings, out_dir / "output.csv")
    write_json(envelope, out_dir / "output.json")

    print(f"Wrote {out_dir / 'output.csv'}")
    print(f"Wrote {out_dir / 'output.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

