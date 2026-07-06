# ClauseChain Engine

This is the clean Python engine for the ClauseChain Round 1 submission.

It is intentionally isolated from the old Django/Next SaaS starter. The judged artifact starts here: a CLI engine that produces the required CSV and JSON outputs from legal evidence.

Current status: **P0 COMPLETE (11 Jun)**. Contracts, template-exact output (verified against the official xlsx byte-for-byte), model routing with real OpenAI/Gemini providers + fallback, swappable graph store (SQLite default / Neo4j optional), the KNOWN/NEW baseline parsed from the master dataset, fetch/OCR spike scripts, and the eval scoreboard. It does not yet perform real crawling→mapping end-to-end — that is P1 (real SG/P6 by 20 Jun).

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
# --economy is an alias (matches the organizer README): 
uv run python run.py --economy Singapore --pillar 6 --out outputs/demo
```

P0 data + spike commands (run once, in this order):

```bash
# 1. Build the KNOWN/NEW baseline from the ESCAP files (master = primary, 10-Jun mail)
uv run python scripts/build_known_index.py
# 2. Grade any output.csv against the baseline (the scoreboard)
uv run python scripts/eval_vs_master.py --output outputs/demo/output.csv --economy Singapore --pillar 6
# 3. AI-1 spike: fetch the SG PDPA page (httpx first; --playwright if blocked)
uv run python scripts/spike_sg_fetch.py
# 4. AI-1 spike: prove scanned-PDF detection on the sample kit
uv run python scripts/spike_ocr_check.py
# 5. AI-2 spike: real model routing (needs OPENAI_API_KEY in .env; GEMINI_API_KEY optional)
uv run python scripts/spike_providers.py
```

Expected outputs:

```text
outputs/demo/output.csv
outputs/demo/output.json
```

## PDF Preparation Utilities

The engine now includes two helper scripts for preparing a scraped PDF corpus before indexing. Run these from `engine/`.

### 1. Rename PDFs to a stable country-based sequence

Use `scripts/rename_pdfs_sequential.py` to rename every PDF in a single folder to a stable sequence such as `singapore_01.pdf`, `singapore_02.pdf`, and so on.

Example for a `country_name/pdf` layout:

```bash
uv run python scripts/rename_pdfs_sequential.py "C:/data/Singapore/pdf" --prefix singapore
uv run python scripts/rename_pdfs_sequential.py "C:/data/Malaysia/pdf" --prefix malaysia --dry-run
```

Flags:

- `folder`
  The folder whose direct PDF children should be renamed. This script does not recurse.
- `--prefix <name>`
  Prefix for the renamed files. For a `country_name/pdf` layout, pass the country name explicitly so output becomes `country_01.pdf`.
- `--start <n>`
  Start numbering from a different index. Default is `1`.
- `--dry-run`
  Print the planned rename operations without changing files. Use this first on real corpora.

### 2. Extract text from PDFs with PDF-text-first and PaddleOCR fallback

Use `scripts/extract_pdf_text.py` to extract text from a single PDF or an entire folder tree. The script attempts embedded PDF text extraction first and automatically falls back to PaddleOCR when a page looks too sparse to trust.

Install dependencies first:

```bash
uv sync
```

You also need a compatible `paddlepaddle` install for your platform. On Windows, PaddleOCR may still hit runtime issues depending on the exact Paddle/PaddleX build; the script itself already falls back page-by-page, but it cannot work around upstream runtime incompatibilities.

Recommended high-accuracy run for best extraction quality:

```bash
uv run python scripts/extract_pdf_text.py "C:/data/Singapore/pdf"   --out data/cache/pdf_text   --min-direct-chars 140   --dpi 300   --ocr-lang en
```

Run on a single PDF:

```bash
uv run python scripts/extract_pdf_text.py "C:/data/Singapore/pdf/singapore_01.pdf" --out data/cache/pdf_text --min-direct-chars 140 --dpi 300 --ocr-lang en
```

What the script writes:

- one `.txt` file per input PDF
- page markers in the output such as `## Page 3 [pdf_text]` or `## Page 4 [paddleocr]` so you can see which pages required OCR

Flags:

- `input`
  A single PDF file or a directory tree containing PDFs. Directory mode is recursive.
- `--out <dir>`
  Output directory for extracted `.txt` files. The script preserves the relative input tree under this directory.
- `--min-direct-chars <n>`
  Minimum amount of directly extracted page text required before the script accepts `PyMuPDF` output. If a page falls below this threshold, it is sent to PaddleOCR automatically. Higher values make fallback more aggressive and usually improve quality on messy government PDFs.
