import tempfile
import json
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth.models import Group
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User

from .importer import SnapshotImportError, import_snapshot
from .decision_writer import (
    DecisionWriterConflict,
    apply_authoritative_decision,
    decision_domain_lock,
)
from .keys import recall_key, zone3_key
from .models import (
    CorrectionRequest,
    EngineSnapshot,
    EvidenceRow,
    FindingDecision,
    RecallDecision,
    ReviewItem,
    Zone3Decision,
)


HASH = "a" * 64
RECEIPT = {"sha256": "b" * 64, "path": "data/review/decisions.json"}


def minimal_artifacts():
    common_headers = ["Economy", "Indicator", "Law/instrument", "Article/section"]
    absence_headers = [
        "Economy",
        "Indicator",
        "Configured governing instrument",
        "Official source URL",
    ]
    recall_headers = [
        "Economy",
        "Indicator",
        "Master act/instrument",
        "Master citation",
    ]
    zone_headers = ["Economy", "Indicator"]
    new_row = ["Singapore", "P6-I4", "Privacy Act", "s. 26"]
    known_row = ["Singapore", "P7-I1", "Privacy Act", "s. 3"]
    absence_row = ["Singapore", "P6-I1", "Privacy Act", "https://official.example"]
    key_rows = [
        {
            "finding_key": "1" * 64,
            "economy": "Singapore",
            "indicator": "P6-I4",
            "law": "Privacy Act",
            "article": "s. 26",
            "is_absence": False,
            "blocked": False,
            "proof_asset": "assets/one.png",
        },
        {
            "finding_key": "2" * 64,
            "economy": "Singapore",
            "indicator": "P7-I1",
            "law": "Privacy Act",
            "article": "s. 3",
            "is_absence": False,
            "blocked": False,
            "proof_asset": None,
        },
        {
            "finding_key": "3" * 64,
            "economy": "Singapore",
            "indicator": "P6-I1",
            "law": "Privacy Act",
            "article": "n/a",
            "is_absence": True,
            "blocked": True,
            "proof_asset": None,
        },
    ]
    consolidated = [
        {
            "Economy": item["economy"],
            "Indicator ID": item["indicator"],
            "Law Name": item["law"],
            "Article / Section": item["article"],
            "Discovery Tag": "KNOWN",
            "Status": "in_force",
        }
        for item in key_rows
    ]
    return {
        "payload": {
            "schema_version": "2",
            "generated_at": "2026-07-18T12:00:00Z",
            "counts": {"new": 1, "known": 1, "absence": 1, "recall": 1, "zone3": 1},
            "refuter_status": "ready",
            "sheets": {
                "NEW Findings": {"headers": common_headers, "rows": [new_row]},
                "Absence Review": {"headers": absence_headers, "rows": [absence_row]},
                "Recall Misses": {
                    "headers": recall_headers,
                    "rows": [["Singapore", "P7-I3", "Employment Act", "s. 95"]],
                },
                "Zone-3 Scores": {
                    "headers": zone_headers,
                    "rows": [["Singapore", "P7-I3"]],
                },
                "KNOWN Findings": {"headers": common_headers, "rows": [known_row]},
            },
        },
        "key_map": {"rows": key_rows},
        "consolidated": {"rows": consolidated},
        "champion": {"status": "FAIL", "failures": ["human review pending"]},
        "costs": [],
        "runs": {f"run-{index}": {"country": "SG", "pillar": 6} for index in range(6)},
    }


class SnapshotImportTests(TestCase):
    def test_import_is_atomic_idempotent_and_builds_all_domains(self):
        snapshot, created = import_snapshot(minimal_artifacts())
        self.assertTrue(created)
        self.assertTrue(snapshot.active)
        self.assertEqual(snapshot.review_items.count(), 5)
        self.assertEqual(snapshot.evidence_rows.count(), 3)
        self.assertEqual(snapshot.run_records.count(), 6)
        self.assertFalse(
            snapshot.review_items.get(queue=ReviewItem.Queue.ABSENCE).blocked
        )
        self.assertEqual(
            snapshot.review_items.get(queue=ReviewItem.Queue.RECALL).stable_key,
            recall_key("Singapore", "P7-I3", "Employment Act", "s. 95"),
        )
        self.assertEqual(
            snapshot.review_items.get(queue=ReviewItem.Queue.ZONE3).stable_key,
            zone3_key("Singapore", "P7-I3"),
        )

        same, created = import_snapshot(minimal_artifacts())
        self.assertFalse(created)
        self.assertEqual(same.pk, snapshot.pk)
        self.assertEqual(EngineSnapshot.objects.count(), 1)

        refreshed = minimal_artifacts()
        refreshed["payload"]["generated_at"] = "2026-07-18T12:05:00Z"
        same, created = import_snapshot(refreshed)
        self.assertFalse(created)
        self.assertEqual(same.pk, snapshot.pk)

    def test_missing_finding_mapping_rolls_back(self):
        artifacts = minimal_artifacts()
        artifacts["key_map"]["rows"] = []
        with self.assertRaises(SnapshotImportError):
            import_snapshot(artifacts)
        self.assertEqual(EngineSnapshot.objects.count(), 0)


