"""Export canonical, local-only data for the lawyer-review workbook.

This script does not author a spreadsheet.  It resolves the current evidence,
methodology and review artifacts into a single JSON payload consumed by the
workbook renderer.  Automated refuter verdicts are intentionally excluded until
the corrected full-rubric refuter has produced ``rubric_version=full-indicator-v2``.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.build_legal_workbook import (
    RUNS,
    _alignment_label,
    _display,
    _official_urls,
    _recall_rationale,
    _surrounding_context,
)

REVIEW_FIELDS = [
    "Reviewer decision",
    "Reviewer correction/reasoning",
    "Reviewer official source URL",
    "Reviewer name",
    "Reviewer role",
    "Review date",
    "Citation checked",
    "Mapping checked",
    "Currentness checked",
]


def indicator_configs() -> dict[str, dict]:
    configs: dict[str, dict] = {}
    for pillar in ("6", "7"):
        payload = yaml.safe_load(Path(f"configs/rdtii/pillar_{pillar}.yaml").read_text()) or {}
        for indicator_id, cfg in (payload.get("indicators") or {}).items():
            item = dict(cfg or {})
            item["pillar_scope_exclusions"] = payload.get("scope_exclusions") or []
            configs[indicator_id] = item
    return configs


def question(cfg: dict) -> str:
    return str(cfg.get("question", cfg.get("legal_question", cfg.get("name", ""))))


def gate_summary(finding: dict, warnings_only: bool = True) -> str:
    proof = finding.get("citation_proof") or {}
    gates = proof.get("gate_results") or []
    if warnings_only:
        gates = [gate for gate in gates if gate.get("status") != "PASS"]
    return "\n".join(
        f"{gate.get('gate_id', '?')} {gate.get('status', '?')}: {gate.get('reason', '')}"
        for gate in gates
    ) or "None"


def proof_location(finding: dict) -> str:
    proof = finding.get("citation_proof") or {}
    if proof.get("page_number"):
        return f"page {proof['page_number']}"
    if proof.get("anchor"):
        return str(proof["anchor"])
    return str(finding.get("Location Reference") or "unresolved")


def legal_comment(indicator_id: str, cfg: dict, *, absence: bool = False) -> str:
    if absence:
        return ("Absence is not a fact until the governing instruments and search-coverage manifest "
                "are checked. Approve only if the score-zero/no-evidence conclusion is justified.")
    if indicator_id == "P7-I3":
        return ("Rubric reminder: sectoral tax, companies, health, telecom, employment and AML "
                "record-retention duties are expressly in scope; reject ceilings/permissive retention.")
    if indicator_id == "P7-I5":
        return ("Apply the court-order test: only access without independent judicial authorization "
                "supports score 1; warrant/court-gated access supports score 0.")
    if (cfg.get("polarity") or "").endswith("absent_scores_high"):
        return ("This is absence-scored: a provision establishing the framework can be valid evidence; "
                "the final score, not the mapping decision, captures presence versus absence.")
    return "Confirm legal function, scope, exceptions, citation and currentness against the official source."


def review_blanks() -> list[str]:
    return [""] * len(REVIEW_FIELDS)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    configs = indicator_configs()
    findings: list[dict] = []
    for run in RUNS:
        envelope = json.loads(Path(f"outputs/{run}/output.json").read_text())
        findings.extend(envelope.get("findings", []))

    common_headers = [
        "Finding ID", "Economy", "Indicator", "Indicator question", "Law/instrument",
        "Article/section", "Exact source snippet", "Surrounding source context",
        "System mapping rationale", "Official source URL", "Proof location", "Alignment",
        "Status evidence", "Gate warnings", "Legal-review guidance",
    ] + REVIEW_FIELDS

    known_rows: list[list] = []
    new_rows: list[list] = []
    absence_rows: list[list] = []
    counters = {"known": 0, "new": 0, "absence": 0}
    for finding in findings:
        indicator_id = finding.get("Indicator ID", "")
        cfg = configs.get(indicator_id, {})
        absence = finding.get("Verbatim Snippet") == "NO_EVIDENCE_FOUND_PENDING_REVIEW"
        tag = finding.get("Discovery Tag")
        if absence:
            counters["absence"] += 1
            manifest = finding.get("search_coverage_manifest") or {}
            absence_rows.append([
                f"A{counters['absence']:03d}", finding.get("Economy"), indicator_id,
                question(cfg), finding.get("Law Name"), finding.get("Source URL"),
                _display(finding.get("status_evidence"), 1200),
                _display(manifest, 5000), legal_comment(indicator_id, cfg, absence=True),
            ] + review_blanks())
            continue
        counters["new" if tag == "NEW" else "known"] += 1
        prefix = "N" if tag == "NEW" else "K"
        finding_id = f"{prefix}{counters['new' if tag == 'NEW' else 'known']:03d}"
        alignment = _alignment_label(finding)
        guidance = legal_comment(indicator_id, cfg)
        if alignment.startswith("unaligned"):
            guidance = ("TECHNICAL BLOCK: citation is not aligned to a canonical page/anchor. "
                        "Do not approve until the citation proof is repaired. " + guidance)
        row = [
            finding_id, finding.get("Economy"), indicator_id, question(cfg),
            finding.get("Law Name"), finding.get("Article / Section"),
            _display(finding.get("Verbatim Snippet"), 1800), _surrounding_context(finding),
            _display(finding.get("Mapping Rationale"), 1200), finding.get("Source URL"),
            proof_location(finding), alignment,
            _display(finding.get("status_evidence"), 1200), gate_summary(finding),
            guidance,
        ] + review_blanks()
        (new_rows if tag == "NEW" else known_rows).append(row)

    misses = json.loads(Path("data/review/recall_adjudication.json").read_text())
    recall_headers = [
        "Miss ID", "Economy", "Indicator", "Indicator question", "Master act/instrument",
        "Master citation", "Technical class", "Emitted under", "Proposed verdict",
        "Plain-language system rationale", "Reviewer verdict", "Reviewer reasoning",
        "Reviewer official source URL", "Reviewer name", "Reviewer role", "Review date",
    ]
    recall_rows = []
    for index, miss in enumerate(misses.get("misses", []), 1):
        cfg = configs.get(miss.get("gold_indicator", ""), {})
        recall_rows.append([
            f"M{index:03d}", miss.get("economy"), miss.get("gold_indicator"), question(cfg),
            miss.get("act"), miss.get("ref"), miss.get("class"),
            ", ".join(miss.get("emitted_under") or []) or "—", miss.get("proposed_verdict"),
            _recall_rationale(miss), "", "", "", "", "", "",
        ])

    zone_headers = [
        "Score ID", "Economy", "Indicator", "Indicator question", "Deterministic score",
        "Deterministic reason", "Judge scores", "Judge reasoning", "Agreement alpha",
        "Score band", "Spread", "Flagged for review", "Reviewer score", "Reviewer decision",
        "Reviewer reasoning", "Reviewer name", "Reviewer role", "Review date",
    ]
    zone_rows = []
    zone_index = 0
    for path in sorted(Path("data/zone3").glob("*_scores.json")):
        payload = json.loads(path.read_text())
        for indicator_id, result in sorted((payload.get("indicators") or {}).items()):
            zone_index += 1
            judges = result.get("judges") or []
            zone_rows.append([
                f"Z{zone_index:03d}", payload.get("economy"), indicator_id,
                question(configs.get(indicator_id, {})), result.get("deterministic"),
                result.get("deterministic_reason"),
                ", ".join(f"{judge.get('persona')}: {judge.get('score')}" for judge in judges),
                " || ".join(f"{judge.get('persona')}: {judge.get('reason', '')}" for judge in judges),
                payload.get("krippendorff_alpha"), json.dumps(result.get("band")),
                result.get("spread"), result.get("flag_for_review"), "", "", "", "", "", "",
            ])

    criteria_headers = [
        "Indicator", "Methodology no.", "Name", "Legal question", "Legal test",
        "Scoring criteria", "Exclusions", "Hunt in", "Polarity",
    ]
    criteria_rows = []
    for indicator_id, cfg in sorted(configs.items()):
        criteria_rows.append([
            indicator_id, cfg.get("methodology_number", cfg.get("methodology_no", "")),
            cfg.get("name"), question(cfg), cfg.get("legal_test", ""),
            _display(cfg.get("scoring", cfg.get("criteria", {})), 3000),
            _display(cfg.get("exclusions", []), 2000), _display(cfg.get("hunt_in", []), 2000),
            cfg.get("polarity", ""),
        ])

    master_headers = [
        "Economy", "Indicator", "Methodology score", "Act/instrument", "Article references",
        "Coverage", "Master impact/rationale", "Official URL(s)",
    ]
    master_rows = []
    index = json.loads(Path("data/known_index.json").read_text())["economies"]
    for economy in ("Singapore", "Malaysia", "Australia"):
        for entry in index.get(economy, []):
            indicator_id = str(entry.get("indicator_code", ""))
            if entry.get("source") != "master" or not indicator_id.startswith(("P6", "P7")):
                continue
            master_rows.append([
                economy, indicator_id, entry.get("score", ""), entry.get("act", ""),
                ", ".join(entry.get("articles") or []), entry.get("coverage", ""),
                entry.get("impact", ""), _official_urls(entry),
            ])

    absence_headers = [
        "Absence ID", "Economy", "Indicator", "Indicator question", "Configured governing instrument",
        "Official source URL", "Status evidence", "Search coverage manifest", "Review guidance",
    ] + REVIEW_FIELDS

    payload = {
        "generated_at": "2026-07-16",
        "counts": {
            "new": len(new_rows), "known": len(known_rows), "absence": len(absence_rows),
            "recall": len(recall_rows), "zone3": len(zone_rows), "master": len(master_rows),
        },
        "sheets": {
            "NEW Findings": {"headers": common_headers, "rows": new_rows},
            "Absence Review": {"headers": absence_headers, "rows": absence_rows},
            "Recall Misses": {"headers": recall_headers, "rows": recall_rows},
            "Zone-3 Scores": {"headers": zone_headers, "rows": zone_rows},
            "KNOWN Findings": {"headers": common_headers, "rows": known_rows},
            "Indicator Criteria": {"headers": criteria_headers, "rows": criteria_rows},
            "Master Known": {"headers": master_headers, "rows": master_rows},
        },
        "refuter_status": (
            "Automated refuter verdicts are not used in this workbook. The legacy run omitted the "
            "complete indicator rubric; the corrected rerun was not exported because external API "
            "transfer was not authorized. Every NEW row therefore requires human legal review."
        ),
    }
    Path(args.out).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(payload["counts"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