- `--dpi <n>`
  Render resolution used for OCR fallback pages. Higher DPI gives PaddleOCR a sharper image and usually improves recognition of small or degraded legal text, but increases runtime and memory use. `300` is the recommended high-quality setting.
- `--ocr-lang <code>`
  PaddleOCR language code. Use the language that matches the source documents. `en` is correct for English-only corpora; use a different code for non-English country folders.
- `--no-angle-cls`
  Disable PaddleOCR angle classification. Leave this off for best accuracy. Only use it when pages are consistently upright and you need extra speed.

Quality defaults in the script are intentionally set to accuracy-first values now:

- `--min-direct-chars 140`
- `--dpi 300`
- angle classification enabled

These defaults favor better extraction over speed, especially on mixed text/scanned legal PDFs.

### 3. Extract structure-preserving Markdown with Docling

Use `scripts/extract_docling_markdown.py` when you want to inspect whether a richer parser preserves headings, lists, tables, and general document structure better than plain `.txt` extraction.

Install the optional Docling stack first:

```bash
uv sync --group docling
```

Run on a folder tree:

```bash
uv run python scripts/extract_docling_markdown.py "C:/data/Singapore/pdf" --out data/cache/docling/singapore
```

Run on a single file:

```bash
uv run python scripts/extract_docling_markdown.py "C:/data/Singapore/pdf/singapore_01.pdf" --out data/cache/docling/singapore
```

What the script writes:

- one `.md` file per supported input document
- one `.json` sidecar per document by default so you can inspect Docling's structured representation
- terminal logs as each file is processed and saved

Flags:

- `input`
  A supported document file or a directory tree. The script currently accepts `.pdf`, `.docx`, `.pptx`, `.html`, `.md`, and `.txt`.
- `--out <dir>`
  Output directory for generated Markdown and JSON files. The relative input tree is preserved under this directory.
- `--no-json`
  Write only Markdown if you do not want the Docling JSON sidecar.

Recommended use:

- run `extract_pdf_text.py` when you want a cheap plain-text corpus for downstream parsing
- run `extract_docling_markdown.py` on the same sample set when you want to compare structure quality before choosing the preprocessing path for the knowledge base

### 4. Compare the current pipeline against olmOCR

Use `scripts/compare_pdf_extractors.py` when you want a side-by-side output comparison between:

- the current ClauseChain hybrid extractor (`PyMuPDF` + PaddleOCR fallback)
- `olmOCR` Markdown output

Install the optional olmOCR package first:

```bash
uv sync --group olmocr
```

This only installs the base Python package. According to the official olmOCR README, local inference requires a recent NVIDIA GPU with at least 12 GB VRAM and a clean Python 3.11 environment; remote OpenAI-compatible inference is the lighter-weight option. On Windows, you will usually want a remote server or a Linux/WSL setup for local GPU inference.

Run a folder comparison:

```bash
uv run python scripts/compare_pdf_extractors.py "C:/data/Australia/pdfs" --out data/cache/pdf_compare/australia
```

Run with an external olmOCR server:

```bash
uv run python scripts/compare_pdf_extractors.py "C:/data/Australia/pdfs" --out data/cache/pdf_compare/australia --server https://your-server/v1 --olmocr-model allenai/olmOCR-2-7B-1025-FP8 --workers 1 --pages-per-group 1
```

What the script writes:

- `current/*.txt` for the existing ClauseChain extractor output
- `olmocr/*.md` for the olmOCR Markdown output
- `reports/*.json` with per-file status, output paths, and olmOCR log path
- `olmocr/*.olmocr.log` with the exact olmOCR command, stdout, and stderr for each PDF

Flags:

- `input`
  A single PDF file or a directory tree containing PDFs.
- `--out <dir>`
  Root output directory for the comparison artifacts.
- `--min-direct-chars`, `--dpi`, `--ocr-lang`, `--no-angle-cls`
  Passed through to the current ClauseChain extractor so you can keep that side consistent with your normal runs.
- `--olmocr-model <name>`
  Optional model name for olmOCR, especially useful when pointing at a remote server.
- `--server <url>`
  Optional OpenAI-compatible olmOCR inference endpoint.
- `--api-key <key>`
  Optional API key for the remote olmOCR server.
- `--workers <n>`
  olmOCR worker count. Keep this at `1` if you want one-PDF-at-a-time behavior.
- `--pages-per-group <n>`
  olmOCR page grouping size. Lower values are easier to debug and usually safer on constrained hardware.
