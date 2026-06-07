# ClauseChain Engine

This is the clean Python engine for the ClauseChain Round 1 submission.

It is intentionally isolated from the old Django/Next SaaS starter. The judged artifact starts here: a CLI engine that produces the required CSV and JSON outputs from legal evidence.

Current status: **P0 skeleton**. It proves the contracts, output shape, model routing, and local Neo4j configuration path. It does not yet perform real crawling, OCR, retrieval, graph loading, or legal mapping.

## What This Engine Must Do

The final engine will:

1. Collect official legal sources for SG, MY, and AU.
2. Extract clean legal text from HTML/PDF/OCR sources.
3. Split law into section-aware `RuleUnit` objects.
4. Store legal structure and evidence paths in local Neo4j.
5. Retrieve candidate provisions with BM25 + dense embeddings + graph expansion.
6. Map candidates to RDTII Pillar 6 / Pillar 7 indicators.
7. Verify exact source spans, currentness, authority, and NEW/KNOWN status.
8. Export a template-exact `output.csv` and transparent `output.json`.

The current P0 dummy run proves step 8 only.

## Quick Start

Install `uv` if you do not already have it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Run the skeleton:

```bash
cd engine
uv run pytest
uv run python run.py --country SG --pillar 6 --out outputs/demo
```

Expected outputs:

```text
outputs/demo/output.csv
outputs/demo/output.json
```

If `uv` cannot write to its default cache on your machine, use:

```bash
UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest
UV_CACHE_DIR=/private/tmp/uv-cache uv run python run.py --country SG --pillar 6 --out outputs/demo
```

## Output Contract

The CSV header is non-negotiable. It must stay exactly:

```text
Economy, Law Name, Law Number / Ref, Last Amended, Indicator ID, Article / Section, Discovery Tag, Location Reference, Verbatim Snippet, Mapping Rationale, Source URL, Confidence, Notes
```

The code-level source of truth is `packages/export/csv_writer.py`.

Every exported row must eventually pass verifier gates for:

- exact verbatim source span
- article/section with paragraph
- official/live source URL
- currentness / not superseded
- correct RDTII indicator
- NEW/KNOWN tag
- confidence and rationale

P0 uses dummy data, so the current verifier gates are placeholders.

## Folder Map

```text
engine/
  run.py                      CLI entrypoint
  pyproject.toml              Python project + dependencies
  configs/
    models.yaml               model routing profiles
    graph.yaml                local Neo4j config contract
  packages/
    core/
      schemas.py              Pydantic contracts shared by all stages
      interfaces.py           LLM/OCR/embedding/graph protocols
      orchestrator.py         pipeline coordinator; P0 returns dummy data
    export/
      csv_writer.py           exact judged CSV writer
      json_writer.py          transparent run envelope writer
    graph/
      neo4j_client.py         local Neo4j adapter stub
      schema.cypher           future legal graph constraints
    providers/
      model_router.py         reads configs/models.yaml
      embedding_provider.py   P0 embedding stub
      ocr_provider.py         P0 local OCR placeholder
  tests/
    test_csv_writer.py
    test_run_dummy.py
```

## Model Routing

Do not hardcode model names inside prompts, retrieval code, or verifier code. Route through `configs/models.yaml`.

Current routing:

| Task | Model |
|---|---|
| Final dense retrieval | `text-embedding-3-large` |
| Cheap dev/testing | `text-embedding-3-small` |
| Query expansion / keyword generation | `gpt-5.4-nano` or Gemini |
| Candidate reranking | `gpt-5.4-nano` first; `gpt-5.4-mini` for hard cases |
| Final legal mapping / rationale | `gpt-5.4-mini` / Gemini high reasoning |
| Embedding fallback experiment | `gemini-embedding-001` |

Rule: embeddings use embedding models, not chat/reasoning models.

## Environment

Copy the example env file when real providers are wired:

```bash
cp .env.example .env
```

Important variables:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=
```

The P0 dummy run does not require API keys or Neo4j.

## Local Neo4j

Neo4j is the canonical legal evidence graph. It will store:

- economies
- instruments
- versions
- sections
- provisions
- source spans
- indicators
- candidate findings
- verified findings

`packages/graph/schema.cypher` defines the first constraints.

For now, Neo4j is env-only. Start it however your machine supports it, then set:

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

The dummy run must continue to work even when Neo4j is not available.

## Team Responsibilities

Lead:

- Keep `run.py` runnable.
- Own schemas, orchestrator, CSV/JSON output, and integration.
- Reject changes that break the dummy run or output contract.

AI-1:

- Build connectors and extraction.
- First target: SG official HTML source.
- Next target: MY scanned/OCR source.
- Return `SourceDocument` and `ExtractedPage` objects only.

AI-2:

- Build retrieval, embeddings, graph expansion, reranking, predicate extraction, RDTII mapping, and verifier gates.
- Return `RuleUnit`, `CandidateFinding`, `MappedFinding`, and `GateResult` objects.
- Keep all model calls behind provider interfaces.

Legal:

- Own indicator meaning, gold rows, known provisions, and final mapping correctness.
- Provide exact quotes, article/section, source URL, expected indicator, and NEW/KNOWN label.

## Development Rules

- No UI work until the CLI produces real SG/P6 output.
- No direct model calls outside provider modules.
- No CSV column changes without updating tests and leadership approval.
- No LLM-generated graph edge without source-span verification.
- No final export row without a source URL and verbatim snippet.
- Keep old `backend/`, `frontend/`, and `agentic-rag-knowledge-graph/` untouched unless explicitly assigned.

## Test Commands

Run all tests:

```bash
uv run pytest
```

Run the public skeleton command:

```bash
uv run python run.py --country SG --pillar 6 --out outputs/demo
```

Inspect output:

```bash
cat outputs/demo/output.csv
cat outputs/demo/output.json
```

## Next Engineering Milestones

P0 complete when:

- tests pass
- dummy command writes CSV + JSON
- schemas are stable enough for team work
- each owner knows which objects they must return

P1 target:

```bash
uv run python run.py --country SG --pillar 6 --out outputs/sg-p6
```

That command should produce real Singapore Pillar 6 output from official source data, with no UI dependency.

