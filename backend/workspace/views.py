from decimal import Decimal

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .decision_state import effective_finding_review
from .decision_writer import (
    DecisionWriterConflict,
    DecisionWriterError,
    apply_authoritative_decision,
    current_authoritative_hash,
    decision_domain_lock,
)
from .models import (
    CorrectionRequest,
    EngineSnapshot,
    EvidenceRow,
    FindingDecision,
    RecallDecision,
    ReviewItem,
    RunRecord,
    Zone3Decision,
)
from .pagination import WorkspacePagination
from .roles import has_review_role, reviewer_identity
from .serializers import (
    CorrectionRequestWriteSerializer,
    FindingBulkDecisionWriteSerializer,
    FindingDecisionWriteSerializer,
    RecallDecisionWriteSerializer,
    Zone3DecisionWriteSerializer,
)


class AuthoritativeWriterUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_code = "authoritative_writer_unavailable"


class DecisionConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "decision_conflict"


def active_snapshot():
    snapshot = EngineSnapshot.objects.filter(active=True).first()
    if snapshot is None:
        raise APIException(
            "No engine snapshot has been imported.", code="snapshot_unavailable"
        )
    return snapshot


def latest_for(model, key_name, key):
    return model.objects.filter(**{key_name: key}).order_by("-created_at").first()


def serialize_decision(row, *, value_field):
    if row is None:
        return None
    payload = {
        "id": str(row.pk),
        value_field: str(getattr(row, value_field)),
        "reviewer_name": row.reviewer_name,
        "reviewer_role": row.reviewer_role,
        "reviewed_at": row.reviewed_at.isoformat(),
        "authoritative_file_hash": row.authoritative_file_hash,
        "supersedes_id": str(row.supersedes_id) if row.supersedes_id else None,
    }
    if isinstance(row, RecallDecision):
        payload.update(
            reasoning=row.reasoning,
            official_source_url=row.official_source_url,
        )
    elif isinstance(row, Zone3Decision):
        payload.update(score=str(row.score), reasoning=row.reasoning)
    return payload


def review_item_payload(item):
    result = {
        "id": item.pk,
        "position": item.position,
        "row": item.row_json,
        "stable_key": item.stable_key,
        "finding_key": item.finding_key or None,
        "blocked": item.blocked,
        "block_reason": item.block_reason,
        "source_hash": item.source_hash,
    }
    if item.queue in (
        ReviewItem.Queue.NEW,
        ReviewItem.Queue.KNOWN,
        ReviewItem.Queue.ABSENCE,
    ):
        result["review_state"] = effective_finding_review(item.finding_key)
        eligibility_reason = finding_ineligibility(item, item.snapshot)
        result["approval_eligibility"] = {
            "eligible": not bool(eligibility_reason),
            "reason": eligibility_reason,
        }
        correction = (
            CorrectionRequest.objects.filter(finding_key=item.finding_key)
            .order_by("-requested_at")
            .first()
        )
        result["latest_correction"] = (
            {
                "id": str(correction.pk),
                "explanation": correction.explanation,
                "requested_by": correction.requested_by.full_name,
                "requested_at": correction.requested_at.isoformat(),
            }
            if correction
            else None
        )
    elif item.queue == ReviewItem.Queue.RECALL:
        result["latest_decision"] = serialize_decision(
            latest_for(RecallDecision, "recall_key", item.stable_key),
            value_field="verdict",
        )
    else:
        result["latest_decision"] = serialize_decision(
            latest_for(Zone3Decision, "score_key", item.stable_key),
            value_field="verdict",
        )
    return result


def item_is_decided(item):
    if item.queue in (
        ReviewItem.Queue.NEW,
        ReviewItem.Queue.KNOWN,
        ReviewItem.Queue.ABSENCE,
    ):
        return effective_finding_review(item.finding_key)["decision"] is not None
    model, key_name = (
        (RecallDecision, "recall_key")
        if item.queue == ReviewItem.Queue.RECALL
        else (Zone3Decision, "score_key")
    )
    return model.objects.filter(**{key_name: item.stable_key}).exists()


