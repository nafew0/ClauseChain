# Engine decisions log

One line per shape/routing/scope decision (Dev Plan §4). Newest first.

## 2026-06-23 — P1 kickoff changes
- **Model routing = two profiles (Dev Plan §3A).** Default **`hybrid_accuracy`** (Path B): cloud `gpt-5.4-nano` (bulk/rerank) + `gpt-5.4-mini` (mapping/rationale) + **local BGE-M3** embeddings + local OCR + Neo4j (via `GRAPH_BACKEND=neo4j`). Ship **`local_fallback`** (Path A): `ollama:` LLM + BGE-M3 + SQLite graph — runs key-free in any sandbox. Renamed away from `cheap_default`/`final_quality`. Rationale: goal = best output; cost is low (small corpus, nano/mini) and Neo4j/OCR self-hosted; Path A neutralizes the unconfirmed no-key/no-internet eval risk.
- **Providers added:** `OllamaProvider` (local LLM, key-free) and `BgeM3EmbeddingProvider` (local multilingual, lazy sentence-transformers load) behind the existing `LLMProvider`/`EmbeddingProvider` interfaces. `build_llm` now parses `ollama:`; `build_embedding` parses `bge_m3`.
- **Output schema:** appended 3 columns AFTER the 13 required (15-Jun Q&A allows extras): `Coverage`, `Verbatim Snippet (English)`, `Status`. `csv_writer.REQUIRED_HEADER` (the 13) is still asserted byte-equal to the template; `CSV_HEADER = REQUIRED_HEADER + EXTRA_HEADER`. Added `model_version` to `MappedFinding` (JSON-only provenance).
- **Round-2 finals gold ingested:** `parse_round2()` reads the per-economy sheets of `ESCAP-RDTII-2.1_ Round 2 Database.xlsx` (economy from sheet name; no country column). `scripts/build_known_index.py` now also writes `data/known_index_round2.json` (809 rows: CN 111 / IN 146 / ID 172 / LA 90 / MN 75 / RU 97 / TH 118; 177 P6/P7; 1373 article refs). `_map_header` relaxed to anchor on Act + (Indicator|Pillar) so country-less sheets parse.

## 2026-06-11 — P0
- Contracts locked: schemas, `LLMProvider`/`EmbeddingProvider`/`OCREngine`/`GraphStore` interfaces, template-exact `csv_writer` (header asserted vs vendored xlsx), stub orchestrator. Graph: SQLite default + Neo4j optional behind `GRAPH_BACKEND`. KNOWN index built from the Round-1 master DB (Impact-column article parsing).
