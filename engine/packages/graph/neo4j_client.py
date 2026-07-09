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
    """Neo4j-backed GraphStore (Path B / live-demo). Lazy connection; same node
    and edge model as SqliteGraphStore. Sparse search uses Neo4j's built-in
    Lucene full-text index (the Neo4j answer to SQLite's FTS5)."""

    FULLTEXT_INDEX = "provision_text"

    def __init__(self, config: Neo4jConfig | None = None) -> None:
        self.config = config or Neo4jConfig.from_env()
        self._driver = None
        self._schema_ready = False

    def _connect(self):
        if self._driver is None:
            if not self.config.is_complete:
                raise RuntimeError(
                    "GRAPH_BACKEND=neo4j but NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD are not all set."
                )
            from neo4j import GraphDatabase

            self._driver = GraphDatabase.driver(
                self.config.uri, auth=(self.config.user, self.config.password)
            )
        return self._driver

    def _ensure_schema(self, session) -> None:
        if self._schema_ready:
            return
        session.run(
            "CREATE CONSTRAINT node_id IF NOT EXISTS "
            "FOR (n:Provision) REQUIRE n.id IS UNIQUE"
        )
        session.run(
            f"CREATE FULLTEXT INDEX {self.FULLTEXT_INDEX} IF NOT EXISTS "
            "FOR (p:Provision) ON EACH [p.text]"
        )
        self._schema_ready = True

    def upsert_rule_unit(self, rule_unit: RuleUnit) -> str:
        instrument_id = f"instrument:{rule_unit.economy}:{rule_unit.law_name}"
        section_id = f"section:{rule_unit.economy}:{rule_unit.law_name}:{rule_unit.article_section}"
        provision_id = f"provision:{rule_unit.id}"
        with self._connect().session() as session:
            self._ensure_schema(session)
            session.run(
                """
                MERGE (i:Instrument {id: $instrument_id})
                  SET i.law_name = $law_name, i.economy = $economy,
                      i.law_number_ref = $law_number_ref, i.last_amended = $last_amended
                MERGE (s:Section {id: $section_id})
                  SET s.article_section = $article_section, s.source_url = $source_url
                MERGE (p:Provision {id: $provision_id})
                  SET p.text = $text, p.economy = $economy,
                      p.location_reference = $location_reference,
                      p.source_url = $source_url,
                      p.article_section = $article_section,
                      p.law_name = $law_name,
                      p.heading = $heading, p.part = $part
                MERGE (i)-[:HAS_SECTION]->(s)
                MERGE (s)-[:HAS_PROVISION]->(p)
                """,
                instrument_id=instrument_id,
                section_id=section_id,
                provision_id=provision_id,
                law_name=rule_unit.law_name,
                economy=rule_unit.economy,
                law_number_ref=rule_unit.law_number_ref,
                last_amended=rule_unit.last_amended,
                article_section=rule_unit.article_section,
                source_url=rule_unit.source_url,
                location_reference=rule_unit.location_reference,
                text=rule_unit.text,
                heading=str(rule_unit.metadata.get("heading", "")),
                part=str(rule_unit.metadata.get("part", "")),
            )
            session.run(
                "MATCH (p:Provision {id: $pid}) SET p.current_as_at = $current",
                pid=provision_id,
                current=str(rule_unit.metadata.get("current_as_at") or ""),
            )
        return f"neo4j://rule-unit/{rule_unit.id}"

    def upsert_rule_units(self, rule_units: list[RuleUnit], batch_size: int = 400) -> int:
        """Batched load via UNWIND — one round-trip per batch instead of per unit."""
        rows = []
        for u in rule_units:
            rows.append({
                "instrument_id": f"instrument:{u.economy}:{u.law_name}",
                "section_id": f"section:{u.economy}:{u.law_name}:{u.article_section}",
                "provision_id": f"provision:{u.id}",
                "law_name": u.law_name, "economy": u.economy,
                "law_number_ref": u.law_number_ref, "last_amended": u.last_amended,
                "article_section": u.article_section, "source_url": u.source_url,
                "location_reference": u.location_reference, "text": u.text,
                "heading": str(u.metadata.get("heading", "")),
                "part": str(u.metadata.get("part", "")),
                "current_as_at": str(u.metadata.get("current_as_at") or ""),
            })
        with self._connect().session() as session:
            self._ensure_schema(session)
            for start in range(0, len(rows), batch_size):
                session.run(
                    """
                    UNWIND $rows AS r
                    MERGE (i:Instrument {id: r.instrument_id})
                      SET i.law_name = r.law_name, i.economy = r.economy,
                          i.law_number_ref = r.law_number_ref, i.last_amended = r.last_amended
                    MERGE (s:Section {id: r.section_id})
                      SET s.article_section = r.article_section, s.source_url = r.source_url
                    MERGE (p:Provision {id: r.provision_id})
                      SET p.text = r.text, p.economy = r.economy,
                          p.location_reference = r.location_reference,
                          p.source_url = r.source_url, p.article_section = r.article_section,
                          p.law_name = r.law_name, p.heading = r.heading, p.part = r.part,
                          p.current_as_at = r.current_as_at,
                          p.law_number_ref = r.law_number_ref, p.last_amended = r.last_amended
                    MERGE (i)-[:HAS_SECTION]->(s)
                    MERGE (s)-[:HAS_PROVISION]->(p)
                    """,
                    rows=rows[start:start + batch_size],
                )
        return len(rows)

    def search_provisions(
        self, query: str, economy: str | None = None, limit: int = 50
    ) -> list[dict]:
        """Sparse leg of hybrid retrieval: Neo4j Lucene full-text (OR semantics)."""
        import re as _re

        # strip every Lucene syntax character; lowercase so AND/OR/NOT/TO in the
        # query text are plain terms, not operators; OR-join for broad recall
        terms = [t.lower() for t in _re.sub(r"[^0-9A-Za-zÀ-￿ ]+", " ", query).split()
                 if len(t.strip()) > 1]
        if not terms:
            return []
        lucene = " OR ".join(terms)
        cypher = (
            f"CALL db.index.fulltext.queryNodes('{self.FULLTEXT_INDEX}', $q) "
            "YIELD node, score "
            + ("WHERE node.economy = $economy " if economy else "")
            + "RETURN node, score ORDER BY score DESC LIMIT $limit"
        )
        with self._connect().session() as session:
            self._ensure_schema(session)
            params = {"q": lucene, "limit": limit}
            if economy:
                params["economy"] = economy
            records = session.run(cypher, **params)
            return [
                {
                    "provision_id": r["node"].get("id"),
                    "text": r["node"].get("text", ""),
                    "score": float(r["score"]),
                    "props": dict(r["node"]),
                }
                for r in records
            ]

    def upsert_edges(self, edges: list[dict], batch_size: int = 500) -> int:
        """Generic typed-edge batch: [{'src','rel','dst','src_label','dst_label','props'}].
        Relationship types are validated against the GraphRAG §5 schema."""
        allowed = {"CROSS_REFERENCES", "MAPS_TO", "EVIDENCED_BY", "KNOWN_AS",
                   "NEW_RELATIVE_TO", "AMENDS", "REPEALS", "SUPERSEDES",
                   "EXCEPTION_TO", "QUALIFIES"}
        with self._connect().session() as session:
            self._ensure_schema(session)
            for rel in {e["rel"] for e in edges}:
                if rel not in allowed:
                    raise ValueError(f"edge type {rel!r} not in the legal-graph schema")
                batch = [e for e in edges if e["rel"] == rel]
                for start in range(0, len(batch), batch_size):
                    session.run(
                        f"""
                        UNWIND $rows AS r
                        MERGE (a {{id: r.src}})
                        MERGE (b {{id: r.dst}})
                        MERGE (a)-[rel:{rel}]->(b)
                          SET rel += r.props
                        """,
                        rows=[{"src": e["src"], "dst": e["dst"], "props": e.get("props", {})}
                              for e in batch],
                    )
        return len(edges)

    def count_nodes(self) -> int:
        with self._connect().session() as session:
            return int(session.run("MATCH (n) RETURN count(n) AS c").single()["c"])

    def close(self) -> None:
        if self._driver is not None:
            self._driver.close()
            self._driver = None