class SummaryView(APIView):
    def get(self, request):
        snapshot = active_snapshot()
        progress = {}
        for queue in ReviewItem.Queue.values:
            items = list(snapshot.review_items.filter(queue=queue))
            progress[queue] = {
                "decided": sum(item_is_decided(item) for item in items),
                "total": len(items),
            }
        return Response(
            {
                "snapshot": {
                    "id": str(snapshot.pk),
                    "schema_version": snapshot.schema_version,
                    "generated_at": snapshot.generated_at.isoformat(),
                    "imported_at": snapshot.imported_at.isoformat(),
                    "source_hash": snapshot.source_hash,
                    "bundle_hash": snapshot.bundle_hash,
                    "engine_git_sha": snapshot.engine_git_sha,
                    "stale": snapshot.stale,
                },
                "counts": snapshot.counts_json,
                "refuter_status": snapshot.refuter_status,
                "champion": snapshot.champion_json,
                "progress": progress,
                "reviewer_roles": list(
                    request.user.groups.filter(
                        name__in=(
                            "citation_reviewer",
                            "mapping_reviewer",
                            "status_reviewer",
                            "admin",
                        )
                    ).values_list("name", flat=True)
                ),
            }
        )


class ReviewQueueView(APIView):
    pagination_class = WorkspacePagination

    def get(self, request, queue):
        if queue not in ReviewItem.Queue.values:
            raise ValidationError({"queue": "Unknown review queue."})
        snapshot = active_snapshot()
        items = list(snapshot.review_items.filter(queue=queue))
        if request.query_params.get("undecided") == "1":
            items = [item for item in items if not item_is_decided(item)]

        if queue == ReviewItem.Queue.NEW:
            headers = snapshot.headers_json.get(queue, [])
            try:
                verdict_index = headers.index("Refuter verdict")
            except ValueError:
                verdict_index = None
            if verdict_index is not None:
                rank = {"SPLIT": 0, "KEEP": 1, "REJECT": 2}
                items.sort(
                    key=lambda item: (
                        rank.get(
                            (
                                str(item.row_json[verdict_index]).upper()
                                if verdict_index < len(item.row_json)
                                else ""
                            ),
                            3,
                        ),
                        item.position,
                    )
                )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(items, request, view=self)
        return Response(
            paginator.response_payload(
                [review_item_payload(item) for item in page],
                queue=queue,
                headers=snapshot.headers_json.get(queue, []),
                snapshot_id=str(snapshot.pk),
                snapshot_hash=snapshot.source_hash,
            )
        )


class EvidenceListView(APIView):
    pagination_class = WorkspacePagination

    def get(self, request):
        rows = list(active_snapshot().evidence_rows.all())
        filters = {
            "economy": "Economy",
            "indicator": "Indicator ID",
            "tag": "Discovery Tag",
            "status": "Status",
        }
        for query_name, field_name in filters.items():
            value = request.query_params.get(query_name)
            if value:
                rows = [
                    row
                    for row in rows
                    if str(row.row_json.get(field_name) or "").casefold()
                    == value.casefold()
                ]
        pillar = request.query_params.get("pillar")
        if pillar:
            rows = [
                row
                for row in rows
                if str(row.row_json.get("Indicator ID") or "").startswith(f"P{pillar}-")
            ]
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(rows, request, view=self)
        return Response(
            paginator.response_payload(
                [
                    {
                        "finding_key": row.finding_key,
                        "row": row.row_json,
                        "blocked": row.blocked,
                        "proof_asset_url": proof_url(row.proof_asset),
                        "source_hash": row.source_hash,
                    }
                    for row in page
                ]
            )
        )


def proof_url(proof_asset):
    if not proof_asset:
        return None
    return "/proof/" + proof_asset.removeprefix("assets/")


class EvidenceDetailView(APIView):
    def get(self, request, finding_key):
        row = get_object_or_404(
            EvidenceRow, snapshot=active_snapshot(), finding_key=finding_key
        )
        return Response(
            {
                "finding_key": row.finding_key,
                "row": row.row_json,
                "blocked": row.blocked,
                "proof_asset_url": proof_url(row.proof_asset),
                "source_hash": row.source_hash,
                "review_state": effective_finding_review(row.finding_key),
            }
        )


