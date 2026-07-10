"""B4 — adversarial false-NEW control: 3 refuter personas attack every NEW row.

A false NEW costs more than a miss (DoDont §10). Each refuter is primed with the
§13 ❌-bank failure modes and tries to REFUTE the mapping. Majority-refuted rows
are recommended REJECT; the rest stay pending for the human pass. Report-only —
nothing is deleted without the user's decision.

Usage: .venv/bin/python scripts/refute_new.py outputs/final_si_p6 [more run dirs]
Writes data/review/refutation_<runname>.json
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

from pydantic import BaseModel, Field  # noqa: E402

REFUTERS = [
    "a hostile opposing counsel looking for ANY reason this mapping is wrong",
    "an ESCAP reviewer who has seen teams map keywords instead of legal function",
    "a strict textualist who rejects anything the quoted words do not plainly establish",
]

FAILURE_MODES = """Known failure modes to check (ESCAP's own ❌-bank):
- keyword match without the legal FUNCTION (confidentiality != localization; business transfer != data transfer)
- lost exception (a conditional regime misread as a ban, or vice versa)
- wrong direction (retention LIMIT "no longer than necessary" is never minimum retention 7.3)
- generic domestic disclosure/processing misread as cross-border (P6)
- court-gated access misread as warrantless (7.5 court-order test)
- provision evidences a different indicator than claimed
- the snippet does not actually support the rationale"""


class Refutation(BaseModel):
    refuted: bool
    reason: str = Field(default="")


def main() -> int:
    from packages.providers.model_router import resolve_llm

    llm = resolve_llm("hybrid_accuracy", tier="high_reasoning")
    out_dir = Path("data/review")
    out_dir.mkdir(parents=True, exist_ok=True)

    for arg in sys.argv[1:]:
        run_dir = Path(arg)
        rows = [r for r in csv.DictReader((run_dir / "output.csv").open(encoding="utf-8"))
                if r.get("Discovery Tag") == "NEW"]
        report = []
        for row in rows:
            votes = []
            for persona in REFUTERS:
                prompt = f"""You are {persona}. Try to REFUTE this RDTII mapping.

REFUTATION STANDARD: refuted=true ONLY if you can NAME one specific failure mode from the
list below that clearly applies to this mapping. The following are NOT refutations:
- the snippet is part of a multi-provision obligation (neighbouring subsections complete it)
- you would have quoted a different/better subsection of the same regime
- the provision is real and relevant but you'd phrase the rationale differently
Those are reviewer notes -> refuted=false with your note as the reason.

{FAILURE_MODES}

CLAIMED MAPPING (tagged NEW — not in ESCAP's baseline):
- Indicator: {row['Indicator ID']}
- Law: {row['Law Name']} {row['Article / Section']} ({row.get('Coverage','')})
- Verbatim: {row['Verbatim Snippet'][:400]}
- Rationale: {row['Mapping Rationale'][:300]}

Is this mapping WRONG for this indicator? refuted=true/false + one-sentence reason."""
                try:
                    result = llm.complete(prompt, Refutation)
                    votes.append({"persona": persona.split()[2], "refuted": result.refuted,
                                  "reason": result.reason[:160]})
                except Exception as error:  # noqa: BLE001
                    votes.append({"persona": persona.split()[2], "refuted": None,
                                  "error": str(error)[:80]})
            refuted_count = sum(1 for v in votes if v.get("refuted"))
            verdict = "RECOMMEND-REJECT" if refuted_count >= 2 else \
                      "RECOMMEND-KEEP" if refuted_count == 0 else "SPLIT-REVIEW"
            report.append({"indicator": row["Indicator ID"], "law": row["Law Name"][:60],
                           "article": row["Article / Section"], "verdict": verdict,
                           "refuter_votes": votes})
        path = out_dir / f"refutation_{run_dir.name}.json"
        path.write_text(json.dumps(report, indent=1))
        summary = {}
        for r in report:
            summary[r["verdict"]] = summary.get(r["verdict"], 0) + 1
        print(f"{run_dir.name}: {len(report)} NEW rows -> {summary} -> {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
