from __future__ import annotations

from pathlib import Path
import os
import re
from typing import Any

import yaml


ENV_PATTERN = re.compile(r"\$\{([A-Z0-9_]+)(?::-([^}]*))?\}")


def _expand_env(value: Any) -> Any:
    if isinstance(value, str):
        def replace(match: re.Match[str]) -> str:
            name, default = match.group(1), match.group(2) or ""
            return os.getenv(name, default)

        return ENV_PATTERN.sub(replace, value)
    if isinstance(value, dict):
        return {key: _expand_env(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_expand_env(item) for item in value]
    return value


def load_model_profiles(config_path: str | Path | None = None) -> dict[str, Any]:
    path = Path(config_path) if config_path else Path(__file__).parents[2] / "configs" / "models.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return _expand_env(data)


def get_profile(name: str = "cheap_default") -> dict[str, Any]:
    profiles = load_model_profiles().get("profiles", {})
    if name not in profiles:
        raise KeyError(f"Unknown provider profile: {name}")
    return profiles[name]

