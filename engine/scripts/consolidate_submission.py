"""Merge per-run outputs into the ONE consolidated submission artifact (15-Jun rule).

Usage:
  .venv/bin/python scripts/consolidate_submission.py outputs/p1_sg_p6_v4 outputs/p1_sg_p7_v2 \
      outputs/p2_my_p6_v3 outputs/p2_au_p6 [more run dirs...]

Writes submission/consolidated.csv (template columns, all economies/pillars) and
consolidated_final.csv (only auto-cleared + legal-approved rows), + JSON.
"""
from __future__ import annotations

import csv
import json
import sys
from datetime import date
from pathlib import Path


def read(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    return list(csv.DictReader(path.open(encoding="utf-8")))


def main() -> int:
    run_dirs = [Path(a) for a in sys.argv[1:]]
    if not run_dirs:
        print(__doc__)
        return 1
    out = Path("submission")
    out.mkdir(exist_ok=True)

    all_rows, final_rows, seen = [], [], set()
    header = None
    for run in run_dirs:
        rows = read(run / "output.csv")
        finals = {(r["Economy"], r["Indicator ID"], r["Law Name"], r["Article / Section"])
                  for r in read(run / "final_output.csv")}
        for r in rows:
            key = (r["Economy"], r["Indicator ID"], r["Law Name"], r["Article / Section"])
            if key in seen:
                continue
            seen.add(key)
            header = header or list(r.keys())
            all_rows.append(r)
            if key in finals:
                final_rows.append(r)

    order = {"Singapore": 0, "Malaysia": 1, "Australia": 2}
    for rows_out, name in ((all_rows, "consolidated.csv"), (final_rows, "consolidated_final.csv")):
        rows_out.sort(key=lambda r: (order.get(r["Economy"], 9), r["Indicator ID"]))
        with (out / name).open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=header)
            w.writeheader()
            w.writerows(rows_out)
    (out / "consolidated.json").write_text(json.dumps(
        {"generated": date.today().isoformat(), "runs": [str(r) for r in run_dirs],
         "rows": all_rows}, indent=1))
    print(f"submission/consolidated.csv: {len(all_rows)} rows "
          f"({len(final_rows)} auto-final) from {len(run_dirs)} runs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