class WorkspaceApiTests(TestCase):
    def setUp(self):
        self.snapshot, _ = import_snapshot(minimal_artifacts())
        self.client = APIClient()
        self.citation = self.make_user(
            "citation", "Citation Reviewer", "citation_reviewer"
        )
        self.mapping = self.make_user("mapping", "Mapping Reviewer", "mapping_reviewer")
        self.status_user = self.make_user(
            "status", "Status Reviewer", "status_reviewer"
        )

    def make_user(self, username, full_name, group_name):
        first_name, last_name = full_name.split(" ", 1)
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="SafePass123!",
            first_name=first_name,
            last_name=last_name,
            email_verified=True,
        )
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)
        return user

    def authenticate(self, user):
        self.client.force_authenticate(user)

    def test_read_apis_require_auth_and_expose_real_snapshot(self):
        self.assertEqual(self.client.get("/api/workspace/summary/").status_code, 401)
        self.authenticate(self.citation)
        response = self.client.get("/api/workspace/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"]["new"], 1)
        response = self.client.get("/api/workspace/review/new/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["finding_key"], "1" * 64)
        response = self.client.get(
            "/api/workspace/evidence/?pillar=6&economy=Singapore"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        response = self.client.get(f"/api/workspace/evidence/{'1' * 64}/")
        self.assertEqual(response.data["proof_asset_url"], "/proof/one.png")
        self.assertEqual(
            self.client.get("/api/workspace/runs/").data["results"].__len__(), 6
        )

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_staged_reviews_require_distinct_users_and_are_append_only(self, writer):
        key = "1" * 64
        self.authenticate(self.citation)
        citation_response = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": key,
                "queue": "new",
                "review_stage": "citation",
                "decision": "approved",
                "citation_checked": True,
                "status_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(citation_response.status_code, 201, citation_response.data)
        self.assertEqual(citation_response.data["outcome"], "stage_recorded")
        self.assertFalse(citation_response.data["engine_exported"])
        citation_row = FindingDecision.objects.get()
        self.assertIsNone(citation_response.data["review_state"]["decision"])
        with self.assertRaises(DjangoValidationError):
            citation_row.save()

        self.authenticate(self.mapping)
        mapping_response = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": key,
                "queue": "new",
                "review_stage": "mapping",
                "decision": "approved",
                "mapping_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(mapping_response.status_code, 201, mapping_response.data)
        self.assertEqual(mapping_response.data["outcome"], "engine_decision_written")
        self.assertTrue(mapping_response.data["engine_exported"])
        self.assertEqual(mapping_response.data["review_state"]["decision"], "approved")
        self.assertEqual(FindingDecision.objects.count(), 2)
        self.assertEqual(writer.call_count, 2)
        self.assertEqual(writer.call_args_list[0].args[1], [])
        final_batch = writer.call_args_list[1].args[1]
        self.assertEqual(final_batch[0]["review"]["decision"], "approved")
        self.assertEqual(
            final_batch[0]["review"]["citation_reviewer_name"],
            self.citation.full_name,
        )
        self.assertEqual(
            final_batch[0]["review"]["mapping_reviewer_name"],
            self.mapping.full_name,
        )
        history = self.client.get(f"/api/workspace/decisions/findings/{key}/history/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.data["results"]), 2)
        self.assertEqual(history.data["effective_review"]["decision"], "approved")

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_same_user_cannot_approve_citation_and_mapping(self, writer):
        self.citation.groups.add(Group.objects.get(name="mapping_reviewer"))
        self.authenticate(self.citation)
        key = "1" * 64
        first = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": key,
                "queue": "new",
                "review_stage": "citation",
                "decision": "approved",
                "citation_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        second = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": key,
                "queue": "new",
                "review_stage": "mapping",
                "decision": "approved",
                "mapping_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(second.status_code, 400)
        self.assertEqual(FindingDecision.objects.count(), 1)

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_optimistic_concurrency_rejects_stale_write(self, writer):
        self.authenticate(self.citation)
        payload = {
            "finding_key": "1" * 64,
            "queue": "new",
            "review_stage": "citation",
            "decision": "approved",
            "citation_checked": True,
            "expected_latest_decision_id": None,
        }
        self.assertEqual(
            self.client.post(
                "/api/workspace/decisions/findings/", payload, format="json"
            ).status_code,
            201,
        )
        response = self.client.post(
            "/api/workspace/decisions/findings/", payload, format="json"
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(FindingDecision.objects.count(), 1)

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_recall_zone3_and_correction_use_separate_domains(self, writer):
        self.authenticate(self.mapping)
        recall_item = ReviewItem.objects.get(queue=ReviewItem.Queue.RECALL)
        response = self.client.post(
            "/api/workspace/decisions/recall/",
            {
                "recall_key": recall_item.stable_key,
                "verdict": "REAL_MISS",
                "reasoning": "Verified against the official instrument.",
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        zone_item = ReviewItem.objects.get(queue=ReviewItem.Queue.ZONE3)
        response = self.client.post(
            "/api/workspace/decisions/zone3/",
            {
                "score_key": zone_item.stable_key,
                "verdict": "overridden",
                "score": "0.5",
                "reasoning": "Legal scope supports the intermediate score.",
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(RecallDecision.objects.count(), 1)
        self.assertEqual(Zone3Decision.objects.count(), 1)

        response = self.client.post(
            "/api/workspace/corrections/",
            {
                "finding_key": "1" * 64,
                "queue": "new",
                "explanation": "The quoted span needs correction.",
                "expected_latest_correction_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(CorrectionRequest.objects.count(), 1)
        self.assertEqual(writer.call_count, 3)
        self.assertEqual(writer.call_args_list[0].args[0], "recall")
        self.assertEqual(
            writer.call_args_list[0].args[1][0]["recall_key"],
            recall_item.stable_key,
        )
        self.assertEqual(writer.call_args_list[1].args[0], "zone3")
        self.assertEqual(writer.call_args_list[1].args[1][0]["action"], "override")
        self.assertEqual(writer.call_args_list[2].args[0], "findings")
        self.assertEqual(
            writer.call_args_list[2].args[1][0]["review"]["decision"],
            "rejected",
        )
        review_state = self.client.get("/api/workspace/review/new/").data["results"][0][
            "review_state"
        ]
        self.assertTrue(review_state["correction_pending"])

    @patch(
        "workspace.views.apply_authoritative_decision",
        side_effect=RuntimeError("should not be called"),
    )
    def test_blocked_finding_cannot_be_approved(self, writer):
        self.authenticate(self.citation)
        item = ReviewItem.objects.get(queue=ReviewItem.Queue.NEW)
        item.blocked = True
        item.block_reason = "Citation alignment is unresolved."
        item.save(update_fields=["blocked", "block_reason"])
        response = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": "1" * 64,
                "queue": "new",
                "review_stage": "citation",
                "decision": "approved",
                "citation_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        writer.assert_not_called()

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_bulk_known_approval_fails_closed_on_incomplete_proof(self, writer):
        self.authenticate(self.citation)
        response = self.client.post(
            "/api/workspace/decisions/findings/bulk/",
            {
                "finding_keys": ["2" * 64],
                "review_stage": "citation",
                "citation_checked": True,
                "expected_latest_decision_ids": {"2" * 64: None},
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("ineligible", response.data)
        writer.assert_not_called()

    @patch("workspace.views.apply_authoritative_decision", return_value=RECEIPT)
    def test_bulk_known_approval_writes_one_authoritative_batch(self, writer):
        evidence = EvidenceRow.objects.get(finding_key="2" * 64)
        evidence.row_json = {
            **evidence.row_json,
            "Status": "in_force",
            "status_evidence": "Official current compilation",
            "citation_proof": {"alignment_status": "exact"},
        }
        evidence.save(update_fields=["row_json"])
        FindingDecision.objects.create(
            finding_key="2" * 64,
            queue="known",
            review_stage="citation",
            decision="approved",
            citation_checked=True,
            status_checked=True,
            reviewer_name=self.citation.full_name,
            reviewer_role="citation",
            reviewed_at=timezone.now(),
            created_by=self.citation,
            authoritative_file_hash=HASH,
        )
        self.authenticate(self.mapping)
        response = self.client.post(
            "/api/workspace/decisions/findings/bulk/",
            {
                "finding_keys": ["2" * 64],
                "review_stage": "mapping",
                "mapping_checked": True,
                "expected_latest_decision_ids": {"2" * 64: None},
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["outcome"], "engine_decision_written")
        self.assertTrue(response.data["engine_exported"])
        self.assertEqual(response.data["review_states"]["2" * 64]["decision"], "approved")
        self.assertEqual(FindingDecision.objects.count(), 2)
        engine_batch = writer.call_args.args[1]
        self.assertEqual(len(engine_batch), 1)
        self.assertEqual(engine_batch[0]["review"]["decision"], "approved")
        writer.assert_called_once()

    def test_missing_engine_writer_returns_503_without_audit_row(self):
        self.authenticate(self.citation)
        with tempfile.TemporaryDirectory() as temp_dir, override_settings(
            ENGINE_ROOT=temp_dir,
            WORKSPACE_DECISION_WRITER=f"{temp_dir}/missing.py",
        ):
            response = self.client.post(
                "/api/workspace/decisions/findings/",
                {
                    "finding_key": "1" * 64,
                    "queue": "new",
                    "review_stage": "citation",
                    "decision": "approved",
                    "citation_checked": True,
                    "expected_latest_decision_id": None,
                },
                format="json",
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(FindingDecision.objects.count(), 0)

    @patch(
        "workspace.views.apply_authoritative_decision",
        side_effect=DecisionWriterConflict("c" * 64),
    )
    def test_external_file_change_returns_409_without_audit_row(self, writer):
        self.authenticate(self.citation)
        response = self.client.post(
            "/api/workspace/decisions/findings/",
            {
                "finding_key": "1" * 64,
                "queue": "new",
                "review_stage": "citation",
                "decision": "approved",
                "citation_checked": True,
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["current_file_hash"], "c" * 64)
        self.assertEqual(FindingDecision.objects.count(), 0)

    def test_wrong_role_is_forbidden(self):
        self.authenticate(self.citation)
        item = ReviewItem.objects.get(queue=ReviewItem.Queue.RECALL)
        response = self.client.post(
            "/api/workspace/decisions/recall/",
            {
                "recall_key": item.stable_key,
                "verdict": "REAL_MISS",
                "expected_latest_decision_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class AppendOnlyModelTests(TestCase):
    def test_recall_decision_cannot_be_updated(self):
        user = User.objects.create_user(
            username="audit", email="audit@example.com", password="SafePass123!"
        )
        row = RecallDecision.objects.create(
            recall_key=HASH,
            verdict="REAL_MISS",
            reviewer_name="Audit User",
            reviewer_role="mapping",
            reviewed_at=timezone.now(),
            created_by=user,
            authoritative_file_hash=HASH,
        )
        row.reasoning = "mutated"
        with self.assertRaises(DjangoValidationError):
            row.save()
        with self.assertRaises(DjangoValidationError):
            row.delete()
        with self.assertRaises(DjangoValidationError):
            RecallDecision.objects.filter(pk=row.pk).delete()


class EngineWriterContractTests(TestCase):
    def test_app_lock_uses_configured_persistent_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir, override_settings(
            WORKSPACE_LOCK_DIR=Path(temp_dir) / "locks"
        ):
            with decision_domain_lock("findings"):
                lock_files = list((Path(temp_dir) / "locks").glob("*.lock"))
                self.assertEqual(len(lock_files), 1)

    def test_real_w2_recall_writer_round_trip_and_sha_conflict(self):
        writer = settings.WORKSPACE_DECISION_WRITER
        engine_python = settings.ENGINE_PYTHON
        with tempfile.TemporaryDirectory() as temp_dir, override_settings(
            ENGINE_ROOT=temp_dir,
            ENGINE_PYTHON=engine_python,
            WORKSPACE_DECISION_WRITER=writer,
        ):
            decision = {
                "recall_key": "f" * 64,
                "verdict": "REAL_MISS",
                "reasoning": "Verified fixture",
                "reviewer_name": "Mapping Reviewer",
                "reviewed_at": "2026-07-18T12:00:00Z",
            }
            receipt = apply_authoritative_decision("recall", [decision])
            self.assertEqual(len(receipt["sha256"]), 64)
            written = json.loads(
                (
                    Path(temp_dir) / "data" / "review" / "recall_decisions.json"
                ).read_text()
            )
            self.assertEqual(written, [decision])
            with self.assertRaises(DecisionWriterConflict):
                apply_authoritative_decision(
                    "recall", [decision], expected_file_hash="0" * 64
                )
