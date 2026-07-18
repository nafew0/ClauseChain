import json
import subprocess
import tempfile
from datetime import datetime, timezone as datetime_timezone
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .keys import content_hash, recall_key, zone3_key
from .models import EngineSnapshot, EvidenceRow, ReviewItem, RunRecord


RUN_NAMES = (
    "final_si_p6",
    "final_si_p7",
    "final_ma_p6",
    "final_ma_p7",
    "final_au_p6",
    "final_au_p7",
)
SHEETS = {
    ReviewItem.Queue.NEW: "NEW Findings",
    ReviewItem.Queue.ABSENCE: "Absence Review",
    ReviewItem.Queue.RECALL: "Recall Misses",
    ReviewItem.Queue.ZONE3: "Zone-3 Scores",
    ReviewItem.Queue.KNOWN: "KNOWN Findings",
}
REFERENCE_SHEETS = {
    "indicator_criteria": "Indicator Criteria",
    "master_known": "Master Known",
}


class SnapshotImportError(RuntimeError):
    pass


def _read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SnapshotImportError(
            f"Required engine artifact is missing: {path}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise SnapshotImportError(
            f"Invalid JSON in engine artifact: {path}: {exc}"
        ) from exc


def _run_json(command, *, cwd):
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
            timeout=180,
        )
        return json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as exc:
        stderr = getattr(locals().get("result", None), "stderr", "")
        raise SnapshotImportError(
            f"Engine export failed: {exc}. {stderr}".strip()
        ) from exc


def load_engine_artifacts(engine_root=None):
    root = Path(engine_root or settings.ENGINE_ROOT).resolve()
    python = str(settings.ENGINE_PYTHON)
    payload = _run_json(
        [
            python,
            "-c",
            (
                "import json; "
                "from scripts.export_legal_review_payload import build_payload; "
                "print(json.dumps(build_payload(), ensure_ascii=False))"
            ),
        ],
        cwd=root,
    )

    with tempfile.TemporaryDirectory(prefix="clausechain-map-") as temp_dir:
        map_path = Path(temp_dir) / "finding_key_map.json"
        try:
            subprocess.run(
                [python, "scripts/export_finding_key_map.py", "--out", str(map_path)],
                cwd=root,
                check=True,
                capture_output=True,
                text=True,
                timeout=180,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise SnapshotImportError(f"finding_key map export failed: {exc}") from exc
        key_map = _read_json(map_path)

    consolidated = _read_json(root / "submission" / "consolidated.json")
    champion = _read_json(root / "reports" / "champion_validation.json")
    costs = _read_json(root / "logs" / "cost_report.json")
    runs = {
        name: _read_json(root / "outputs" / name / "output.json") for name in RUN_NAMES
    }
    return {
        "payload": payload,
        "key_map": key_map,
        "consolidated": consolidated,
        "champion": champion,
        "costs": costs,
        "runs": runs,
    }


def _parse_generated_at(value):
    parsed = parse_datetime(str(value or ""))
    if parsed is None:
        try:
            parsed = datetime.fromisoformat(str(value))
        except (TypeError, ValueError) as exc:
            raise SnapshotImportError(
                f"Payload generated_at is invalid: {value!r}"
            ) from exc
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, datetime_timezone.utc)
    return parsed


def _header_index(headers):
    return {str(header): index for index, header in enumerate(headers)}


def _cell(row, indexes, name):
    index = indexes.get(name)
    return row[index] if index is not None and index < len(row) else ""


def _finding_lookup(key_map):
    lookup = {}
    absence_lookup = {}
    by_key = {}
    for item in key_map.get("rows", []):
        finding_key = str(item.get("finding_key") or "")
        if not finding_key or finding_key in by_key:
            raise SnapshotImportError(
                f"Missing or duplicate finding_key: {finding_key!r}"
            )
        by_key[finding_key] = item
        identity = tuple(
            " ".join(str(item.get(key) or "").split()).casefold()
            for key in ("economy", "indicator", "law", "article")
        )
        if identity in lookup:
            raise SnapshotImportError(f"Ambiguous finding-key identity: {identity}")
        lookup[identity] = item
        if item.get("is_absence"):
            absence_identity = identity[:3]
            if absence_identity in absence_lookup:
                raise SnapshotImportError(
                    f"Ambiguous absence finding identity: {absence_identity}"
                )
            absence_lookup[absence_identity] = item
    return lookup, absence_lookup, by_key


