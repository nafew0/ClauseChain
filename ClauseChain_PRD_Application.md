# Product Requirements Document - ClauseChain

**A Measured Legal Evidence Compiler for Digital Trade Regulation**

| Field | Value |
|---|---|
| Document type | Product Requirements Document |
| Product | ClauseChain |
| Version | 1.0 |
| Status | Hackathon proposal + prototype build specification |
| Date | 24 May 2026 |
| Initiative | UN Global Hackathon: AI for Digital Trade Regulatory Analysis |
| Framework | UN Regional Digital Trade Integration Index (RDTII) v2.1 |
| Mandatory scope | Pillar 6: Cross-Border Data Policies; Pillar 7: Domestic Data Protection and Privacy |
| License target | Apache 2.0 codebase; documented third-party model licenses |
| Core thesis | Verified citation is necessary but not sufficient. ClauseChain verifies citation, authority, currentness, legal structure, predicate meaning, and counter-evidence before producing an RDTII mapping. |

---

## 1. Executive Summary

ClauseChain is an open-source, self-hostable AI system that discovers, extracts, verifies, and maps digital trade regulations to the UN RDTII framework. It is designed as a **measured legal evidence compiler**: every claim must be tied not only to a quote, but to a current authoritative source, a precise legal structure, a structured legal predicate tuple, and a counter-evidence search.

The main insight is that legal accuracy fails multiplicatively across pipeline stages. A system that is 90% accurate at discovery, OCR, structure parsing, retrieval, classification, and verification may only be roughly 53% correct end to end. ClauseChain therefore measures and improves each stage independently: source discovery recall, authority precision, OCR character error rate, section-boundary F1, retrieval recall@k, classification macro-F1, citation exactness, current-law-status accuracy, and abstention calibration.

The prototype will demonstrate four levels of proof:

1. A high-confidence end-to-end flow on a clean official source.
2. Multilingual scanned-document stress tests on Thai and Bengali materials.
3. Legal-status handling for binding/current/draft/repealed/guideline sources.
4. A reproducible benchmark bundle with labeled examples, negative cases, evaluation scripts, and confidence intervals.

The product's promise is deliberately narrow and defensible: ClauseChain does not replace legal experts. It compiles reviewable regulatory evidence, refuses unsupported claims, and shows humans exactly where the evidence, uncertainty, and conflict are.

---

## 2. Core Design Principles

ClauseChain's design starts from a practical constraint: a real quotation is necessary for legal evidence, but it is not sufficient. A cited span can still be wrong for the task if it comes from a non-binding guideline, a repealed provision, an unofficial translation, an incomplete rule fragment, or a clause whose exception changes the legal effect. The system therefore verifies the full evidence chain before producing an RDTII mapping.

### 2.1 Differentiators

| Area | Design choice |
|---|---|
| Core guarantee | Citation, authority, currentness, structure, predicate, and counter-evidence are verified before output |
| Legal interpretation | System first extracts a legal predicate tuple, then maps the tuple to RDTII |
| Authority handling | Jurisdiction-specific authority graph with binding status, consolidation, repeal, commencement, amendment, and translation handling |
| Verification | Cite-Verify-Reject plus authority, currentness, counter-evidence, and tuple checks |
| Accuracy | Per-stage measured metrics with confidence intervals |
| Evaluation | Adversarial benchmark: positives, negatives, guidelines, repealed laws, amendments, OCR noise, unofficial translations |
| Demo strategy | Narrow proof first, then scalable architecture |
| Human review | Reviewer validates legal tuple fields, source status, conflicts, and uncertainty |

### 2.2 Design Principle

Every output must answer six questions:

1. **What is the claim?** The RDTII indicator and structured legal predicate.
2. **Where is the evidence?** Exact span, section, page, bbox, URL, hash.
3. **Is the source authoritative?** Binding status and source hierarchy.
4. **Is the text current?** Repeal, amendment, consolidation, and commencement status.
5. **Does the evidence entail the claim?** Predicate-level verification, not only NLI.
6. **What could contradict it?** Counter-evidence search over amendments, exceptions, guidelines, and related provisions.

---

## 3. Product Positioning

### 3.1 Project Title

**ClauseChain - Measured Legal Evidence for Digital Trade**

Alternate tagline for application/video:

> Every claim has a source. Every source has status. Every status is reviewable.

### 3.2 Short Proposal Summary

ClauseChain is an open-source AI system for mapping digital trade regulations to RDTII Pillars 6 and 7 with reviewable, evidence-based outputs. It discovers legal materials from official sources, extracts text from HTML, native PDFs, and scanned documents, reconstructs legal structure, and maps clauses to cross-border data and domestic data protection indicators.

Its distinguishing feature is not only citation verification. ClauseChain verifies the whole legal evidence chain: source authority, current-law status, document structure, exact quoted span, legal predicate meaning, and counter-evidence. The model is not allowed to produce free-form legal conclusions. It fills constrained schemas, extracts actor-action-object-condition tuples, and maps those tuples to RDTII indicators only after verification gates pass. If the system cannot prove a claim, it abstains or routes it to human review.

The demo focuses on Bangladesh, Thailand, and Singapore, covering English, Bengali, and Thai; official HTML; native PDFs; scanned amendments; and non-binding guidelines. ClauseChain ships with a reproducible benchmark pack: labeled clauses, negative examples, OCR stress cases, evaluation scripts, and per-stage accuracy metrics. The codebase is Apache 2.0, self-hostable, and model-provider agnostic.

### 3.3 Problem Understanding

Regulatory mapping for digital trade is still largely manual. Analysts must locate statutes, amendments, regulations, official gazettes, regulator guidance, and translations; determine which sources are binding and current; identify relevant clauses; interpret rule-and-exception structures; and map the result to a framework such as RDTII. This is slow, expensive, difficult to reproduce, and especially hard in jurisdictions where key documents are scanned, multilingual, amended frequently, or scattered across government portals.

AI can accelerate the work, but generic RAG is not enough. A system can quote the right words from the wrong source, quote a repealed provision, miss an exception, misread a guideline as binding law, or classify a data retention rule as a cross-border transfer restriction. In legal and policy analysis, these errors matter.

ClauseChain's objective is to automate the evidence compilation workflow while preserving legal reviewability. It increases analyst capacity by collecting candidate sources, extracting structured legal text, identifying likely RDTII evidence, and producing machine-readable outputs. It reduces risk by measuring each stage, abstaining under uncertainty, and exposing every claim to human audit with source status and counter-evidence visible.

---

## 4. Scope and Demo Strategy

### 4.1 Mandatory Scope

ClauseChain focuses on the two mandatory policy areas:

- **RDTII Pillar 6 - Cross-Border Data Policies:** cross-border transfer restrictions, data localization, domestic processing/storage requirements, adequacy/comparability conditions, regulator approval, conditional transfer pathways.
- **RDTII Pillar 7 - Domestic Data Protection and Privacy:** personal data protection frameworks, lawful basis, purpose limitation, data subject rights, retention limits, breach notification, compliance obligations, regulator powers, government access safeguards.

### 4.2 Proof Ladder

The system should not try to prove everything at once. It should prove capability in layers:

