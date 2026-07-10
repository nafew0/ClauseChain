from __future__ import annotations

import argparse
import os
from pathlib import Path

from packages.core.envfile import load_env_file
from packages.core.orchestrator import run
from packages.export.csv_writer import write_csv
from packages.export.json_writer import write_json

load_env_file()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ClauseChain engine skeleton.")
    parser.add_argument(
        "--country",
        "--economy",
        dest="country",
        required=True,
        help="Economy code or name, e.g. SG or Singapore. (--economy matches the organizer README.)",
    )
    parser.add_argument("--pillar", required=True, type=int, help="RDTII pillar number, e.g. 6.")
    parser.add_argument(
        "--out",
        default="outputs/demo",
        help="Output directory for output.csv and output.json.",
    )
    parser.add_argument(
        "--provider-profile",
        default=os.getenv("CLAUSECHAIN_PROVIDER_PROFILE", "hybrid_accuracy"),
        help="Provider profile from configs/models.yaml (hybrid_accuracy=Path B, local_fallback=Path A key-free). Env: CLAUSECHAIN_PROVIDER_PROFILE.",
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

    # Curation layer (reviewer, 9 Jul): candidates -> legal_review -> final.
    # Only auto-clearable rows enter final_output.csv; NEW rows and flagged rows
    # wait for Legal sign-off in legal_review.csv. output.csv = all candidates.
    needs_review = [f for f in envelope.findings
                    if f.discovery_tag == "NEW"
                    or "flag" in (f.notes or "").lower()
                    or f.status != "in_force"                      # A2: unverified/unknown
                    or "PENDING_REVIEW" in f.verbatim_snippet]     # A3: absence rows
    # final_output.csv = auto-CLEARABLE rows (KNOWN + verified + gates green); the
    # SUBMITTED consolidated_final additionally requires reviewer_decision=approved
    # via scripts/approve_rows.py (L4).
    final = [f for f in envelope.findings if f not in needs_review]
    write_csv(envelope.findings, out_dir / "candidate_rows.csv")
    write_csv(needs_review, out_dir / "legal_review.csv")
    write_csv(final, out_dir / "final_output.csv")

    print(f"Wrote {out_dir / 'output.csv'} ({len(envelope.findings)} candidates; "
          f"{len(final)} auto-final, {len(needs_review)} for legal review)")
    print(f"Wrote {out_dir / 'output.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

