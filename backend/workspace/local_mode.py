"""Local (open-weights) mode: a workspace kept fully separate from the hybrid one.

Hybrid evidence reaches the app through the imported, signed snapshot. Local
runs are never imported: their evidence is the worker's stored copy of each
run's envelope (latest run per economy x pillar), their review lives in
LocalReviewDecision (app database only, never the engine's decisions.json), and
the two model backends meet only on the Model comparison page, which follows
the final template's "Engine Comparison" sheet.
"""

from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict
from datetime import timedelta

from django.utils.dateparse import parse_datetime

from .keys import content_hash, normalized_part
from .models import EngineAction, LocalReviewDecision, RunRecord
from .registry import identity_payload

ABSENCE_MARK = "NO_EVIDENCE_FOUND"
ECONOMY_BY_COUNTRY = {
    "SG": "Singapore",
    "MY": "Malaysia",
    "MA": "Malaysia",
    "AU": "Australia",
    "TH": "Thailand",
    "IN": "India",
    "ID": "Indonesia",
}
QUEUES = ("new", "known", "absence")


# ---------------------------------------------------------------- runs

def run_actions(mode):
    """Succeeded runs of one mode that stored an envelope, newest first."""
    queryset = EngineAction.objects.filter(
        kind=EngineAction.Kind.RUN, status=EngineAction.Status.SUCCEEDED
    )
    if mode == "local":
        queryset = queryset.filter(arguments_json__mode="local")
    else:
        queryset = queryset.exclude(arguments_json__mode="local")
    return [
        action
        for action in queryset.order_by("-finished_at", "-requested_at")
        if (action.result_json or {}).get("findings") is not None
    ]


def envelope_economy(envelope):
    country = str(envelope.get("country") or "").upper()
    return ECONOMY_BY_COUNTRY.get(country, country)


def scope_of(action):
    arguments = action.arguments_json or {}
    envelope = action.result_json or {}
    economy = str(arguments.get("economy") or envelope_economy(envelope))
    return economy, str(arguments.get("pillar") or envelope.get("pillar") or "")


def runs_by_scope(mode="local"):
    grouped = defaultdict(list)
    for action in run_actions(mode):
        grouped[scope_of(action)].append(action)
    return dict(grouped)


def latest_runs(mode="local"):
    return {scope: actions[0] for scope, actions in runs_by_scope(mode).items()}


def output_sha(action):
    return next(
        (value.get("sha256") for key, value in (action.result_hashes_json or {}).items()
         if key.endswith("output.json")),
        "",
    )


def model_names(envelope):
    cost = (envelope.get("metadata") or {}).get("cost_report") or {}
    names = list((cost.get("models") or {}).keys())
    if names:
        return names
    versions = {str(f.get("model_version")) for f in envelope.get("findings") or []
                if f.get("model_version")}
    return sorted(versions)


def envelope_summary(envelope):
    metadata = envelope.get("metadata") or {}
    cost = metadata.get("cost_report") or {}
    findings = envelope.get("findings") or []
    absences = sum(1 for finding in findings if is_absence(finding))
    models = cost.get("models") or {}
    return {
        "run_id": envelope.get("run_id") or cost.get("run_id"),
        "country": envelope.get("country"),
        "pillar": envelope.get("pillar"),
        "provider_profile": envelope.get("provider_profile"),
        "generated_at": envelope.get("generated_at") or cost.get("at"),
        "elapsed_seconds": metadata.get("elapsed_seconds") or cost.get("elapsed_seconds"),
        "rows": len(findings),
        "evidence": len(findings) - absences,
        "absences": absences,
        "models": model_names(envelope),
        "calls": sum(int(model.get("calls") or 0) for model in models.values()),
        "input_tokens": sum(int(model.get("input_tokens") or 0) for model in models.values()),
        "output_tokens": sum(int(model.get("output_tokens") or 0) for model in models.values()),
        "total_usd": cost.get("total_usd"),
        "corpus_fingerprint": metadata.get("corpus_fingerprint"),
        "corpus_provisions": metadata.get("corpus_provisions"),
        "warning_count": len(envelope.get("warnings") or []),
    }


def run_summary(action):
    economy, pillar = scope_of(action)
    return envelope_summary(action.result_json or {}) | {
        "action_id": str(action.pk),
        "economy": economy,
        "pillar": pillar,
        "requested_by": action.requested_by.full_name if action.requested_by_id else "",
        "started_at": action.started_at.isoformat() if action.started_at else None,
        "finished_at": action.finished_at.isoformat() if action.finished_at else None,
        "output_sha256": output_sha(action),
    }


