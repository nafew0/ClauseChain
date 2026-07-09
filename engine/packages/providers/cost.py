"""Measured cost accounting (README contract: measured, never estimated).

Providers report real token usage here after every API call; the orchestrator
writes the accumulated report to the envelope + logs/cost_report.json.
Prices are per 1M tokens (USD, as of Jul 2026) — edit PRICES when they change.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

PRICES = {  # per 1M tokens: (input, output)
    "gpt-5.4-nano": (0.05, 0.40),
    "gpt-5.4-mini": (0.25, 2.00),
    "text-embedding-3-small": (0.02, 0.0),
}

_USAGE: dict[str, dict] = defaultdict(lambda: {"input_tokens": 0, "output_tokens": 0, "calls": 0})


def record(model: str, input_tokens: int, output_tokens: int = 0) -> None:
    entry = _USAGE[model]
    entry["input_tokens"] += int(input_tokens or 0)
    entry["output_tokens"] += int(output_tokens or 0)
    entry["calls"] += 1


def reset() -> None:
    _USAGE.clear()


def report() -> dict:
    models = {}
    total = 0.0
    for model, u in _USAGE.items():
        pin, pout = PRICES.get(model, (0.0, 0.0))
        cost = u["input_tokens"] / 1e6 * pin + u["output_tokens"] / 1e6 * pout
        models[model] = {**u, "usd": round(cost, 4), "priced": model in PRICES}
        total += cost
    return {"models": models, "total_usd": round(total, 4),
            "note": "measured from real API usage objects; prices per 1M tokens (PRICES)"}


def append_log(run_id: str, extra: dict | None = None,
               path: str | Path = "logs/cost_report.json") -> dict:
    entry = {"run_id": run_id, "at": datetime.now(timezone.utc).isoformat(),
             **report(), **(extra or {})}
    p = Path(path)
    p.parent.mkdir(exist_ok=True)
    log = json.loads(p.read_text()) if p.is_file() else []
    log.append(entry)
    p.write_text(json.dumps(log, indent=1))
    return entry
