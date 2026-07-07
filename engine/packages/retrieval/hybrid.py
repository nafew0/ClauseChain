"""Hybrid broad-recall retrieval: graph full-text (sparse) + embedding cosine (dense).

Design rules (12-Jun, Dev Plan §0): BROAD RECALL, NOT top-k — evidence dropped
early can never be recovered downstream; the gates cut later. Union of both
legs, generous caps, per-indicator query packs generated from the rubric YAML.

Dense embeddings are precomputed once per corpus and cached on disk keyed by a
hash of (provision_id, text), so re-runs cost zero embedding calls.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass, field
from pathlib import Path

# generous caps that bound LLM cost without behaving like top-k relevance cuts
SPARSE_LIMIT_PER_QUERY = 40
DENSE_LIMIT_PER_QUERY = 40
DENSE_MIN_SIMILARITY = 0.25
UNION_CAP_PER_INDICATOR = 120


def build_query_pack(indicator_id: str, indicator_cfg: dict) -> list[str]:
    """Turn a rubric-YAML indicator into a set of search queries (concept + statutory phrasings)."""
    queries: list[str] = []
    question = indicator_cfg.get("question")
    if question:
        queries.append(str(question))
    name = indicator_cfg.get("name")
    if name:
        queries.append(str(name))
    for cue in indicator_cfg.get("positive_cues", []) or []:
        queries.append(str(cue))
    hunt = indicator_cfg.get("hunt_in", []) or []
    queries.extend(str(h) for h in hunt)
    return [q for q in queries if q.strip()]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


class EmbeddingCache:
    """Disk-cached corpus embeddings: embed each provision text at most once, ever."""

    def __init__(self, embedder, cache_path: str | Path = "data/cache/embeddings.json") -> None:
        self._embedder = embedder
        self._path = Path(cache_path)
        self._cache: dict[str, list[float]] = {}
        if self._path.is_file():
            self._cache = json.loads(self._path.read_text())

    @staticmethod
    def _key(provision_id: str, text: str) -> str:
        return f"{provision_id}:{hashlib.sha256(text.encode()).hexdigest()[:16]}"

    MAX_CHARS = 20000   # ~5k tokens, well under the 8192-token embedding limit
    BATCH = 96

    @classmethod
    def _sanitize(cls, text: str) -> str:
        text = text.strip() or "(empty provision)"
        return text[: cls.MAX_CHARS]

    def ensure(self, items: list[tuple[str, str]]) -> None:
        """items = [(provision_id, text)]; embeds only the missing ones, in chunked batches."""
        missing = [(pid, text) for pid, text in items if self._key(pid, text) not in self._cache]
        if not missing:
            return
        for start in range(0, len(missing), self.BATCH):
            chunk = missing[start:start + self.BATCH]
            vectors = self._embedder.embed([self._sanitize(text) for _, text in chunk])
            for (pid, text), vec in zip(chunk, vectors):
                self._cache[self._key(pid, text)] = vec
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._cache))

    def vector(self, provision_id: str, text: str) -> list[float] | None:
        return self._cache.get(self._key(provision_id, text))

    def embed_query(self, query: str) -> list[float]:
        return self._embedder.embed([query])[0]


@dataclass
class Candidate:
    provision_id: str
    text: str
    props: dict
    sparse_score: float = 0.0
    dense_score: float = 0.0
    matched_queries: list[str] = field(default_factory=list)

    @property
    def combined(self) -> float:
        return self.dense_score + min(self.sparse_score, 10.0) / 10.0


def retrieve_for_indicator(
    store,
    cache: EmbeddingCache,
    corpus: list[dict],
    indicator_id: str,
    indicator_cfg: dict,
    economy: str,
) -> list[Candidate]:
    """Union of sparse (graph full-text) and dense (cosine) hits for one indicator.

    `corpus` = [{'provision_id', 'text', 'props'}] — the full loaded corpus for
    the economy (dense leg scans it all; it is small by design).
    """
    queries = build_query_pack(indicator_id, indicator_cfg)
    by_id: dict[str, Candidate] = {}

    # sparse leg — graph-backed full-text (FTS5 / Lucene), one query at a time
    for query in queries:
        for hit in store.search_provisions(query, economy=economy, limit=SPARSE_LIMIT_PER_QUERY):
            cand = by_id.setdefault(
                hit["provision_id"],
                Candidate(hit["provision_id"], hit["text"], hit.get("props", {})),
            )
            cand.sparse_score = max(cand.sparse_score, float(hit.get("score", 0.0)))
            cand.matched_queries.append(query)

    # dense leg — cosine over the cached corpus vectors
    cache.ensure([(c["provision_id"], c["text"]) for c in corpus])
    for query in queries:
        qvec = cache.embed_query(query)
        scored = []
        for row in corpus:
            vec = cache.vector(row["provision_id"], row["text"])
            if vec is None:
                continue
            sim = _cosine(qvec, vec)
            if sim >= DENSE_MIN_SIMILARITY:
                scored.append((sim, row))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        for sim, row in scored[:DENSE_LIMIT_PER_QUERY]:
            cand = by_id.setdefault(
                row["provision_id"],
                Candidate(row["provision_id"], row["text"], row.get("props", {})),
            )
            cand.dense_score = max(cand.dense_score, sim)
            cand.matched_queries.append(query)

    candidates = sorted(by_id.values(), key=lambda c: c.combined, reverse=True)
    return candidates[:UNION_CAP_PER_INDICATOR]


def load_corpus(store, economy: str) -> list[dict]:
    """Pull every provision for an economy out of the graph store (for the dense leg)."""
    if hasattr(store, "_connect") and hasattr(store, "db_path"):  # SqliteGraphStore
        rows = store._connect().execute(
            "SELECT provision_id, economy, text FROM provisions_fts WHERE economy = ?",
            (economy,),
        ).fetchall()
        out = []
        for provision_id, _econ, text in rows:
            node = store._connect().execute(
                "SELECT props FROM nodes WHERE id = ?", (provision_id,)
            ).fetchone()
            out.append({"provision_id": provision_id, "text": text,
                        "props": json.loads(node[0]) if node else {}})
        return out
    # Neo4j
    with store._connect().session() as session:
        records = session.run(
            "MATCH (p:Provision) WHERE p.economy = $economy RETURN p", economy=economy
        )
        return [{"provision_id": r["p"].get("id"), "text": r["p"].get("text", ""),
                 "props": dict(r["p"])} for r in records]
