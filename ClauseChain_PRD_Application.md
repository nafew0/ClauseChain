# Product Requirements Document - ClauseChain

**A Measured Legal Evidence Compiler for Digital Trade Regulation**

| Field | Value |
|---|---|
| Document type | Product Requirements Document |
| Product | ClauseChain |
| Version | 1.0 |
| Status | Round 0 application (shortlisted). **Superseded for Round 1 build by `ClauseChain_Round1_Build_Guide.md` + `ClauseChain_Legal_Matching_DoDont.md` — see Round 1 Addendum below.** |
| Date | 24 May 2026 · Round 1 addendum 7 June 2026 |
| Initiative | UN Global Hackathon: AI for Digital Trade Regulatory Analysis |
| Framework | UN Regional Digital Trade Integration Index (RDTII) v2.1 |
| Mandatory scope | Pillar 6: Cross-Border Data Policies; Pillar 7: Domestic Data Protection and Privacy |
| Bonus scope | One bonus pillar (Pillar 2 Public Procurement **or** Pillar 8 Intermediary Liability) + Zone 3 scoring (0–1) — extra points. *(Note: "cybersecurity" is indicator 7.2, not a separate pillar.)* |
| Demo instruments | **Round 1:** SG PDPA 2012 (rev. 2021) ss. 13, 24, 26(1) + Cybersecurity Act 2018; AU Privacy Act 1988; MY PDPA 2010 (Act 709). *(Thailand/Bangladesh instruments cited later in this doc are illustrative only — see Round 1 Addendum.)* |
| Model routing | Local-first (vLLM + Qwen/Llama family) with optional per-task cloud routing to OpenAI or Anthropic |
| Minimum footprint | 1× L40S 48 GB / 64 GB RAM / 500 GB SSD (local mode) · or CPU-only + cloud APIs (laptop mode) |
| License target | Apache 2.0 codebase; documented third-party model licenses (matrix in §21) |
| Core thesis | Verified citation is necessary but not sufficient. ClauseChain verifies citation, authority, currentness, legal structure, predicate meaning, and counter-evidence before producing an RDTII mapping. |

---

## ⚠️ Round 1 Retargeting Addendum (7 June 2026 — read first)

This PRD is the **Round 0 application** that earned ClauseChain's shortlist; its architecture and thesis stand. But the post-shortlist workshops (1 / 4 / 5 June) corrected several specifics. The **operative Round-1 documents are now `ClauseChain_Round1_Build_Guide.md`** (architecture + phase plan) **and `ClauseChain_Legal_Matching_DoDont.md`** (legal-matching rules + example bank). Where the body below conflicts, **this table governs:**

| Topic | This PRD (Round 0) says | **Round 1 truth (governs)** |
|---|---|---|
| **Economies** | Singapore, Thailand, Bangladesh | **Singapore, Australia, Malaysia** (Round 1, all English). Thailand is a *final-round* economy; Bangladesh is *not on the list*. All TH/BD content below is **architecture illustration only**, retargeted to AU/MY. |
| **Indicator codes** | placeholder `6.x`; our own rubric names (`transfer_restriction`, `data_protection_framework`) | **`P6-I1…P7-I5` = the RDTII 2.1 methodology indicators, 1:1** (P6-I1 = 6.1 ban/local-processing · 6.2 local storage · 6.3 infrastructure · 6.4 conditional flow; P7 = 7.1 comprehensive DP framework · 7.2 cybersecurity · 7.3 retention · 7.4 DPIA/DPO · 7.5 gov access). **`P6-I5`=6.5 is non-regulatory → engine extracts 9 indicators (P6-I1…I4 + P7-I1…I5).** |
| **Output schema** | the §12 minimum-citation object | the **exact `OUTPUT_TEMPLATE_31MAY.xlsx` columns** (CSV) + a JSON envelope; our object maps onto it and adds **`Discovery Tag` (NEW/KNOWN)**, **`Coverage` (Horizontal/Sectoral)**, **`Last Amended`**. |
| **Bonus scope** | "Pillar 8 (Cybersecurity)", Pillar 2 Bangladesh procurement | cybersecurity is indicator **7.2** (not a pillar). One bonus pillar = **Pillar 2 or Pillar 8** for SG/AU/MY (not Bangladesh) + **Zone 3 scoring (0–1)**. |
| **NEW-evidence discovery** | not present | **the single largest scoring lever (20 of 40)** — autonomous discovery + NEW/KNOWN diff at **(instrument + article)** granularity. |
| **Judged artifact** | working UI prototype | a **runnable CLI engine** (`run.py --country SG --pillar 6` → CSV+JSON, no manual steps) — confirmed required. UI is the *extra-mile*. |
| **Scoring weights** | per-stage metrics (internal) | the rubric is **40 % substantive · 30 % technical · 30 % architecture**; Zone 3 (RDTII 0–1 score) is optional bonus. |

Everything else carries forward **unchanged and validated** by the workshops: the eight verification gates, the legal predicate tuple, the authority/currentness resolver, the evidence ledger (now framed as **GraphRAG**), modular local/cloud provider routing, OCR rigor (CER < 5 %), and the human-in-the-loop audit trail.

---

## 0. Executive Snapshot

**Problem.** Regulatory mapping for digital trade is still largely manual. Generic RAG quotes the right words from the wrong source, misses exceptions, and treats guidelines as binding law. In legal and policy work, these errors are not acceptable.

**Solution.** ClauseChain is an open-source, self-hostable pipeline that turns scattered legal materials into reviewable RDTII evidence. It verifies six things before any output ships: the exact span, the source authority, the current-law status, the legal structure, the predicate meaning, and the absence of counter-evidence.

**Three differentiators.**