class RunsView(APIView):
    def get(self, request):
        records = RunRecord.objects.filter(snapshot=active_snapshot())
        return Response(
            {
                "results": [
                    {
                        "run_name": record.run_name,
                        "envelope": record.envelope_json,
                        "cost": record.cost_json,
                        "source_hash": record.source_hash,
                    }
                    for record in records
                ]
            }
        )


class DecisionHistoryView(APIView):
    def get(self, request, domain, key):
        if domain == "findings":
            rows = FindingDecision.objects.filter(finding_key=key).order_by(
                "created_at"
            )
            results = [
                {
                    "id": str(row.pk),
                    "stage": row.review_stage,
                    "decision": row.decision,
                    "checks": {
                        "citation": row.citation_checked,
                        "mapping": row.mapping_checked,
                        "status": row.status_checked,
                    },
                    "note": row.note,
                    "reviewer_name": row.reviewer_name,
                    "reviewer_role": row.reviewer_role,
                    "reviewed_at": row.reviewed_at.isoformat(),
                    "supersedes_id": (
                        str(row.supersedes_id) if row.supersedes_id else None
                    ),
                    "authoritative_file_hash": row.authoritative_file_hash,
                }
                for row in rows
            ]
            corrections = [
                {
                    "id": str(row.pk),
                    "explanation": row.explanation,
                    "reviewer_name": row.requested_by.full_name,
                    "reviewed_at": row.requested_at.isoformat(),
                    "supersedes_id": (
                        str(row.supersedes_id) if row.supersedes_id else None
                    ),
                    "authoritative_file_hash": row.authoritative_file_hash,
                }
                for row in CorrectionRequest.objects.filter(finding_key=key).order_by(
                    "requested_at"
                )
            ]
            return Response(
                {
                    "domain": domain,
                    "key": key,
                    "results": results,
                    "corrections": corrections,
                    "effective_review": effective_finding_review(key),
                }
            )
        if domain == "recall":
            rows = RecallDecision.objects.filter(recall_key=key).order_by("created_at")
            value_field = "verdict"
        elif domain == "zone3":
            rows = Zone3Decision.objects.filter(score_key=key).order_by("created_at")
            value_field = "verdict"
        else:
            raise ValidationError({"domain": "Unknown decision domain."})
        return Response(
            {
                "domain": domain,
                "key": key,
                "results": [
                    serialize_decision(row, value_field=value_field) for row in rows
                ],
            }
        )


def require_role(user, role):
    if not has_review_role(user, role):
        raise PermissionDenied(f"The {role} reviewer role is required.")


def concurrency_check(latest, expected):
    latest_id = latest.pk if latest else None
    if latest_id != expected:
        raise DecisionConflict(
            {
                "detail": "This review changed after it was loaded.",
                "latest_decision_id": str(latest_id) if latest_id else None,
            }
        )


def writer_or_503(domain, decisions):
    try:
        return apply_authoritative_decision(
            domain,
            decisions,
            expected_file_hash=current_authoritative_hash(domain),
        )
    except DecisionWriterConflict as exc:
        raise DecisionConflict(
            {
                "detail": "The authoritative decision file changed outside this review session.",
                "current_file_hash": exc.current_sha or None,
            }
        ) from exc
    except DecisionWriterError as exc:
        raise AuthoritativeWriterUnavailable(str(exc)) from exc


def engine_finding_decisions(
    finding_key, effective, *, reviewer_name, reviewer_role, reviewed_at, note=""
):
    if not effective.get("decision"):
        return []
    return [
        {
            "finding_key": finding_key,
            "review": {
                "decision": effective["decision"],
                "reviewer_name": reviewer_name,
                "reviewer_role": reviewer_role,
                "reviewed_at": reviewed_at.isoformat(),
                "citation_checked": effective["citation_checked"],
                "mapping_checked": effective["mapping_checked"],
                "status_checked": effective["status_checked"],
                "citation_reviewer_name": effective["citation_reviewer_name"],
                "mapping_reviewer_name": effective["mapping_reviewer_name"],
                "status_reviewer_name": effective["status_reviewer_name"],
                "correction_note": note or None,
            },
        }
    ]


