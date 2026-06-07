from __future__ import annotations

from dataclasses import dataclass
import os

from packages.core.schemas import RuleUnit


@dataclass(frozen=True)
class Neo4jConfig:
    uri: str | None
    user: str | None
    password: str | None

    @classmethod
    def from_env(cls) -> "Neo4jConfig":
        return cls(
            uri=os.getenv("NEO4J_URI"),
            user=os.getenv("NEO4J_USER"),
            password=os.getenv("NEO4J_PASSWORD"),
        )

    @property
    def is_complete(self) -> bool:
        return bool(self.uri and self.user and self.password)


class Neo4jGraphStore:
    """P0 graph adapter stub. It does not connect during dummy runs."""

    def __init__(self, config: Neo4jConfig | None = None) -> None:
        self.config = config or Neo4jConfig.from_env()

    def upsert_rule_unit(self, rule_unit: RuleUnit) -> str:
        return f"neo4j://rule-unit/{rule_unit.id}"