- `--max-concurrent-requests <n>`
  Optional remote inference concurrency limit passed through to olmOCR.
- `--keep-olmocr-workspace`
  Keep the raw per-file olmOCR workspace next to the copied Markdown output for debugging.

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
  run.py                      CLI entrypoint (--country / --economy)
  pyproject.toml              Python project + dependencies (groups: dev, crawl, docling, olmocr)
  configs/
    models.yaml               model routing profiles (+ graph backend)
    graph.yaml                GraphStore backend contract (sqlite default / neo4j optional)
    rdtii/
      pillar_6.yaml           indicator rules + official 0/0.5/1 criteria + weights
      pillar_7.yaml           same, incl. the P7-I1/I2 polarity (absence = 1)
    jurisdictions/
      sg.yaml my.yaml au.yaml portals, citation grammar, anchor instruments, notes
  packages/
    core/                     schemas.py · interfaces.py · orchestrator.py
    connectors/
      sg_sso.py               SG fetcher (httpx first, Playwright fallback)
    ingest/
      xlsx.py                 stdlib-only xlsx reader
      known_index.py          master-DB Impact parser -> KNOWN baseline
    export/                   csv_writer.py (template-exact) · json_writer.py
    graph/
      store.py                get_graph_store() factory (GRAPH_BACKEND)
      sqlite_graph.py         DEFAULT judged-path store
      neo4j_client.py         optional demo swap
      schema.cypher           Neo4j constraints
    providers/
      model_router.py         profiles + resolve_llm()/resolve_embedding()
      llm_providers.py        OpenAI + Gemini (REST) + FallbackLLM
      embedding_provider.py   OpenAI embeddings + stub
      ocr_provider.py         local PDF-text-first extractor + OCR fallback provider
  scripts/
    build_known_index.py      ESCAP files -> data/known_index.json + data/seeds.json
    eval_vs_master.py         the scoreboard (KNOWN recall + format checks)
    extract_docling_markdown.py Docling conversion to Markdown + JSON for structure inspection
    compare_pdf_extractors.py side-by-side current extractor vs olmOCR comparison
    extract_pdf_text.py       PDF text extraction with automatic PaddleOCR fallback
    rename_pdfs_sequential.py rename a folder of PDFs to country_01.pdf style names
    spike_sg_fetch.py         AI-1 spike: live SG fetch
    spike_ocr_check.py        AI-1 spike: scanned-PDF detection
    spike_providers.py        AI-2 spike: real routing (needs API keys)
  data/
    known_index.json          KNOWN baseline (master = primary; built artifact)
    seeds.json                crawler seeds (Legal Inventory, all pillars)
    gold/gold_rows.csv        the answer key (Legal verifies every row)
  tests/                      16 tests incl. template-contract guard (fixtures/)
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

## Legal evidence graph (SQLite default, Neo4j optional)

**Final decision (GraphRAG Strategy §12):** the graph is a *data model* behind the
swappable `GraphStore` interface — same nodes/edges either way:

- economies, instruments, versions, sections, provisions, source spans,
  indicators, candidate findings, verified findings

Backends:

| Backend | When | Setup |
|---|---|---|
| `sqlite` (**default**) | The judged path. Zero extra services — judges run pip-only. | none (`data/graph.db` auto-created) |
| `neo4j` (optional) | Live-demo graph view + Cypher answers in the interview. | set `GRAPH_BACKEND=neo4j` + the `NEO4J_*` vars |

The swap is one env var — the same trick as the LLM/OCR swap, and demoed the same way.
`packages/graph/schema.cypher` defines the Neo4j constraints; `packages/graph/sqlite_graph.py`
is the default store. The dummy run works with no graph service at all.

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

P0 complete when: ✅ DONE (11 Jun)

- [x] tests pass (16)
- [x] dummy command writes CSV + JSON (header verified against the official template file)
- [x] schemas are stable enough for team work
- [x] each owner knows which objects they must return
- [x] rubric YAMLs encode the official scoring criteria (incl. P7 polarity)
- [x] KNOWN baseline built from the master DB (306 article refs parsed from Impact prose)
- [x] graph store swappable (sqlite default / neo4j optional)
- [x] eval scoreboard runs (`scripts/eval_vs_master.py`)
- [ ] HUMAN VERIFY: API-key spike (`scripts/spike_providers.py`) + SG fetch spike — need keys/network

P1 target:

```bash
uv run python run.py --country SG --pillar 6 --out outputs/sg-p6
```

That command should produce real Singapore Pillar 6 output from official source data, with no UI dependency.