def sheet_cell(snapshot, queue, row, header):
    if isinstance(row, dict):
        return row.get(header) or row.get(header.casefold().replace(" ", "_"))
    headers = snapshot.headers_json.get(queue, [])
    try:
        index = headers.index(header)
    except ValueError:
        return None
    return row[index] if index < len(row) else None


def sheet_record(sheet, row):
    """Return a sheet row as a named record without changing the stored snapshot."""
    if isinstance(row, dict):
        return row
    return dict(zip(sheet.get("headers") or [], row))


def finding_ineligibility(item, snapshot):
    """Mechanical approval gate shared by individual and bulk decisions."""
    if snapshot.stale:
        return "The active snapshot is stale. Refresh before recording a decision."
    if item.blocked:
        return item.block_reason or "The evidence is technically blocked."

    evidence = EvidenceRow.objects.filter(
        snapshot=snapshot, finding_key=item.finding_key
    ).first()
    if not evidence:
        return "The finding has no consolidated evidence row."
    if evidence.blocked:
        return "The consolidated evidence row is technically blocked."
    row = evidence.row_json
    if str(row.get("Status") or "").strip() != "in_force":
        return "The source is not verified as in force."
    if not row.get("status_evidence") or not row.get("status_evidence_record"):
        return "The finding lacks complete currentness evidence."
    status_record = row.get("status_evidence_record") or {}
    if status_record.get("conflicting"):
        return "The currentness evidence is conflicting."

    if item.queue == ReviewItem.Queue.ABSENCE:
        manifest = row.get("search_coverage_manifest")
        if not isinstance(manifest, dict):
            return "The absence conclusion lacks a search-coverage manifest."
        if manifest.get("unresolved_failures"):
            return "The absence search has unresolved acquisition failures."
        if not manifest.get("portals") or not manifest.get("instruments"):
            return "The absence search coverage is incomplete."
        instrument_results = manifest.get("instrument_results") or []
        if any(
            not result.get("evidence_eligible")
            or result.get("legal_status") != "in_force"
            for result in instrument_results
        ):
            return "The absence coverage includes an ineligible or non-current instrument."
    else:
        proof = row.get("citation_proof")
        if not isinstance(proof, dict):
            return "The finding lacks a complete citation proof."
        if proof.get("alignment_status") in ("unaligned", "ambiguous", "review", None):
            return "The source citation is unresolved or ambiguously aligned."
        failed_gates = [
            gate.get("gate_id")
            for gate in proof.get("gate_results") or []
            if gate.get("status") != "PASS"
        ]
        if failed_gates:
            return f"Evidence gates are not passing: {', '.join(filter(None, failed_gates))}."
    return ""