# ---------------------------------------------------------------- findings

def is_absence(finding):
    return ABSENCE_MARK in str(finding.get("Verbatim Snippet") or "")


def queue_of(finding):
    if is_absence(finding):
        return "absence"
    return "new" if str(finding.get("Discovery Tag") or "").upper() == "NEW" else "known"


def finding_key(finding):
    """Same key as the engine's packages.core.finalization.finding_key."""
    payload = "\x1f".join(
        str(finding.get(field) or "")
        for field in ("Economy", "Indicator ID", "Law Name", "Article / Section",
                      "source_artifact_id", "Verbatim Snippet")
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def review_subject_hash(finding):
    """What a Local approval attests to; any change sends the finding back to review."""
    proof = dict(finding.get("citation_proof") or {})
    proof.pop("verified_at", None)
    return content_hash({
        "contract": "clausechain-local-review-subject-v1",
        "finding_key": finding_key(finding),
        "mapping_rationale": finding.get("Mapping Rationale"),
        "source_url": finding.get("Source URL"),
        "status": finding.get("Status"),
        "citation_proof": proof or None,
        "status_evidence_record": finding.get("status_evidence_record"),
        "search_coverage_manifest": finding.get("search_coverage_manifest"),
    })


def match_mode(finding):
    proof = finding.get("citation_proof") or {}
    alignment = str(proof.get("alignment_status") or "").casefold()
    if alignment in {"exact", "anchor"}:
        return alignment
    return "blocked" if proof else "unavailable"


def proof_summary(finding):
    proof = finding.get("citation_proof") or {}
    gates = [
        {"gate_id": gate.get("gate_id"), "status": gate.get("status"), "reason": gate.get("reason")}
        for gate in proof.get("gate_results") or []
    ]
    return {
        "available": bool(proof),
        "match_mode": match_mode(finding),
        "page": proof.get("page_number"),
        "anchor": proof.get("anchor"),
        "article_path": proof.get("article_path") or [],
        "alignment_score": proof.get("alignment_score"),
        "source_sha256": str(proof.get("source_sha256") or finding.get("source_artifact_id") or "")
        .removeprefix("sha256:"),
        "gates": gates,
        "gates_pass": bool(gates) and all(gate["status"] == "PASS" for gate in gates),
    }


# ---------------------------------------------------------------- decisions

def latest_decisions():
    latest = {}
    for row in LocalReviewDecision.objects.order_by("created_at"):
        latest[row.finding_key] = row
    return latest


def serialize_decision(row):
    return {
        "id": str(row.pk),
        "decision": row.decision,
        "citation_checked": row.citation_checked,
        "mapping_checked": row.mapping_checked,
        "status_checked": row.status_checked,
        "note": row.note,
        "reviewer_name": row.reviewer_name,
        "reviewer_role": row.reviewer_role,
        "reviewed_at": row.reviewed_at.isoformat(),
        "review_subject_hash": row.review_subject_hash,
        "supersedes_id": str(row.supersedes_id) if row.supersedes_id else None,
    }


def review_state(row, subject_hash):
    if row is None:
        return {"state": "pending", "decision": None, "latest": None}
    if row.review_subject_hash != subject_hash:
        # The rerun changed what the reviewer attested to; decide again.
        return {"state": "stale", "decision": None, "latest": serialize_decision(row)}
    return {"state": row.decision, "decision": row.decision, "latest": serialize_decision(row)}


# ---------------------------------------------------------------- items

TEXT_FIELDS = {
    "economy": "Economy",
    "indicator": "Indicator ID",
    "law": "Law Name",
    "law_ref": "Law Number / Ref",
    "last_amended": "Last Amended",
    "article": "Article / Section",
    "tag": "Discovery Tag",
    "location": "Location Reference",
    "snippet": "Verbatim Snippet",
    "snippet_en": "Verbatim Snippet (English)",
    "rationale": "Mapping Rationale",
    "source_url": "Source URL",
    "confidence": "Confidence",
    "notes": "Notes",
    "coverage": "Coverage",
    "status": "Status",
}


def serialize_item(finding, action, index, decisions, *, detail=False):
    key = finding_key(finding)
    subject = review_subject_hash(finding)
    economy, pillar = scope_of(action)
    envelope = action.result_json or {}
    absence = is_absence(finding)
    proof = proof_summary(finding)
    item = {
        "key": key,
        "stable_key": key,
        "queue": queue_of(finding),
        "pillar": pillar,
        **{name: finding.get(field) for name, field in TEXT_FIELDS.items()},
        "absence": absence,
        "status_evidence": finding.get("status_evidence"),
        "citation_tier": finding.get("citation_tier"),
        "access_date": finding.get("access_date"),
        "model_version": finding.get("model_version"),
        "proof": {
            name: proof[name]
            for name in ("available", "match_mode", "page", "anchor", "gates_pass", "source_sha256")
        } | {
            "gates_total": len(proof["gates"]),
            "failing_gates": [gate["gate_id"] for gate in proof["gates"] if gate["status"] != "PASS"],
        },
        "run": {
            "action_id": str(action.pk),
            "run_id": envelope.get("run_id"),
            "economy": economy,
            "generated_at": envelope.get("generated_at"),
            "index": index,
        },
        "subject_hash": subject,
        "review": review_state(decisions.get(key), subject),
    }
    if detail:
        item["proof"] = proof | {"gates_total": len(proof["gates"]),
                                 "failing_gates": item["proof"]["failing_gates"]}
        item["status_record"] = finding.get("status_evidence_record")
        item["coverage_manifest"] = finding.get("search_coverage_manifest") if absence else None
    return item


def local_items():
    """Every finding of the latest Local run per economy x pillar."""
    decisions = latest_decisions()
    items, seen = [], Counter()
    for (_, _), action in sorted(latest_runs("local").items()):
        for index, finding in enumerate((action.result_json or {}).get("findings") or []):
            item = serialize_item(finding, action, index, decisions)
            seen[item["key"]] += 1
            if seen[item["key"]] > 1:  # identical row emitted twice in one run
                item["stable_key"] = f"{item['key']}:{index}"
            items.append(item)
    return items


def find_local_finding(key):
    """(finding, action, index) for a finding key in the latest Local runs."""
    for action in latest_runs("local").values():
        for index, finding in enumerate((action.result_json or {}).get("findings") or []):
            if finding_key(finding) == key:
                return finding, action, index
    return None, None, None


def review_progress(items):
    progress = {queue: {"total": 0, "decided": 0, "approved": 0, "rejected": 0, "stale": 0}
                for queue in QUEUES}
    for item in items:
        bucket = progress[item["queue"]]
        bucket["total"] += 1
        state = item["review"]["state"]
        if state in {"approved", "rejected"}:
            bucket["decided"] += 1
            bucket[state] += 1
        elif state == "stale":
            bucket["stale"] += 1
    return progress


# ---------------------------------------------------------------- run-to-run changes

def _components(finding):
    return {
        "citation": content_hash([finding.get("Law Name"), finding.get("Article / Section"),
                                  normalized_part(finding.get("Verbatim Snippet")),
                                  finding.get("Source URL")]),
        "mapping": content_hash([finding.get("Indicator ID"), finding.get("Mapping Rationale"),
                                 finding.get("Coverage"), finding.get("Discovery Tag")]),
        "status": content_hash([finding.get("Status"), finding.get("status_evidence")]),
    }


def _identity(finding):
    return content_hash(identity_payload(finding))


def _change(kind, finding, *, stages=(), previous=None):
    return {
        "kind": kind,
        "economy": finding.get("Economy"),
        "indicator": finding.get("Indicator ID"),
        "law": finding.get("Law Name"),
        "article": finding.get("Article / Section"),
        "absence": is_absence(finding),
        "queue": queue_of(finding),
        "finding_key": None if kind == "not_reproduced" else finding_key(finding),
        "changed_stages": list(stages),
        "snippet": str(finding.get("Verbatim Snippet") or "")[:400],
        "previous_snippet": str((previous or {}).get("Verbatim Snippet") or "")[:400] or None,
    }


def run_changes():
    """Latest Local run vs the Local run before it, per economy x pillar."""
    scopes = []
    for (economy, pillar), actions in sorted(runs_by_scope("local").items()):
        current, previous = actions[0], (actions[1] if len(actions) > 1 else None)
        now = {_identity(f): f for f in (current.result_json or {}).get("findings") or []}
        before = {_identity(f): f for f in ((previous.result_json or {}).get("findings") or [])} \
            if previous else {}
        changes = []
        for identity, finding in now.items():
            if identity not in before:
                changes.append(_change("new", finding))
                continue
            old, new = _components(before[identity]), _components(finding)
            stages = [stage for stage in ("citation", "mapping", "status") if old[stage] != new[stage]]
            changes.append(_change("revised" if stages else "unchanged", finding,
                                   stages=stages, previous=before[identity]))
        for identity, finding in before.items():
            if identity not in now:
                changes.append(_change("not_reproduced", finding))
        scopes.append({
            "economy": economy,
            "pillar": pillar,
            "baseline": previous is None,
            "current_run": run_summary(current),
            "previous_run": run_summary(previous) if previous else None,
            "counts": dict(Counter(change["kind"] for change in changes)),
            "changes": changes,
        })
    return scopes


# ---------------------------------------------------------------- Model A vs Model B

def hybrid_runs():
    """Newest hybrid envelope per scope: the reviewed snapshot's, or a later app run."""
    runs = {}
    snapshot_records = RunRecord.objects.filter(snapshot__active=True)
    for record in snapshot_records:
        envelope = record.envelope_json or {}
        scope = (envelope_economy(envelope), str(envelope.get("pillar") or ""))
        cost = record.cost_json or {}
        runs[scope] = {
            "source": "reviewed snapshot",
            "name": record.run_name,
            "envelope": envelope,
            "total_usd": cost.get("total_usd", (envelope.get("metadata") or {}).get("cost_report", {}).get("total_usd")),
            "started_at": None,
            "finished_at": None,
        }
    for action in run_actions("hybrid"):
        scope = scope_of(action)
        envelope = action.result_json or {}
        current = runs.get(scope)
        if current and str(current["envelope"].get("generated_at") or "") >= str(envelope.get("generated_at") or ""):
            continue
        runs[scope] = {
            "source": "app run",
            "name": f"{(action.arguments_json or {}).get('out_prefix', 'final')}_"
                    f"{(action.arguments_json or {}).get('cc')}_p{scope[1]}",
            "envelope": envelope,
            "total_usd": ((envelope.get("metadata") or {}).get("cost_report") or {}).get("total_usd"),
            "started_at": action.started_at.isoformat() if action.started_at else None,
            "finished_at": action.finished_at.isoformat() if action.finished_at else None,
        }
    return runs


def _engine_card(label, run):
    if not run:
        return None
    summary = envelope_summary(run["envelope"])
    finished = run.get("finished_at") or summary["generated_at"]
    started = run.get("started_at")
    if not started and finished and summary["elapsed_seconds"]:
        # Snapshot envelopes are stamped when the run ended; its start is that minus elapsed.
        ended = parse_datetime(str(finished))
        started = (ended - timedelta(seconds=float(summary["elapsed_seconds"]))).isoformat() if ended else None
    return summary | {
        "label": label,
        "source": run["source"],
        "name": run["name"],
        "started_at": started,
        "finished_at": finished,
        "total_usd": run.get("total_usd") if run.get("total_usd") is not None else summary["total_usd"],
        # The run path reads the archived corpus only (no HTTP in packages/core,
        # rdtii, retrieval or extractors); the fingerprint proves which archive.
        "documents_fetched": 0,
    }


def comparison_scopes():
    hybrid, local = hybrid_runs(), latest_runs("local")
    scopes = []
    for scope in sorted(set(hybrid) | set(local)):
        scopes.append({
            "economy": scope[0],
            "pillar": scope[1],
            "model_a": bool(hybrid.get(scope)),
            "model_b": bool(local.get(scope)),
        })
    return scopes


def _instrument(finding):
    return identity_payload(finding)["instrument_key"]


def _citation(finding):
    return identity_payload(finding)["citation_key"]


def _base_citation(finding):
    return re.sub(r"\(.*$", "", _citation(finding)) or _citation(finding)


def _quote(finding):
    return normalized_part(finding.get("Verbatim Snippet"))


def _pair(a_rows, b_rows):
    a_left, b_left, pairs = list(a_rows), list(b_rows), []
    rules = (
        lambda a, b: (_instrument(a), _citation(a), a.get("Indicator ID"))
        == (_instrument(b), _citation(b), b.get("Indicator ID")),
        lambda a, b: (_instrument(a), _citation(a)) == (_instrument(b), _citation(b)),
        lambda a, b: (_instrument(a), _base_citation(a), a.get("Indicator ID"))
        == (_instrument(b), _base_citation(b), b.get("Indicator ID")),
        lambda a, b: (_instrument(a), _base_citation(a)) == (_instrument(b), _base_citation(b)),
    )
    for rule in rules:
        for a in list(a_left):
            match = next((b for b in b_left if rule(a, b)), None)
            if match is not None:
                pairs.append((a, match))
                a_left.remove(a)
                b_left.remove(match)
    return pairs, a_left, b_left


def _difference(a, b):
    if a is None:
        return "Only Model B found this provision."
    if b is None:
        return "Only Model A found this provision."
    notes = []
    if a.get("Indicator ID") != b.get("Indicator ID"):
        notes.append(f"Model A mapped it to {a.get('Indicator ID')}, Model B to {b.get('Indicator ID')}")
    if _citation(a) != _citation(b):
        notes.append(f"Model A cited {a.get('Article / Section')}, Model B cited {b.get('Article / Section')}")
    if _quote(a) != _quote(b):
        notes.append("they quote different words from it")
    if not notes:
        return "Same provision, indicator, citation and quote."
    sentence = "; ".join(notes) + "."
    return sentence[0].upper() + sentence[1:]


def _provision_row(a, b):
    base = a or b
    return {
        "law": base.get("Law Name"),
        "article": base.get("Article / Section"),
        "indicator": base.get("Indicator ID"),
        "found_by": "Both" if a and b else ("Model A only" if a else "Model B only"),
        "indicator_differs": bool(a and b and a.get("Indicator ID") != b.get("Indicator ID")),
        "citation_differs": bool(a and b and _citation(a) != _citation(b)),
        "quote_differs": bool(a and b and _quote(a) != _quote(b)),
        "how": _difference(a, b),
        "model_a": _side(a),
        "model_b": _side(b),
    }


def _side(finding):
    if finding is None:
        return None
    return {
        "indicator": finding.get("Indicator ID"),
        "article": finding.get("Article / Section"),
        "snippet": str(finding.get("Verbatim Snippet") or "")[:700],
        "rationale": str(finding.get("Mapping Rationale") or "")[:700],
        "confidence": finding.get("Confidence"),
        "tag": finding.get("Discovery Tag"),
        "source_url": finding.get("Source URL"),
        "finding_key": finding_key(finding),
    }


def comparison(economy, pillar):
    scope = (economy, str(pillar))
    a_run, b_action = hybrid_runs().get(scope), latest_runs("local").get(scope)
    b_run = None
    if b_action is not None:
        b_run = {
            "source": "local run",
            "name": f"local_{(b_action.arguments_json or {}).get('cc')}_p{scope[1]}",
            "envelope": b_action.result_json or {},
            "total_usd": None,
            "started_at": b_action.started_at.isoformat() if b_action.started_at else None,
            "finished_at": b_action.finished_at.isoformat() if b_action.finished_at else None,
        }
    a_all = (a_run or {}).get("envelope", {}).get("findings") or []
    b_all = (b_run or {}).get("envelope", {}).get("findings") or []
    a_rows = [f for f in a_all if not is_absence(f)]
    b_rows = [f for f in b_all if not is_absence(f)]
    pairs, a_only, b_only = _pair(a_rows, b_rows)
    rows = [_provision_row(a, b) for a, b in pairs]
    rows += [_provision_row(a, None) for a in a_only]
    rows += [_provision_row(None, b) for b in b_only]
    rows.sort(key=lambda row: (str(row["indicator"]), str(row["law"]), str(row["article"])))
    for number, row in enumerate(rows, 1):
        row["number"] = number

    indicators = sorted({str(f.get("Indicator ID")) for f in a_all + b_all if f.get("Indicator ID")})
    by_indicator = []
    for indicator in indicators:
        a_found = sum(1 for f in a_rows if f.get("Indicator ID") == indicator)
        b_found = sum(1 for f in b_rows if f.get("Indicator ID") == indicator)
        by_indicator.append({
            "indicator": indicator,
            "model_a": a_found,
            "model_b": b_found,
            "agreement": ("both found" if a_found and b_found else "both none" if not (a_found or b_found)
                          else "Model A only" if a_found else "Model B only"),
        })
    both = sum(1 for row in rows if row["found_by"] == "Both")
    return {
        "economy": economy,
        "pillar": str(pillar),
        "model_a": _engine_card("Model A — commercial (hybrid)", a_run),
        "model_b": _engine_card("Model B — open weights (local)", b_run),
        "same_corpus": bool(
            a_run and b_run
            and (a_run["envelope"].get("metadata") or {}).get("corpus_fingerprint")
            and (a_run["envelope"].get("metadata") or {}).get("corpus_fingerprint")
            == (b_run["envelope"].get("metadata") or {}).get("corpus_fingerprint")
        ),
        "counts": {
            "provisions": len(rows),
            "both": both,
            "model_a_only": len(a_only),
            "model_b_only": len(b_only),
            "indicator_differs": sum(row["indicator_differs"] for row in rows),
            "citation_differs": sum(row["citation_differs"] for row in rows),
            "quote_differs": sum(row["quote_differs"] for row in rows),
            "agreement_pct": round(100 * both / len(rows)) if rows else None,
        },
        "rows": rows,
        "by_indicator": by_indicator,
    }