| Proof level | Purpose | Demo target |
|---|---|---|
| Level 1: Clean end-to-end | Show full workflow with low extraction risk | Singapore official HTML PDPA/cyber/data source |
| Level 2: Legal complexity | Show rule/exception, amendments, current-law status | Thailand PDPA and related instruments |
| Level 3: Technical stress | Show OCR, Bengali/English mix, scanned or less-curated sources | Bangladesh data/cyber/telecom instruments |
| Level 4: Benchmark | Show scientific credibility | Reproducible labeled dataset and eval script |

### 4.3 Target Jurisdictions

| Jurisdiction | Role in demo | Source types | Notes |
|---|---|---|---|
| Singapore | Clean benchmark and full end-to-end flow | Official HTML, official PDF, regulator guidance | Strong for demonstrating exact structure and citations |
| Thailand | Host-country relevance and bilingual legal text | Official gazette PDFs, regulator pages, Thai/English materials | Strong for multilingual and rule/exception logic |
| Bangladesh | Hard technical stress case and regional relevance | HTML laws, PDFs, scanned materials, draft/current-status challenges | Strong for OCR, source status, and developing-economy relevance |

### 4.4 In Scope

- Automated and assisted discovery of official legal sources.
- Source authority and legal-status classification.
- Extraction from HTML, native PDF, scanned PDF, and DOCX where available.
- Legal structure parsing: act, part, chapter, section, subsection, paragraph, proviso, explanation, schedule.
- Rule-unit construction, preserving principal rule, exception, condition, definition, and cross-reference.
- RDTII Pillar 6 and 7 mapping.
- Verifiable citations with source hash, URL, section, page, char offsets, and bbox where available.
- Counter-evidence search for amendments, repeals, exceptions, conflicting current text, and non-binding guidance.
- Human review and export.
- Reproducible benchmark and evaluation scripts.

### 4.5 Out of Scope

- Providing legal advice.
- Replacing qualified legal review.
- Guaranteeing exhaustive global coverage at application stage.
- Bypassing paywalls, CAPTCHA, login barriers, or robots restrictions.
- Treating unofficial translations as binding unless jurisdiction metadata says otherwise.
- Claiming model weights are Apache 2.0 when they have separate licenses.

---

## 5. Users and Jobs To Be Done

### 5.1 Personas

**Regulatory analyst.** Needs a defensible RDTII evidence dataset for a jurisdiction. Values recall, traceability, and speed.

**Legal reviewer.** Needs to verify whether a clause is binding, current, interpreted correctly, and mapped to the correct indicator.

**Hackathon evaluator or auditor.** Needs to test whether the system is real, reproducible, and not just a demo script.

**Government or institutional operator.** Needs local deployment, model-provider flexibility, audit logs, and data-residency control.

### 5.2 Core User Stories

- As an analyst, I can enter a jurisdiction and official seed sources, then receive candidate legal instruments ranked by authority and relevance.
- As a reviewer, I can inspect a proposed mapping beside the original document, with the exact span highlighted and source status visible.
- As an evaluator, I can run the benchmark script and reproduce reported metrics.
- As an operator, I can configure local-only models and verify that no document is sent to a cloud provider unless explicitly enabled.

---

## 6. System Architecture

### 6.1 Architecture Overview

ClauseChain is a staged pipeline. Each stage emits a typed artifact and a measurable quality signal.

```text
[0] Jurisdiction Pack
    authority hierarchy, seed sources, citation patterns, language config, RDTII rubric
        |
        v
[1] Discovery
    crawl/search official sources, retrieve candidate documents
        |
        v
[2] Source Acquisition and Provenance
    save raw bytes, hash, timestamp, headers, rendered pages
        |
        v
[3] Authority and Current-Law Resolver
    binding status, draft/repealed/current, amendment graph, translation status
        |
        v
[4] Extraction and Layout
    HTML/PDF/OCR pipelines, text + bbox + confidence + page images
        |
        v
[5] Legal Structure and Rule Units
    section tree, definitions, principal rules, exceptions, conditions, cross-references
        |
        v
[6] Indexing and Retrieval
    sparse + dense search, query expansion, reranking, recall measurement
        |
        v
[7] Legal Predicate Extraction
    actor/action/object/modality/condition/exception/source-status tuple
        |
        v
[8] RDTII Mapping
    deterministic rubric checks + constrained model classification
        |
        v
[9] Verification Gates
    span, authority, currentness, tuple entailment, counter-evidence, structural checks
        |
        v
[10] Human Audit, Benchmark, Export
    review UI, corrections, metrics, JSON/CSV/provenance bundle
```

### 6.2 Component Responsibilities

| Component | Responsibility | Primary artifacts |
|---|---|---|
| Jurisdiction Pack Manager | Stores official domains, authority hierarchy, citation rules, language settings, rubric bindings | `jurisdiction.yaml`, authority graph |
| Discovery Service | Crawls and finds candidate documents | `discovery_candidate` records |
| Acquisition Service | Downloads raw files and captures immutable provenance | source bytes, SHA-256, retrieval log |
| Authority Resolver | Determines binding/current status and document relationships | source status graph |
| Extraction Service | Converts source into text, layout, images, and confidence spans | extracted pages, OCR tokens, layout blocks |
| Legal Parser | Converts text/layout to legal tree | `legal_node` tree |
| Rule Unit Builder | Combines principal rules, exceptions, provisos, definitions, and cross-references | `rule_unit` records |
| Retrieval Service | Finds candidate rule units per RDTII criterion | retrieval candidates + scores |
| Predicate Extractor | Extracts structured legal meaning | legal predicate tuple |
| RDTII Mapper | Maps predicate tuple to Pillar 6/7 criteria | mapping candidate |
| Verification Service | Applies hard gates and abstention logic | verification report |
| Review UI | Lets humans approve/correct/reject with evidence visible | review decision |
| Benchmark Runner | Computes per-stage and end-to-end metrics | metrics report |
| Export Service | Produces JSONL, CSV matrix, and provenance bundle | export package |

### 6.3 Deployment Architecture

Default deployment is self-hosted:

- **Backend API:** FastAPI service layer, with Django integration possible if the existing product backend remains the host application.
- **Worker layer:** Celery/RQ or Prefect workers for crawl, extraction, OCR, indexing, classification, verification, and export jobs.
- **Metadata DB:** Postgres with pgvector available for lightweight local vector search.
- **Search layer:** OpenSearch for BM25/hybrid keyword search, paired with Qdrant or pgvector for dense vector retrieval.
- **Object storage:** MinIO or local S3-compatible storage.
- **Model serving:** vLLM or llama.cpp-compatible local endpoint.
- **Frontend:** React/Next.js audit UI with PDF.js overlay.
- **Benchmark CLI:** Python package with deterministic eval scripts.
- **Packaging:** Docker Compose for prototype; Kubernetes Helm chart optional later.

### 6.4 Model and Tool Stack