1. **Predicate tuple, not free-text classification.** The model extracts a structured legal predicate (actor / action / object / modality / condition / exception) and only then maps to RDTII. Rubric checks run on the tuple, not on prose.
2. **Eight verification gates (G1–G8).** Span, location, authority, currentness, structure, tuple support, RDTII predicate support, and counter-evidence search. Any failure rejects or routes to human review.
3. **Per-stage measured accuracy.** Discovery recall, OCR CER, section-boundary F1, retrieval recall@k, tuple field accuracy, macro-F1, citation exactness, and abstention calibration — all reported with confidence intervals.

**Demo coverage (Round 1).** Singapore (clean official HTML benchmark), Australia (Federal Register, amendment tracking), Malaysia (the "harder" economy — scanned gazettes + OCR stress, error-checking + new-data collection). All English. *(The Thailand/Bengali examples elsewhere in this document illustrate the multilingual/OCR architecture and apply to final-round economies — see the Round 1 Addendum.)*

**Deployment modes.** (1) **Local** — vLLM + Qwen / Llama on a single L40S. (2) **Cloud** — OpenAI or Anthropic per-task routing, no GPU required. (3) **Hybrid** — local for embeddings and OCR, cloud for high-stakes classification and verification. All target documents are public legal text scraped from official portals, so operators may choose any mix without privacy risk to data subjects. Provider routing is configurable per pipeline task (§6.4.1).

**Headline targets (prototype).** Discovery recall@20 ≥ 0.90 · Retrieval recall@20 ≥ 0.90 · Pillar macro-F1 ≥ 0.75 · Citation exact-match ≥ 0.95 · Calibrated abstention beats no-abstention baseline.

**Repository.** Apache 2.0 code; model weights retain their own licenses (matrix in §21). Reproducible benchmark, provenance bundle, and Docker Compose ship in-repo. Working UI prototype at `/pipeline/{crawl,harvest,extract,map,trace,export}`.

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

The Round 1 demo focuses on Singapore, Australia, and Malaysia (all English), covering official HTML, native PDFs, scanned gazettes/amendments, and non-binding guidelines; the multilingual path (Thai/Bengali/etc.) is built into the architecture for final-round economies. ClauseChain ships with a reproducible benchmark pack: labeled clauses, negative examples, OCR stress cases, evaluation scripts, and per-stage accuracy metrics. The codebase is Apache 2.0, self-hostable, and model-provider agnostic.

### 3.3 Problem Understanding

Regulatory mapping for digital trade is still largely manual. Analysts must locate statutes, amendments, regulations, official gazettes, regulator guidance, and translations; determine which sources are binding and current; identify relevant clauses; interpret rule-and-exception structures; and map the result to a framework such as RDTII. This is slow, expensive, difficult to reproduce, and especially hard in jurisdictions where key documents are scanned, multilingual, amended frequently, or scattered across government portals.

AI can accelerate the work, but generic RAG is not enough. A system can quote the right words from the wrong source, quote a repealed provision, miss an exception, misread a guideline as binding law, or classify a data retention rule as a cross-border transfer restriction. In legal and policy analysis, these errors matter.

ClauseChain's objective is to automate the evidence compilation workflow while preserving legal reviewability. It increases analyst capacity by collecting candidate sources, extracting structured legal text, identifying likely RDTII evidence, and producing machine-readable outputs. It reduces risk by measuring each stage, abstaining under uncertainty, and exposing every claim to human audit with source status and counter-evidence visible.

### 3.4 Where ClauseChain Sits in the Landscape

Commercial legal-AI products (LexisNexis Protégé, Harvey, Spellbook, Casetext) are built for litigation, contracts, and law-firm workflows; they do not produce RDTII-shaped, jurisdiction-graphed, currentness-verified evidence and they are closed-source. Open RAG stacks (LangChain templates, llama-index legal demos, Verba) retrieve and cite, but stop at citation — they do not verify authority, currentness, or counter-evidence and they treat all retrieved chunks as equally authoritative. Government RegTech tooling (OECD i-Reg, World Bank Privacy Data Protection trackers, UNCTAD CyberLaws) curates indicators by hand and does not extract from source documents. ClauseChain occupies the gap: open-source, self-hostable, RDTII-native, with measurable per-stage accuracy, predicate-tuple verification, and an evidence ledger that lets every output be reconstructed from raw bytes.

---

## 4. Scope and Demo Strategy

### 4.1 Mandatory Scope

ClauseChain focuses on the two mandatory policy areas (Pillars 6 & 7, for **Singapore / Australia / Malaysia**) plus **one optional bonus pillar** (Pillar 2 **or** Pillar 8) for extra points. *(Round 1 correction: the "two bonus pillars, one scoped to Bangladesh" framing below is superseded — Bangladesh is out of scope; pick a single bonus pillar for SG/AU/MY. See the Round 1 Addendum.)*

- **RDTII Pillar 6 — Cross-Border Data Policies:** cross-border transfer restrictions, data localization, domestic processing/storage requirements, adequacy/comparability conditions, regulator approval, conditional transfer pathways.
- **RDTII Pillar 7 — Domestic Data Protection and Privacy:** personal data protection frameworks, lawful basis, purpose limitation, data subject rights, retention limits, breach notification, compliance obligations, regulator powers, government access safeguards.
- **RDTII Pillar 8 — Internet Intermediary Liability and Content Access** *(bonus)*: platform and ISP liability, safe-harbour rules, content takedown/blocking orders, user-identity requirements, monitoring obligations.
- **RDTII Pillar 2 — Public Procurement of ICT Goods and Services** *(bonus — Bangladesh)*: discrimination in ICT procurement processes, patent and technology specification requirements in tender documents, WTO Government Procurement Agreement (GPA) signatory status. Bangladesh is not a GPA signatory; this is directly verifiable from WTO and government official sources and constitutes a concrete RDTII indicator. Anchor instruments: BPPA procurement rules and standard tender documents (`bppa.gov.bd`); Department of Public Procurement materials (`dpp.gov.bd`); statutory procurement framework (`bdlaws.minlaw.gov.bd`); WTO GPA membership list (`wto.org`).

