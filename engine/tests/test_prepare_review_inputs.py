import os
import subprocess
from pathlib import Path

import pytest

from scripts import prepare_review_inputs as prepare


def _write(path: Path, when: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("{}")
    os.utime(path, (when, when))


@pytest.fixture
def engine_tree(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    for run in prepare.RUNS:
        _write(tmp_path / "outputs" / run / "output.json", 1_000)
    _write(tmp_path / "submission" / "consolidated.json", 2_000)
    calls = []

    def fake_run(argv, *args, **kwargs):
        calls.append(argv[1])
        failing = argv[1].endswith("champion_validate.py")
        return subprocess.CompletedProcess(argv, 1 if failing else 0)

    monkeypatch.setattr(prepare.subprocess, "run", fake_run)
    monkeypatch.setattr("sys.argv", ["prepare_review_inputs.py"])
    return tmp_path, calls


def test_unchanged_runs_only_export_the_bundle(engine_tree):
    _, calls = engine_tree
    assert prepare.changed_runs() == []
    assert prepare.main() == 0
    assert calls == ["scripts/export_ui_bundle.py"]


def test_a_round2_rerun_is_rebuilt_before_export(engine_tree):
    root, calls = engine_tree
    _write(root / "outputs" / "final_r2_th_p6" / "output.json", 3_000)
    assert prepare.changed_runs() == ["final_r2_th_p6"]
    # champion_validate exits 1 (a FAIL report); the refresh still completes.
    assert prepare.main() == 0
    assert calls == [
        "scripts/refute_new.py",
        "scripts/consolidate_submission.py",
        "scripts/zone3_score.py",
        "scripts/build_review_bundle.py",
        "scripts/champion_validate.py",
        "scripts/export_ui_bundle.py",
    ]  # recall adjudication stays round-1 only


def test_a_failed_rebuild_step_stops_the_refresh(engine_tree, monkeypatch):
    root, calls = engine_tree
    _write(root / "outputs" / "final_si_p6" / "output.json", 3_000)
    monkeypatch.setattr(prepare.subprocess, "run", lambda argv, *a, **k: (
        calls.append(argv[1]) or subprocess.CompletedProcess(argv, 2 if "consolidate" in argv[1] else 0)))
    with pytest.raises(SystemExit):
        prepare.main()
    assert calls[-1] == "scripts/consolidate_submission.py"
    assert "scripts/export_ui_bundle.py" not in calls