| Task | Default | Fallback / enhancement | Accuracy rationale |
|---|---|---|---|
| Crawling | Scrapy + Playwright + Crawl4AI | httpx/manual upload fallback | Scrapy gives breadth, Playwright handles dynamic portals, Crawl4AI produces AI-ready captures |
| HTML extraction | Trafilatura + custom legal DOM parser | Readability/lxml or site-specific adapters | Official HTML is often highest-fidelity source; DOM paths preserve section anchors |
| PDF extraction | Docling + PyMuPDF/pdfplumber | Per-site PDF adapters | Preserves page/section layout, tables, reading order, and coordinates |
| OCR text + bbox | PaddleOCR-VL/PaddleOCR or Surya-style coordinate OCR | Tesseract/OCRmyPDF fallback; Qwen-VL repair for low-confidence regions | Coordinate-native OCR anchors citations; VLMs improve hard regions without becoming the sole location source |
| Embeddings | Qwen3-Embedding high-accuracy mode; BGE-M3 proven baseline | Smaller embedding model for low-cost mode; domain tuning later | Multilingual retrieval must work across English, Thai, Bengali/Bangla, and other jurisdictions |
| Sparse/hybrid search | OpenSearch BM25 + dense vectors in Qdrant/pgvector | Postgres-only mode for simple deployments | Legal terms need exact-match retrieval and source/status filters |
| Reranking | Qwen3-Reranker or BGE-reranker-v2-m3 | Smaller reranker or LLM reranker for hard cases | Cross-encoder reranking is one of the highest-ROI retrieval accuracy steps |
| Classifier | Qwen/Llama-family local model via constrained schema | Ensemble or cloud adapter for low-confidence cases | Local-first, provider-swappable, evidence-only classification |
| Entailment / verifier | Tuple verifier + multilingual NLI | LLM judge with strict evidence schema | General NLI alone is weak on legal text; tuple support is easier to audit |
| Pipeline framework | FastAPI services + explicit DAG workers | Haystack/LangGraph adapters where useful | Keeps components testable and swappable |
| Schema enforcement | Pydantic + JSON schema / Outlines | Instructor-style validators | Prevents free-form unsupported claims |

Important license note: ClauseChain code is Apache 2.0. Model weights and third-party tools retain their own licenses and are listed in a `MODEL_LICENSES.md` file.

### 6.5 Repository and Runtime Skeleton

The prototype should expose enough structure that judges can see it is buildable, not only conceptual:

```text
clausechain/
  apps/
    api/                 # FastAPI endpoints
    web/                 # Next.js audit UI
    worker/              # crawl/extract/index/classify jobs
  packages/
    core/                # schemas, evidence ledger, policy logic
    connectors/          # jurisdiction crawlers and source profiles
    extractors/          # HTML/PDF/OCR adapters
    retrieval/           # hybrid search, embeddings, reranking
    rdtii/               # rubric configs and mapping logic
    verifier/            # citation, authority, tuple, and conflict checks
  configs/
    jurisdictions/       # sg.yaml, th.yaml, bd.yaml
    rdtii/               # pillar_6.yaml, pillar_7.yaml
  tests/
    fixtures/
    golden/
    regression/
  docs/
    architecture.md
    reviewer_guide.md
    model_licenses.md
  docker-compose.yml
```

Docker Compose services:

| Service | Purpose |
|---|---|
| `api` | Backend API and project orchestration |
| `web` | Audit UI |
| `worker` | Long-running crawl, OCR, index, classify, verify jobs |
| `postgres` | Metadata, ledger, pgvector local mode |
| `opensearch` | BM25/hybrid search |
| `qdrant` | Dense vector search, if not using pgvector |
| `minio` | Raw source files, rendered pages, exports |
| `redis` | Queue/cache |
| `vllm` | Local model serving |

### 6.6 API Surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/projects` | POST | Create an analysis project |
| `/projects/{id}/crawl` | POST | Start discovery for a jurisdiction/pillar set |
| `/documents/{id}` | GET | Fetch document metadata, authority status, and extraction state |
| `/documents/{id}/render?page=n` | GET | Render original PDF/image page for audit |
| `/evidence/search` | POST | Retrieve candidate rule units for a rubric criterion |
| `/claims/classify` | POST | Produce predicate tuple and RDTII mapping candidates |
| `/claims/{id}/verify` | POST | Run verification gates |
| `/reviews/{claim_id}` | POST | Record human review decision |
| `/exports/{project_id}` | GET | Download JSONL/CSV/provenance bundle |

---

## 7. Jurisdiction Packs

### 7.1 Purpose

Most legal accuracy comes from jurisdiction-specific metadata that generic models do not know reliably. ClauseChain therefore requires a jurisdiction pack for every supported country.

### 7.2 Jurisdiction Pack Schema

```yaml
jurisdiction: SG
name: Singapore
languages:
  primary: en
  supported: [en]
official_sources:
  - name: Singapore Statutes Online
    domain: sso.agc.gov.sg
    source_type: official_statute_database
    authority_rank: 100
  - name: Personal Data Protection Commission
    domain: pdpc.gov.sg
    source_type: regulator_guidance
    authority_rank: 60
authority_hierarchy:
  primary_legislation: 100
  subsidiary_legislation: 90
  regulator_decision: 75
  binding_code: 70
  guideline: 40
  consultation_draft: 10
status_markers:
  repealed: ["repealed", "revoked", "no longer in force"]
  draft: ["draft", "consultation", "bill"]
  consolidated: ["revised edition", "current version"]
citation_patterns:
  section: ["section {number}", "s. {number}"]
  article: ["Article {number}"]
rdtii_bindings:
  pillars: [6, 7]
```

### 7.3 Accuracy Benefit

Jurisdiction packs reduce model guessing. They make official-source detection, authority ranking, citation parsing, and current-law checks deterministic wherever possible.

### 7.4 Default Source Authority Hierarchy

The hierarchy is configurable per jurisdiction, but the default ordering is:

| Rank | Source type | Normal use |
|---:|---|---|
| 1 | Constitution or primary statute | Binding legal standard where relevant |
| 2 | Official gazette version of act/regulation/amendment | Binding source and amendment history |
| 3 | Official consolidated legislation portal | Preferred current-law citation where reliable |
| 4 | Binding subsidiary legislation, rules, orders, codes | Binding rule where enabled by statute |
| 5 | Official regulator decisions or binding determinations | Binding or quasi-binding authority depending on jurisdiction |
| 6 | Official ministry/regulator guidelines | Context unless expressly binding |
| 7 | Official explanatory notes, FAQs, consultation papers | Context or leads only |
| 8 | Unofficial translations or private legal databases | Reviewer aid or lead only |
| 9 | Law firm notes, blogs, news, commentary | Discovery lead only |

Only ranks 1-5 normally determine the final legal standard. Ranks 6-9 can appear in the audit view as context, but cannot override binding text.

### 7.5 Conflict Resolution Rules

| Conflict | Default handling |
|---|---|
| Law vs guideline | Law controls; guideline is tagged non-binding context |
| Consolidated law vs older amendment | Prefer consolidated current text if the amendment is incorporated; cite both and route to review if unclear |
| Official original vs unofficial translation | Original official language controls; translation is non-authoritative reviewer aid |
| General prohibition vs exception in same rule unit | Read together as a qualified or conditional standard |
| Later same-rank rule vs older same-rank rule | Later effective rule controls only if in force and not repealed |
| Two official current sources disagree | Cite both, flag conflict, require human review |
| Draft/bill vs current law | Draft is marked non-current and cannot support current-law output |

---

## 8. Pipeline Requirements and Accuracy Controls

### 8.1 Stage 1 - Discovery

**Goal:** Find likely relevant legal materials from official sources without treating every retrieved document as authoritative.

Functional requirements:

- Accept seed URLs, sitemap URLs, gazette indexes, statute database search pages, and manual uploads.
- Crawl politely with robots awareness, rate limiting, and visible user-agent.
- Identify candidate documents using keyword, semantic, and link-context signals.
- Tag document candidates as law, regulation, amendment, guideline, draft, ruling, consultation paper, translation, or other.
- Never bypass CAPTCHA, login gates, robots restrictions, or access controls.

Accuracy controls:

- Two-pass discovery: broad retrieval followed by strict authority/relevance filter.
- Recall@k measurement: whether known target instruments appear in top 5, 10, 20 candidates.
- False-positive review: how many retrieved documents are not legal or not relevant.

Stage metrics:

- Discovery recall@20.
- Official-source precision.
- Document-type classification accuracy.
- Manual fallback rate.

### 8.2 Stage 2 - Source Acquisition and Provenance

**Goal:** Preserve the original source so citations can be independently re-verified.

Functional requirements:

- Store raw source bytes exactly as downloaded.
- Compute SHA-256 hash over raw source bytes.
- Capture URL, retrieval timestamp, HTTP headers, MIME type, file size, redirect chain, and content-language if available.
- Render PDFs to page images for visual audit.
- Keep extracted text separate from raw source.

Accuracy controls:

- MIME sniffing instead of trusting file extension.
- Duplicate detection by hash and near-duplicate text fingerprint.
- Source snapshot export in provenance bundle.

Stage metrics:

- Reproducible retrieval rate.
- Hash verification success rate.
- Duplicate clustering precision.

### 8.3 Stage 3 - Authority and Current-Law Resolver

**Goal:** Prevent correct quotes from wrong or outdated sources.

Functional requirements:

- Classify each source as binding, non-binding, draft, repealed, superseded, consolidated, amendment, unofficial translation, or unknown.
- Build a relationship graph between original acts, amendments, regulations, guidelines, translations, and consolidated versions.
- Detect effective dates, commencement dates, publication dates, repeal markers, and amendment targets where available.
- Prefer current consolidated official text when available.
- Cite amendments when the legal question requires amendment history; otherwise cite current operative text.
- Treat guidelines as explanatory context unless configured as binding or quasi-binding.

Accuracy controls:

- Deterministic authority hierarchy from jurisdiction pack.
- Counter-search for "repealed", "amended by", "commencement", "in force", and equivalent local-language markers.
- Human review for unknown status.

Stage metrics:

- Authority classification accuracy.
- Current-law-status accuracy.
- Amendment-target extraction F1.
- Unofficial translation detection precision.

### 8.4 Stage 4 - Extraction, OCR, and Layout

**Goal:** Extract text and location while preserving confidence and layout.

Functional requirements:

- Route documents by true file type: HTML, native PDF, scanned PDF, image, DOCX.
- Use text-layer extraction for born-digital PDFs when reliable.
- Use OCR only where text layer is missing or corrupt.
- Produce token-level text, page number, bbox, OCR engine, and confidence.
- Use coordinate-native OCR for bounding boxes.
- Use VLMs for hard-region repair, not as the sole coordinate authority.
- Preserve tables, footnotes, headings, schedules, and marginal notes where relevant.

Accuracy controls:

- OCR ensemble only on low-confidence or high-value regions.
- Token alignment across OCR engines.
- Confidence-aware routing: expensive VLM pass only on disagreement regions.
- Human review queue for low-confidence cited spans.

Stage metrics:

- Character error rate (CER).
- Word error rate (WER).
- Bbox intersection-over-union on sampled pages.
- Low-confidence token rate.
- OCR disagreement rate.

### 8.5 Stage 5 - Legal Structure and Rule Units

**Goal:** Avoid corrupting legal meaning through bad chunking.

Functional requirements:

- Parse legal hierarchy: act, part, chapter, section/article, subsection, paragraph, subparagraph, proviso, explanation, schedule.
- Identify definitions and link defined terms to usage.
- Detect discourse roles: principal rule, exception, condition, proviso, explanation, definition, penalty, enforcement power, recital.
- Build **rule units** that keep a principal rule and its exceptions/conditions together.
- Preserve parent context for every child node.
- Store cross-references and amendment references.

Accuracy controls:

- Deterministic legal pattern parsing before ML fallback.
- Language-specific section markers in jurisdiction packs.
- Rule-unit tests for "except", "unless", "provided that", "subject to", "notwithstanding", and local-language equivalents.

Stage metrics:

- Section-boundary F1.
- Rule-unit completeness score.
- Definition-linking accuracy.
- Exception/condition detection F1.

### 8.6 Stage 6 - Retrieval

**Goal:** Retrieve the correct rule units before classification.

Functional requirements:

- Use hybrid retrieval: sparse exact-match + multilingual dense embeddings.
- Expand RDTII queries using rubric terms, synonyms, and jurisdiction-specific terms.
- Retrieve at rule-unit level, not arbitrary token windows.
- Rerank top-k candidates with a multilingual cross-encoder.
- Include relevant definitions and parent context in classifier prompt.

Accuracy controls:

- Recall-first top-k retrieval before precision reranking.
- Hard-negative examples in benchmark.
- Counter-retrieval for related exceptions, amendments, and definitions.

Stage metrics:

- Retrieval recall@5, recall@10, recall@20.
- Reranker precision@5.
- Missed-evidence false-negative rate.

### 8.7 Stage 7 - Legal Predicate Extraction

**Goal:** Convert legal text into structured meaning before mapping to RDTII.

The core intermediate artifact is the legal predicate tuple:

```json
{
  "actor": "organisation",
  "action": "transfer",
  "object": "personal data",
  "destination": "outside the jurisdiction",
  "modality": "prohibited_by_default",
  "condition": "comparable protection requirements must be satisfied",
  "exception": "transfer permitted if statutory requirements are met",
  "legal_role": "principal_rule_with_exception",
  "source_status": "binding_current",
  "evidence_span_ids": ["span_001", "span_002"]
}
```

Functional requirements:

- Extract actor, action, object, destination, modality, condition, exception, trigger, and authority status.
- Support multi-label and composite rules.
- Abstain when tuple fields cannot be grounded in evidence.
- Link each tuple field to one or more spans.

Accuracy controls:

- Predicate-by-predicate validation instead of one-shot "which pillar?" classification.
- Constrained JSON schema.
- Field-level confidence.
- Ensemble or second-pass review only for low-confidence or high-impact clauses.

Stage metrics:

- Tuple field accuracy.
- Modality accuracy.
- Condition/exception extraction F1.
- Abstention calibration.

### 8.8 Stage 8 - RDTII Mapping

**Goal:** Map verified legal predicates to RDTII indicators.

Functional requirements:

- Encode RDTII Pillars 6 and 7 as YAML rubrics with:
  - indicator ID
  - definition
  - required predicates
  - exclusion rules
  - positive examples
  - negative examples
  - required evidence fields
- Run deterministic predicate checks before LLM classification.
- Ask the model to check each criterion's predicates, not to free-form classify.
- Allow multiple indicators where a clause legitimately covers multiple obligations.
- Output `not_applicable` where evidence is insufficient.

Example rubric fragment:

```yaml
schema_version: rdtii-2.1-hackathon
pillars:
  P6:
    name: Cross-Border Data Policies
    indicators:
      transfer_restriction:
        description: Rules restricting or conditioning cross-border transfer of data
        required_predicates:
          action: [transfer, disclose, make_available]
          destination: [outside_jurisdiction, foreign_country, cross_border]
          modality: [prohibited_by_default, conditional_permission, approval_required, adequacy_required]
        positive_cues:
          - transfer personal data outside
          - country or territory outside
          - adequate protection
          - comparable protection
          - data localization
        exclusions:
          - domestic retention period without cross-border destination
          - cybersecurity incident reporting without data-transfer rule
        required_evidence: [binding_text, exact_span, source_status]
  P7:
    name: Domestic Data Protection and Privacy
    indicators:
      data_protection_framework:
        required_predicates:
          object: [personal_data, sensitive_personal_data]
          action: [collect, process, store, retain, disclose, protect]
        required_evidence: [binding_text, exact_span, source_status]
```

Accuracy controls:

- Rubric-as-code with tests.
- Negative examples for retention vs transfer, security vs privacy, guideline vs law, and domestic processing vs cross-border transfer.
- Human review for near-threshold scores.

Stage metrics:

- Macro-F1 per indicator.
- Pillar-level F1.
- False-positive rate on negative clauses.
- False-negative rate on known relevant clauses.

### 8.9 Stage 9 - Verification Gates

**Goal:** Block unsupported, outdated, or legally weak claims before output.

Verification consists of eight gates:

| Gate | Question | Failure behavior |
|---|---|---|
| G1 Span | Does the exact span exist in the source/extraction? | Reject |
| G2 Location | Does the section/page/bbox point to the cited span? | Reject or route to review |
| G3 Authority | Is the source authoritative for this claim? | Reject or mark non-binding context |
| G4 Currentness | Is the source current or correctly linked to current text? | Reject or route to review |
| G5 Structure | Is the cited node the correct legal unit and role? | Reject or route to review |
| G6 Tuple | Does the evidence support the extracted predicate tuple? | Reject or route to review |
| G7 RDTII | Do the tuple predicates satisfy the rubric criterion? | Reject or route to review |
| G8 Counter-evidence | Did search find repeal, amendment, exception, or conflict that changes the claim? | Route to human review |

The Cite-Verify-Reject principle remains embedded inside these gates:

- Cite: exact span and source.
- Verify: span, structure, authority, tuple, and RDTII entailment.
- Reject: unsupported outputs do not ship.

### 8.10 Stage 10 - Human Audit, Learning, and Export

**Goal:** Make review fast and transform corrections into measurable improvement.

Functional requirements:

- Show source document and extracted text side by side.
- Highlight exact span on original source where bbox is available.
- Show source status: binding/current/draft/repealed/guideline/translation.
- Show legal predicate tuple field by field.
- Show RDTII mapping and rubric predicates.
- Show counter-evidence results.
- Allow reviewer to approve, edit, reject, or mark uncertain.
- Store review decisions with reviewer ID, timestamp, and reason.
- Feed corrected examples into benchmark/evaluation set after approval.

Stage metrics:

- Human minutes per verified mapping.
- Reviewer agreement.
- Correction rate by pipeline stage.
- Review queue precision.

---

## 9. Data Model

### 9.1 Source Document

```json
{
  "source_id": "SG-SSO-PDPA-2012-CURRENT",
  "jurisdiction": "SG",
  "url": "https://sso.agc.gov.sg/Act/PDPA2012",
  "retrieved_at": "2026-05-24T10:30:00+06:00",
  "raw_sha256": "abc123...",
  "mime_type": "text/html",
  "language": "en",
  "source_type": "official_statute_database",
  "authority_status": "binding_current",
  "authority_rank": 100,
  "legal_status": {
    "binding": true,
    "current": true,
    "draft": false,
    "repealed": false,
    "consolidated": true,
    "translation_status": "original"
  }
}
```

### 9.2 Legal Node

```json
{
  "node_id": "SG-PDPA-s26-1",
  "source_id": "SG-SSO-PDPA-2012-CURRENT",
  "type": "subsection",
  "label": "26(1)",
  "title": "Transfer of personal data outside Singapore",
  "text": "An organisation shall not transfer any personal data...",
  "parent_id": "SG-PDPA-s26",
  "children": [],
  "page": null,
  "char_offset": [10234, 10680],
  "bbox": null,
  "role": "principal_rule_with_exception",
  "confidence": 0.98
}
```

### 9.3 Rule Unit

```json
{
  "rule_unit_id": "SG-PDPA-s26-unit-1",
  "source_id": "SG-SSO-PDPA-2012-CURRENT",
  "principal_rule_node": "SG-PDPA-s26-1",
  "exception_nodes": ["SG-PDPA-s26-1-except"],
  "condition_nodes": ["SG-PDPA-s26-2"],
  "definition_nodes": ["SG-PDPA-def-organisation", "SG-PDPA-def-personal-data"],
  "composite_text": "An organisation shall not transfer... except...",
  "legal_roles": ["principal_rule", "exception", "condition"]
}
```

### 9.4 Evidence Mapping Record

```json
{
  "record_id": "SG-PDPA-s26-P6-transfer-001",
  "jurisdiction": "SG",
  "pillar": 6,
  "indicator": "6.x",
  "indicator_name": "Conditional cross-border personal data transfer regime",
  "legal_predicate": {
    "actor": "organisation",
    "action": "transfer",
    "object": "personal data",
    "destination": "outside Singapore",
    "modality": "prohibited_by_default",
    "condition": "requirements ensure comparable protection",
    "exception": "permitted if statutory requirements are satisfied"
  },
  "evidence": [
    {
      "span_id": "span_001",
      "text": "An organisation shall not transfer any personal data to a country or territory outside Singapore...",
      "source_id": "SG-SSO-PDPA-2012-CURRENT",
      "section": "26(1)",
      "char_offset": [10234, 10320],
      "page": null,
      "bbox": null,
      "source_url": "https://sso.agc.gov.sg/Act/PDPA2012",
      "source_hash_sha256": "abc123..."
    }
  ],
  "verification": {
    "span": "pass",
    "location": "pass",
    "authority": "pass",
    "currentness": "pass",
    "structure": "pass",
    "tuple": "pass",
    "rdtii": "pass",
    "counter_evidence": "none_found",
    "final_status": "verified"
  },
  "confidence": {
    "retrieval": 0.96,
    "tuple": 0.91,
    "mapping": 0.89,
    "calibrated": 0.86
  },
  "status": "verified",
  "schema_version": "1.0"
}
```

### 9.5 Evidence Ledger Semantics

The Evidence Ledger is an append-only graph over the same database records. It does not replace the relational model; it explains why a claim is allowed to exist.

Core node types:

- `Document`
- `DocumentVersion`
- `LegalNode`
- `RuleUnit`
- `EvidenceSpan`
- `PredicateTuple`
- `RDTIIClaim`
- `VerifierDecision`
- `ReviewDecision`

Core edge types:

| Edge | Meaning |
|---|---|
| `supports` | Evidence span supports a tuple field or RDTII claim |
| `qualifies` | Exception/condition qualifies a principal rule |
| `defines` | Definition node controls a term used in a rule unit |
| `amends` | Document version amends another instrument or provision |
| `supersedes` | Later/current source supersedes older text |
| `conflicts_with` | Two sources or rule units appear inconsistent |
| `non_binding_context_for` | Guideline/explanatory source provides context but not binding authority |
| `requires_review` | Gate failure or uncertainty requires human decision |