### 4.2 Proof Ladder

The system should not try to prove everything at once. It should prove capability in layers:

| Proof level | Purpose | Demo target |
|---|---|---|
| Level 1: Clean end-to-end | Show full workflow with low extraction risk | Singapore official HTML PDPA/cyber/data source |
| Level 2: Legal complexity | Show rule/exception, amendments, current-law status | Thailand PDPA and related instruments |
| Level 3: Technical stress | Show OCR, Bengali/English mix, scanned or less-curated sources | Bangladesh data/cyber/telecom instruments |
| Level 4: Benchmark | Show scientific credibility | Reproducible labeled dataset and eval script |

### 4.3 Target Jurisdictions

| Jurisdiction | Role in demo | Anchor instruments | Source types |
|---|---|---|---|
| Singapore | Clean benchmark, full end-to-end flow, currentness baseline | PDPA 2012 (rev. 2021) ss. 13, 17, 26(1); Personal Data Protection Regulations 2021; PDPC transfer-limitation guidance; IMDA online-safety and copyright-intermediary materials | `sso.agc.gov.sg` official HTML + PDF; `pdpc.gov.sg` regulator guidance; `imda.gov.sg` |
| Thailand | Host-country bilingual stress test, gazette PDFs, conditional-transfer regime | PDPA B.E. 2562 ss. 26, 27–29, 41; Royal Gazette PDFs; PDPC sections 28–29 cross-border-transfer notifications 2022–2024; ministry materials | `ratchakitcha.soc.go.th` gazette PDFs; `pdpc.or.th` regulator pages (Thai + English); `mdes.go.th` |
| Bangladesh | OCR stress, new-law source-status handling, multilingual gazette scans, WTO GPA non-signatory stress test for P2 | Personal Data Protection Act 2026 (P6/P7); National Data Management Act 2026 (P6/P7); Cyber Protection Act 2026 (P8); BPPA procurement rules and standard tender documents (P2); Department of Public Procurement materials (P2); WTO GPA non-signatory status (P2); Bangladesh Government Press gazette scans | `bdlaws.minlaw.gov.bd` HTML/PDF; `dpp.gov.bd`; `bppa.gov.bd`; gazette scans (Bengali + English); `wto.org` |

Every demo claim cites the *specific instrument and section* above. Singapore is the precision baseline (clean HTML, English, current consolidated text). Thailand exercises the rule/exception verifier on bilingual text. Bangladesh exercises OCR, source-status handling across a new 2026 legislative stack, and Bengali multilingual retrieval.

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

Important license note: ClauseChain code is Apache 2.0. Model weights and third-party tools retain their own licenses; the full matrix is documented in §21 and shipped as `MODEL_LICENSES.md`.

### 6.4.1 Cloud LLM Routing (Optional)

ClauseChain's default stack is local-first because it must run inside government and institutional environments. However, **every target document in the demo set is public legal text scraped from official portals** — there is no personally identifiable information, no privileged content, and no privacy concern in routing the text through a third-party API. Operators may therefore configure any pipeline task to use a cloud LLM provider instead of (or alongside) the local model. Provider choice is restricted to **OpenAI** and **Anthropic** to keep the auditable surface small.

**Per-task provider matrix:**

| Pipeline task | Local default | OpenAI cloud option | Anthropic cloud option | Default routing |
|---|---|---|---|---|
| Crawl / HTML / PDF extraction | Scrapy · Trafilatura · Docling | n/a | n/a | always local (deterministic) |
| OCR text + bbox | PaddleOCR-VL / PaddleOCR | n/a | n/a | always local (coordinate-native) |
| OCR hard-region repair (VLM) | Qwen2-VL-7B | `gpt-5.4-mini` (vision) | `claude-haiku-4-6` (vision) | confidence-threshold |
| Embeddings (multilingual) | BGE-M3 / Qwen3-Embedding | `text-embedding-3-large` | *not available — Anthropic does not host an embedding API* | always local |
| Reranking | BGE-reranker-v2-m3 / Qwen3-Reranker | `gpt-5.4-mini` (LLM-as-judge) | `claude-haiku-4-6` (LLM-as-judge) | always local |
| Legal predicate extraction | Qwen2.5-7B / Llama-3.1-8B-Instruct | `gpt-5.4-mini` | `claude-haiku-4-6` | confidence-threshold |
| RDTII mapping | Qwen2.5-7B | `gpt-5.4` | `claude-sonnet-4-6` | confidence-margin |
| Entailment / NLI verifier (Gate G6/G7) | DeBERTa-v3 multilingual NLI | `gpt-5.4-mini` | `claude-haiku-4-6` | always local |
| Counter-evidence search (Gate G8) | Local LLM + retrieval | `gpt-5.4-mini` | `claude-haiku-4-6` | confidence-threshold |
| Review-time explanation generation | Qwen2.5-7B | `gpt-5.4` | `claude-sonnet-4-6` | operator-controlled |

**Honest note on Anthropic embeddings.** Anthropic does not currently expose a hosted embedding API; it recommends Voyage AI. Operators wanting an Anthropic-aligned cloud stack should pair Claude for LLM tasks with OpenAI `text-embedding-3-large` for embeddings, or run BGE-M3 locally. ClauseChain does not depend on this in the default path.

