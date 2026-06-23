from __future__ import annotations

from packages.core.schemas import RuleUnit
from packages.graph.neo4j_client import Neo4jGraphStore
from packages.graph.sqlite_graph import SqliteGraphStore
from packages.graph.store import get_graph_store


def _rule_unit() -> RuleUnit:
    return RuleUnit(
        id="sg-pdpa-2012-s26-1",
        document_id="doc-1",
        economy="Singapore",
        law_name="Personal Data Protection Act 2012",
        article_section="s. 26(1)",
        text="An organisation shall not transfer any personal data ...",
        source_url="https://sso.agc.gov.sg/Act/PDPA2012",
        location_reference="Part 6, s. 26(1)",
    )


def test_sqlite_store_upserts_rule_unit(tmp_path) -> None:
    store = SqliteGraphStore(db_path=tmp_path / "graph.db")
    uri = store.upsert_rule_unit(_rule_unit())
    assert uri == "sqlite://rule-unit/sg-pdpa-2012-s26-1"
    assert store.count_nodes() == 3  # Instrument + Section + Provision
    store.upsert_rule_unit(_rule_unit())  # idempotent
    assert store.count_nodes() == 3
    store.close()


def test_factory_defaults_to_sqlite(tmp_path, monkeypatch) -> None:
    monkeypatch.delenv("GRAPH_BACKEND", raising=False)
    store = get_graph_store(db_path=tmp_path / "g.db")
    assert isinstance(store, SqliteGraphStore)


def test_factory_env_swap_to_neo4j(monkeypatch) -> None:
    monkeypatch.setenv("GRAPH_BACKEND", "neo4j")
    assert isinstance(get_graph_store(), Neo4jGraphStore)
