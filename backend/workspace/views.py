from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .decision_state import effective_finding_review
from .decision_writer import (
    DecisionWriterError,
    apply_authoritative_decision,
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
        raise APIException("No engine snapshot has been imported.", code="snapshot_unavailable")
    return snapshot


def latest_for(model, key_name, key):
    return model.objects.filter(**{key_name: key}).order_by("-created_at").first()


def serialize_decision(row, *, value_field):
    if row is None:
        return None
    return {
        "id": str(row.pk),
        value_field: str(getattr(row, value_field)),
        "reviewer_name": row.reviewer_name,
        "reviewer_role": row.reviewer_role,
        "reviewed_at": row.reviewed_at.isoformat(),
        "authoritative_file_hash": row.authoritative_file_hash,
        "supersedes_id": str(row.supersedes_id) if row.supersedes_id else None,
    }


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
    if item.queue in (ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE):
        result["review_state"] = effective_finding_review(item.finding_key)
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
            latest_for(RecallDecision, "recall_key", item.stable_key), value_field="verdict"
        )
    else:
        result["latest_decision"] = serialize_decision(
            latest_for(Zone3Decision, "score_key", item.stable_key), value_field="verdict"
        )
    return result


def item_is_decided(item):
    if item.queue in (ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE):
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
                            str(item.row_json[verdict_index]).upper()
                            if verdict_index < len(item.row_json)
                            else "",
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
                    row for row in rows
                    if str(row.row_json.get(field_name) or "").casefold() == value.casefold()
                ]
        pillar = request.query_params.get("pillar")
        if pillar:
            rows = [
                row for row in rows
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


def writer_or_503(domain, payload):
    try:
        return apply_authoritative_decision(domain, payload)
    except DecisionWriterError as exc:
        raise AuthoritativeWriterUnavailable(str(exc)) from exc


class FindingDecisionView(APIView):
    def post(self, request):
        serializer = FindingDecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        stage = data["review_stage"]
        require_role(request.user, stage)
        item = get_object_or_404(
            ReviewItem,
            snapshot=active_snapshot(),
            queue=data["queue"],
            finding_key=data["finding_key"],
        )
        if item.blocked and data["decision"] == FindingDecision.Verdict.APPROVED:
            raise ValidationError({"decision": "A technically blocked finding cannot be approved."})

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
            latest = latest_for(
                FindingDecision,
                "finding_key",
                data["finding_key"],
            )
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
            if (
                effective["decision"] == "approved"
                and effective["citation_reviewer_name"] == effective["mapping_reviewer_name"]
            ):
                raise ValidationError(
                    {"review_stage": "Citation and mapping approval must come from different users."}
                )
            # Enforce identity separation immediately, even before status completion.
            other_stage = (
                FindingDecision.Stage.MAPPING
                if stage == FindingDecision.Stage.CITATION
                else FindingDecision.Stage.CITATION
            )
            if stage in (FindingDecision.Stage.CITATION, FindingDecision.Stage.MAPPING):
                other = (
                    FindingDecision.objects.filter(
                        finding_key=data["finding_key"],
                        review_stage=other_stage,
                        decision=FindingDecision.Verdict.APPROVED,
                    )
                    .order_by("-created_at")
                    .first()
                )
                if (
                    data["decision"] == FindingDecision.Verdict.APPROVED
                    and other
                    and other.created_by_id == request.user.pk
                ):
                    raise ValidationError(
                        {"review_stage": "The same user cannot approve citation and mapping."}
                    )

            receipt = writer_or_503(
                "findings",
                {
                    "schema_version": "1",
                    "event": {
                        "finding_key": data["finding_key"],
                        "queue": data["queue"],
                        "review_stage": stage,
                        "decision": data["decision"],
                        "reviewer_name": reviewer_name,
                        "reviewer_role": stage,
                        "reviewed_at": reviewed_at.isoformat(),
                        "citation_checked": data["citation_checked"],
                        "mapping_checked": data["mapping_checked"],
                        "status_checked": data["status_checked"],
                        "note": data["note"],
                    },
                    "effective_review": {key: value for key, value in effective.items() if key != "stages"},
                    "expected_file_hash": latest.authoritative_file_hash if latest else None,
                },
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
            },
            status=status.HTTP_201_CREATED,
        )


class RecallDecisionView(APIView):
    def post(self, request):
        require_role(request.user, "recall")
        serializer = RecallDecisionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        get_object_or_404(
            ReviewItem,
            snapshot=active_snapshot(),
            queue=ReviewItem.Queue.RECALL,
            stable_key=data["recall_key"],
        )
        reviewer_name, reviewer_id = reviewer_identity(request.user)
        with decision_domain_lock("recall"):
            latest = latest_for(RecallDecision, "recall_key", data["recall_key"])
            concurrency_check(latest, data.pop("expected_latest_decision_id"))
            reviewed_at = timezone.now()
            receipt = writer_or_503(
                "recall",
                {
                    "schema_version": "1",
                    "decision": {
                        **{key: str(value) if isinstance(value, Decimal) else value for key, value in data.items()},
                        "reviewer_name": reviewer_name,
                        "reviewer_role": "mapping",
                        "reviewed_at": reviewed_at.isoformat(),
                    },
                    "expected_file_hash": latest.authoritative_file_hash if latest else None,
                },
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
        get_object_or_404(
            ReviewItem,
            snapshot=active_snapshot(),
            queue=ReviewItem.Queue.ZONE3,
            stable_key=data["score_key"],
        )
        reviewer_name, reviewer_id = reviewer_identity(request.user)
        with decision_domain_lock("zone3"):
            latest = latest_for(Zone3Decision, "score_key", data["score_key"])
            concurrency_check(latest, data.pop("expected_latest_decision_id"))
            reviewed_at = timezone.now()
            event = {
                **data,
                "score": str(data["score"]),
                "reviewer_name": reviewer_name,
                "reviewer_role": "mapping",
                "reviewed_at": reviewed_at.isoformat(),
            }
            receipt = writer_or_503(
                "zone3",
                {
                    "schema_version": "1",
                    "decision": event,
                    "expected_file_hash": latest.authoritative_file_hash if latest else None,
                },
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
        get_object_or_404(
            ReviewItem,
            snapshot=active_snapshot(),
            queue=data["queue"],
            finding_key=data["finding_key"],
        )
        with transaction.atomic():
            latest = (
                CorrectionRequest.objects.select_for_update()
                .filter(finding_key=data["finding_key"])
                .order_by("-requested_at")
                .first()
            )
            concurrency_check(latest, data.pop("expected_latest_correction_id"))
            row = CorrectionRequest.objects.create(
                **data,
                requested_by=request.user,
                supersedes=latest,
            )
        return Response(
            {"correction_request_id": str(row.pk), "finding_key": row.finding_key},
            status=status.HTTP_201_CREATED,
        )
