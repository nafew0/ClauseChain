"""Bring hybrid reruns into the review inputs, then export the UI bundle.

A hybrid run only writes outputs/<run>/output.json. The review snapshot is
imported from files derived from those outputs (refuter verdicts, the
consolidated candidate set, zone-3 score suggestions, the review bundle and its
unsigned decision template, the champion report), so a rerun reaches the app
only after they are rebuilt. This is the same chain as deploy/night_chain.sh,
run for the runs whose output.json is newer than submission/consolidated.json:

  refute_new (changed runs) -> consolidate (all runs) -> adjudicate_recall
  (round-1 runs, only when one of them changed) -> zone3_score (changed runs)
  -> build_review_bundle -> champion_validate -> export_ui_bundle

With no changed run it only exports the bundle, exactly as before. Signed
decisions are never touched here: apply_decisions.py carries every decision
whose finding and review subject survive the new template, and the rest keep
their receipts in the exported bundles.

Usage: .venv/bin/python scripts/prepare_review_inputs.py [--out ui_export.zip] [--run final_r2_th_p6 ...]
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core import progress  # noqa: E402

# The runs the review snapshot imports (backend/workspace/importer.py RUN_NAMES),
# in the order consolidated.json has always listed them.
ROUND1_RUNS = ["final_si_p6", "final_si_p7", "final_ma_p6", "final_ma_p7",
               "final_au_p6", "final_au_p7"]
RUNS = ROUND1_RUNS + ["final_r2_th_p6", "final_r2_th_p7", "final_r2_in_p6",
                      "final_r2_in_p7", "final_r2_id_p6", "final_r2_id_p7"]
CONSOLIDATED = Path("submission/consolidated.json")


def changed_runs() -> list[str]:
    """Runs whose output is newer than the consolidated candidate set."""
    if not CONSOLIDATED.is_file():
        return [run for run in RUNS if Path(f"outputs/{run}/output.json").is_file()]
    built = CONSOLIDATED.stat().st_mtime
    return [run for run in RUNS
            if Path(f"outputs/{run}/output.json").is_file()
            and Path(f"outputs/{run}/output.json").stat().st_mtime > built]


def step(name: str, argv: list[str], *, advisory: bool = False) -> None:
    started = time.time()
    progress.emit("prepare", f"{name}…")
    result = subprocess.run([sys.executable, *argv])
    if result.returncode and advisory:
        # A FAIL report is itself the output: the app shows it as the
        # evidence-integrity banner, so it must not block the refresh.
        progress.emit("prepare", f"{name} reported failures (exit {result.returncode}); "
                                 "they are shown in the app", level="warn")
    elif result.returncode:
        progress.emit("prepare", f"{name} failed (exit {result.returncode}); "
                                 "the snapshot was not refreshed", level="error")
        raise SystemExit(result.returncode)
    progress.emit("prepare", f"{name} done in {time.time() - started:.0f}s")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="ui_export.zip")
    parser.add_argument("--run", action="append", choices=RUNS,
                        help="force a run through the chain even if its output is not newer")
    args = parser.parse_args()

    changed = sorted(set(changed_runs()) | set(args.run or []), key=RUNS.index)
    dirs = [f"outputs/{run}" for run in RUNS if Path(f"outputs/{run}/output.json").is_file()]
    changed_dirs = [f"outputs/{run}" for run in changed]
    if changed:
        progress.emit("prepare", f"rebuilding review inputs for {', '.join(changed)}")
        step("refuter panel on new rows", ["scripts/refute_new.py", *changed_dirs])
        step("consolidating the candidate set", ["scripts/consolidate_submission.py", *dirs])
        if any(run in ROUND1_RUNS for run in changed):
            step("recall adjudication", ["scripts/adjudicate_recall.py",
                                         *[f"outputs/{run}" for run in ROUND1_RUNS]])
        step("zone-3 score suggestions", ["scripts/zone3_score.py", *changed_dirs])
        step("review bundle and decision template", ["scripts/build_review_bundle.py"])
        step("champion validation", ["scripts/champion_validate.py"], advisory=True)
    else:
        progress.emit("prepare", "no hybrid run changed since the last consolidation")
    step("exporting the UI bundle", ["scripts/export_ui_bundle.py", "--out", args.out])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