Every final export should be reconstructable from this graph: the claim, the evidence spans, the legal structure, the source status, the verification gates, and the reviewer decision.

---

## 10. Legal Interpretation Logic: PDPA Example

### 10.1 Linguistic Conflict

The two phrases create a surface-level conflict if read sentence by sentence. The first says an organization "shall not transfer" personal data outside the jurisdiction. The second says transfer may occur "except" in accordance with requirements that ensure comparable protection. A general contradiction detector may treat this as "transfer prohibited" versus "transfer permitted."

Legally, however, the two phrases form one composite rule. The first phrase states the default rule; the second supplies the conditional pathway. The conflict is not substantive contradiction but rule-and-exception structure.

### 10.2 Precedence and Policy Rationale

The primary regulatory standard is the **composite conditional transfer regime**: transfer is prohibited by default unless the statutory requirements are met. The prohibition is the baseline, but it should not be classified as a total ban because the exception is part of the same operative rule.

The policy rationale is data protection by default with controlled cross-border flow. The legal system protects data subjects by requiring comparable protection before data leaves the jurisdiction, while still allowing trade-enabling transfers under defined safeguards.

### 10.3 How ClauseChain Programs This Decision

ClauseChain handles this through rule-unit construction and predicate extraction:

1. Structural parser identifies the principal prohibition and exception connector.
2. Rule Unit Builder binds the prohibition and exception together.
3. Predicate Extractor outputs `modality = prohibited_by_default` and `condition = comparable_protection_required`.
4. RDTII Mapper classifies the rule as a conditional cross-border transfer regime, not a total localization requirement.
5. Verifier checks that both principal rule and exception are cited from the same legal unit or linked provisions.

---

## 11. Anti-Hallucination and Legal-Correctness Design

### 11.1 What the AI Model Is Allowed To Do

The model may:

- Extract candidate spans from retrieval context.
- Fill constrained JSON schemas.
- Identify legal predicate tuple fields.
- Suggest RDTII indicators from fixed enumerations.
- Assign calibrated confidence.
- Output `not_applicable` or `insufficient_evidence`.
- Explain a decision only after evidence and verification pass.

### 11.2 What the AI Model Is Not Allowed To Do

The model may not:

- Cite documents outside retrieved sources.
- Invent section numbers, URLs, page numbers, or quotations.
- Treat a guideline as binding law unless source metadata supports that status.
- Use training-memory legal knowledge as evidence.
- Collapse rule and exception into a single unstructured conclusion.
- Override authority/currentness gates.
- Emit verified status without all required gate results.

### 11.3 Concrete Failure Case

Failure case: the system retrieves a ministry guideline that paraphrases a cross-border transfer rule and a repealed act containing the original statutory wording. A generic RAG system cites the guideline because it is clearer and classifies the rule as binding current law.

ClauseChain blocks this:

- Authority gate tags guideline as non-binding context.
- Currentness gate detects repealed status on the act.
- Counter-evidence search finds the current consolidated law.
- Final output cites the current binding section only; the guideline appears as supplementary context.
- If the current source cannot be located, the system abstains rather than shipping a binding-law claim.

---

## 12. Evidence and Citation Method

Every claim must link to exact evidence. A citation contains:

- source URL
- raw source SHA-256
- retrieval timestamp
- source status
- jurisdiction authority rank
- instrument title and type
- section/article/paragraph
- page number where applicable
- char offsets
- bbox where available
- extraction confidence
- legal node ID
- rule unit ID
- verification gate results

### 12.1 Citation Rules

- Primary output should cite current binding text where available.
- Amendments are cited when explaining amendment history or where no consolidated current text exists.
- Guidelines are never used as binding evidence unless configured as binding in the jurisdiction pack.
- Unofficial translations may support reviewer comprehension but cannot replace original-language authoritative evidence.
- OCR fuzzy matching is allowed only inside OCR-tagged regions and must log edit distance.

### 12.2 Counter-Evidence Search

Before final output, the system searches the corpus for:

- repeal notices
- amendment acts
- commencement orders
- later consolidated versions
- exception clauses
- definitions that narrow or expand meaning
- official regulator guidance that changes interpretation but not binding text
- unofficial translation mismatch

If counter-evidence is found, the mapping is routed to human review with both evidence sets visible.

### 12.3 Minimum Citation Object

Every exported citation must be machine-verifiable:

```json
{
  "evidence_id": "ev_sg_pdpa_26_1",
  "source_url": "https://sso.agc.gov.sg/Act/PDPA2012",
  "retrieved_at": "2026-05-24T10:30:00+06:00",
  "source_type": "official_legislation_html",
  "jurisdiction": "SG",
  "instrument_title": "Personal Data Protection Act 2012",
  "version_or_effective_date": "current",
  "article_section_paragraph": "section 26(1)",
  "page_number": null,
  "bbox": null,
  "quote": "An organisation shall not transfer any personal data...",
  "quote_char_start": 10234,
  "quote_char_end": 10320,
  "source_sha256": "abc123...",
  "span_sha256": "def456...",
  "ocr_confidence": null,
  "authority_rank": "binding_primary_law",
  "verification_status": "verified"
}
```

Validation rules:

- Quote must appear exactly in extracted source text, unless marked as OCR fuzzy match with edit distance and original image attached.
- Section/page/bbox must resolve in the audit UI.
- Source URL must either be retrievable or preserved in the provenance bundle.
- Unsupported claims are removed before export; if removal changes the legal conclusion, the whole mapping is blocked or sent to review.

### 12.4 Export Formats

| Export | Purpose |
|---|---|
| JSONL evidence package | Automated evaluation and downstream pipelines |
| CSV RDTII matrix | Analyst spreadsheet review |
| Markdown report | GitHub-readable workpaper output |
| HTML/PDF audit report | Human-readable evidence packet with source snippets |
| Provenance bundle | Raw sources, hashes, extracted text, mappings, and verification results |

---

## 13. Benchmark and Evaluation Strategy

### 13.1 Why Benchmarking Is Central

The winning accuracy argument is not "we built a careful architecture." It is "we measured each stage, published the test set, and can reproduce the numbers." ClauseChain treats evaluation as a product feature.

### 13.2 Benchmark Dataset

The benchmark contains:

- Positive Pillar 6 clauses.
- Positive Pillar 7 clauses.
- Negative clauses with lexical overlap but wrong legal meaning.
- Data retention clauses that look like data-transfer clauses.
- Cybersecurity/security clauses that look like privacy clauses.
- Ministry guidelines and non-binding materials.
- Repealed or superseded provisions.
- Amendment and consolidation pairs.
- Unofficial translations.
- OCR-corrupted scanned pages in Thai/Bengali where available.
- Rule-and-exception provisions.

### 13.3 Labels

Each benchmark item includes:

- jurisdiction
- source ID
- source status
- legal node ID
- correct span
- correct legal predicate tuple
- correct RDTII indicator or `not_applicable`
- authority status
- current-law status
- expected counter-evidence, if any
- reviewer notes
- annotator ID

### 13.4 Metrics

