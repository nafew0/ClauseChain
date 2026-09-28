"""API for the Local (open-weights) workspace and the Model A vs Model B comparison.

Every endpoint here reads Local runs only (see local_mode.py); none of them reads
or writes the hybrid snapshot, its registry or the signed decision files. The
comparison endpoints are the single place where both model backends appear.
"""

import csv
import io
import json
from datetime import date
from hashlib import sha256

from django.conf import settings
from django.db import transaction
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from . import local_mode as lm
from .engine_worker import _sha256
from .models import EngineAction, LocalReviewDecision
from .roles import reviewer_identity, reviewer_roles
from .views import (
    RUN_CODES,
    RUN_MODES,
    TEMPLATE_COLUMNS,
    DecisionConflict,
    actions_for_mode,
    serialize_engine_action,
    serialize_modes,
)

PILLARS = ("6", "7")
# Template column -> Local item field (items carry each value once).
TEMPLATE_FIELDS = {field: name for name, field in lm.TEXT_FIELDS.items() if field in TEMPLATE_COLUMNS}
RUN_FILES = ("output.json", "output.csv", "candidate_rows.csv", "legal_review.csv")
STORED_ENVELOPE = "stored_envelope.json"
RAW_TEXT_CAP = 3_000_000


def _scope_order(run):
    economies = list(RUN_CODES)
    economy = run.get("economy")
    return (economies.index(economy) if economy in economies else 99, str(run.get("pillar")))


def _latest_summaries():
    return sorted((lm.run_summary(action) for action in lm.latest_runs("local").values()),
                  key=_scope_order)


class LocalOverviewView(APIView):
    def get(self, request):
        runs = _latest_summaries()
        by_scope = {(run["economy"], run["pillar"]): run for run in runs}
        items = lm.local_items()
        comparable = sum(1 for scope in lm.comparison_scopes() if scope["model_a"] and scope["model_b"])
        return Response({
            "mode": "local",
            "modes": serialize_modes(),
            "models": RUN_MODES["local"]["models"],
            "runs": runs,
            "coverage": [
                {"economy": economy, "pillar": pillar, "run": by_scope.get((economy, pillar))}
                for economy in RUN_CODES for pillar in PILLARS
            ],
            "progress": lm.review_progress(items),
            "counts": {
                "runs": len(runs),
                "scopes": len(RUN_CODES) * len(PILLARS),
                "rows": sum(run["rows"] for run in runs),
                "evidence": sum(run["evidence"] for run in runs),
                "absences": sum(run["absences"] for run in runs),
                "comparable": comparable,
            },
            "totals": {
                "calls": sum(run["calls"] for run in runs),
                "input_tokens": sum(run["input_tokens"] for run in runs),
                "output_tokens": sum(run["output_tokens"] for run in runs),
                "elapsed_seconds": round(sum(float(run["elapsed_seconds"] or 0) for run in runs), 1),
                "total_usd": round(sum(float(run["total_usd"] or 0) for run in runs), 4),
            },
            "active": [
                serialize_engine_action(action)
                for action in actions_for_mode("local").filter(
                    kind=EngineAction.Kind.RUN,
                    status__in=(EngineAction.Status.QUEUED, EngineAction.Status.RUNNING),
                )
            ],
        })


class LocalItemsView(APIView):
    def get(self, request):
        items = lm.local_items()
        return Response({
            "mode": "local",
            "modes": serialize_modes(),
            "template_columns": list(TEMPLATE_COLUMNS),
            "template_fields": TEMPLATE_FIELDS,
            "progress": lm.review_progress(items),
            "runs": _latest_summaries(),
            "reviewer_roles": reviewer_roles(request.user),
            "results": items,
        })


def _reviewer_role(user):
    roles = reviewer_roles(user)
    if not roles:
        raise PermissionDenied("Local review needs a reviewer role.")
    return "admin" if "admin" in roles else roles[0]


def _record_decision(request, key, decision, checks, note, expected_latest_id):
    role = _reviewer_role(request.user)
    finding, action, index = lm.find_local_finding(key)
    if finding is None:
        raise NotFound("This finding is not in the latest Local run of its economy and pillar.")
    with transaction.atomic():
        latest = (LocalReviewDecision.objects.select_for_update()
                  .filter(finding_key=key).order_by("-created_at").first())
        if (str(latest.pk) if latest else None) != (str(expected_latest_id) if expected_latest_id else None):
            raise DecisionConflict("Someone recorded a newer decision on this finding. Reload and decide again.")
        row = LocalReviewDecision.objects.create(
            finding_key=key,
            review_subject_hash=lm.review_subject_hash(finding),
            queue=lm.queue_of(finding),
            decision=decision,
            note=note,
            economy=str(finding.get("Economy") or ""),
            indicator_id=str(finding.get("Indicator ID") or ""),
            law_name=str(finding.get("Law Name") or "")[:512],
            article=str(finding.get("Article / Section") or "")[:255],
            action=action,
            engine_run_id=str((action.result_json or {}).get("run_id") or ""),
            reviewer_name=reviewer_identity(request.user)[0],
            reviewer_role=role,
            reviewed_at=timezone.now(),
            created_by=request.user,
            supersedes=latest,
            **checks,
        )
    return row, lm.serialize_item(finding, action, index, {key: row}, detail=True)


