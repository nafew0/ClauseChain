from __future__ import annotations

from typing import Protocol

from pydantic import BaseModel

from packages.core.schemas import ExtractedPage, RuleUnit


class LLMProvider(Protocol):
    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel: ...


class EmbeddingProvider(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class OCREngine(Protocol):
    def extract(self, file_path: str) -> list[ExtractedPage]: ...


class GraphStore(Protocol):
    def upsert_rule_unit(self, rule_unit: RuleUnit) -> str: ...

