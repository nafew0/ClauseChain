# ClauseChain — Round 1 Build Guide

**Architecture + phase-by-phase plan to win the UN Global Hackathon on AI for Digital Trade Regulatory Analysis.**

| Field | Value |
|---|---|
| Document type | Engineering & delivery plan (companion to `ClauseChain_PRD_Application.md`) |
| Phase | Round 1 — Build (1 June → 20 July 2026) |
| Today | **Rebased 22 June 2026** · ~4 weeks to submission. **The authoritative timeline + scope + task plan now live in `ClauseChain_Dev_Plan_and_Task_Distribution.md` (guiding star); THIS doc is the architecture/method reference.** P0 (engine scaffold) is DONE. |
| Mandatory scope | Economies: **Singapore, Australia, Malaysia** (English) · Pillars **6 & 7** · Zones **1 + 2** |
| Scope (22 Jun) | **Core-first, Round-2 additive:** SG/AU/MY × P6&P7 flawless & frozen (~11 Jul) — extra economies score **0** in Round 1 — THEN the **7 Round-2 finals economies** (CN/IN/ID/LA/MN/RU/TH) as an additive track validated vs the new Round-2 gold DB. After core: multilingual/OCR → R2 economies → bonus pillar (if time), with Zone-3 noise-audit + UI woven in. |
| Indicator codes | **`P6-I1…P6-I5`, `P7-I1…P7-I5` — these ARE the RDTII 2.1 methodology indicators 1:1** (`P6-I1 = 6.1`, … confirmed by the RDTII team, 5 June). The methodology definitions govern (§7); the output-template "Indicator Reference" gloss is superseded. **P6-I5 = 6.5 is non-regulatory → engine extracts P6-I1…I4 + P7-I1…I5 (9 indicators).** |
| Zone 3 scoring | **Official 0/0.5/1 criteria + P6 indicator weights + P7 polarity now encoded in §7.1** (extracted from the RDTII 2.1 Guide, 11 Jun full read; canonical legal home: DoDont §9.1). |
| NEW/KNOWN baseline | Per ESCAP's **10 June mail**: master dataset = **primary** KNOWN reference; 384-row Legal Inventory CSV = **secondary** (seeds + validation). See §8. |
| Hard rule | Mandatory core ships and is unbeatable **before** any stretch work begins. No stretch item may destabilize the core. |

> **Goal statement.** Not to pass — to win, such that no team outscores us on any block. We do that by (1) making the mandatory deliverable flawless and fully rubric-aligned, then (2) layering every optional on top behind a freeze that protects the deadline.