class LocalItemDetailView(APIView):
    def get(self, request, finding_key):
        finding, action, index = lm.find_local_finding(finding_key)
        if finding is None:
            raise NotFound("This finding is not in the latest Local run of its economy and pillar.")
        rows = LocalReviewDecision.objects.filter(finding_key=finding_key).order_by("created_at")
        return Response({
            "item": lm.serialize_item(finding, action, index, lm.latest_decisions(), detail=True),
            "history": [lm.serialize_decision(row) for row in rows],
        })


class LocalDecisionView(APIView):
    def post(self, request):
        key = str(request.data.get("finding_key") or "")
        decision = str(request.data.get("decision") or "")
        if decision not in LocalReviewDecision.Verdict.values:
            raise ValidationError({"decision": "Choose approved or rejected."})
        checks = {name: bool(request.data.get(name))
                  for name in ("citation_checked", "mapping_checked", "status_checked")}
        note = str(request.data.get("note") or "").strip()
        if decision == "approved" and not all(checks.values()):
            raise ValidationError({"checks": "Approval needs the citation, mapping and status checks."})
        if decision == "rejected" and len(note) < 3:
            raise ValidationError({"note": "A rejection needs a reason."})
        row, item = _record_decision(request, key, decision, checks, note,
                                     request.data.get("expected_latest_id"))
        return Response({"decision": lm.serialize_decision(row), "item": item}, status=201)


class LocalBulkDecisionView(APIView):
    """Approve KNOWN rows whose proof resolved and every citation gate passed."""

    def post(self, request):
        keys = [str(key) for key in request.data.get("finding_keys") or []]
        if not keys:
            raise ValidationError({"finding_keys": "Select at least one KNOWN row."})
        expected = request.data.get("expected_latest_ids") or {}
        items = {item["key"]: item for item in lm.local_items()}
        for key in keys:
            item = items.get(key)
            if not item or item["queue"] != "known":
                raise ValidationError({"finding_keys": "Bulk approval covers KNOWN rows only."})
            if not item["proof"]["gates_pass"]:
                raise ValidationError({"finding_keys": "Rows with non-passing gates need individual review."})
        rows = []
        for key in keys:
            row, _ = _record_decision(
                request, key, "approved",
                {"citation_checked": True, "mapping_checked": True, "status_checked": True},
                "Bulk-approved KNOWN evidence (proof resolved, all gates pass).",
                expected.get(key),
            )
            rows.append(lm.serialize_decision(row))
        return Response({"decisions": rows}, status=201)


class LocalDecisionHistoryView(APIView):
    def get(self, request, finding_key):
        rows = LocalReviewDecision.objects.filter(finding_key=finding_key).order_by("created_at")
        return Response({"results": [lm.serialize_decision(row) for row in rows]})


class LocalChangesView(APIView):
    def get(self, request):
        scopes = sorted(lm.run_changes(), key=_scope_order)
        totals = {}
        for scope in scopes:
            for kind, count in scope["counts"].items():
                totals[kind] = totals.get(kind, 0) + count
        return Response({"mode": "local", "modes": serialize_modes(), "counts": totals, "scopes": scopes})