| Stage | Metric | Target for prototype |
|---|---|---|
| Discovery | Recall@20 for known instruments | >= 0.90 on seeded jurisdictions |
| Authority | Source authority classification accuracy | >= 0.90 |
| Currentness | Current/repealed/draft/guideline status accuracy | >= 0.85 |
| OCR | CER on sampled pages | Reported; improve iteration over iteration |
| Structure | Section-boundary F1 | >= 0.85 on clean HTML/PDF |
| Rule units | Exception/condition detection F1 | >= 0.75 |
| Retrieval | Recall@20 for evidence spans | >= 0.90 |
| Reranking | Precision@5 | >= 0.75 |
| Tuple extraction | Field-level accuracy | >= 0.80 |
| Classification | Macro-F1 per pillar | >= 0.75 |
| Citation | Exact/fuzzy span verification | >= 0.95 |
| Abstention | Error rate among non-abstained outputs | Lower than no-abstention baseline |
| Human review | Reviewer agreement | Cohen's kappa reported |

### 13.5 Confidence Intervals

Metrics should be reported with confidence intervals where sample size permits. The benchmark runner should use bootstrap intervals for F1 and precision/recall. This makes the proposal look rigorous and prevents overclaiming.

### 13.6 Baselines

ClauseChain should compare against:

1. Naive LLM prompt: classify clause and cite.
2. Standard RAG: retrieve top chunks and classify.
3. ClauseChain without authority/currentness gates.
4. ClauseChain without predicate tuple extraction.
5. Full ClauseChain.

The purpose is to show which architectural pieces actually improve accuracy.

### 13.7 Regression and Failure-Case Tests

The benchmark runner should include targeted tests that represent real legal failure modes:

| Test | Expected behavior |
|---|---|
| Exception lost during chunking | Retrieve the whole rule unit and classify as conditional transfer regime, not absolute ban |
| Guideline treated as law | Binding law controls; guideline appears only as non-binding context |
| OCR flips legal meaning | Low-confidence modal/negation detector blocks or routes to review |
| Outdated amendment selected | Current-law resolver checks effective date and consolidated text before citation |
| Uncited explanation added | Verifier removes unsupported proposition or fails the claim |
| Translation mismatch | Original official-language text controls; translation marked reviewer aid |
| Retention clause misread as transfer clause | Tuple/RDTII gates reject because destination/cross-border predicate is missing |

---

## 14. Human-in-the-Loop UX

### 14.1 Core Screens

For the hackathon, prioritize three screens rather than a broad app surface.

| Screen | Purpose | Must show |
|---|---|---|
| Evidence Audit | Let reviewer validate one mapping | Original source, highlighted span, extracted text, predicate tuple, RDTII mapping, gates |
| Source Status Graph | Show why a source is authoritative/current | Original, amendment, consolidated text, guideline, translation, status |
| Benchmark Dashboard | Prove measured accuracy | Per-stage metrics, failures, confusion matrix, abstention curve |

Additional screens can exist, but these three win the demo.

### 14.2 Evidence Audit Layout

Left pane:

- Original document viewer.
- Highlighted bbox or text location.
- Page and section navigation.
- Source status banner.

Middle pane:

- Extracted legal node.
- Rule unit with principal rule, exception, condition.
- Definitions and cross-references.

Right pane:

- Legal predicate tuple.
- RDTII indicator candidate.
- Verification gates.
- Counter-evidence.
- Approve/edit/reject/uncertain controls.

### 14.3 Reviewer Decisions

Reviewer actions:

- Approve mapping.
- Edit tuple field.
- Change RDTII indicator.
- Mark source status wrong.
- Attach counter-evidence.
- Reject as not applicable.
- Mark as uncertain.

Every decision is logged and can become benchmark data after validation.

### 14.4 UI Trust Badges

Every claim should display compact status badges so a reviewer can scan risk quickly:

| Badge | Meaning |
|---|---|
| `Official binding source` | Source can support a binding-law claim |
| `Official non-binding guideline` | Source may provide context but cannot control the result |
| `Current consolidated text` | Source appears to be current operative text |
| `Draft / not in force` | Source cannot support current-law output |
| `Unofficial translation` | Translation is reviewer aid only |
| `Exact citation verified` | Quote and location passed deterministic verification |
| `OCR verified` | OCR span passed confidence and location checks |
| `Low OCR confidence` | Important words or cited region need review |
| `Conflict detected` | Counter-evidence or source disagreement exists |
| `Human reviewed` | A reviewer has approved or corrected the mapping |

---

## 15. Functional Requirements

### 15.1 Must Have for Application Prototype

- Create jurisdiction packs for SG, TH, and BD with official source domains and authority hierarchy.
- Ingest at least one clean official HTML source end to end.
- Ingest at least one scanned or image-based legal page and produce text plus bbox/confidence.
- Build legal node tree for at least one full instrument.
- Build rule units for provisions containing exceptions/conditions.
- Implement hybrid retrieval plus reranking over rule units.
- Implement legal predicate tuple extraction.
- Implement RDTII mapping for Pillars 6 and 7.
- Implement verification gates G1-G8 at least in prototype form.
- Export JSONL and CSV records.
- Provide benchmark script with at least a small labeled set and metrics.
- Provide audit UI or recorded UI prototype showing span, source status, tuple, gates, and reviewer action.

### 15.2 Should Have for Round 1

- Expand benchmark to at least 200 labeled examples.
- Add current-law graph for all three demo jurisdictions.
- Add multilingual NLI or tuple-verification approach.
- Add counter-evidence search UI.
- Add inter-annotator agreement workflow.
- Add baseline comparison scripts.
- Add Docker Compose local deployment.

### 15.3 Could Have for Finals

- Contributor workflow for adding a new jurisdiction pack.
- Bonus RDTII pillars 8 and 12.
- Public hosted demo with rate limits.
- Full provenance bundle re-verification CLI.
- Jurisdiction comparison matrix with click-through evidence.

---

## 16. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Transparency | Every output includes evidence, source status, gate results, and model versions |
| Reproducibility | Benchmark and provenance bundle can be rerun locally |
| Portability | Core system runs self-hosted with local models |
| Modularity | Crawlers, OCR engines, embedding models, LLMs, and rerankers are swappable |
| Cost control | Expensive models run only on low-confidence or high-value regions |
| Security | SSRF protection for URL ingestion; no credential bypass; safe file handling |
| Privacy | Core documents are public legal texts; local-only mode available |
| Accessibility | Audit UI targets WCAG 2.1 AA |
| Observability | Stage metrics, logs, and failure reasons are visible |
| Determinism | Schema validation, pinned model versions, and fixed eval scripts |

---

## 17. Technical Memo Draft

ClauseChain is a measured legal evidence compiler for mapping digital trade regulation to RDTII Pillars 6 and 7. The system is built around the premise that citation verification alone is not enough: a quoted span may be real but legally wrong if it comes from a repealed act, a non-binding guideline, an unofficial translation, or a clause whose exception changes the rule. ClauseChain therefore verifies not only the quote, but also source authority, current-law status, legal structure, predicate meaning, and counter-evidence.

The architecture is a staged pipeline. A jurisdiction pack defines official sources, authority hierarchy, citation patterns, language settings, and RDTII rubric bindings. Discovery crawls official statute databases, gazettes, regulator sites, and ministry portals using Scrapy/Playwright/Crawl4AI with polite crawling and manual fallback. Acquisition stores raw source bytes, hashes, timestamps, HTTP metadata, and rendered page images. The authority resolver classifies sources as binding, guideline, draft, repealed, consolidated, amendment, or translation, and builds a graph of amendment and current-law relationships.

