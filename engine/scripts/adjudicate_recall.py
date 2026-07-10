"""L1 recall closure (P3.5): per-miss adjudication of every unmatched gold provision.

For each master-known provision NOT matched by the run output, classify WHY:
  NOT_IN_CORPUS            — no unit with that law+section exists (acquisition/parse
                             hole, or the gold ref itself is wrong/points elsewhere)
  IN_CORPUS_NOT_EMITTED    — the unit exists (so injection put it in front of the
                             mapper) but no output row cites it: screen/mapping/gate
                             dropped it — needs a human verdict (real miss vs the
                             provision genuinely not fitting the indicator criteria)
  EMITTED_OTHER_INDICATOR  — we DID emit the provision, under a different indicator
                             (possible gold-side mapping disagreement)
  GOLD_REF_UNPARSEABLE     — the gold article ref has no section base (Impact-prose
                             parse artifact, e.g. "reg. 2021")

Output: data/review/recall_adjudication.md (+ .json) — one row per miss with a
verdict column for the human reviewer (MY rows: remember ESCAP planted errors —
a "miss" against a planted-error row can be CORRECT behavior; cross-check the
124-finding error audit).

Usage: .venv/bin/python scripts/adjudicate_recall.py \
           outputs/final_si_p6 ... outputs/final_au_p7
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.core.envfile import load_env_file  # noqa: E402

load_env_file()

from packages.discovery.diff import KnownIndex, laws_match, section_base  # noqa: E402
from packages.graph.sqlite_graph import SqliteGraphStore  # noqa: E402
from packages.ingest.known_index import base_ref, extract_refs  # noqa: E402

ECONOMY_OF = {"si": "Singapore", "ma": "Malaysia", "au": "Australia"}


def corpus_units(store, economy: str) -> list[dict]:
    from packages.retrieval.hybrid import load_corpus

    return load_corpus(store, economy)


def main() -> int:
    run_dirs = [Path(a) for a in sys.argv[1:]]
    if not run_dirs:
        print(__doc__)
        return 1
    index = KnownIndex("data/known_index.json")
    raw = json.loads(Path("data/known_index.json").read_text())["economies"]
    store = SqliteGraphStore()

    misses = []
    stats: dict[str, dict[str, int]] = {}
    for run in run_dirs:
        name = run.name  # final_si_p6
        _, cc, pp = name.split("_")
        economy, pillar = ECONOMY_OF[cc], pp.removeprefix("p")
        rows = list(csv.DictReader((run / "output.csv").open(encoding="utf-8")))
        aliases = index._aliases.get(economy, {})

        def gmatch(gold_name: str, our_name: str) -> bool:
            return laws_match(aliases.get(gold_name, gold_name), our_name)

        # (gold law, gold base, indicator, original ref) for this economy+pillar
        gold = []
        for e in raw.get(economy, []):
            if e.get("source") != "master" or not str(e.get("indicator_code", "")).startswith(f"P{pillar}-"):
                continue
            for law in e.get("acts_norm", [e.get("act_norm")]):
                for ref in e.get("articles", []):
                    gold.append({"law": law, "base": base_ref(ref), "ref": ref,
                                 "indicator": e.get("indicator_code"),
                                 "act_display": e.get("act", law)})

        corpus = corpus_units(store, economy)
        run_stats = {"gold": len(gold), "matched": 0, "NOT_IN_CORPUS": 0,
                     "IN_CORPUS_NOT_EMITTED": 0, "EMITTED_OTHER_INDICATOR": 0,
                     "GOLD_REF_UNPARSEABLE": 0}
        seen = set()
        for g in gold:
            key = (g["law"], g["base"], g["indicator"])
            if key in seen:
                continue
            seen.add(key)

            def row_hits(row) -> bool:
                if not gmatch(g["law"], row.get("Law Name", "")):
                    return False
                return g["base"] in {base_ref(r) for r in extract_refs(row.get("Article / Section", ""))}

            same_ind = [r for r in rows if row_hits(r)
                        and r.get("Indicator ID", "").startswith(f"P{pillar}-")]
            if g["base"] is None:
                verdict = "GOLD_REF_UNPARSEABLE"
            elif any(r.get("Indicator ID") == g["indicator"] for r in same_ind) or (
                    g["indicator"] is None and same_ind):
                run_stats["matched"] += 1
                continue
            elif same_ind:
                verdict = "EMITTED_OTHER_INDICATOR"
            else:
                # corpus units are compared in diff.py's section_base space
                # (bare "45" / "sch2cl5"), NOT ingest's base_ref space ("s. 45")
                kbase = section_base(g["ref"])

                def unit_hits(u) -> bool:
                    ub = section_base(u["props"].get("article_section", ""))
                    if ub is None:
                        return False
                    if kbase.startswith("sch") and "cl" not in kbase:
                        return ub == kbase or ub.startswith(f"{kbase}cl")
                    return ub == kbase

                if kbase is None:
                    verdict = "GOLD_REF_UNPARSEABLE"
                else:
                    in_corpus = any(gmatch(g["law"], u["props"].get("law_name", ""))
                                    and unit_hits(u) for u in corpus)
                    verdict = "IN_CORPUS_NOT_EMITTED" if in_corpus else "NOT_IN_CORPUS"
            run_stats[verdict] += 1
            emitted_under = sorted({r.get("Indicator ID") for r in same_ind}) if same_ind else []
            misses.append({"economy": economy, "pillar": pillar, "run": str(run),
                           "gold_indicator": g["indicator"], "act": g["act_display"],
                           "ref": g["ref"], "base": g["base"], "class": verdict,
                           "emitted_under": emitted_under,
                           "reviewer_verdict": "",  # REAL_MISS | GOLD_WRONG | GOLD_AMBIGUOUS | CORRECT_ABSTENTION
                           "reviewer_note": ""})
        stats[f"{economy} P{pillar}"] = run_stats
        print(f"{economy} P{pillar}: {run_stats}")

    out_dir = Path("data/review")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "recall_adjudication.json").write_text(json.dumps(
        {"stats": stats, "misses": misses}, indent=1))

    lines = ["# L1 Recall Adjudication (P3.5)", "",
             "Every master-known provision the sweep did NOT match, classified by cause.",
             "Fill `Verdict` per row: **REAL_MISS** (fix the engine) | **GOLD_WRONG**",
             "(gold cites a wrong/planted ref — cite evidence; MY rows: cross-check the",
             "124-finding error audit) | **GOLD_AMBIGUOUS** | **CORRECT_ABSTENTION**",
             "(provision truly fails the indicator criteria — engine right, gold loose).", ""]
    for scope, s in stats.items():
        lines.append(f"- **{scope}**: {s['matched']}/{s['gold']} matched · "
                     f"{s['NOT_IN_CORPUS']} not-in-corpus · "
                     f"{s['IN_CORPUS_NOT_EMITTED']} in-corpus-not-emitted · "
                     f"{s['EMITTED_OTHER_INDICATOR']} other-indicator · "
                     f"{s['GOLD_REF_UNPARSEABLE']} unparseable-ref")
    lines += ["", "| Economy | Ind | Act | Gold ref | Class | Emitted under | Verdict | Note |",
              "|---|---|---|---|---|---|---|---|"]
    for m in misses:
        lines.append(f"| {m['economy']} | {m['gold_indicator']} | {m['act'][:45]} | "
                     f"{m['ref']} | {m['class']} | {', '.join(m['emitted_under']) or '—'} |  |  |")
    (out_dir / "recall_adjudication.md").write_text("\n".join(lines) + "\n")
    print(f"\nwrote data/review/recall_adjudication.md ({len(misses)} misses to adjudicate)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
