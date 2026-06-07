from __future__ import annotations


class StubEmbeddingProvider:
    """Deterministic P0 embedding stub with no network calls."""

    def __init__(self, dimensions: int = 1536) -> None:
        self.dimensions = dimensions

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [[0.0] * self.dimensions for _ in texts]