class ReviewContextView(APIView):
    def get(self, request, queue, stable_key):
        if queue not in ReviewItem.Queue.values:
            raise ValidationError({"queue": "Unknown review queue."})
        snapshot = active_snapshot()
        item = get_object_or_404(
            ReviewItem, snapshot=snapshot, queue=queue, stable_key=stable_key
        )
        item_record = sheet_record(
            {"headers": snapshot.headers_json.get(queue, [])}, item.row_json
        )
        economy = str(item_record.get("Economy") or "")
        indicator = str(item_record.get("Indicator") or item_record.get("Indicator ID") or "")
        law = str(
            item_record.get("Law/instrument")
            or item_record.get("Configured governing instrument")
            or item_record.get("Master act/instrument")
            or ""
        )

        criteria_sheet = snapshot.reference_json.get("indicator_criteria") or {}
        criteria = [
            sheet_record(criteria_sheet, row)
            for row in criteria_sheet.get("rows") or []
            if str(sheet_record(criteria_sheet, row).get("Indicator") or "") == indicator
        ]
        master_sheet = snapshot.reference_json.get("master_known") or {}
        master_known = [
            sheet_record(master_sheet, row)
            for row in master_sheet.get("rows") or []
            if str(sheet_record(master_sheet, row).get("Economy") or "") == economy
            and str(sheet_record(master_sheet, row).get("Indicator") or "") == indicator
        ]

        related = []
        for evidence in snapshot.evidence_rows.all():
            row = evidence.row_json
            same_indicator = (
                str(row.get("Economy") or "") == economy
                and str(row.get("Indicator ID") or "") == indicator
            )
            same_law = bool(law) and str(row.get("Law Name") or "") == law
            if same_indicator or same_law:
                related.append(
                    {
                        "finding_key": evidence.finding_key,
                        "row": row,
                        "blocked": evidence.blocked,
                        "proof_asset_url": proof_url(evidence.proof_asset),
                        "same_law": same_law,
                        "same_indicator": same_indicator,
                    }
                )

        zone_item = None
        for candidate in snapshot.review_items.filter(queue=ReviewItem.Queue.ZONE3):
            record = sheet_record(
                {"headers": snapshot.headers_json.get(ReviewItem.Queue.ZONE3, [])},
                candidate.row_json,
            )
            if record.get("Economy") == economy and record.get("Indicator") == indicator:
                zone_item = candidate
                break
        zone3 = None
        if zone_item:
            zone_record = sheet_record(
                {"headers": snapshot.headers_json.get(ReviewItem.Queue.ZONE3, [])},
                zone_item.row_json,
            )
            latest = latest_for(Zone3Decision, "score_key", zone_item.stable_key)
            zone3 = {
                "score_key": zone_item.stable_key,
                "deterministic_score": zone_record.get("Deterministic score"),
                "effective_score": float(latest.score) if latest else zone_record.get("Deterministic score"),
                "source": "reviewer" if latest else "deterministic",
                "reviewer_name": latest.reviewer_name if latest else None,
                "reviewed_at": latest.reviewed_at.isoformat() if latest else None,
            }

        return Response(
            {
                "queue": queue,
                "stable_key": stable_key,
                "snapshot": {
                    "id": str(snapshot.pk),
                    "source_hash": snapshot.source_hash,
                    "stale": snapshot.stale,
                },
                "indicator_criteria": criteria[0] if criteria else None,
                "master_known": master_known,
                "related_evidence": related,
                "zone3": zone3,
                "approval_eligibility": {
                    "eligible": not bool(finding_ineligibility(item, snapshot))
                    if queue in (ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE)
                    else not snapshot.stale and not item.blocked,
                    "reason": finding_ineligibility(item, snapshot)
                    if queue in (ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE)
                    else (item.block_reason if item.blocked else ("The active snapshot is stale." if snapshot.stale else "")),
                },
                "score_semantics": {
                    "level": "indicator",
                    "finding_has_independent_score": False,
                    "allowed_scores": [0, 0.5, 1],
                    "explanation": "A finding is an evidence row. The 0, 0.5, or 1 score is decided once at indicator level, using all approved evidence and the methodology.",
                },
            }
        )


