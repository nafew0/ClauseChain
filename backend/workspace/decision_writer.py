import fcntl
import json
import os
import subprocess
from contextlib import contextmanager
from pathlib import Path

from django.conf import settings

from .keys import canonical_json


class DecisionWriterError(RuntimeError):
    pass


@contextmanager
def decision_domain_lock(domain):
    review_dir = Path(settings.ENGINE_ROOT) / "data" / "review"
    review_dir.mkdir(parents=True, exist_ok=True)
    lock_path = review_dir / f".workspace-{domain}.lock"
    with lock_path.open("a+") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)


def apply_authoritative_decision(domain, payload):
    """Call the engine-owned W2 writer and require a verifiable receipt."""

    writer = Path(settings.WORKSPACE_DECISION_WRITER)
    if not writer.is_file():
        raise DecisionWriterError(
            f"Engine decision writer is unavailable: {writer}. "
            "Install the W2 writer before accepting reviewer decisions."
        )
    command = [str(settings.ENGINE_PYTHON), str(writer), "--domain", domain]
    try:
        result = subprocess.run(
            command,
            cwd=settings.ENGINE_ROOT,
            input=canonical_json(payload),
            text=True,
            capture_output=True,
            check=True,
            timeout=60,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
    except (OSError, subprocess.SubprocessError) as exc:
        stderr = getattr(locals().get("result", None), "stderr", "")
        raise DecisionWriterError(f"Authoritative decision write failed: {exc}. {stderr}".strip()) from exc

    receipt = None
    for line in reversed(result.stdout.splitlines()):
        try:
            candidate = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(candidate, dict):
            receipt = candidate
            break
    if receipt is None:
        raise DecisionWriterError("Engine writer returned no JSON receipt.")
    file_hash = str(receipt.get("sha256") or receipt.get("file_hash") or "")
    if len(file_hash) != 64 or any(character not in "0123456789abcdef" for character in file_hash.lower()):
        raise DecisionWriterError("Engine writer receipt has no valid SHA-256 file hash.")
    receipt["sha256"] = file_hash.lower()
    return receipt
