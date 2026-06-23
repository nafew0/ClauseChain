from __future__ import annotations

import os
from pathlib import Path

from packages.graph.neo4j_client import Neo4jGraphStore
from packages.graph.sqlite_graph import SqliteGraphStore


def get_graph_store(backend: str | None = None, db_path: str | Path = "data/graph.db"):
    """Return the configured GraphStore.

    Selection order: explicit arg > GRAPH_BACKEND env var > sqlite default.
    sqlite = judged path (no extra service). neo4j = optional live-demo swap.
    """
    choice = (backend or os.getenv("GRAPH_BACKEND") or "sqlite").strip().lower()
    if choice == "sqlite":
        return SqliteGraphStore(db_path=db_path)
    if choice == "neo4j":
        return Neo4jGraphStore()
    raise ValueError(f"Unknown GRAPH_BACKEND: {choice!r} (expected 'sqlite' or 'neo4j')")