> **⚠️ Post-22-June update (folds in the 11/12/15-June session notes + the Round-2 gold DB; master changelog = Dev Plan §0). Deltas that change THIS doc:**
> - **Model routing → ACCURACY-FIRST, dual-profile (decided 23 Jun).** Our goal is best output, not the cost-efficiency sub-score. **Default = Path B** (cloud `gpt-5.4-nano`/`mini` reasoning + self-hosted Neo4j GraphRAG + local OCR + local BGE-M3 embeddings; ~cents/doc, measured). **Ship Path A** = key-free local fallback (local LLM + SQLite graph) so it runs in any sandbox. Both are `models.yaml` profiles (= the 15-pt modularity demo). Precompute & cache embeddings. Full rationale: Dev Plan §3A. *(Supersedes the cloud-default routing table in §4 below.)*
> - **Retrieval = broad recall, NOT top-k** (12-Jun Direct-Corpus-Interaction result + Nikita 5-Jun: evidence dropped by a top-k score can't be recovered downstream). Graph expansion + broad retrieval, then gates cut.
> - **Zone-3 = Noise Audit** (12-Jun Qian Xiao, built on **Pillar 6 with our exact weights**): multi-persona LLM judges → measure disagreement (**Krippendorff's α**) → emit an **uncertainty band + human approval**, never a bare 0/0.5/1. Extends §7.1.
> - **GraphRAG edges:** adopt `AMENDS` / `REVOKE` / `SUPERSEDES` / `CROSS_REFERENCES` on the `Document → Article → Paragraph → Item → Subitem` tree (12-Jun schema = ours) — powers currentness + amendment tracking.
> - **Output contract (§6):** additional columns ARE allowed after the 13 → add **`Coverage`**, **`Verbatim Snippet (English)`**, **`Status`**; **`Location Reference` is optional**; submit **ONE consolidated** CSV/JSON; `Last Amended` = month+year. **NEW = provision-level**; eval vs the **FULL** known evidence; **repealed-cited-as-current = penalty**; no-evidence → "no provision found", never blank (15-Jun).
> - **Round-2 readiness now:** the engine generalizes by config — validate the 7 finals economies (CN/IN/ID/LA/MN/RU/TH) against `Hackthon_Knowledge/ESCAP-RDTII-2.1_ Round 2 Database.xlsx` (government-verified gold).
> - **Keep evidence separate from scores; always model uncertainty** (12-Jun design rule).

---

## Table of Contents

1. [Design principles (every decision maps to the rubric)](#1-design-principles)
2. [Scope ladder — core vs stretch](#2-scope-ladder)
3. [System architecture](#3-system-architecture)
4. [Tech stack (lean + modular-by-config)](#4-tech-stack)
5. [Repository structure](#5-repository-structure)
6. [Output contract (exact template match)](#6-output-contract)
7. [Indicator rubric-as-code (corrected definitions)](#7-indicator-rubric-as-code)
8. [The NEW-evidence discovery engine (the 20-point lever)](#8-new-evidence-discovery)
9. [Jurisdiction packs & country scaling](#9-jurisdiction-packs)
10. [Evaluation & benchmark harness](#10-evaluation)
11. [Phase-by-phase plan with dates](#11-phase-plan)
12. [Deliverables checklist (the 5 required artifacts)](#12-deliverables)
13. [UI plan — the extra mile](#13-ui-plan)
14. [Risk register & deadline protection](#14-risks)
15. [Roles & ownership](#15-roles)

---

## 1. Design principles

Every block of the 40/30/30 rubric is a feature we build *on purpose*, not a side effect.

| Rubric block | Pts | Design commitment |
|---|---|---|
| Substantive — framework alignment | 20 | Rubric-as-code for `P6-I1…P7-I5`; deterministic predicate checks before any LLM call; output `not_applicable` instead of guessing. |
| Substantive — **NEW evidence** | (of 40) | Autonomous discovery + NEW/KNOWN diff against the sample-kit provision set. **This is where the championship is won — §8.** |
| Substantive — citation fidelity | — | Verbatim span + article **with paragraph** (`s. 26(1)`) + page/anchor + working official URL. Never paraphrase. |
| Technical — live crawling (10) | 10 | Playwright-based crawler that navigates official portals autonomously; per-site connectors; zero manual download in the judged path. |
| Technical — OCR (10) | 10 | Coordinate-native OCR with measured CER < 5%; VLM repair only on low-confidence regions; CER reported per document. |
| Technical — end-to-end (no manual steps) | — | One command in → CSV+JSON out. A reviewer hands us `country + pillar`; nothing else. |
| Architecture — **modular backend (15)** | 15 | Swap LLM or OCR by editing `configs/models.yaml` — no code change. Provider interfaces (`LLMProvider`, `OCREngine`) with local + OpenAI + Anthropic implementations. |
| Architecture — **audit trail (15)** | 15 | Every output row carries a verbatim snippet + source hash + gate results; UI lets a judge click a row → see the exact highlighted source. |
| Architecture — cost-efficiency | — | Per-run cost meter; local-first defaults; cloud escalation only on low confidence; report $/document. |

**Anti-hallucination is a scoring feature.** The Canvas deck's "issues" list (incorrect citation, missing acts, misinterpretation, wrong answer to the indicator's core question, broken URLs, stale law, hallucinated indicators/laws) is our gate checklist. We will demo each failure being *caught*.

### 1.1 Hard legal-correctness rules (from the 1/4/5 June workshops)

These are the exact mistakes the RDTII team flagged in live worked examples. Each maps to a gate and we demo it being caught:

| Rule | Why (workshop example) | Where enforced |
|---|---|---|
| **Currentness is paramount** | The canonical Assignment-1 error was citing an *outdated* notice (MAS Cyber-Hygiene, canceled 1 Jul 2022 → replaced by FSM-N16) via a *broken URL*. In-force test: adopted+published → effective date → not repealed/superseded. | G4 currentness + amendment graph; URL must resolve live |
| **Verbatim must actually exist** | Hallucination example: a tool cited "IT Act s.70B(1)/(4)" — text that does not appear in the act. | G1 span: the quote must be found in the extracted source, else reject |
| **Map on legal function, not keywords** | A transfer *condition* (6.4) mis-coded as a *ban* (6.1); Bhutan network-segmentation rules are cybersecurity (7.2), not infrastructure (6.3). | Predicate tuple + rubric exclusions before any LLM label |
| **Sectoral instruments ARE recorded** | Don't discard a sectoral notice because a horizontal law exists — record it (tag role), distinguish "recorded" from "controlling evidence." | Authority resolver keeps G2/G3, tags role; never filters them out |
| **One provision → many indicators** | The same legal text can satisfy several indicators; they are not mutually exclusive. | Output is one row per (provision × indicator); multi-label mapping |
| **Domestic primary sources only** | An LLM error recorded **CPTPP (an international agreement)** as a domestic measure. | Source-type filter: international agreements are not domestic measures (except the non-regulatory indicators) |
| **"Fighting the NO"** | Proving a country has *no* ban means searching the whole universe; if nothing restrictive is found, still **cite the general governing law as the reference basis (score 0)** rather than leave it blank. | Explicit absence/score-0 path; never emit an empty/uncovered indicator silently |
| **Dead-link fallback** | Government PDFs sometimes vanish but a third party hosts the official text. | Keep an **archived copy + access date**; use web-archive / third-party as a discovery lead, cite the official instrument |

---

## 2. Scope ladder

We ship in concentric rings. Each ring is independently demoable and adds points without endangering the ring beneath it.

```
RING 0 — CORE (must ship, unbeatable)        ← freeze by 5 July
  SG + AU + MY · Pillars 6 & 7 · Zone 1 (crawl) + Zone 2 (extract/map/cite)
  Exact template output (CSV+JSON) · verbatim audit trail · OCR path · modular config
  NEW/KNOWN discovery · amendment ("Last Amended") tracking

RING 1 — HIGH-VALUE OPTIONALS (our mandatory)  ← additive only, after core freeze
  Zone 3: RDTII 0–1 compliance-cost scoring with "Impact" rationale
  + Bonus pillar (Pillar 2 or 8) for SG/AU/MY
  Extra-mile UI wired to the live engine

RING 2 — CHAMPIONSHIP STRETCH (proof of scale)  ← only if Ring 1 is green
  Additional economies via the connector pattern, staged by difficulty:
    Tier A (English / structured): India, Indonesia, Mongolia, Timor-Leste
    Tier B (non-Latin / hard portals): Thailand, Russian Federation, Lao PDR, China
  Round 1 target: SG/AU/MY rock-solid + 2–3 additional economies as live proof.
  Finals target: all 8 (3 mandatory there) — the architecture must already reach them.
```

> **Realism note.** Fully scoring all 8 additional economies before 20 July is *not* the Round 1 requirement (they belong to the finals, where 3 of 8 are mandatory). The winning move for Round 1 is **flawless SG/AU/MY + demonstrable, working scale to a few additional economies**, with the connector architecture proving the rest is "add a jurisdiction pack." We build the machine that reaches all 8; we *prove* it on a few. This is how we look like champions without missing the deadline.

---

## 3. System architecture

The engine is a staged, typed pipeline. Each stage emits a typed artifact + a quality signal. This is the PRD's pipeline, **retargeted** to SG/AU/MY and the exact output contract.

```
            ┌─────────────────────────────────────────────────────────────┐
 INPUT  →   │  run.py --country SG --pillar 6   (CLI)  ·  POST /runs (API)  │
            └─────────────────────────────────────────────────────────────┘
                                     │
   [0] Jurisdiction Pack   sg.yaml / au.yaml / my.yaml — seed URLs, authority graph,
        load                citation patterns, language, KNOWN-provision list
                                     │
   [1] Discovery (Zone 1)  crawl official portal (Playwright) → candidate documents,
                            ranked by semantic + keyword relevance to indicator
                                     │
   [2] Acquisition         raw bytes + SHA-256 + headers + rendered page images
        & provenance
                                     │
   [3] Authority &         binding / current / draft / repealed / amended;
        currentness        "Last Amended" date; supersession graph
                                     │
   [4] Extraction (Zone 2) HTML (Trafilatura) | native PDF (PyMuPDF/Docling) |
                            scanned (PaddleOCR→CER, VLM repair) — text + bbox + conf
                                     │
   [5] Legal structure     section tree; rule units (principal rule + exception +
        & rule units        condition + definition); Horizontal vs Sectoral coverage
                                     │
   [6] Retrieval           hybrid BM25 + dense (BGE-M3) + rerank, per indicator
                                     │
   [7] Predicate extraction actor/action/object/destination/modality/condition/exception
                                     │
   [8] RDTII mapping        rubric-as-code (deterministic) → constrained LLM →
                            P6-I1…P7-I5  (+ optional Zone 3 score 0–1)
                                     │
   [9] Verification gates   G1 span · G2 location · G3 authority · G4 currentness ·
        (G1–G8)             G5 structure · G6 tuple · G7 rubric · G8 counter-evidence
                                     │
  [10] Discovery diff       tag NEW vs KNOWN against jurisdiction pack KNOWN-list
                                     │
  [11] Export               CSV (template-exact) + JSON envelope + provenance bundle
                                     │
            ┌─────────────────────────────────────────────────────────────┐
 OUTPUT →   │  output.csv · output.json · logs/ · provenance/   +   UI view │
            └─────────────────────────────────────────────────────────────┘
```

**Two entry points, one core.** The CLI (`run.py`) satisfies deliverable #1 and the "no manual steps" test. The FastAPI service exposes the same pipeline so the Next.js UI (deliverable extra-mile) renders *real* runs, not mock data. The pipeline core is import-shared — never duplicated.

**Modularity is enforced by interfaces, not convention:**

```python
class LLMProvider(Protocol):
    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel: ...
# impls: LocalVLLM, OllamaProvider, OpenAIProvider, AnthropicProvider

class OCREngine(Protocol):
    def extract(self, page_image: bytes) -> list[OCRToken]: ...  # token + bbox + conf
# impls: PaddleOCREngine, TesseractEngine, (VLM repair: QwenVL / cloud vision)
```

Selection is 100% config-driven (`configs/models.yaml`). The judge's literal test — "swap OpenAI for Llama 3 by changing a config value" — passes by construction.

**Validated by production practice (TH2OECD, 4-June workshop).** A live government legal-AI system independently arrived at our two core bets, which we adopt explicitly:
- **GraphRAG over plain RAG.** The evidence ledger is a legal knowledge graph — `Law → Section → Provision` plus typed relationships (`amends`, `supersedes`, `qualifies`, `cross-references`, `defines`). It improves retrieval, exception-following (provisions that point into Schedules), and counter-evidence/amendment detection. This *is* §3's ledger, framed as GraphRAG. **Storage decision (final, 11 Jun):** the graph is a *data model behind a swappable `GraphStore` interface* — **SQLite-backed by default** (the judged quick-start contract is clone→venv→pip→one command; no hard service dependency), with a **Neo4j driver as an optional config swap** (`GRAPH_BACKEND=neo4j`) powering the live-demo graph view. The backend swap itself is one more modularity proof. Details: `ClauseChain_Championship_GraphRAG_Strategy.md` §12.
- **A hard AI/code boundary.** LLMs only for ambiguity, reading, comparison, drafting; **deterministic code for validation, required-field checks, scoring, version control, and output packaging** (= our rubric-as-code + gates). This is what makes results reproducible.
- **Observability from day one.** Log every agent output, retrieved source, intermediate result, rubric hit, score, and model version, so a failure can be traced to retrieval vs classification vs reasoning vs formatting. Feeds the iteration loop (every reviewer correction becomes a regression test).
- **Responsible-AI framing** (OECD principles) for the pitch: transparency, traceability, human oversight, no autonomous final decisions — which our audit trail + HITL already deliver.

---

## 4. Tech stack

Chosen to be **shippable by a small strong team in 7 weeks** while keeping the modular property. Heavier infra (OpenSearch, Qdrant, MinIO, vLLM cluster) from the PRD is *optional scale-up*, not required for Round 1.

| Layer | Round 1 choice | Why / swap path |
|---|---|---|
| Language | Python 3.11 (engine) | One language, great AI-assistant velocity. |
| Pipeline | Plain typed DAG of stage functions; Prefect optional | Testable, debuggable; no framework lock-in. |
| Crawl | **Playwright** (JS/anti-bot) + `httpx`; per-site connectors | Handles laws.go.th / legislation.gov.au / lom.agc.gov.my. Crawl4AI optional. |
| HTML extract | **Trafilatura** + custom legal DOM adapter | Preserves section anchors. |
| PDF extract | **PyMuPDF** + **Docling**; `pdfplumber` for tables | Reading order, layout, coordinates. |
| OCR | **PaddleOCR** (coord-native) → **Tesseract** fallback → VLM repair | CER measured; bbox anchors citations. |
| Embeddings | **BGE-M3** (multilingual, local) | Works for EN now + TH/ZH/RU/LO later. Swap to Qwen3-Embedding or OpenAI. |
| Retrieval | BM25 (`rank_bm25` / SQLite FTS5) + dense (FAISS or pgvector) + cross-encoder rerank | Hybrid; exact legal terms + semantics. |
| LLM | Config-routed: **local (Ollama/vLLM) default**, OpenAI / Anthropic cloud | The 15-pt modular requirement. |
| Schema | **Pydantic v2** + Outlines/JSON-schema constrained decoding | No free-form hallucinated output. |
| Storage | **Postgres + pgvector** (server) / **SQLite + FAISS** (laptop mode) | Laptop mode = the cloud-only judge path. |
| Object store | Local FS (`storage/`) → MinIO optional | Raw bytes, page images, exports. |
| API | **FastAPI** | UI + programmatic access; same core as CLI. |
| UI | **Next.js 16 / React 19** (existing app), React Query → FastAPI | Reuse `/pipeline/*`; rip out SaaS/billing from the judged path. |
| Eval | `pytest` + bootstrap-CI metric scripts | Reproducible benchmark vs sample DB. |

**On the existing repo:** the Django `accounts` + `subscriptions` (Stripe/bKash) backend is **not** part of the judged engine — keep it out of the submission path (it's off-message for an open-source tool). The Next.js front-end is reused; its mock `lib/clausechain/data.ts` is replaced by live FastAPI calls.

---

## 5. Repository structure

```
clausechain/
  apps/
    cli/            run.py — the judged entry point
    api/            FastAPI service (same core)
    web/            Next.js audit UI (reused, rewired to API)
  packages/
    core/           pydantic schemas, evidence ledger, run orchestrator
    connectors/     per-portal crawlers: sg_sso.py, au_legislation.py, my_lom.py, ...
    extractors/     html.py, pdf.py, ocr.py  (+ OCREngine impls)
    retrieval/      bm25.py, dense.py, rerank.py, hybrid.py
    rdtii/          rubric loader + checks
    providers/      LLMProvider impls (local/openai/anthropic)
    verifier/       G1–G8 gates
    discovery/      NEW/KNOWN diff engine
    export/         csv_writer.py (template-exact), json_envelope.py, provenance.py
  configs/
    models.yaml             routing: local | cloud | hybrid
    jurisdictions/          sg.yaml, au.yaml, my.yaml, (id.yaml, in.yaml, ...)
    rdtii/                  pillar_6.yaml, pillar_7.yaml, (optional pillar_2/8.yaml)
  tests/
    fixtures/  golden/  regression/        # built from the sample DB
  benchmark/
    dataset.jsonl  run_benchmark.py  report.md
  docs/
    README.md (Quick Start — MANDATORY)  architecture.md  adding_a_jurisdiction.md
  docker-compose.yml
  output_template.xlsx        # the organizer template, our writer validates against it
```

---

## 6. Output contract

**This is non-negotiable and validated programmatically by judges.** Column names and order must match `OUTPUT_TEMPLATE_31MAY.xlsx` exactly. Our `export/csv_writer.py` asserts the header against the template file in CI.

**CSV columns (exact):**

`Economy` · `Law Name` · `Law Number / Ref` · `Last Amended` · `Indicator ID` · `Article / Section` · `Discovery Tag` · `Location Reference` · `Verbatim Snippet` · `Mapping Rationale` · `Source URL` · `Confidence` · `Notes`

Rules baked into the writer:
- **One row per (provision × indicator).** One article mapping to two indicators = two rows.
- `Economy` = official UN name. `Law Name` = full name + year, never abbreviated.
- `Indicator ID` ∈ {`P6-I1`…`P6-I4`, `P7-I1`…`P7-I5`, optional `P8-I*`} — validated against the rubric; **never invented**. (`P6-I5`=6.5 is non-regulatory, sourced from treaty databases — the engine does not extract it.)
- `Article / Section` always includes the paragraph: `s. 26(1)`, `Art. 26(2)` — never bare `Art. 26`.
- `Discovery Tag` ∈ {`NEW`, `KNOWN`} — dropdown-enforced.
- `Verbatim Snippet` = exact source text, no edits. Must pass G1 (span exists in extracted source).
- `Mapping Rationale` ≤ 300 chars, format: *"This [section] [prohibits/requires/permits/establishes] [what]. Maps to [indicator] because [1-sentence legal logic]."* Blank if uncertain (a wrong rationale misleads judges).
- `Source URL` = direct official-portal link (not Google, not a third-party DB), checked live.
- Add **`Coverage` (Horizontal / Sectoral[+sector])** — required by the Zone-2 spec and present in every sample-DB row. (If it cannot go in the CSV without breaking the template header, carry it in the JSON + `Notes`; confirm via Q&A whether a `Coverage` column is permitted.)

**JSON envelope (supplementary, per the deck):**

```json
{
  "economy": "Singapore",
  "law_name": "Personal Data Protection Act 2012",
  "source_pdf_path": "storage/runs/<id>/sg_pdpa.pdf",
  "ocr_quality_cer": 0.012,
  "processing_time": 41,
  "model_version": "qwen2.5-7b@local + paddleocr-2.7",
  "provisions": [
    {
      "indicator_id": "P6-I4",
      "article": "s. 26(1)",
      "verbatim": "An organisation shall not transfer any personal data ... unless ... requirements prescribed ...",
      "mapping_rationale": "This s.26(1) permits cross-border transfer only if comparable-protection requirements are met. Maps to P6-I4 (conditional flow regime) — transfer stays possible, so it is NOT a 6.1 ban.",
      "discovery_tag": "NEW",
      "coverage": "Horizontal",
      "measure_type": "binding_primary_law",
      "status": "in_force",
      "last_amended": "2021",
      "source_url": "https://sso.agc.gov.sg/Act/PDPA2012",
      "archived_copy": "storage/runs/<id>/archive/sg_pdpa_2012.html",
      "access_date": "2026-06-07",
      "location_reference": "page 32",
      "translation": null,
      "confidence": 0.94,
      "gate_results": {"G1":"pass","G2":"pass","G3":"pass","G4":"pass","G5":"pass","G6":"pass","G7":"pass","G8":"none_found"},
      "raw_context": "Part VI ... s.26(1) ... (2) ...",
      "rdtii_score": 1.0,
      "impact": "Conditional cross-border transfer regime (RDTII 6.4)."
    }
  ],
  "confidence": 0.94
}
```

The JSON carries the RDTII-methodology fields the workshops asked for beyond the CSV: **`coverage`** (Horizontal/Sectoral + sector), **`measure_type`**, **`status`** (in_force / amended / repealed / draft / not-yet-effective), **`translation`** (original + English + uncertainty flag, for non-English economies), and **`archived_copy` + `access_date`** (link-preservation — a flagged pain point). `mapping_rationale` is named on legal **function**, not a paraphrase of the snippet.

---

## 7. Indicator rubric-as-code

**The submission codes ARE the RDTII 2.1 methodology indicators, 1:1** — confirmed by the RDTII team on 5 June: `P6-I1 = Indicator 6.1`, `P6-I2 = 6.2`, … `P7-I5 = 7.5`. (The early `OUTPUT_TEMPLATE` "Indicator Reference" tab gave a different GDPR-style gloss — *adequacy / SCCs / consent / purpose-limitation / breach* — which is **superseded**. The methodology definitions below govern; the sample DB, the portals CSV, and the organizers' own Assignment 1 all use them.) There is **no crosswalk** — the code *is* the methodology number. We encode each indicator as YAML with required predicates, positive cues, exclusions, and gold examples.

**Pillar 6 — Cross-border data flows** ("can data move across borders, under what restrictions, at what cost?"):

| Code | Indicator | Captures | Example |
|---|---|---|---|
| P6-I1 | 6.1 Ban & local processing | a ban on transfer **OR** a local-processing requirement (most restrictive) | Korea: financial cloud must process credit data locally |
| P6-I2 | 6.2 Local storage | a **copy** must be stored domestically (does *not* by itself forbid transfer) | Türkiye: large social networks store user data in-country |
| P6-I3 | 6.3 Infrastructure | local **servers / data centres / infrastructure** as a condition of service | Vietnam: providers must keep ≥1 local server |
| P6-I4 | 6.4 Conditional flow | transfer allowed **IF** conditions met (consent / adequacy / contractual safeguards / approval). If transfer stays possible, it is **not** a ban. | Palau: notify ministry + consent before transfer abroad |
| P6-I5 | 6.5 No binding data-transfer agreement | **NON-REGULATORY** — sourced from external treaty databases; **our engine does NOT extract it.** | — |

> Engine covers **P6-I1…P6-I4** only (with P7, **9 regulatory indicators** total).

**Pillar 7 — Domestic governance of personal data:**

| Code | Indicator | Captures | Example |
|---|---|---|---|
| P7-I1 | 7.1 Comprehensive DP framework | a horizontal personal-data-protection law (**sectoral laws are still recorded**) | SG PDPA 2012 (horizontal) |
| P7-I2 | 7.2 Dedicated cybersecurity framework | a law *specifically* for cybersecurity (not scattered security clauses) | SG Cybersecurity Act 2018 |
| P7-I3 | 7.3 Minimum retention period | data must be kept **≥ a set period** (≠ "do not keep longer than necessary") | BD: e-commerce records kept 6 years |
| P7-I4 | 7.4 DPIA / DPO | obligation to appoint a DPO and/or run a DPIA | SG: organisations must appoint a DPO |
| P7-I5 | 7.5 Government access | law enabling/requiring govt access — look **beyond privacy law**: criminal procedure, surveillance, telecom | SG Criminal Procedure Code s.39 |

```yaml
# configs/rdtii/pillar_6.yaml   (codes == methodology numbers)
schema_version: rdtii-2.1
P6-I1:
  name: Ban and local processing requirements        # = Indicator 6.1
  question: Does the law ban cross-border transfer OR mandate local processing?
  required_predicates: { action: [transfer, process], modality: [prohibited, mandatory_local] }
  positive_cues: ["shall not transfer", "must be processed within", "may not be sent abroad"]
  exclusions: ["transfer allowed if conditions met -> that is P6-I4, not a ban"]
P6-I2: { name: Local storage requirements, question: "Must a copy be stored domestically?" }
P6-I3: { name: Infrastructure requirements, question: "Local server / data centre required to provide the service?" }
P6-I4:
  name: Conditional flow regimes                      # = Indicator 6.4
  question: Is transfer permitted subject to consent / adequacy / safeguards / approval?
  required_predicates: { action: [transfer], modality: [conditional], condition: [consent, adequacy, contract, approval] }
  exclusions: ["unconditional ban -> P6-I1"]
P6-I5: { name: No binding data-transfer agreement, regulatory: false }   # non-regulatory: SKIP
```

```yaml
# configs/rdtii/pillar_7.yaml
P7-I1: { name: Comprehensive data-protection framework, note: "record sectoral laws too" }
P7-I2: { name: Dedicated cybersecurity framework }
P7-I3: { name: Minimum data-retention period, exclusions: ["keep no longer than necessary -> NOT 7.3"] }
P7-I4: { name: DPIA / DPO requirements }
P7-I5: { name: Government access to personal data, sources: [privacy_law, criminal_procedure, surveillance, telecom] }
```

### 7.1 Zone 3 scoring rules — the official 0 / 0.5 / 1 criteria (RDTII 2.1 Guide)

*Added 11 Jun from the full RDTII-guide read. Canonical legal home: `ClauseChain_Legal_Matching_DoDont.md` §9.1 — update there first, mirror here. Encode all of this in `pillar_*.yaml`; Zone 3 stays deterministic code over gated, controlling-evidence rows (AI suggests, Legal approves — Dev Plan §9).*

**⚠️ Polarity first (a silent score-killer):** **P7-I1 and P7-I2 score the *absence* of a framework** (lack = 1 = more restrictive environment); **P7-I3/I4/I5 score the *presence* of requirements.** All of Pillar 6 scores the presence of restrictions. Higher always = more regulatory burden. A sign-flip here silently corrupts every Zone 3 score — the polarity lives in the YAML, not in anyone's head.

**Scope exclusion (P6):** measures applying **only to government data are NOT scored** for Pillar 6.

| Code | Score 1 | Score 0.5 | Score 0 |
|---|---|---|---|
| P6-I1 | ban/local-processing covers **personal data** OR applies **horizontally**; also 1 if **≥2** such requirements on non-personal/specific data (or targeting >1 economy) | a single requirement on non-personal/specific data or one economy | transfer free of such requirements |
| P6-I2 | mirrors 6.1: copy-stored-domestically rule covers personal data OR horizontal; or ≥2 on non-personal/specific data | single non-personal/specific-data storage rule | no local-storage requirement |
| P6-I3 | **any** infrastructure requirement exists | — | none |
| P6-I4 | conditions cover **personal data** (any coverage) OR apply **horizontally** (even non-personal) | non-personal/specific data, or sectoral only | no conditions on transfer |
| P6-I5 | no binding data-transfer agreement (treaty DBs — **engine does not extract**) | — | ≥1 binding agreement |
| P7-I1 | **lacks** a comprehensive DP framework | **sectoral-only** laws; or **horizontal-but-thin** (e.g. missing right-to-rectification → "not comprehensive enough" — Juntong, 5 Jun; organizers explicitly invite going deeper than the binary here) | comprehensive horizontal framework exists |
| P7-I2 | **lacks** a dedicated cybersecurity framework (sectoral notices/scattered clauses don't count as dedicated) | — | dedicated framework exists |
| P7-I3 | a minimum retention **period is specified** (keep ≥ X days/months/years) | — | no minimum period ("not longer than necessary" is NOT 7.3) |
| P7-I4 | DPIA **or** DPO required (either suffices) | — | neither required |
| P7-I5 | government access to personal data enabled/required | — | otherwise |

**Pillar-6 indicator weights** (for the dashboard + pitch math): **6.1 = 38 %** · **6.3 = 31 %** · 6.2 = 12 % · 6.4 = 12 % · 6.5 = 8 %. The two heavyweights (6.1, 6.3) are exactly the pair with the trickiest disambiguations (6.4-vs-6.1 ban, 6.2-storage-vs-6.3-infrastructure) — mapping accuracy there is worth disproportionately more.

**Bonus completeness:** auto-check the treaty/status pages for the non-regulatory indicators (URLs listed in `Non-regulatory indicators.pdf`) so P6-I5 ships with a treaty-database citation instead of a blank.

**The mapping question, per RDTII (= our predicate tuple):** *who* is regulated · *what* is required/prohibited · to *what* data/service/sector · under *what* conditions · with *what* exceptions. Map on legal **function, not keywords** — a transfer *condition* is 6.4 (not a 6.1 ban); network-segmentation/encryption rules are cybersecurity 7.2 (not infrastructure 6.3). Don't ignore thresholds, exemptions, schedules, or implementing rules that define the real scope.

**Bonus pillar.** The organizers named **Pillars 3, 5, 9** as examples — but their indicators (3.4, 5.3, 9.1) need *secondary-source / de-facto-practice* handling (a different pipeline). For maximum reuse of our P6/P7 *regulatory* engine, prefer a purely-regulatory pillar: **Pillar 2 (Public Procurement)** — horizontal, clean gold data, already in our PRD — or **Pillar 8 (Intermediary Liability)**. Decide once Ring 0 is green; it is one more `pillar_X.yaml`. *(Build-guide recommendation updated from "P8 only" to "P2 or P8, P2 slightly preferred for reuse.")*

---

## 8. NEW-evidence discovery

**This is the single largest differentiator (20 of 40 substantive points) and "most teams miss it."** We treat it as a headline feature, not a byproduct.

**Definition (refined per 5-June Q&A).** NEW/KNOWN is judged at **provision granularity, not law granularity.** A *new provision inside an already-recorded law* still counts as **NEW** — because the RDTII team often recorded only the law name or the first relevant provision (space/time limits). So even on "known" laws like the SG PDPA there is large NEW headroom: extra articles, exceptions, and sectoral provisions they never cited. `KNOWN` = the exact (instrument + article) was already a provided example (reproduce it — it proves recall).

**Design:**
1. **Baseline ruling (ESCAP 10 June mail — authoritative):** the **master dataset** (`Sample Kit/ESCAP-RDTII-2.1_ Round 1 Database.xlsx`) is the **primary KNOWN reference**. The new 384-row **`Mail Content 10 June/Singapore, Malaysia, Australia, Legal Inventory.csv`** (all pillars, long-form, MY 146 / SG 131 / AU 107 — no Impact/provision columns) is **secondary**: crawler seeds + structure/format validation; ESCAP's own words: evidence beyond it "may be classified as NEW". Each jurisdiction pack ships a `known_provisions:` list keyed on **(instrument + article)** — built by normalizing master-DB law names/numbers **and parsing the article references out of its Impact-column prose** (that is where the gold articles actually live). Where the DB recorded only a law name, *any* specific article we cite is NEW.
2. After mapping + verification, the discovery-diff stage normalizes each result `(instrument, article, indicator)` and checks membership against the KNOWN set → tags `NEW`/`KNOWN`. A new article within a known instrument → `NEW`.
3. **Recall maximization** is the actual engineering: broad two-pass discovery (semantic + keyword over the full portal), retrieve at rule-unit granularity, and run *counter-retrieval* for exceptions/amendments so we surface provisions other teams' chunkers miss.
4. Every `NEW` row goes through the **full gate stack** — a NEW provision that fails verification is worse than not finding it (false positives lose points). NEW + verified is the gold.
5. Surface a **discovery summary** in output + UI: "X provisions found · Y NEW · Z KNOWN · recall vs sample kit = …".

**Why we'll out-discover others:** our authority/currentness resolver finds *amendments and superseding instruments* (the country task is literally "find amendments and new regulations"), and our rule-unit retrieval catches exception clauses that naive top-k chunking drops. Both are NEW-provision factories.

---

## 9. Jurisdiction packs & country scaling

Adding an economy = adding a `configs/jurisdictions/<cc>.yaml` + (if needed) a per-portal connector. This is what makes "scale to all 8" credible.

```yaml
# configs/jurisdictions/au.yaml
jurisdiction: AU
name: Australia
languages: { primary: en, supported: [en] }
official_sources:
  - { name: Federal Register of Legislation, domain: legislation.gov.au, authority_rank: 100 }
authority_hierarchy: { binding_current: [act, legislative_instrument], guidance: [oaic_guidance] }
citation_patterns: { section: ["s {n}", "section {n}"] }
known_provisions: [ ... from sample DB ... ]
connector: au_legislation
rdtii_bindings: { pillars: [6, 7, 8] }
```

**Scaling tiers (build connectors in this order):**

| Tier | Economies | Challenge | Reuse |
|---|---|---|---|
| Core | SG, AU, MY | English, structured | full pipeline |
| A (Round-1 stretch) | India, Indonesia, Mongolia, Timor-Leste | mostly English / Latin script, varied portals | new connector + pack; same extractors |
| B (Finals) | Thailand, Russian Federation, Lao PDR, China | non-Latin script, OCR-heavy, hard portals | + multilingual embeddings (BGE-M3 already) + OCR language packs |

**Round 1 commitment:** SG/AU/MY at 100% + **2–3 Tier-A economies as working proof**. The deck's mention of "additional economies (extra points)" is satisfied, and the connector pattern demonstrates the path to all 8 for finals.

---

## 10. Evaluation

We can grade ourselves because the **sample database is labeled gold data for AU/SG/MY across all pillars** — including the real Pillar 6/7 rows (e.g. SG PDPA s.26 → 6.4; Companies Act → retention).

| Metric | Target | Source of truth |
|---|---|---|
| Mapping macro-F1 (P6/P7) | ≥ 0.80 | sample DB rows (codes ≡ 6.x / 7.x) |
| Field accuracy (article, URL, last-amended) | ≥ 0.90 | sample DB |
| NEW-provision precision | ≥ 0.90 (no false NEWs) | manual spot-check + gates |
| Citation exactness (span verifies) | ≥ 0.95 | G1 |
| OCR CER (scanned docs) | < 5% | per-doc measured |
| Crawl recall@20 | ≥ 0.90 | known instruments appear |

`benchmark/run_benchmark.py` produces `report.md` with bootstrap confidence intervals. Assignment-2's suggested methods (F1, field accuracy, inter-annotator agreement, ≥10 real provisions vs RDTII DB) are the floor; we exceed them.

**RDTII quality-control checklist (Juntong, 5 June) — encode as automated gates before any row ships:**
1. Correct indicator **and its scope** under the Guide?
2. Source **official, current, and in force**? (not draft/repealed/superseded)
3. Captured the **exact operative provision**, not just the law title?
4. **Separated the main rule from its exceptions / approvals / thresholds**?
5. If **no restriction** is found, did we still cite the **general governing law as the reference basis** (score 0) rather than leave it blank?

These five are the human reviewers' own pre-entry check — turning them into deterministic gates is the cheapest way to match human accuracy.

---

## 11. Phase plan

Rebased **11 June** (~5.5 weeks). **Core freezes 5 July; stretch is additive-only after that** (absolute max slide: 8 Jul, and only after applying the Dev-Plan §12 cut order). Technical workshops 11–15 June (RAG/OCR/architecture) run alongside P0 — attend and fold in learnings. **Email the Q&A questions before 15 Jun (Dev Plan §14).**

| Phase | Dates | Outcome | Maps to |
|---|---|---|---|
| **P0 — Foundations** | Jun 11–13 (rebased) | Repo skeleton; Pydantic schemas; `csv_writer` asserting template header; `pillar_6/7.yaml` with the **methodology definitions** (P6-I1…I4 + P7-I1…I5); KNOWN-lists for SG/AU/MY at (instrument+article) granularity; `models.yaml` with local+cloud providers; eval harness skeleton wired to sample DB. | Architecture, Output contract |
| **P1 — Vertical slice** | Jun 14–20 (rebased) | **One command end-to-end:** `run.py --country SG --pillar 6` → crawl SSO HTML → extract → map P6-I1…I4 → CSV+JSON, verbatim + exact citation. Cross-check vs SG gold. First green benchmark row. | Deliverables 1,2; all rubric blocks at small scale |
| **P2 — Breadth & resilience** | Jun 21 – Jul 1 (rebased) | Add **Pillar 7**; add **AU + MY** (connectors); **live crawling** hardened; **OCR path** on a scanned MY/SG gazette with CER<5%; **modular swap** demoed (local↔cloud). All 3 economies × P6+P7 passing benchmark. | Technical (10+10+e2e), Architecture (15 modular) |
| **P3 — Differentiators** | Jul 2–5 (rebased; tight — cut order before freeze-slide) | **NEW/KNOWN discovery** + recall maximization; **amendment/Last-Amended** tracking; **G1–G8** wired to every row; **Zone 3 scoring (0–1) + Impact**; confidence + flag-for-review. **CORE FREEZE Jul 5.** | Substantive (NEW 20pts), Audit trail (15), Zone 3 |
| **P4 — Stretch (champion)** | Jul 6–12 | **Bonus pillar (P2/P8)** for SG/AU/MY; **2–3 Tier-A economies** (India/Indonesia/Mongolia/Timor-Leste) as live proof; **extra-mile UI** wired to engine; cost meter. | All optionals |
| **P5 — Package & harden** | Jul 13–19 | **Quick Start README**; **pitch deck** (framed on 40/30/30 + failure-mode catches); **≤10-min screen recording** (scanned-PDF → citation); benchmark `report.md`; edge-case handling (misspelt country, dead URL); **live-demo dry runs**. | Deliverables 1,3,4; live-pitch prep |
| **Submit** | **Jul 20** | All 5 deliverables uploaded. | — |
| Pitch prep | Jul 21–Aug 3 | Rehearse live run; hold-out economy; interview Q&A. | Deliverable 5 (3 Aug) |

---

## 12. Deliverables

| # | Deliverable | Owner phase | Acceptance |
|---|---|---|---|
| 1 | Functional prototype (Task 1+2) + **Quick Start README** | P1→P5 | **CLI is mandatory** (confirmed 5 Jun): reviewer runs `python run.py --country SG --pillar 6`, gets CSV+JSON, no manual steps; works on text **and** scanned PDFs; open-source fallback switch; pinned versions. Quick-start "10 min" = runtime **after** install (setup time excluded). |
| 2 | Structured output (CSV+JSON) | P1 | Validates against `OUTPUT_TEMPLATE_31MAY.xlsx` programmatically; live URLs; NEW rows present. |
| 3 | Technical pitch deck | P5 | Problem→solution; extraction+mapping logic; **explicitly mapped to 40/30/30 and the failure-mode catches**; for non-technical + technical judges. |
| 4 | ≤10-min screen recording | P5 | Engine processes a **scanned/image PDF**, generates correct citations, shows audit trail. |
| 5 | Live demo + interview (3 Aug) | P5+ | Engine runs **live** on a country+pillar, produces output in real time; handle a hold-out economy. |

---

## 13. UI plan — the extra mile

Engine is the scored core; the UI is how we look like champions and how policy judges verify in seconds. Reuse the existing Next.js app; **drop the SaaS/auth/billing surface from the judged path**; wire `/pipeline/*` to the FastAPI engine via React Query.

Priority screens (the PRD's "three that win the demo," retargeted):
1. **Run console** — pick economy + pillar(s) → live progress through stages → results table. The "no manual steps" story, visualized.
2. **Evidence audit (the money screen)** — output row ↔ original source side-by-side, **verbatim span highlighted on the actual PDF/HTML**, predicate tuple, indicator, gate badges, NEW/KNOWN tag, confidence. This *is* the 15-pt audit trail.
3. **Discovery & coverage dashboard** — NEW vs KNOWN counts, per-indicator coverage across SG/AU/MY, recall vs sample kit, cost meter, CER. Proves substantive accuracy at a glance.
4. **Source status / amendment view** — current vs superseded, "Last Amended," counter-evidence — proves we don't cite stale law.
5. **Cross-jurisdiction comparative view** — the same indicator across SG/AU/MY side by side (a direct WTO end-user request: "run the same query across jurisdictions and give comparative analysis"). Cheap to build on top of the per-economy output; high demo value.

UI must never be required for the engine to run (**the CLI is the judged artifact — confirmed required on 5 June; GUI is extra**), but it must render *real* runs.

---

## 14. Risk register & deadline protection

| Risk | Mitigation |
|---|---|
| Stretch work breaks the core | **Core freeze 5 July**; stretch on branches; core stays green and submittable from 5 July onward. We could submit on 5 July if needed. |
| Scaling to 8 economies eats the deadline | Round 1 ships SG/AU/MY + 2–3 Tier-A only; all-8 is a *finals* goal. Connector pattern = cheap proof of scale without full coverage. |
| Hard portals (anti-bot/JS) block crawler | Playwright + per-site connectors; manual-upload fallback logged as a retrieval issue (still processes), so the e2e path never fully fails. |
| OCR CER > 5% on bad scans | Measure per-doc; VLM repair on low-confidence regions; cite only verified spans; report CER honestly. |
| Indicator-code ambiguity (P* vs *.x) | **Resolved** (5 Jun): `P6-Ix ≡ 6.x`, `P7-Ix ≡ 7.x`; methodology definitions in `pillar_*.yaml`; output-template gloss ignored. |
| Citing stale/outdated law (the canonical error) | G4 in-force check (adopted+published → effective date → not repealed/superseded) + amendment graph + live URL resolution. |
| "Fighting the NO" — proving absence is hard | Explicit score-0 path: when no restriction found, cite the general governing law as reference basis; never silently drop an indicator. |
| Dead government links | Archive a copy + access date at acquisition; third-party host = discovery lead, cite the official instrument. |
| LLM hallucinates indicators/laws or non-existent text | Constrained decoding + rubric enums + **G1 span (quote must exist in source)** + G7 reject; demo the catch. |
| Over-engineering infra | Start SQLite+FAISS laptop mode; scale to Postgres/pgvector only if needed. |
| Team bus factor | Clear ownership (§15); shared schemas first so stages integrate cleanly. |

**Golden rule:** at every weekly checkpoint, the main branch must run end-to-end and produce valid output for at least SG. If it doesn't, stop feature work and fix it.

---

## 15. Roles & ownership

Aligned to the hackathon's "Tech Lead + Substantive Lead" structure; adapt to your team size.

| Track | Owns |
|---|---|
| **Substantive lead** | Rubric YAML (methodology definitions), gold-set labeling, mapping-rationale quality, indicator correctness, Q&A-portal escalations, pitch (policy half). |
| **Tech lead / backend** | Pipeline core, connectors, extractors/OCR, providers, verification gates, CLI/API, benchmark. |
| **Frontend** | Next.js UI rewire, evidence-audit screen, discovery dashboard. |
| **Shared** | Output contract (schemas first!), README, screen recording, live-demo rehearsal. |

---

## Immediate next actions (this week, P0)

1. **Email the Q&A questions before 15 June** (the four in Dev Plan §14: hold-out seeding · Zone-3 judging · live-demo network/API constraints · Coverage-column permission from §6). Attend the 11–15 Jun technical workshops; fold learnings into P1–P2.
2. Scaffold the repo (§5); define Pydantic schemas + the template-asserting `csv_writer` **first** so every stage targets the real contract.
3. Author `pillar_6.yaml` + `pillar_7.yaml` with the **methodology definitions (§7) + the official scoring criteria, weights, and P7 polarity (§7.1)**, and the SG/AU/MY `known_provisions` lists (instrument+article) — **built from the master DB (parse the Impact column; primary baseline per the 10 Jun mail), portals CSV, and the 10-June Legal Inventory as secondary seeds**.
4. Stand up `models.yaml` with a local provider + one cloud provider, and prove the swap.
5. Wire the eval harness to the sample DB so we have a scoreboard from day one. *(The 9-Jun manual-extraction assignment deadline has passed — if not submitted, Legal still completes those rows internally; they remain our gold-label spec.)*

> Build the engine the PRD already designed — just pointed at Singapore, Australia, Malaysia, the exact `P6-I1…P7-I5` output template, and the NEW-evidence prize. Make the core unbeatable first; then spend every remaining hour on the optionals that turn "shortlisted" into "champion."