def _csv_response(filename, rows):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(rows)
    response = HttpResponse(("﻿" + buffer.getvalue()).encode("utf-8"),
                            content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


class LocalDatasetExportView(APIView):
    def get(self, request):
        economy = request.query_params.get("economy") or ""
        pillar = request.query_params.get("pillar") or ""
        items = [item for item in lm.local_items()
                 if (not economy or item["economy"] == economy) and (not pillar or item["pillar"] == pillar)]
        header = [*TEMPLATE_COLUMNS, "Pillar", "Local review", "Reviewer", "Reviewed at", "Match",
                  "Page / anchor", "Gates", "Model", "Run ID", "Finding key"]
        rows = [header]
        for item in items:
            latest = item["review"]["latest"] or {}
            proof = item["proof"]
            rows.append([
                *["" if item[TEMPLATE_FIELDS[column]] is None else item[TEMPLATE_FIELDS[column]]
                  for column in TEMPLATE_COLUMNS],
                item["pillar"], item["review"]["state"], latest.get("reviewer_name", ""),
                latest.get("reviewed_at", ""), proof["match_mode"], proof["page"] or proof["anchor"] or "",
                "all pass" if proof["gates_pass"] else ", ".join(
                    f"{gate['gate_id']} {gate['status']}" for gate in proof["gates"]
                    if gate["status"] != "PASS") or "none attached",
                item["model_version"] or "", item["run"]["run_id"] or "", item["key"],
            ])
        return _csv_response(f"clausechain_local_dataset_{date.today().isoformat()}.csv", rows)


class LocalLedgerView(APIView):
    def get(self, request):
        events = []
        for row in LocalReviewDecision.objects.order_by("-created_at")[:500]:
            events.append({
                "id": str(row.pk),
                "event_type": "local_decision",
                "occurred_at": row.reviewed_at.isoformat(),
                "actor": row.reviewer_name,
                "actor_role": row.reviewer_role,
                "action": row.decision,
                "subject": f"{row.economy} · {row.indicator_id} · {row.law_name} {row.article}".strip(),
                "key": row.finding_key,
                "hash": row.review_subject_hash,
                "note": row.note,
                "supersedes_id": str(row.supersedes_id) if row.supersedes_id else None,
            })
        for action in actions_for_mode("local").filter(kind=EngineAction.Kind.RUN)[:200]:
            arguments = action.arguments_json or {}
            subject = f"{arguments.get('economy')} · Pillar {arguments.get('pillar')}"
            base = {"key": str(action.pk), "subject": subject, "note": "", "supersedes_id": None}
            events.append(base | {
                "id": f"{action.pk}:requested", "event_type": "run_requested",
                "occurred_at": action.requested_at.isoformat(),
                "actor": action.requested_by.full_name, "actor_role": "superuser",
                "action": "queued", "hash": "",
            })
            if action.started_at:
                events.append(base | {
                    "id": f"{action.pk}:started", "event_type": "run_started",
                    "occurred_at": action.started_at.isoformat(), "actor": "engine worker",
                    "actor_role": "worker", "action": "started", "hash": "",
                })
            if action.finished_at:
                events.append(base | {
                    "id": f"{action.pk}:finished", "event_type": f"run_{action.status}",
                    "occurred_at": action.finished_at.isoformat(), "actor": "engine worker",
                    "actor_role": "worker", "action": action.status, "hash": lm.output_sha(action),
                    "note": (action.error or "")[:300],
                })
        events.sort(key=lambda event: event["occurred_at"], reverse=True)
        return Response({"count": len(events), "results": events})


def _run_folder(action):
    arguments = action.arguments_json or {}
    return settings.ENGINE_ROOT / "outputs" / f"{arguments.get('out_prefix', 'local')}_{arguments.get('cc')}_p{arguments.get('pillar')}"


def _latest_local_action(action_id):
    for action in lm.latest_runs("local").values():
        if str(action.pk) == str(action_id):
            return action
    raise NotFound("Only the latest Local run of an economy and pillar has files on disk.")


def _file_meta(action, name):
    recorded = lm.output_sha(action) if name == "output.json" else None
    if name == STORED_ENVELOPE:
        data = json.dumps(action.result_json, ensure_ascii=False, indent=1).encode()
        return {"name": name, "exists": True, "size": len(data), "sha256": sha256(data).hexdigest(),
                "recorded_sha256": None, "verified": None, "location": "app database (worker's stored copy)"}
    path = _run_folder(action) / name
    if not path.is_file():
        return {"name": name, "exists": False, "size": 0, "sha256": None, "recorded_sha256": recorded,
                "verified": False if recorded else None,
                "location": str(path.relative_to(settings.ENGINE_ROOT))}
    digest = _sha256(path)
    return {
        "name": name, "exists": True, "size": path.stat().st_size, "sha256": digest,
        "recorded_sha256": recorded, "verified": (digest == recorded) if recorded else None,
        "location": str(path.relative_to(settings.ENGINE_ROOT)),
    }


class LocalRawListView(APIView):
    def get(self, request):
        runs = []
        for action in lm.latest_runs("local").values():
            summary = lm.run_summary(action)
            runs.append({
                "action_id": str(action.pk), "economy": summary["economy"], "pillar": summary["pillar"],
                "run_id": summary["run_id"], "finished_at": summary["finished_at"],
                "files": [_file_meta(action, name) for name in (*RUN_FILES, STORED_ENVELOPE)],
            })
        return Response({"mode": "local", "modes": serialize_modes(), "results": sorted(runs, key=_scope_order)})


class LocalRawFileView(APIView):
    def get(self, request, action_id, name):
        if name not in (*RUN_FILES, STORED_ENVELOPE):
            raise NotFound("Unknown run file.")
        action = _latest_local_action(action_id)
        meta = _file_meta(action, name)
        if not meta["exists"]:
            raise NotFound("That file is not on disk.")
        if name == STORED_ENVELOPE:
            raw = json.dumps(action.result_json, ensure_ascii=False, indent=1)
        else:
            path = _run_folder(action) / name
            if request.query_params.get("download") == "1":
                response = FileResponse(path.open("rb"), as_attachment=True, filename=f"{path.parent.name}_{name}")
                response["X-Content-SHA256"] = meta["sha256"]
                return response
            raw = path.read_text(encoding="utf-8", errors="replace")
        if request.query_params.get("download") == "1":
            response = HttpResponse(raw.encode("utf-8"), content_type="application/json; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{action.pk}_{name}"'
            return response
        parsed = None
        if name.endswith(".json"):
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and isinstance(parsed.get("findings"), list):
                parsed = parsed["findings"]
        elif name.endswith(".csv"):
            parsed = list(csv.DictReader(io.StringIO(raw)))[:200]
        return Response({"file": meta | {"raw_text": raw[:RAW_TEXT_CAP], "truncated": len(raw) > RAW_TEXT_CAP,
                                         "parsed": parsed}})


class ComparisonView(APIView):
    def get(self, request):
        scopes = sorted(lm.comparison_scopes(), key=_scope_order)
        economy = request.query_params.get("economy")
        pillar = request.query_params.get("pillar")
        if not economy:
            first = next((scope for scope in scopes if scope["model_a"] and scope["model_b"]), None)
            economy, pillar = (first["economy"], first["pillar"]) if first else (None, None)
        selected = lm.comparison(economy, pillar) if economy and pillar else None
        return Response({"scopes": scopes, "selected": selected, "models": {
            key: value["models"] for key, value in RUN_MODES.items()}})


def _minutes(seconds):
    return "" if seconds in (None, "") else f"{float(seconds) / 60:.1f}"


class ComparisonExportView(APIView):
    """CSV in the final template's "Engine Comparison" sheet shape (two sections)."""

    def get(self, request):
        economy = request.query_params.get("economy") or ""
        pillar = request.query_params.get("pillar") or ""
        if not economy or not pillar:
            raise ValidationError({"scope": "Choose an economy and pillar."})
        result = lm.comparison(economy, pillar)
        a, b = result["model_a"] or {}, result["model_b"] or {}

        def cell(card, field):
            return card.get(field) if card else ""

        rows = [
            [f"Engine comparison — {economy} · Pillar {pillar}"],
            ["1 · Per-engine summary"],
            ["Field", "Engine A — first pass (Model A: commercial, hybrid)",
             "Engine B — second pass (Model B: open weights, local)"],
            ["Provider and model name", " + ".join(cell(a, "models") or []), " + ".join(cell(b, "models") or [])],
            ["Start time", cell(a, "started_at") or "", cell(b, "started_at") or ""],
            ["End time", cell(a, "finished_at") or "", cell(b, "finished_at") or ""],
            ["Elapsed (minutes)", _minutes(cell(a, "elapsed_seconds")), _minutes(cell(b, "elapsed_seconds"))],
            ["Documents fetched during this pass", cell(a, "documents_fetched"), cell(b, "documents_fetched")],
            ["Cost of this pass (US$)", cell(a, "total_usd"), cell(b, "total_usd") or 0],
            ["Archived corpus fingerprint", cell(a, "corpus_fingerprint") or "", cell(b, "corpus_fingerprint") or ""],
            [],
            ["2 · Provision-by-provision comparison"],
            ["#", "Law Name", "Article / Section", "Indicator ID", "Found by", "Indicator differs?",
             "Citation differs?", "Quoted words differ?", "How they differ — one line"],
        ]
        for row in result["rows"]:
            rows.append([
                row["number"], row["law"], row["article"], row["indicator"],
                {"Both": "Both", "Model A only": "Engine A only", "Model B only": "Engine B only"}[row["found_by"]],
                *[("Yes" if row[flag] else "No") if row["found_by"] == "Both" else "—"
                  for flag in ("indicator_differs", "citation_differs", "quote_differs")],
                row["how"],
            ])
        slug = f"{economy.lower().replace(' ', '_')}_p{pillar}"
        return _csv_response(f"clausechain_engine_comparison_{slug}.csv", rows)