def _match_finding(row, headers, queue, lookup, absence_lookup):
    indexes = _header_index(headers)
    economy = _cell(row, indexes, "Economy")
    indicator = _cell(row, indexes, "Indicator")
    law = _cell(row, indexes, "Law/instrument") or _cell(
        row, indexes, "Configured governing instrument"
    )
    article = _cell(row, indexes, "Article/section")
    normalized = tuple(
        " ".join(str(item or "").split()).casefold()
        for item in (economy, indicator, law, article)
    )
    if queue == ReviewItem.Queue.ABSENCE:
        return absence_lookup.get(normalized[:3])
    return lookup.get(normalized)


def _block_reason(row, headers, key_item, queue):
    indexes = _header_index(headers)
    guidance = str(_cell(row, indexes, "Legal-review guidance") or "")
    warnings = str(_cell(row, indexes, "Gate warnings") or "")
    if guidance.startswith("TECHNICAL BLOCK"):
        return guidance
    if queue != ReviewItem.Queue.ABSENCE and key_item and key_item.get("blocked"):
        return warnings or "Engine citation proof marks this finding as blocked."
    return ""


def _cost_for_run(costs, envelope):
    if not isinstance(costs, list):
        return {}
    country = str(envelope.get("country") or "").upper()
    economy_alias = {
        "SG": "Singapore",
        "MY": "Malaysia",
        "MA": "Malaysia",
        "AU": "Australia",
    }
    economy = economy_alias.get(country, country)
    pillar = str(envelope.get("pillar") or "")
    matches = [
        item
        for item in costs
        if str(item.get("economy") or "").casefold() == economy.casefold()
        and str(item.get("pillar") or "") == pillar
    ]
    return matches[-1] if matches else {}


