from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from packages.core.schemas import RuleUnit


_SCHEMA = """
CREATE TABLE IF NOT EXISTS nodes (
    id    TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    props TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS edges (
    src   TEXT NOT NULL,
    rel   TEXT NOT NULL,
    dst   TEXT NOT NULL,
    props TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (src, rel, dst)
);
CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label);
CREATE INDEX IF NOT EXISTS idx_edges_rel ON edges(rel);
CREATE VIRTUAL TABLE IF NOT EXISTS provisions_fts USING fts5(
    provision_id UNINDEXED, economy UNINDEXED, text
);
"""


class SqliteGraphStore:
    """Default judged-path graph store: same node/edge model, zero extra services.

    Implements the `GraphStore` protocol. Neo4j (`GRAPH_BACKEND=neo4j`) is the
    optional swap for the live-demo graph view — see configs/graph.yaml.
    Connection is lazy so constructing the store never touches disk.
    """

    def __init__(self, db_path: str | Path = "data/graph.db") -> None:
        self.db_path = Path(db_path)
        self._conn: sqlite3.Connection | None = None

    def _connect(self) -> sqlite3.Connection:
        if self._conn is None:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            self._conn = sqlite3.connect(self.db_path)
            self._conn.executescript(_SCHEMA)
        return self._conn

    def upsert_node(self, node_id: str, label: str, props: dict | None = None) -> None:
        conn = self._connect()
        conn.execute(
            "INSERT OR REPLACE INTO nodes (id, label, props) VALUES (?, ?, ?)",
            (node_id, label, json.dumps(props or {}, ensure_ascii=False)),
        )
        conn.commit()

    def upsert_edge(self, src: str, rel: str, dst: str, props: dict | None = None) -> None:
        conn = self._connect()
        conn.execute(
            "INSERT OR REPLACE INTO edges (src, rel, dst, props) VALUES (?, ?, ?, ?)",
            (src, rel, dst, json.dumps(props or {}, ensure_ascii=False)),
        )
        conn.commit()

    def upsert_rule_unit(self, rule_unit: RuleUnit) -> str:
        instrument_id = f"instrument:{rule_unit.economy}:{rule_unit.law_name}"
        section_id = f"section:{rule_unit.economy}:{rule_unit.law_name}:{rule_unit.article_section}"
        provision_id = f"provision:{rule_unit.id}"

        self.upsert_node(
            instrument_id,
            "Instrument",
            {"law_name": rule_unit.law_name, "economy": rule_unit.economy,
             "law_number_ref": rule_unit.law_number_ref, "last_amended": rule_unit.last_amended},
        )
        self.upsert_node(
            section_id, "Section",
            {"article_section": rule_unit.article_section, "source_url": rule_unit.source_url},
        )
        self.upsert_node(
            provision_id, "Provision",
            {"text": rule_unit.text, "location_reference": rule_unit.location_reference,
             "start_char": rule_unit.start_char, "end_char": rule_unit.end_char,
             "source_url": rule_unit.source_url,
             "article_section": rule_unit.article_section,
             "law_name": rule_unit.law_name, "economy": rule_unit.economy,
             "law_number_ref": rule_unit.law_number_ref,
             "last_amended": rule_unit.last_amended,
             "heading": str(rule_unit.metadata.get("heading", "")),
             "part": str(rule_unit.metadata.get("part", "")),
             "current_as_at": rule_unit.metadata.get("current_as_at"),
             "id": provision_id},
        )
        self.upsert_edge(instrument_id, "HAS_SECTION", section_id)
        self.upsert_edge(section_id, "HAS_PROVISION", provision_id)

        conn = self._connect()
        conn.execute("DELETE FROM provisions_fts WHERE provision_id = ?", (provision_id,))
        conn.execute(
            "INSERT INTO provisions_fts (provision_id, economy, text) VALUES (?, ?, ?)",
            (provision_id, rule_unit.economy, rule_unit.text),
        )
        conn.commit()
        return f"sqlite://rule-unit/{rule_unit.id}"

    def search_provisions(
        self, query: str, economy: str | None = None, limit: int = 50
    ) -> list[dict]:
        """Sparse leg of hybrid retrieval: SQLite FTS5 (BM25 ranking, built-in)."""
        # FTS5 query syntax: quote each term to avoid operator interpretation; OR them
        # for broad recall (union of term hits, ranked) rather than implicit AND.
        terms = [t for t in query.replace('"', " ").split() if t.strip()]
        if not terms:
            return []
        match = " OR ".join(f'"{t}"' for t in terms)
        sql = (
            "SELECT provision_id, economy, text, bm25(provisions_fts) AS rank "
            "FROM provisions_fts WHERE provisions_fts MATCH ?"
        )
        params: list = [match]
        if economy:
            sql += " AND economy = ?"
            params.append(economy)
        sql += " ORDER BY rank LIMIT ?"
        params.append(limit)
        rows = self._connect().execute(sql, params).fetchall()
        results = []
        for provision_id, econ, text, rank in rows:
            node = self._connect().execute(
                "SELECT props FROM nodes WHERE id = ?", (provision_id,)
            ).fetchone()
            props = json.loads(node[0]) if node else {}
            results.append(
                {"provision_id": provision_id, "text": text,
                 "score": -float(rank), "props": props}  # bm25() is lower-is-better
            )
        return results

    def count_nodes(self) -> int:
        row = self._connect().execute("SELECT COUNT(*) FROM nodes").fetchone()
        return int(row[0])

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None