class FindingDecisionView(APIView):
    def post(self, request):
        serializer = FindingDecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        stage = data["review_stage"]
        require_role(request.user, stage)
        snapshot = active_snapshot()
        item = get_object_or_404(
            ReviewItem,
            snapshot=snapshot,
            queue=data["queue"],
            finding_key=data["finding_key"],
        )
        if snapshot.stale:
            raise ValidationError({"snapshot": "The active snapshot is stale."})
        reason = finding_ineligibility(item, snapshot)
        if reason and data["decision"] == FindingDecision.Verdict.APPROVED:
            raise ValidationError(
                {"decision": reason}
            )

        reviewer_name, reviewer_id = reviewer_identity(request.user)
        reviewed_at = timezone.now()
        prospective = {
            **data,
            "id": "prospective",
            "reviewer_name": reviewer_name,
            "reviewed_at": reviewed_at,
            "created_by_id": request.user.pk,
        }

        with decision_domain_lock("findings"):
            latest_stage = (
                FindingDecision.objects.filter(
                    finding_key=data["finding_key"], review_stage=stage
                )
                .order_by("-created_at")
                .first()
            )
            concurrency_check(latest_stage, data.pop("expected_latest_decision_id"))
            effective = effective_finding_review(
                data["finding_key"], prospective=prospective
            )
            validate_distinct_stage_reviewer(
                data["finding_key"], stage, data["decision"], request.user, effective
            )
            engine_decisions = engine_finding_decisions(
                data["finding_key"],
                effective,
                reviewer_name=reviewer_name,
                reviewer_role=stage,
                reviewed_at=reviewed_at,
                note=data["note"],
            )
            receipt = writer_or_503(
                "findings",
                engine_decisions,
            )
            row = FindingDecision.objects.create(
                **data,
                reviewer_name=reviewer_name,
                reviewer_role=stage,
                reviewed_at=reviewed_at,
                created_by=request.user,
                supersedes=latest_stage,
                authoritative_file_hash=receipt["sha256"],
                writer_receipt_json=receipt,
            )
        return Response(
            {
                "decision_id": str(row.pk),
                "authoritative_file_hash": receipt["sha256"],
                "review_state": effective_finding_review(row.finding_key),
                "reviewer_id": reviewer_id,
                "outcome": (
                    "engine_decision_written" if engine_decisions else "stage_recorded"
                ),
                "engine_exported": bool(engine_decisions),
            },
            status=status.HTTP_201_CREATED,
        )


def validate_distinct_stage_reviewer(finding_key, stage, decision, user, effective):
    if (
        effective["decision"] == "approved"
        and effective["citation_reviewer_name"].strip().casefold()
        == effective["mapping_reviewer_name"].strip().casefold()
    ):
        raise ValidationError(
            {
                "review_stage": "Citation and mapping approval must have different reviewer names."
            }
        )
    if stage not in (FindingDecision.Stage.CITATION, FindingDecision.Stage.MAPPING):
        return
    other_stage = (
        FindingDecision.Stage.MAPPING
        if stage == FindingDecision.Stage.CITATION
        else FindingDecision.Stage.CITATION
    )
    other = effective["stages"].get(other_stage)
    if (
        decision == FindingDecision.Verdict.APPROVED
        and other
        and other["reviewer_user_id"] == str(user.pk)
    ):
        raise ValidationError(
            {"review_stage": "The same user cannot approve citation and mapping."}
        )


def bulk_ineligibility(item, snapshot):
    reason = finding_ineligibility(item, snapshot)
    if reason:
        return reason
    headers = snapshot.headers_json.get(item.queue, [])
    if isinstance(item.row_json, list) and "Gate warnings" in headers:
        index = headers.index("Gate warnings")
        warning = str(
            item.row_json[index] if index < len(item.row_json) else ""
        ).strip()
        if warning and warning.casefold() not in ("none", "—"):
            return "The finding has gate warnings and requires individual review."
    return ""