**Routing modes.** Each task supports four routing modes:

| Mode | Behavior |
|---|---|
| `always_local` | Cloud disabled for this task even if configured globally |
| `always_cloud` | Skip local model and call the configured provider directly |
| `confidence_threshold` | Run local first; escalate to cloud if local confidence < configured threshold |
| `confidence_margin` | Run local first; escalate if score margin between top-1 and top-2 candidates < threshold |

**Configuration schema (`configs/models.yaml`):**

```yaml
mode: hybrid                  # local-only | cloud-only | hybrid
cloud_consent:
  acknowledged: true          # operator confirms public-document scope
  data_residency_note: "Public legal text from official portals only"

providers:
  openai:
    api_key_env: OPENAI_API_KEY
    base_url: https://api.openai.com/v1
  anthropic:
    api_key_env: ANTHROPIC_API_KEY
    base_url: https://api.anthropic.com

tasks:
  ocr_vlm_repair:
    routing: confidence_threshold
    local:  { model: Qwen2-VL-7B }
    cloud:                                # pick one provider
      openai:    { model: gpt-5.4-mini }
      anthropic: { model: claude-haiku-4-6 }
    trigger: { ocr_confidence_below: 0.75 }

  embedding:
    routing: always_local
    local:  { model: BGE-M3 }
    cloud:  { provider: openai, model: text-embedding-3-large }

  predicate_extraction:
    routing: confidence_threshold
    local:  { model: Qwen2.5-7B-Instruct }
    cloud:
      openai:    { model: gpt-5.4-mini }
      anthropic: { model: claude-haiku-4-6 }
    trigger: { local_confidence_below: 0.65 }

  rdtii_mapping:
    routing: confidence_margin
    local:  { model: Qwen2.5-7B-Instruct }
    cloud:
      openai:    { model: gpt-5.4 }
      anthropic: { model: claude-sonnet-4-6 }
    trigger: { score_margin_below: 0.15 }

  nli_verifier:
    routing: always_local                 # escalate only on gate G6/G7 failure
    local:  { model: DeBERTa-v3-multilingual-NLI }
    cloud:
      openai:    { model: gpt-5.4-mini }
      anthropic: { model: claude-haiku-4-6 }
```

**Audit invariants preserved under cloud routing.** Switching a task to cloud does **not** loosen the verification gates. The same G1–G8 checks run on the cloud output. The provenance ledger records, for every claim:

- which model produced the predicate tuple (`local:Qwen2.5-7B`, `cloud:openai:gpt-5.4-mini`, or `cloud:anthropic:claude-haiku-4-6`),
- the routing decision and trigger value that caused escalation,
- the request/response hash for cloud calls (no payload is stored when `cloud_consent.persist_payloads: false`),
- the per-token or per-call cost estimate for budget tracking.

**Restricted-content guard.** If a document is tagged in the jurisdiction pack as `restricted` (e.g. internal regulator drafts shared under NDA), cloud routing is refused for that document regardless of operator config; only local models may process it. Default for all hackathon demo documents is `public`.

**Cost control.** Operators set a per-run cloud budget cap (e.g. USD 2.00 / run). When the cap is reached, all routing modes fall back to local; the run continues without cloud escalation and the cap event is logged.

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
| `/models/providers` | GET | List available providers (local, openai, anthropic) and discovered models |
| `/models/routing` | GET | Return current per-task routing config |
| `/models/routing` | PUT | Update per-task routing (mode, provider, model, thresholds, budget cap) |
| `/models/usage` | GET | Per-run cost report: local GPU-seconds, cloud tokens, cloud spend by provider |

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
  G1_binding_current_law: [primary_legislation, official_gazette_current]
  G2_binding_subordinate: [subsidiary_legislation, regulation, notification, binding_circular]
  G3_official_guidance: [regulator_guideline, faq, advisory, model_clause]
  G4_non_current: [draft_bill, consultation_paper, pending_regulation]
  G5_reviewer_aid: [unofficial_translation, law_firm_note, news, commentary]
status_markers:
  repealed: ["repealed", "revoked", "no longer in force"]
  draft: ["draft", "consultation", "bill"]
  consolidated: ["revised edition", "current version"]
citation_patterns:
  section: ["section {number}", "s. {number}"]
  article: ["Article {number}"]
rdtii_bindings:
  pillars: [6, 7]          # extend to [2, 6, 7, 8, 12] via jurisdiction-specific override
