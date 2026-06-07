from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


JsonDict = dict[str, Any]


class OCRToken(BaseModel):
    text: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    bbox: list[float] | None = None


class SourceDocument(BaseModel):
    id: str
    title: str
    economy: str
    authority: str
    source_url: str
    content_hash: str
    retrieved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: JsonDict = Field(default_factory=dict)


class ExtractedPage(BaseModel):
    document_id: str
    page_number: int = Field(ge=1)
    text: str
    source_url: str
    location_reference: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    tokens: list[OCRToken] = Field(default_factory=list)
    metadata: JsonDict = Field(default_factory=dict)


class RuleUnit(BaseModel):
    id: str
    document_id: str
    economy: str
    law_name: str
    law_number_ref: str | None = None
    last_amended: str | None = None
    article_section: str
    text: str
    source_url: str
    location_reference: str
    start_char: int | None = Field(default=None, ge=0)
    end_char: int | None = Field(default=None, ge=0)
    extraction_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    metadata: JsonDict = Field(default_factory=dict)


class PredicateTuple(BaseModel):
    actor: str | None = None
    action: str | None = None
    object: str | None = None
    destination: str | None = None
    modality: str | None = None
    condition: str | None = None
    exception: str | None = None
    source_status: str | None = None
    metadata: JsonDict = Field(default_factory=dict)


class CandidateFinding(BaseModel):
    economy: str
    law_name: str
    law_number_ref: str | None = None
    last_amended: str | None = None
    indicator_id: str
    article_section: str
    discovery_tag: Literal["NEW", "KNOWN", "UNCLEAR"]
    location_reference: str
    verbatim_snippet: str
    mapping_rationale: str
    source_url: str
    confidence: float = Field(ge=0.0, le=1.0)
    graph_path: list[str] = Field(default_factory=list)
    verifier_risks: list[str] = Field(default_factory=list)


class MappedFinding(BaseModel):
    economy: str = Field(alias="Economy")
    law_name: str = Field(alias="Law Name")
    law_number_ref: str | None = Field(default=None, alias="Law Number / Ref")
    last_amended: str | None = Field(default=None, alias="Last Amended")
    indicator_id: str = Field(alias="Indicator ID")
    article_section: str = Field(alias="Article / Section")
    discovery_tag: Literal["NEW", "KNOWN"] = Field(alias="Discovery Tag")
    location_reference: str = Field(alias="Location Reference")
    verbatim_snippet: str = Field(alias="Verbatim Snippet")
    mapping_rationale: str = Field(alias="Mapping Rationale")
    source_url: str = Field(alias="Source URL")
    confidence: float = Field(alias="Confidence", ge=0.0, le=1.0)
    notes: str | None = Field(default=None, alias="Notes")
    graph_path: list[str] = Field(default_factory=list)
    verifier_risks: list[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator(
        "economy",
        "law_name",
        "indicator_id",
        "article_section",
        "location_reference",
        "verbatim_snippet",
        "mapping_rationale",
        "source_url",
    )
    @classmethod
    def require_non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("field must be non-empty")
        return value


class GateResult(BaseModel):
    gate_id: str
    status: Literal["PASS", "FAIL", "WARN", "NOT_RUN"]
    reason: str
    evidence_reference: str | None = None
    metadata: JsonDict = Field(default_factory=dict)


class RunEnvelope(BaseModel):
    run_id: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    country: str
    pillar: int
    provider_profile: str
    findings: list[MappedFinding]
    gates: list[GateResult] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    metadata: JsonDict = Field(default_factory=dict)