Extraction routes HTML, native PDF, and scanned PDF through specialized pipelines. Trafilatura and custom DOM parsing handle official HTML; Docling and PyMuPDF handle born-digital PDFs; PaddleOCR/coordinate-native OCR provides text and bounding boxes for scanned pages, with Tesseract/OCRmyPDF as deterministic fallback and vision-language models used only for hard-region repair. The legal parser reconstructs a section tree and builds rule units that keep principal rules, exceptions, conditions, definitions, and cross-references together.

Retrieval uses hybrid sparse and dense search: OpenSearch/BM25 for exact legal terms, Qdrant or pgvector for dense vectors, multilingual embeddings such as Qwen3-Embedding or BGE-M3, and Qwen/BGE rerankers for candidate precision. Instead of asking a model to classify directly, ClauseChain first extracts a structured legal predicate tuple: actor, action, object, destination, modality, condition, exception, and source status. RDTII mapping is then performed by rubric-as-code checks plus constrained model classification through a local Qwen/Llama-family model served by vLLM.

Verification applies eight gates: span match, location, authority, currentness, structure, tuple support, RDTII predicate support, and counter-evidence search. Claims that fail are rejected or routed to human review. The Evidence Ledger records support, qualification, amendment, conflict, and review edges so every final claim can be reconstructed. Outputs include JSONL, CSV matrix records, Markdown/HTML reports, and a provenance bundle.

Accuracy is measured stage by stage: discovery recall@k, authority precision, OCR error rate, section-boundary F1, retrieval recall@20, tuple accuracy, macro-F1, citation accuracy, current-law-status accuracy, and abstention calibration. A reproducible benchmark pack with positive, negative, OCR, amendment, guideline, and repealed-law examples is included so reviewers can verify the system's claims.

---

## 18. Roadmap

### 18.1 Application Prototype

Goal: prove the architecture with a narrow working path and measured evidence.

Deliverables:

- Product requirements document.
- Jurisdiction packs for SG/TH/BD.
- One complete end-to-end flow on an official clean source.
- One scanned-page OCR stress test.
- Small adversarial benchmark.
- JSONL/CSV export sample.
- Evidence audit UI or video prototype.
- Technical memo and concept video.

### 18.2 Round 1

Goal: expand from proof to robust prototype.

Deliverables:

- At least 200 labeled benchmark examples.
- All three jurisdictions working through core pipeline.
- Source status graph and current-law resolver.
- Counter-evidence UI.
- Baseline comparisons.
- Inter-annotator agreement.
- Docker Compose deployment.

### 18.3 Finals

Goal: demonstrate production readiness and public-good sustainability.

Deliverables:

- Public demo or packaged local demo.
- Complete provenance verification CLI.
- Contributor docs for jurisdiction packs and rubrics.
- Bonus pillar extension.
- Measured accuracy report.
- Apache 2.0 repository with model-license documentation.

---

## 19. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Broad architecture outpaces implementation | High | Narrow demo path: one clean end-to-end source plus stress tests |
| OCR quality poor on Bengali/Thai scans | High | Measure CER; use confidence-aware VLM repair; cite only high-confidence spans |
| Current-law resolver incomplete | High | Start with explicit source-status tags and human review for unknowns |
| General NLI unreliable for legal text | Medium | Use predicate tuple verification and abstention; treat NLI as supporting signal |
| Gold set too small to prove accuracy | High | Build adversarial benchmark early, report confidence intervals honestly |
| Model licenses conflict with Apache claim | Medium | Apache code only; document model licenses separately |
| Crawler blocked by official source | Medium | Manual upload fallback; log blocked source as retrieval issue |
| RDTII rubric unavailable or changes | Medium | Rubric-as-code abstraction; update YAML without changing pipeline |
| Review UI too broad | Medium | Build three high-value screens first |

---

## 20. Acceptance Criteria

ClauseChain is application-ready when:

- A reviewer can inspect at least one RDTII mapping from source discovery to export.
- The mapping includes exact span, source URL, hash, source status, legal node, rule unit, predicate tuple, RDTII indicator, gate results, and final decision.
- The system abstains on at least one intentionally ambiguous or non-binding example.
- The benchmark script runs locally and reports per-stage metrics.
- The technical memo clearly states what is measured, what is not yet solved, and how the architecture scales.

ClauseChain is Round-1-ready when:

- All three jurisdictions have jurisdiction packs and at least one working legal source.
- The benchmark contains at least 200 labeled examples with negatives and status-conflict cases.
- Current-law status and authority handling are visible in the UI.
- Human review corrections are logged and can update benchmark data.
- Outputs can be re-verified from the provenance bundle.

---

## Appendix A - Application Form Crosswalk

| Application field | PRD section |
|---|---|
| Project title | Section 3.1 |
| Short proposal summary | Section 3.2 |
| Problem understanding and objectives | Section 3.3 |
| Policy area | Section 4.1 |
| Q1 linguistic conflict | Section 10.1 |
| Q1 precedence and rationale | Section 10.2 |
| Q1 programming the AI | Section 10.3 |
| Q2 end-to-end workflow | Section 6 and Section 8 |
| Q3 data sources and scope | Section 4.2 and 4.3 |
| Q4 evidence and citation | Section 12 |
| Q5 authoritative source scenario | Sections 8.3, 8.9, and 12.2 |
| Q6 anti-hallucination design | Section 11 |
| Technical memo | Section 17 |

## Appendix B - Glossary

| Term | Meaning |
|---|---|
| Legal predicate tuple | Structured representation of legal meaning: actor, action, object, modality, condition, exception, etc. |
| Rule unit | A legally coherent unit combining principal rule, exceptions, conditions, definitions, and cross-references |
| Authority resolver | Component that determines whether a source is binding, current, draft, repealed, guideline, translation, or unknown |
| Counter-evidence | Evidence that may alter or defeat a proposed mapping, such as repeal, amendment, exception, or non-binding source status |
| Abstention calibration | Measuring whether the system refuses uncertain outputs at the right threshold |
| Provenance bundle | Export containing source files, hashes, mapping records, and verification data for independent re-checking |

## Appendix C - Technology References

These references are implementation aids, not mandatory dependencies:

- RDTII 2.1 Guide: https://www.unescap.org/kp/2025/regional-digital-trade-integration-index-rdtii-21-guide
- Crawl4AI: https://github.com/unclecode/crawl4ai
- Trafilatura: https://github.com/adbar/trafilatura
- Docling: https://github.com/docling-project/docling
- PaddleOCR: https://github.com/PaddlePaddle/PaddleOCR
- Tesseract: https://tesseract-ocr.github.io/
- Qwen3.6: https://github.com/QwenLM/Qwen3.6
- Qwen3 Embedding and Reranker: https://github.com/QwenLM/Qwen3-Embedding
- BGE-M3: https://huggingface.co/BAAI/bge-m3
- OpenSearch hybrid search: https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/
- pgvector: https://github.com/pgvector/pgvector
- vLLM: https://github.com/vllm-project/vllm
- PDF.js: https://github.com/mozilla/pdf.js
- Akoma Ntoso: https://www.oasis-open.org/standard/akn-v1-0/