class FindingBulkDecisionView(APIView):
    def post(self, request):
        serializer = FindingBulkDecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        stage = data["review_stage"]
        require_role(request.user, stage)
        snapshot = active_snapshot()
        items = list(
            ReviewItem.objects.filter(
                snapshot=snapshot,
                queue=ReviewItem.Queue.KNOWN,
                finding_key__in=data["finding_keys"],
            )
        )
        if len(items) != len(data["finding_keys"]):
            found = {item.finding_key for item in items}
            unknown = sorted(set(data["finding_keys"]) - found)
            raise ValidationError(
                {"finding_keys": f"Unknown/non-KNOWN finding keys: {unknown}"}
            )
        failures = {
            item.finding_key: reason
            for item in items
            if (reason := bulk_ineligibility(item, snapshot))
        }
        if failures:
            raise ValidationError({"ineligible": failures})

        reviewer_name, reviewer_id = reviewer_identity(request.user)
        reviewed_at = timezone.now()
        expected = data.pop("expected_latest_decision_ids")
        finding_keys = data.pop("finding_keys")
        with decision_domain_lock("findings"):
            engine_decisions = []
            latest_by_key = {}
            for key in finding_keys:
                latest_stage = (
                    FindingDecision.objects.filter(finding_key=key, review_stage=stage)
                    .order_by("-created_at")
                    .first()
                )
                concurrency_check(latest_stage, expected[key])
                latest_by_key[key] = latest_stage
                prospective = {
                    **data,
                    "id": "prospective",
                    "finding_key": key,
                    "queue": ReviewItem.Queue.KNOWN,
                    "decision": FindingDecision.Verdict.APPROVED,
                    "reviewer_name": reviewer_name,
                    "reviewed_at": reviewed_at,
                    "created_by_id": request.user.pk,
                }
                effective = effective_finding_review(key, prospective=prospective)
                validate_distinct_stage_reviewer(
                    key,
                    stage,
                    FindingDecision.Verdict.APPROVED,
                    request.user,
                    effective,
                )
                engine_decisions.extend(
                    engine_finding_decisions(
                        key,
                        effective,
                        reviewer_name=reviewer_name,
                        reviewer_role=stage,
                        reviewed_at=reviewed_at,
                        note=data["note"],
                    )
                )
            receipt = writer_or_503(
                "findings",
                engine_decisions,
            )
            rows = [
                FindingDecision.objects.create(
                    finding_key=key,
                    queue=ReviewItem.Queue.KNOWN,
                    review_stage=stage,
                    decision=FindingDecision.Verdict.APPROVED,
                    citation_checked=data["citation_checked"],
                    mapping_checked=data["mapping_checked"],
                    status_checked=data["status_checked"],
                    note=data["note"],
                    reviewer_name=reviewer_name,
                    reviewer_role=stage,
                    reviewed_at=reviewed_at,
                    created_by=request.user,
                    supersedes=latest_by_key[key],
                    authoritative_file_hash=receipt["sha256"],
                    writer_receipt_json=receipt,
                )
                for key in finding_keys
            ]
        return Response(
            {
                "decision_ids": [str(row.pk) for row in rows],
                "authoritative_file_hash": receipt["sha256"],
                "reviewer_id": reviewer_id,
                "outcome": (
                    "engine_decision_written" if engine_decisions else "stage_recorded"
                ),
                "engine_exported": bool(engine_decisions),
                "review_states": {
                    row.finding_key: effective_finding_review(row.finding_key)
                    for row in rows
                },
            },
            status=status.HTTP_201_CREATED,
        )


class RecallDecisionView(APIView):
    def post(self, request):
        require_role(request.user, "recall")
        serializer = RecallDecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        snapshot = active_snapshot()
        if snapshot.stale:
            raise ValidationError({"snapshot": "The active snapshot is stale."})
        item = get_object_or_404(
            ReviewItem,
            snapshot=snapshot,
            queue=ReviewItem.Queue.RECALL,
            stable_key=data["recall_key"],
        )
        if item.blocked:
            raise ValidationError({"verdict": item.block_reason or "The recall item is blocked."})
        reviewer_name, reviewer_id = reviewer_identity(request.user)
        with decision_domain_lock("recall"):
            latest = latest_for(RecallDecision, "recall_key", data["recall_key"])
            concurrency_check(latest, data.pop("expected_latest_decision_id"))
            reviewed_at = timezone.now()
            receipt = writer_or_503(
                "recall",
                [
                    {
                        **{
                            key: str(value) if isinstance(value, Decimal) else value
                            for key, value in data.items()
                        },
                        "reviewer_name": reviewer_name,
                        "reviewer_role": "mapping",
                        "reviewed_at": reviewed_at.isoformat(),
                    }
                ],
            )
            row = RecallDecision.objects.create(
                **data,
                reviewer_name=reviewer_name,
                reviewer_role="mapping",
                reviewed_at=reviewed_at,
                created_by=request.user,
                supersedes=latest,
                authoritative_file_hash=receipt["sha256"],
                writer_receipt_json=receipt,
            )
        return Response(
            {
                "decision_id": str(row.pk),
                "authoritative_file_hash": receipt["sha256"],
                "reviewer_id": reviewer_id,
            },
            status=status.HTTP_201_CREATED,
        )