def import_snapshot(artifacts=None, *, keep=5):
    artifacts = artifacts or load_engine_artifacts()
    payload = artifacts["payload"]
    sheets = payload.get("sheets") or {}
    required_sheets = [*SHEETS.values(), *REFERENCE_SHEETS.values()]
    missing_sheets = [name for name in required_sheets if name not in sheets]
    if missing_sheets:
        raise SnapshotImportError(
            f"Review payload is missing sheets: {', '.join(missing_sheets)}"
        )

    fingerprint_artifacts = dict(artifacts)
    fingerprint_payload = dict(payload)
    fingerprint_payload.pop("generated_at", None)
    fingerprint_artifacts["payload"] = fingerprint_payload
    # A contract salt prevents a pre-D3 snapshot (whose source artifacts are
    # identical but whose reference sheets were not stored) from being reused.
    fingerprint_artifacts["workspace_contract"] = "d3-reference-context-v1"
    source_hash = content_hash(fingerprint_artifacts)
    existing = EngineSnapshot.objects.filter(source_hash=source_hash).first()
    if existing:
        if not existing.active:
            with transaction.atomic():
                EngineSnapshot.objects.filter(active=True).update(
                    active=False, stale=True
                )
                EngineSnapshot.objects.filter(pk=existing.pk).update(
                    active=True, stale=False
                )
                existing.refresh_from_db()
        return existing, False

    lookup, absence_lookup, key_lookup = _finding_lookup(artifacts["key_map"])
    headers_json = {
        queue: list((sheets[name] or {}).get("headers") or [])
        for queue, name in SHEETS.items()
    }
    reference_json = {
        key: {
            "headers": list((sheets[name] or {}).get("headers") or []),
            "rows": list((sheets[name] or {}).get("rows") or []),
        }
        for key, name in REFERENCE_SHEETS.items()
    }
    generated_at = _parse_generated_at(
        payload.get("generated_at") or payload.get("manifest", {}).get("generated_at")
    )

    with transaction.atomic():
        EngineSnapshot.objects.filter(active=True).update(active=False, stale=True)
        snapshot = EngineSnapshot.objects.create(
            schema_version=str(payload.get("schema_version") or "1"),
            generated_at=generated_at,
            source_hash=source_hash,
            bundle_hash=str(
                payload.get("bundle_hash")
                or content_hash(payload.get("artifact_hashes") or fingerprint_artifacts)
            ),
            engine_git_sha=str(payload.get("engine_git_sha") or ""),
            counts_json=payload.get("counts") or {},
            headers_json=headers_json,
            reference_json=reference_json,
            refuter_status=str(payload.get("refuter_status") or ""),
            champion_status=str(artifacts["champion"].get("status") or ""),
            champion_json=artifacts["champion"],
            manifest_json=(
                payload.get("manifest")
                or {"artifact_hashes": payload.get("artifact_hashes") or {}}
            ),
            active=True,
        )

        review_items = []
        for queue, sheet_name in SHEETS.items():
            sheet = sheets[sheet_name] or {}
            headers = list(sheet.get("headers") or [])
            for position, row in enumerate(sheet.get("rows") or []):
                key_item = None
                stable_key = ""
                finding_key = ""
                if queue in (
                    ReviewItem.Queue.NEW,
                    ReviewItem.Queue.KNOWN,
                    ReviewItem.Queue.ABSENCE,
                ):
                    indexes = _header_index(headers)
                    embedded_key = (
                        row.get("finding_key") or row.get("Finding key")
                        if isinstance(row, dict)
                        else _cell(row, indexes, "Finding key")
                    )
                    key_item = (
                        _match_finding(row, headers, queue, lookup, absence_lookup)
                        if not embedded_key
                        else key_lookup.get(str(embedded_key))
                    )
                    if embedded_key and key_item is None:
                        raise SnapshotImportError(
                            f"Payload finding_key is absent from the proof map: {embedded_key}"
                        )
                    finding_key = str(
                        embedded_key or (key_item or {}).get("finding_key") or ""
                    )
                    stable_key = finding_key
                    if not finding_key:
                        raise SnapshotImportError(
                            f"Could not resolve finding_key for {sheet_name} row {position + 1}"
                        )
                else:
                    indexes = _header_index(headers)
                    if queue == ReviewItem.Queue.RECALL:
                        stable_key = str(_cell(row, indexes, "Recall key") or "")
                        if not stable_key:
                            stable_key = recall_key(
                                _cell(row, indexes, "Economy"),
                                _cell(row, indexes, "Indicator"),
                                _cell(row, indexes, "Master act/instrument"),
                                _cell(row, indexes, "Master citation"),
                            )
                    else:
                        stable_key = zone3_key(
                            _cell(row, indexes, "Economy"),
                            _cell(row, indexes, "Indicator"),
                        )
                reason = _block_reason(row, headers, key_item, queue)
                review_items.append(
                    ReviewItem(
                        snapshot=snapshot,
                        queue=queue,
                        position=position,
                        row_json=row,
                        stable_key=stable_key,
                        finding_key=finding_key,
                        blocked=bool(reason),
                        block_reason=reason,
                        source_hash=content_hash(row),
                    )
                )
        ReviewItem.objects.bulk_create(review_items)

        evidence_rows = []
        for position, row in enumerate(artifacts["consolidated"].get("rows") or []):
            identity = tuple(
                " ".join(str(row.get(key) or "").split()).casefold()
                for key in ("Economy", "Indicator ID", "Law Name", "Article / Section")
            )
            key_item = lookup.get(identity)
            if not key_item:
                raise SnapshotImportError(
                    f"Could not resolve consolidated finding_key: {identity}"
                )
            evidence_rows.append(
                EvidenceRow(
                    snapshot=snapshot,
                    position=position,
                    row_json=row,
                    finding_key=key_item["finding_key"],
                    proof_asset=str(key_item.get("proof_asset") or ""),
                    blocked=bool(key_item.get("blocked")),
                    source_hash=content_hash(row),
                )
            )
        EvidenceRow.objects.bulk_create(evidence_rows)

        RunRecord.objects.bulk_create(
            [
                RunRecord(
                    snapshot=snapshot,
                    run_name=name,
                    envelope_json=envelope,
                    cost_json=_cost_for_run(artifacts["costs"], envelope),
                    source_hash=content_hash(envelope),
                )
                for name, envelope in artifacts["runs"].items()
            ]
        )

        retained_ids = list(
            EngineSnapshot.objects.order_by("-imported_at").values_list(
                "pk", flat=True
            )[:keep]
        )
        EngineSnapshot.objects.exclude(pk__in=retained_ids).filter(
            releases__isnull=True
        ).delete()
    return snapshot, True