```

### 7.3 Accuracy Benefit

Jurisdiction packs reduce model guessing. They make official-source detection, authority ranking, citation parsing, and current-law checks deterministic wherever possible.

### 7.4 Default Source Authority Hierarchy

The hierarchy is configurable per jurisdiction. Every ingested document is assigned one of five tiers at acquisition time, stored as `authority_rank` in the source record alongside `binding_status`, `effective_date`, `repealed_by`, and `citation_granularity`.

| Tier | Source class | Legal weight |
|---|---|---|
| G1 | Consolidated official statute pages, current official gazettes | Binding current law — supports final RDTII claim |
| G2 | Regulations, notifications, rules, orders, circulars with legal force | Binding subordinate law — supports final RDTII claim |
| G3 | Regulator guidelines, FAQs, advisories, model clauses | Official guidance — context only unless configured binding in jurisdiction pack |
| G4 | Bills, draft regulations, public consultations | Non-current — cannot support a current-law claim |
| G5 | Unofficial translations, law-firm summaries, news, commentary | Reviewer aid only — discovery leads, never binding evidence |

Only G1 and G2 normally determine the final legal standard. G3–G5 can appear in the audit view as context, but cannot override binding text.

### 7.5 Conflict Resolution Rules

| Conflict | Default handling |
|---|---|
| Law vs guideline | G1/G2 law controls; G3 guideline is tagged non-binding context |
| Consolidated law vs older amendment | Prefer consolidated current text (G1) if the amendment is incorporated; cite both and route to review if unclear |
| Official original vs unofficial translation | Original official language (G1/G2) controls; G5 translation is non-authoritative reviewer aid |
| General prohibition vs exception in same rule unit | Read together as a qualified or conditional standard |
| Later same-rank rule vs older same-rank rule | Later effective rule controls only if in force and not repealed |
| Two official current sources disagree | Cite both, flag conflict, require human review |
| Draft/bill vs current law | G4 draft is marked non-current and cannot support current-law output |

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

**Gate thresholds (prototype defaults, configurable per jurisdiction pack):**

| Gate | Pass threshold | Review threshold | Reject threshold | Notes |
|---|---|---|---|---|
| G1 Span | exact byte/char match | edit distance 1–3 on OCR regions only | edit distance > 3, or no match | OCR fuzzy must be tagged with `ocr_confidence` and original image |
| G2 Location | bbox IoU ≥ 0.85 or section path match | IoU 0.50–0.85 | IoU < 0.50 or section unresolved | |
| G3 Authority | source authority tier G1 or G2 (binding) | tier G3 (official guidance) when used as binding evidence | tier G4–G5 (non-current / reviewer aids) | Non-binding context allowed in audit view but cannot drive final claim |
| G4 Currentness | `status = binding_current` AND not within 14 days of an open amendment | `consolidated_text_age > 365 days` OR amendment pending | `status ∈ {repealed, draft, superseded}` for binding claim | |
| G5 Structure | role matches expected (principal_rule, exception, etc.) | role uncertain | rule unit incomplete (exception missing) | |
| G6 Tuple | NLI entailment ≥ 0.70 across all populated fields | 0.50–0.70 | < 0.50 | Multilingual NLI; per-field score logged |
| G7 RDTII | All required predicates present AND no exclusion triggered | required predicate ambiguous | required predicate missing OR exclusion triggered | Rubric-as-code; deterministic before LLM |
| G8 Counter-evidence | no repeal/amendment/conflict found; OR found but ledger marks `superseded_by` correctly | conflict found, automatic resolution uncertain | direct contradiction with higher-rank current source | Route to review even if other gates passed |

A claim's `final_status` is `verified` only when all gates that apply to its class are `pass`. Any `review` routes the claim to human queue; any `reject` blocks export.

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
  "instrument_title": "Personal Data Protection Act 2012",
  "last_amendment_date": "2021-02-01",
  "scope": "horizontal",
  "impact": "Organisations are prohibited from transferring personal data outside Singapore unless comparable protection requirements are satisfied; this conditions all cross-border data flows and is directly relevant to RDTII Pillar 6.",
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

**OCR fuzzy-match citation example** (Bangladesh scanned amendment, Bengali source):

```json
{
  "evidence_id": "ev_bd_dsa_26_1_ocr",
  "source_url": "https://bdlaws.minlaw.gov.bd/act-1261.pdf",
  "retrieved_at": "2026-05-23T09:12:24+06:00",
  "source_type": "official_legislation_scanned_pdf",
  "jurisdiction": "BD",
  "instrument_title": "Digital Security Act 2018",
  "version_or_effective_date": "2018-10-08 (in force)",
  "article_section_paragraph": "section 26(1)",
  "page_number": 14,
  "bbox": { "x0": 72, "y0": 412, "x1": 540, "y1": 488, "page_width": 612, "page_height": 792 },
  "quote": "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.",
  "quote_char_start": 18742,
  "quote_char_end": 19103,
  "source_sha256": "9f2c4e8a1b...d3e7",
  "span_sha256": "a73b2f1c8e...0d9a",
  "match_type": "fuzzy",
  "ocr": {
    "engine_primary":  "PaddleOCR-VL",
    "engine_secondary": "Tesseract",
    "vlm_repair_engine": "cloud:anthropic:claude-sonnet-4-6",
    "ocr_confidence": 0.77,
    "edit_distance": 2,
    "disagreements_resolved": 4,
    "original_image_url": "/storage/runs/run-BD-001/pages/BD-DSA-2018-p14.png"
  },
  "authority_rank": "binding_primary_law",
  "verification_status": "verified",
  "gate_results": {
    "G1_span": "pass (fuzzy, edit_distance=2)",
    "G2_location": "pass (bbox IoU=0.91)",
    "G3_authority": "pass",
    "G4_currentness": "pass",
    "G5_structure": "pass",
    "G6_tuple": "pass (NLI=0.88)",
    "G7_rdtii": "pass",
    "G8_counter_evidence": "none_found"
  }
}
```

This is the path that ClauseChain's OCR rigor was built for: a scanned Bengali statute, two OCR engines disagreeing, a VLM repair pass (here using cloud Claude per operator config), and every choice logged so a reviewer can re-verify against the original page image.

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
| OCR | CER on sampled pages | < 5% on official printed text; VLM repair (gpt-5.4-mini / claude-haiku-4-6) escalated on low-confidence regions |
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

**Working UI prototype.** A Next.js 16 / React 19 prototype of the audit surface is in-repo and runs at `/pipeline/{crawl, harvest, extract, map, trace, export}`. The Source Trace route (`/pipeline/trace`) implements the dual-panel layout above with synchronized scroll, span popovers (per-gate dot, verbatim snippet, confidence, match type), and a coverage summary bar. The Mapping Run route (`/pipeline/map`) implements the L0–L3 autonomy selector, CVR-loop streaming, and rejection inspector. The Export route (`/pipeline/export`) implements the machine-readable output described in §12. The prototype uses mock pipeline data; backend wiring is part of Round 1.

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

- Jurisdiction packs for **SG, AU, and MY** with ≥ 5 official source domains each and a complete authority hierarchy.
- Ingest **≥ 3 official HTML sources** end to end (one per jurisdiction); at minimum SG PDPA 2012, AU Privacy Act 1988, MY PDPA 2010 (Act 709).
- Ingest **≥ 1 scanned legal page per jurisdiction** with text + bbox + per-token OCR confidence emitted (Malaysia gazettes are the OCR-stress case).
- Build legal node tree for **at least one full instrument per jurisdiction** (target: SG PDPA, AU Privacy Act, MY PDPA).
- Build rule units for **≥ 10 provisions containing exceptions/conditions** across the three jurisdictions.
- Hybrid retrieval (BM25 + multilingual dense) plus reranking, with retrieval recall@20 ≥ 0.85 on the prototype benchmark.
- Legal predicate tuple extraction with **field-level accuracy ≥ 0.75** on the prototype benchmark.
- RDTII mapping for Pillars 6 and 7 using the **methodology indicators `P6-I1…I4` + `P7-I1…I5`** (= 6.1…6.4 / 7.1…7.5; P6-I5 non-regulatory), with **macro-F1 ≥ 0.70** on a ≥ 50-example labeled benchmark.
- Verification gates G1–G8 implemented and exercised by every shipped claim, including a **Discovery Tag (NEW/KNOWN)** on every row.
- Export to the **exact `OUTPUT_TEMPLATE_31MAY.xlsx` CSV schema** + JSON envelope + provenance bundle; outputs re-verifiable from raw bytes.
- Reproducible benchmark script with ≥ 50 labeled examples (≥ 10 negatives, ≥ 5 OCR fuzzy cases, ≥ 5 amendment/repeal cases) and per-stage metrics with bootstrap confidence intervals.
- Working audit UI (already prototyped at `/pipeline/*`) showing span, source status, tuple, gates, and reviewer action.
- Model routing config (§6.4.1) operational with at least `always_local` and one cloud provider tested end-to-end.

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
| Provider agnosticism | Local, OpenAI-cloud, Anthropic-cloud, and hybrid modes all produce identical schema; gates run regardless of producer |
| Cost control | Per-run cloud budget cap; automatic fallback to local when cap reached; cost report per task and per provider |
| Operator consent | Cloud routing requires explicit `cloud_consent.acknowledged: true`; restricted-tier documents refuse cloud regardless |
| Audit completeness | Every claim's ledger entry records model identity (local/cloud + provider + version), routing decision, and trigger value |

---

## 17. Technical Memo (One Page)

ClauseChain is an open-source pipeline that maps digital trade regulation to RDTII Pillars 6 and 7 with reviewable, evidence-based outputs. Its core premise is that citation verification is necessary but not sufficient: a real quote can come from a repealed act, a non-binding guideline, an unofficial translation, or a clause whose exception changes the rule. ClauseChain verifies the whole evidence chain — span, source authority, current-law status, legal structure, predicate meaning, and counter-evidence — before any output ships.

**Pipeline.** Per-jurisdiction packs define official source domains, authority hierarchies, citation patterns, language settings, and RDTII rubric bindings. Discovery crawls official statute databases, gazettes, and regulator portals (Scrapy + Playwright + Crawl4AI). Acquisition preserves raw bytes, SHA-256, HTTP metadata, and rendered page images. The authority resolver classifies each source as binding, guideline, draft, repealed, consolidated, amendment, or translation, and builds a current-law graph. Extraction routes HTML, native PDF, and scanned PDF through Trafilatura / Docling / PaddleOCR-VL with VLM repair on hard regions only. The legal parser produces a section tree and builds rule units that bind principal rules to their exceptions, conditions, definitions, and cross-references.

**Mapping.** Retrieval is hybrid sparse + dense (OpenSearch BM25 + Qdrant / pgvector, BGE-M3 or Qwen3-Embedding, cross-encoder reranking). Before any classification, the model extracts a structured legal predicate tuple (actor / action / object / destination / modality / condition / exception / source-status). RDTII mapping then runs rubric-as-code deterministic checks plus a constrained classification call.

**Model routing.** Default stack is local-first on vLLM (Qwen / Llama family). Operators can route any LLM-bearing task to **OpenAI** or **Anthropic** via per-task configuration (`always_local`, `always_cloud`, `confidence_threshold`, `confidence_margin`). Cloud model assignments: OCR VLM repair and predicate extraction → `gpt-5.4-mini` / `claude-haiku-4-6`; RDTII mapping and explanations → `gpt-5.4` / `claude-sonnet-4-6`; embeddings (cloud) → `text-embedding-3-large` (OpenAI only — Anthropic does not host an embedding API). Cloud routing requires explicit operator consent, respects a per-run budget cap, and writes the model identity into the provenance ledger. Cost per 50-page document: hybrid ≈ USD 0.05–0.10; cloud-only ≈ USD 0.15–0.30; local-only ≈ USD 0.00 marginal.

**Verification.** Eight gates (G1 span, G2 location, G3 authority, G4 currentness, G5 structure, G6 tuple, G7 RDTII, G8 counter-evidence). Each has a `pass / review / reject` threshold (§8.9). A claim's `final_status` is `verified` only when every applicable gate passes; any failure rejects or routes to human review.

**Evidence.** Outputs ship as JSONL, CSV matrix, Markdown report, and a provenance bundle. Every record is reconstructable from raw bytes: source URL, hash, section, page, char offsets, bbox (where available), OCR engine and confidence, predicate tuple, gate results, and model identity.

**Accuracy.** Per-stage metrics with bootstrap confidence intervals: discovery recall@20, authority precision, OCR CER, section-boundary F1, retrieval recall@20, tuple field accuracy, pillar macro-F1, citation exact-match, and abstention calibration. Five baselines included (naive LLM, standard RAG, ClauseChain minus authority gate, ClauseChain minus tuple, full ClauseChain) so judges can see which architectural pieces actually move accuracy.

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

## 21. Model License & Provider Matrix

ClauseChain's source code is Apache 2.0. **Model weights and third-party APIs retain their own licenses.** This matrix is what operators consult before deploying — it answers "can I use this commercially, self-host it, redistribute it?" up front.

### 21.1 Local model licenses

| Model | License | Commercial use | Redistribution | Notes |
|---|---|---|---|---|
| Qwen2.5-7B-Instruct | Apache 2.0 | Yes | Yes | Default classifier and predicate extractor |
| Qwen2-VL-7B | Apache 2.0 | Yes | Yes | Default OCR VLM repair |
| Qwen3-Embedding | Apache 2.0 | Yes | Yes | Optional high-accuracy embedding |
| Qwen3-Reranker | Apache 2.0 | Yes | Yes | Optional reranker |
| Llama-3.1-8B-Instruct | Llama Community License | Yes (with attribution) | Conditional | Not OSI-approved; >700M MAU triggers separate Meta license |
| BGE-M3 | MIT | Yes | Yes | Default multilingual embedding |
| BGE-reranker-v2-m3 | MIT | Yes | Yes | Default reranker |
| DeBERTa-v3 multilingual NLI | MIT (base) + dataset license | Yes | Yes | Check fine-tune dataset (often MultiNLI / XNLI) |
| PaddleOCR-VL / PaddleOCR | Apache 2.0 | Yes | Yes | Default OCR |
| Tesseract | Apache 2.0 | Yes | Yes | OCR fallback |
| Docling | MIT | Yes | Yes | PDF extraction |
| Trafilatura | Apache 2.0 | Yes | Yes | HTML extraction |
| Crawl4AI | Apache 2.0 | Yes | Yes | AI-friendly crawler |
| vLLM | Apache 2.0 | Yes | Yes | Model server |

**ClauseChain's default model stack is fully commercial-grade and self-hostable.** The only model that carries non-OSI terms is Llama-3.1, and Qwen2.5-7B is the recommended drop-in replacement for any operator who wants a pure-Apache stack.

### 21.2 Cloud provider terms

| Provider | API | Data handling default | Operator must review |
|---|---|---|---|
| OpenAI | `api.openai.com` | API requests are *not* used to train models (since 2023 policy); 30-day retention for abuse monitoring | Enterprise / Zero-Data-Retention agreement if required |
| Anthropic | `api.anthropic.com` | API requests are *not* used to train models; no long-term retention by default | Anthropic Enterprise terms if required |

Both providers are SOC 2 Type II. Both publish data-handling commitments. Neither hosts ClauseChain — they receive only the specific text the operator routes to them per `configs/models.yaml`. Operators who must guarantee zero-cloud-egress should use `mode: local-only`.

### 21.3 Provider-routing decision aid

| Operator profile | Recommended mode | Why |
|---|---|---|
| Government / regulator with data-residency mandate | `local-only` | No external network egress; all weights self-hosted; deterministic |
| Research lab, NGO, academic | `hybrid` (local default, cloud for low-confidence escalation) | Best accuracy-per-dollar; local for bulk, cloud for edge cases |
| Hackathon judge / individual analyst | `cloud-only` with Anthropic Claude | No GPU required; runs on a laptop; predictable cost |
| Production analyst team | `hybrid` with budget cap | Local for embedding and OCR (cheap, fast at scale); cloud for predicate extraction and counter-evidence |

---

## 22. Hardware Footprint & Operating Modes

### 22.1 Reference deployments

| Mode | Hardware | What runs locally | What runs cloud | Approx. cost / run* |
|---|---|---|---|---|
| **Local-only (recommended for government)** | 1× NVIDIA L40S 48 GB · 64 GB RAM · 500 GB SSD | All models (vLLM serving Qwen2.5-7B + BGE-M3 + DeBERTa-NLI + Qwen2-VL-7B) | None | $0 marginal; ~$0.50 amortized GPU-hour |
| **Local-lean** | 1× RTX 4090 24 GB · 32 GB RAM · 250 GB SSD | Qwen2.5-7B-Q4 quantized + BGE-M3 + Tesseract | OCR VLM repair only | ~$0.10 / run cloud |
| **Hybrid (recommended for analysts)** | 1× RTX 4090 24 GB · 32 GB RAM | OCR + embeddings + reranking + NLI | Predicate extraction, RDTII mapping (low-confidence only), counter-evidence | $0.30–$0.80 / run |
| **Cloud-only (laptop mode)** | 16 GB MacBook / equivalent · no GPU | Crawl, HTML/PDF extraction, deterministic OCR (Tesseract), rubric checks | All LLM tasks, all VLM tasks, OpenAI embeddings | $1.50–$4.00 / run |

*Cost estimate based on `claude-sonnet-4-6` at ~$3/MTok input and `gpt-5.4-mini` at ~$0.15/MTok input as of 2026-05; one "run" = one jurisdiction full pipeline over ≈ 20 instruments. Operator budget cap enforced.

**Cost per 50-page document (single instrument):**

| Mode | Per-document cost | Notes |
|---|---|---|
| Local-only | ≈ USD 0.00 marginal | GPU amortized; electricity ≈ $0.002/doc |
| Hybrid (local OCR + embeddings, cloud for predicate + mapping) | ≈ USD 0.05–0.10 | Uses `gpt-5.4-mini` / `claude-haiku-4-6` for extraction; `claude-sonnet-4-6` / `gpt-5.4` for mapping |
| Cloud-only (laptop mode, all LLM tasks via API) | ≈ USD 0.15–0.30 | OpenAI embeddings + cloud VLM + cloud predicate/mapping; no GPU required |

Estimate basis: 50-page official legal PDF ≈ 25 k tokens extracted text; predicate extraction ≈ 8 k tokens in + 1 k out per batch; RDTII mapping ≈ 4 k tokens in + 0.5 k out. OCR repair runs on ≈ 10% of pages for scanned documents.

### 22.2 Storage budget

- Raw source bytes: ≈ 200 MB per jurisdiction (HTML + PDF + scans).
- Rendered page images: ≈ 50 MB per scanned instrument.
- Extracted text + layout JSON: ≈ 20 MB per instrument.
- Vector index (BGE-M3 over rule units): ≈ 50 MB per 10 k chunks.
- Provenance bundle (export): ≈ 80 MB per jurisdiction full run.

**Total for SG+TH+BD prototype: well under 5 GB.**

### 22.3 Network egress (cloud mode)

For a single full jurisdiction run in cloud-only mode:

- Cloud LLM tokens out: ≈ 800 k input + 80 k output tokens.
- Cloud embedding tokens (OpenAI): ≈ 300 k tokens.
- Cloud VLM image tokens: ≈ 50 page-images (scanned PDFs only).

Operators behind air-gapped networks must run `local-only`. Operators on metered connections should set `cloud_budget.tokens_per_run` and `cloud_budget.usd_per_run`.

---

## 23. UN/UNESCAP Engagement & Open-Source Strategy

### 23.1 Alignment with RDTII methodology

ClauseChain's `configs/rdtii/pillar_6.yaml` and `pillar_7.yaml` are intended to be a faithful, machine-readable encoding of UNESCAP's RDTII v2.1 Guide. Indicator IDs in the prototype use placeholder values (e.g. `6.x`) where the final UNESCAP indicator catalog assignment is pending; these are clearly tagged with `schema_version: rdtii-2.1-hackathon-draft` so no consumer mistakes them for the canonical UNESCAP IDs. A versioned rubric upgrade path (`rdtii-2.1` → `rdtii-2.1-final`) is built into the loader.

### 23.2 Validation against UNESCAP scoring

For at least one jurisdiction (Singapore, where RDTII v2.1 scoring is most likely already complete), the prototype will compute ClauseChain's RDTII output and compare it indicator-by-indicator with UNESCAP's published scoring where available. Disagreements are reported with the underlying evidence, not hidden. This is the most honest demonstration that the system is real.

### 23.3 Engagement plan

- **Application stage (now):** publish PRD, prototype UI, and small benchmark. Open a GitHub Discussions thread inviting UNESCAP RDTII team feedback on the YAML rubric encoding.
- **Round 1:** propose a 30-minute working session with UNESCAP to confirm indicator IDs, rubric edge cases, and any clarifications to the Guide that the rubric-as-code surfaces.
- **Finals:** if accepted, deliver a contributor guide (`docs/adding_a_jurisdiction.md`, `docs/updating_the_rubric.md`) and a one-jurisdiction worked replication of UNESCAP's scoring methodology.

### 23.4 Open-source posture

- **License.** Apache 2.0 for code; `MODEL_LICENSES.md` for weights.
- **Contributor model.** Each jurisdiction pack is a single PR (YAML + a small fixture set). The PR template requires authority hierarchy, citation patterns, and at least 10 labeled benchmark examples. Maintainers run the benchmark on PR.
- **Governance.** Rubric files under `configs/rdtii/` are governed by a `MAINTAINERS.md` list; substantive RDTII semantics changes require sign-off from at least one maintainer with policy / legal background.
- **Capacity building.** A `docs/jurisdiction_pack_quickstart.md` walks a new-country contributor from blank repo to working pipeline in under one day. Target audience: regulators and researchers in developing economies who want to score their own jurisdiction without waiting for a vendor.
- **Public good.** The benchmark pack itself (positive / negative / OCR / amendment / repeal cases) is published under CC-BY-4.0 so it can be reused beyond ClauseChain — including by competing tools, which is fine and helps the field.

---

## Appendix A - Application Form Crosswalk

| Application field | PRD section |
|---|---|
| Executive snapshot (one-pager for fast scan) | Section 0 |
| Project title | Section 3.1 |
| Short proposal summary | Section 3.2 |
| Problem understanding and objectives | Section 3.3 |
| Competitive landscape | Section 3.4 |
| Policy area | Section 4.1 |
| Demo jurisdictions and anchor instruments | Section 4.3 |
| Q1 linguistic conflict | Section 10.1 |
| Q1 precedence and rationale | Section 10.2 |
| Q1 programming the AI | Section 10.3 |
| Q2 end-to-end workflow | Section 6 and Section 8 |
| Q3 data sources and scope | Section 4.2 and 4.3 |
| Q4 evidence and citation | Section 12 |
| Q5 authoritative source scenario | Sections 8.3, 8.9, and 12.2 |
| Q6 anti-hallucination design | Section 11 |
| Cloud LLM routing (OpenAI / Anthropic) | Section 6.4.1 |
| Verification-gate thresholds | Section 8.9 |
| OCR fuzzy-match citation example | Section 12.3 |
| UI prototype reference | Section 14.2 |
| Model licenses & provider matrix | Section 21 |
| Hardware footprint & operating modes | Section 22 |
| UN/UNESCAP engagement & open-source strategy | Section 23 |
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