class Zone3DecisionView(APIView):
    def post(self, request):
        require_role(request.user, "zone3")
        serializer = Zone3DecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        snapshot = active_snapshot()
        if snapshot.stale:
            raise ValidationError({"snapshot": "The active snapshot is stale."})
        item = get_object_or_404(
            ReviewItem,
            snapshot=snapshot,
            queue=ReviewItem.Queue.ZONE3,
            stable_key=data["score_key"],
        )
        if item.blocked:
            raise ValidationError({"score": item.block_reason or "The score item is blocked."})
        reviewer_name, reviewer_id = reviewer_identity(request.user)
        with decision_domain_lock("zone3"):
            latest = latest_for(Zone3Decision, "score_key", data["score_key"])
            concurrency_check(latest, data.pop("expected_latest_decision_id"))
            reviewed_at = timezone.now()
            event = {
                "economy": sheet_cell(
                    item.snapshot, ReviewItem.Queue.ZONE3, item.row_json, "Economy"
                ),
                "indicator": sheet_cell(
                    item.snapshot, ReviewItem.Queue.ZONE3, item.row_json, "Indicator"
                ),
                "action": (
                    "approve"
                    if data["verdict"] == Zone3Decision.Verdict.APPROVED
                    else "override"
                ),
                "score": float(data["score"]),
                "reasoning": data["reasoning"],
                "reviewer_name": reviewer_name,
                "reviewer_role": "mapping",
                "reviewed_at": reviewed_at.isoformat(),
            }
            receipt = writer_or_503(
                "zone3",
                [event],
            )
            row = Zone3Decision.objects.create(
                **data,
                reviewer_name=reviewer_name,
                reviewer_role="mapping",
                reviewed_at=reviewed_at,
                created_by=request.user,
                supersedes=latest,
                authoritative_file_hash=receipt["sha256"],
                writer_receipt_json=receipt,
            )
        return Response(
            {
                "decision_id": str(row.pk),
                "authoritative_file_hash": receipt["sha256"],
                "reviewer_id": reviewer_id,
            },
            status=status.HTTP_201_CREATED,
        )


class CorrectionRequestView(APIView):
    def post(self, request):
        serializer = CorrectionRequestWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if not (
            has_review_role(request.user, "citation")
            or has_review_role(request.user, "mapping")
            or has_review_role(request.user, "status")
        ):
            raise PermissionDenied("A reviewer role is required.")
        snapshot = active_snapshot()
        if snapshot.stale:
            raise ValidationError({"snapshot": "The active snapshot is stale."})
        get_object_or_404(
            ReviewItem,
            snapshot=snapshot,
            queue=data["queue"],
            finding_key=data["finding_key"],
        )
        with decision_domain_lock("findings"):
            latest = (
                CorrectionRequest.objects.filter(finding_key=data["finding_key"])
                .order_by("-requested_at")
                .first()
            )
            concurrency_check(latest, data.pop("expected_latest_correction_id"))
            reviewed_at = timezone.now()
            receipt = writer_or_503(
                "findings",
                [
                    {
                        "finding_key": data["finding_key"],
                        "review": {
                            "decision": "rejected",
                            "reviewer_name": request.user.full_name,
                            "reviewer_role": "correction-request",
                            "reviewed_at": reviewed_at.isoformat(),
                            "citation_checked": False,
                            "mapping_checked": False,
                            "status_checked": False,
                            "citation_reviewer_name": "",
                            "mapping_reviewer_name": "",
                            "status_reviewer_name": "",
                            "correction_note": data["explanation"],
                        },
                    }
                ],
            )
            row = CorrectionRequest.objects.create(
                **data,
                requested_by=request.user,
                supersedes=latest,
                authoritative_file_hash=receipt["sha256"],
                writer_receipt_json=receipt,
            )
        return Response(
            {
                "correction_request_id": str(row.pk),
                "finding_key": row.finding_key,
                "authoritative_file_hash": receipt["sha256"],
            },
            status=status.HTTP_201_CREATED,
        )
