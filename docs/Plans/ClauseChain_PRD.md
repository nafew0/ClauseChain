# Product Requirements Document — ClauseChain

**Hash-Anchored Regulatory Evidence for Digital Trade**

| | |
|---|---|
| **Document type** | Product Requirements Document (PRD) |
| **Product** | ClauseChain |
| **Version** | 1.0 |
| **Status** | For submission — UN Global Hackathon: AI for Digital Trade Regulatory Analysis 2026 |
| **Date** | 23 May 2026 |
| **Initiative** | UNESCAP / KMITL — AI for Digital Trade Regulatory Analysis |
| **Framework** | UN Regional Digital Trade Integration Index (RDTII) v2.1 |
| **License** | Apache 2.0 (open source) |
| **Mandatory scope** | RDTII Pillar 6 (Cross-Border Data Policies) · Pillar 7 (Domestic Data Protection & Privacy) |

---

## Document Control

| Section | Purpose |
|---|---|
| 1. Executive Summary | Project title, summary, the one-paragraph thesis |
| 2. Problem Statement & Objectives | Problem understanding, goals, success criteria |
| 3. Scope & Policy Alignment | RDTII pillar mapping, in/out of scope |
| 4. Users & Use Cases | Personas, user stories |
| 5. Functional Requirements | What the system must do, by pipeline stage |
| 6. The Two Tasks | Task 1 (Discovery) and Task 2 (Mapping & Verification) |
| 7. Anti-Hallucination Design (CVR Loop) | The core technical guarantee |
| 8. Legal-Interpretation Logic | The PDPA rule/exception worked example |
| 9. System Architecture | Components, data flow, tech stack |
| 10. Data Model & Output Specification | The machine-readable deliverable |
| 11. User Interface Requirements | The nine-page product surface |
| 12. Non-Functional Requirements | Performance, scale, cost, reliability |
| 13. Compliance & Governance | GDPR, accessibility (WCAG 2.1 AA), data sovereignty |
| 14. Demo Scope & Data Sources | Jurisdictions and document types for the demo |
| 15. Evaluation & Acceptance Criteria | How accuracy is measured |
| 16. Risks & Mitigations | Risk register |
| 17. Roadmap | Application → Round 1 → Finals |
| Appendix A | Application question cross-reference map |
| Appendix B | Glossary |

---

# 1. Executive Summary

## 1.1 Project Title

**ClauseChain — Hash-Anchored Regulatory Evidence for Digital Trade**

## 1.2 Short Proposal Summary

> *(≈195 words — directly answers the application "Short Proposal Summary" field.)*

Digital trade regulations exist across thousands of statutes, in dozens of languages, scattered across official gazettes, ministry portals, and scanned amendments. Mapping them to a comparable framework like the UN RDTII is manual, expensive, and error-prone. AI can accelerate this work — but only if its outputs are trustworthy.

ClauseChain is an open-source AI pipeline that automatically discovers, extracts, and maps digital trade regulations to RDTII Pillars 6 and 7, with an extensible architecture for the remaining pillars. What distinguishes it is a structural guarantee: every classification is bound to a verbatim, hash-anchored citation from an authoritative source, verified through a three-gate Cite-Verify-Reject (CVR) loop. The model cannot output a classification without producing a verifiable quote; if verification fails, the output is rejected rather than softened.

Built on open-weight models (Llama 3.1, BGE-M3, Qwen2-VL) and self-hostable infrastructure (Qdrant, Postgres, vLLM), ClauseChain is released under Apache 2.0 with no vendor lock-in. Our demo covers Bangladesh, Thailand, and Singapore — spanning English, Thai, and Bengali; HTML, native PDF, and scanned amendments — and ships with a hand-labeled gold-standard evaluation set so accuracy claims are reproducible by any third party.

## 1.3 The Thesis (one paragraph)

ClauseChain treats hallucination not as a quality issue to be reduced but as a structural impossibility to be enforced. A classification cannot exist in the system without a verbatim, hash-anchored, independently-verifiable citation. Verification is a machine gate, not a human courtesy: if a claim fails the Cite-Verify-Reject loop, it is rejected before a human ever sees it. This single principle — visible in every screen, every output record, and every ledger entry — is what makes AI safe to use for evidence-based digital governance.

---

# 2. Problem Statement & Objectives

## 2.1 Problem Understanding & Objectives

> *(≈195 words — directly answers the application "Problem Understanding & Objectives" field.)*

The RDTII framework gives the international community a shared yardstick for digital trade governance, but populating it remains a slow, manual research task. As digital regulations proliferate — particularly across developing economies whose laws are often spread across primary acts, amendments, ministerial regulations, and non-binding guidelines, and frequently published only in scanned form — the gap between regulatory reality and analytical coverage widens.

AI offers an obvious lever, but the standard generative approach is unsafe for legal and policy work: large language models hallucinate, paraphrase, and confidently misattribute. In a context where citations may influence policy or trade decisions, a fabricated reference is worse than no reference at all.

ClauseChain's objective is to deliver a pipeline that scales human analytical capacity *without* sacrificing trust. Specifically: (1) automate retrieval of regulations from heterogeneous government sources, including scanned non-English documents; (2) classify clauses against the RDTII rubric with cited evidence; (3) make every claim reproducibly verifiable by a third party through hash-anchored provenance; and (4) keep humans firmly in the loop via a side-by-side audit interface. The result is a tool for trustworthy, evidence-based digital governance.

## 2.2 Measurable Objectives

| # | Objective | Target (application stage) |
|---|---|---|
| O1 | Automated discovery from official sources | ≥15 primary instruments across 3 jurisdictions, autonomously crawled |
| O2 | Multi-format extraction including scanned/non-English | HTML, native PDF, scanned PDF in EN/BN/TH all handled |
| O3 | Accurate RDTII classification | Classification F1 ≥ 0.75 across all three jurisdictions |
| O4 | Citation fidelity | Citation accuracy ≥ 0.95 (verbatim span verifiably present in source) |
| O5 | Zero unverified output | 100% of shipped classifications pass all three CVR gates |
| O6 | Reproducibility | Any third party can independently re-verify any citation from the export bundle |
| O7 | Open and sustainable | Runs fully self-hosted on a single 24 GB GPU; Apache 2.0; no mandatory paid API |

---

# 3. Scope & Policy Alignment

## 3.1 Which Policy Area Is Most Relevant

> *(Directly answers the application "Which policy area" field.)*

ClauseChain addresses both mandatory pillars as its primary scope:

- **Pillar 6 — Cross-Border Data Policies.** Data localization requirements, conditional cross-border transfer regimes, processing-location requirements, adequacy/comparability conditions.
- **Pillar 7 — Domestic Data Protection & Privacy.** Lawful basis for processing, purpose limitation, data-subject rights, breach notification, retention limits, DPO/accountability obligations, government access to personal data.

These two pillars are not just selected — they are the demonstrated core of the system, with a hand-labeled evaluation set built specifically for their sub-criteria.

## 3.2 Bonus / Extensible Scope

The architecture is pillar-agnostic: a pillar is defined by a structured YAML rubric, so adding coverage requires no model retraining. Bonus pillars demonstrated as extensibility proof: **Pillar 8 (Internet Intermediary Liability)**, with Pillars 9 and 12 reachable by the same mechanism.

## 3.3 In Scope / Out of Scope

| In scope | Out of scope (this stage) |
|---|---|
| Discovery, extraction, OCR, classification, verification, export | Real-time legal advice or legal interpretation as authority |
| RDTII Pillar 6 & 7 mapping with citations | Drafting new legislation |
| Human-in-the-loop review at selectable autonomy levels | Fully autonomous legal decision-making without audit |
| Self-hosted open-weight default; optional cloud routing | Replacing qualified legal counsel |
| EN / BN / TH for the demo | Exhaustive global language coverage (roadmapped) |

---

# 4. Users & Use Cases

## 4.1 Personas

**P1 — Regulatory Analyst** (UN agency, World Bank, ministry, think-tank). Needs to map a jurisdiction's laws to RDTII efficiently and produce a defensible, citable dataset. Values accuracy and traceability over speed.

**P2 — Reviewer / Legal Lead.** Verifies, edits, or rejects classifications. Needs the source visible beside every claim and needs human edits to be as accountable as machine output.

**P3 — Evaluator / Auditor (incl. hackathon judge).** Needs to assess the system's accuracy and trust properties quickly, and to independently reproduce any citation.

**P4 — Operator / Administrator.** Configures jurisdictions, autonomy levels, and model routing; manages self-hosted deployment.

## 4.2 Representative User Stories

- As an **analyst**, I paste a government URL and watch the system crawl, extract, and classify it, so I can map a new jurisdiction in hours rather than weeks.
- As a **reviewer**, I see the original source highlighted beside each classification, so I can approve or reject with full context.
- As an **evaluator**, I click any citation, fetch its source, recompute its hash, and confirm it matches — so I can trust the dataset without trusting the model.
- As an **operator**, I set the run to fully autonomous for a bulk re-crawl, knowing verification still runs and everything is logged for audit.

---

# 5. Functional Requirements

Requirements are grouped by pipeline stage. **MUST** = required for the application demo; **SHOULD** = Round 1; **MAY** = Finals / roadmap.

## 5.1 Discovery (FR-D)

- **FR-D1 (MUST):** Accept a manually entered URL (or multiple) for direct scraping, with validation against internal/loopback addresses (SSRF protection).
- **FR-D2 (MUST):** Crawl official sources from a per-jurisdiction seed registry using Crawl4AI, respecting robots.txt and rate limits.
- **FR-D3 (MUST):** Compute a discovery-confidence score per document (source authority + type + topical relevance).
- **FR-D4 (MUST):** Detect and surface blocked/CAPTCHA/login-walled pages as "needs manual retrieval" — never bypass them.
- **FR-D5 (SHOULD):** Detect repealed/draft/superseded markers and flag accordingly.

## 5.2 Harvest & Triage (FR-H)

- **FR-H1 (MUST):** Present the harvested set grouped by detected file type for human review before extraction.
- **FR-H2 (MUST):** Allow keep/discard decisions with reasons; discards remain visible and reversible (non-destructive).
- **FR-H3 (MUST):** Cluster near-duplicate documents so the authoritative version is kept.
- **FR-H4 (SHOULD):** Allow human correction of mis-detected file types, rerouting extraction.

## 5.3 Extraction & Conversion (FR-E)

- **FR-E1 (MUST):** Route by *true* file type (content sniffing), forking native PDF vs. scanned PDF.
- **FR-E2 (MUST):** Convert HTML/native PDF/DOCX to clean markdown + canonical JSON preserving legal hierarchy (Act → Part → Chapter → Section → Sub-clause).
- **FR-E3 (MUST):** Separate non-text assets (images, tables, embedded files) with references back to their location in the parent.
- **FR-E4 (MUST):** For scanned documents, run dual-engine OCR (Qwen2-VL + Tesseract) with consensus voting; flag disagreements.
- **FR-E5 (MUST):** Record `char_offset`, `page`, and `bbox` for every structural node (required for citation trace-back).

## 5.4 Indexing & Mapping (FR-M)

- **FR-M1 (MUST):** Embed clauses with a multilingual model (BGE-M3); store in a vector index (Qdrant) with hybrid dense+sparse retrieval.
- **FR-M2 (MUST):** Encode each RDTII pillar as a structured YAML rubric (operative predicates, exception indicators, typical phrases).
- **FR-M3 (MUST):** Classify each clause via a constrained JSON schema (no free-form prose), supporting multi-label output.
- **FR-M4 (SHOULD):** Inject relevant definitions into classifier context for any clause using a defined term.
- **FR-M5 (MAY):** Layer a legal knowledge graph (amendments, cross-references, definitions, conflicts) over the vector backbone.

## 5.5 Verification — CVR Loop (FR-V)

- **FR-V1 (MUST):** Gate 1 Span Match — verbatim span must appear in source (length-proportional fuzzy tolerance, OCR-only).
- **FR-V2 (MUST):** Gate 2 NLI Entailment — span must entail the classification claim above a calibrated threshold.
- **FR-V3 (MUST):** Gate 3 Structural Plausibility — cited section must exist; rubric operative predicates must be present.
- **FR-V4 (MUST):** Any gate failure → reject or route to human review; never silently ship.
- **FR-V5 (MUST):** Log every gate result (including fuzzy edit distance and NLI score) to the provenance ledger.

## 5.6 Conflict & Version Reconciliation (FR-C)

- **FR-C1 (MUST):** Resolve precedence using *both* authority level and recency (higher authority wins; within equal authority, newer wins).
- **FR-C2 (MUST):** Surface genuine conflicts for human adjudication rather than auto-resolving; log the decision.
- **FR-C3 (MAY):** Reconstruct full amendment chains to compute current consolidated text.

## 5.7 Output & Export (FR-O)

- **FR-O1 (MUST):** Emit machine-readable output (JSON, JSON Lines, CSV) — one record per mapping with indicator, verbatim span, citation, discovery tags, and verification results.
- **FR-O2 (MUST):** Emit a self-contained provenance bundle (sources + hashes + classifications) enabling independent re-verification.
- **FR-O3 (MUST):** Version the output schema as a stable contract.

## 5.8 Autonomy & Routing (FR-A)

- **FR-A1 (MUST):** Provide selectable autonomy levels L0–L3 (review-everything → fully autonomous), per-run with per-stage override.
- **FR-A2 (MUST):** Autonomy controls only *human gating*; CVR verification always runs.
- **FR-A3 (MUST):** Tag auto-approved actions in the ledger to distinguish machine from human decisions.
- **FR-A4 (SHOULD):** Provide a model-router abstraction allowing local or cloud providers per task, with an escalation strategy (local-first, escalate low-confidence items) and a token-budget cap.

---

# 6. The Two Tasks

The hackathon defines two technical tasks. ClauseChain maps cleanly onto both.

## 6.1 Task 1 — Automated Evidence Discovery

The system finds and reads real legal documents autonomously. This comprises Discovery (FR-D), Harvest (FR-H), and Extraction (FR-E): navigating official portals via Crawl4AI, retrieving laws including scanned/image files, detecting relevant documents by keyword/semantic cues, and extracting text with high fidelity while preserving structure. The headline capability is turning messy, scanned, non-English (Bengali/Thai) PDFs into clean, structured, high-fidelity markdown and canonical JSON.

## 6.2 Task 2 — Intelligent Mapping & Verification

After retrieval, the system pinpoints, classifies, and verifies evidence transparently. This comprises Indexing & Mapping (FR-M), the CVR Loop (FR-V), Conflict Reconciliation (FR-C), and the human-in-the-loop audit interface. It identifies clauses for each RDTII category, provides precise citations (article/section/paragraph), displays extracted text beside the original source, and handles multi-jurisdiction, multi-language documents consistently.

---

# 7. Anti-Hallucination Design — The CVR Loop

## 7.1 Technical Design (Reduces Hallucination)

> *(≈245 words — directly answers application Q6. Includes: what the model may do, may not do, how claims link to evidence, and one concrete failure case.)*

ClauseChain enforces hallucination resistance structurally, not by prompt engineering alone.

**What the model is allowed to do:** Fill a constrained JSON schema with (a) a `pillar`/`sub_criterion` chosen from a fixed enumeration, (b) a `verbatim_span` quoted from the retrieval context, (c) tagged fields for `principal_rule`, `exceptions`, and `conditions`, and (d) a calibrated `confidence` score. It may output `null` if no retrieved evidence applies.

**What the model is not allowed to do:** Generate free-form prose; paraphrase the source in citation fields; cite documents not present in retrieval context; use general or training-derived knowledge to make legal claims; or emit a classification with an empty `verbatim_span`.

**How every claim links to evidence:** Each output record carries `source_hash_sha256`, `source_url`, `section_number`, `page`, `char_offset`, and `bbox`. The `verbatim_span` is verified character-for-character against the source (Gate 1). An NLI verifier confirms entailment (Gate 2). A structural check confirms the cited section exists and the rubric's operative predicates are present (Gate 3).

**Failure case caught:** A clause addressing *data retention periods* has lexical overlap with both "retention" and "transfer." The model labels it `6.1 Data Localization`. Gate 2 computes entailment between the span ("Personal data shall not be retained for longer than reasonably necessary…") and the claim: score 0.15. Gate 3 finds none of 6.1's operative predicates ("stored within", "processed domestically"). The output is rejected before display and routed to human review with both reasons attached.

## 7.2 The Three Gates

| Gate | Check | On failure |
|---|---|---|
| **1 — Span Match** | Verbatim span present in source, char-for-char (length-proportional fuzzy tolerance, applied only to known-OCR regions, edit distance logged) | Reject |
| **2 — NLI Entailment** | DeBERTa-v3 NLI: does the span entail the claim? Threshold calibrated on the gold set | Route to human review |
| **3 — Structural Plausibility** | Cited section exists in parsed structure; rubric operative predicates present; clause role is operative (not definition/recital) | Reject |

**Critical principle:** autonomy level controls how often a *human* approves; the three gates are *machine* checks that always run, even in fully autonomous mode. Autonomy removes the human bottleneck, never the safety rail.

---

# 8. Legal-Interpretation Logic (PDPA Worked Example)

This section addresses the application's Q1 (the PDPA rule/exception scenario) as a formal requirement, because the system's correctness depends on handling the rule/exception structure that is ubiquitous in statute.

## 8.1 The Linguistic Conflict (Q1.1)

> *(≈140 words)*

The two phrases appear contradictory in isolation. The first is an **absolute prohibition** ("shall not transfer any personal data"). The second is a **conditional exception** ("except in accordance with requirements"). Read naively, one says "never" and the other says "sometimes" — a surface-level NLP system, especially one operating at sentence granularity, would flag these as conflicting modal claims.

The conflict is purely linguistic and structural. The clauses occupy different syntactic positions: the first is the principal rule; the second is a subordinate carve-out. They use opposing modal cues ("shall not" vs. "except"), which is precisely the lexical pattern that triggers contradiction detectors trained on general-purpose text. Without explicit handling of the principal-rule + exception relationship, a system misreads the law as self-contradictory rather than as a regulated default with a controlled pathway.

## 8.2 Which Takes Precedence, and Why (Q1.2)

> *(≈140 words)*

The first phrase — the prohibition — is the primary regulatory standard. The second is an exception, operative only when its enumerated conditions are met. The interpretation rule: a general rule with a qualified exception means the rule applies by default; the exception applies only when its preconditions are satisfied, and the burden of demonstrating satisfaction lies with the party invoking it.

The policy rationale is **data protection by default, controlled flow by exception**. The default protects the data subject; the exception creates a narrow, conditional pathway whose conditions exist precisely to preserve the protective standard. This structure mirrors GDPR (Article 44 and Chapter V), Singapore PDPA (Section 26), and Thai PDPA (Section 28). ClauseChain therefore treats the prohibition as the regulatory baseline for Pillar 6 mapping, with the exception's conditions stored as machine-readable predicates checked separately.

## 8.3 Programming the AI to Decide Correctly (Q1.3)

> *(≈140 words)*

Three layered mechanisms:

**(1) Structural parsing.** Each provision is segmented and tagged by role — `principal_rule`, `exception`, `condition`, `definition` — by a fine-tuned classifier. This tags the two clauses as `principal_rule` and `exception` rather than two independent assertions.

**(2) Discourse linking.** A rule-based component detects subordinating connectors ("except", "unless", "provided that", "notwithstanding", "subject to") and binds exception clauses to their principal rule as a single composite *rule unit*. They are retrieved together, never in isolation.

**(3) Structured classification.** The LLM is constrained to a JSON schema with separate fields for `principal_rule`, `exceptions[]`, and `conditions[]`. It cannot collapse the two phrases into a single free-text classification. A downstream verifier confirms the principal rule and exception share the same section reference and that conditions are explicitly listed.

---

# 9. System Architecture

## 9.1 End-to-End Workflow (Q2)

> *(≈245 words — directly answers application Q2: collect → extract → classify → explain → cite → export.)*

ClauseChain implements the six-stage workflow as follows:

**Collect.** A per-jurisdiction seed registry (YAML) lists official gazettes, ministry portals, and statute databases. Crawl4AI handles JavaScript-heavy government sites with polite crawling (robots.txt, rate limiting, identifying User-Agent). A lightweight classifier tags each retrieval as act / amendment / regulation / guideline / ruling. A human triage step confirms the harvested set before compute is spent.

**Extract.** A file-type router dispatches HTML to a markdown + legal-structure parser, native PDFs to Docling, and scanned PDFs to dual-engine OCR (Qwen2-VL primary, Tesseract secondary) with consensus voting. All paths emit a canonical JSON tree preserving the Act → Part → Chapter → Section → Sub-clause hierarchy, with character offsets, page numbers, and bounding boxes per node.

**Classify.** RDTII Pillars 6 and 7 are encoded as structured YAML rubrics. Clauses are embedded with BGE-M3 (multilingual) into Qdrant. For each clause, relevant rubric criteria are retrieved and Llama 3.1 fills a constrained JSON schema (pillar, sub-criterion, verbatim_span, principal_rule, exceptions, conditions, confidence).

**Explain.** The structured output renders in an audit interface: classification card beside the original document with the cited span highlighted.

**Cite.** Every claim carries a SHA-256 hash of the source plus character offset and bounding box — third-party reproducible.

**Export.** Outputs serialize to JSON, JSON Lines, and CSV (RDTII matrix), plus an append-only provenance ledger.

## 9.2 Authoritative-Source Resolution Pipeline (Q5)

> *(≈245 words — directly answers application Q5: the three-source scenario.)*

Step-by-step pipeline for the three-source scenario (HTML regulation, scanned amendment PDF, non-binding ministry guideline):

**1. Authority classification.** Each source is tagged via the document classifier and the jurisdiction's authority hierarchy: the HTML regulation is *primary legislation, authoritative*; the scanned amendment is *amending instrument, authoritative for what it amends*; the ministry guideline is *non-binding interpretive guidance*. The guideline is retained as context but excluded from binding citations.

**2. Ingestion.** The HTML passes through the markdown + legal parser. The scanned amendment is rasterized at 300 DPI and processed by Qwen2-VL and Tesseract in parallel; token-level consensus resolves OCR disagreements; low-confidence regions are flagged, never silently guessed. The guideline is parsed and tagged `binding: false`.

**3. Version reconciliation.** A version graph records that the amendment modifies named sections of the regulation. For any amended section, the amended text supersedes the original; untouched sections remain as published.

**4. Clause retrieval.** For the cross-border-transfer query, BGE-M3 hybrid retrieval returns candidates across all sources; the guideline is dropped from the citation set (shown as context only).

**5. Conflict resolution.** If HTML and amendment disagree, precedence considers authority then recency — the amendment wins by recency; the conflict is logged.

**6. Output.** The citation points to the amended section with the amendment PDF's SHA-256, page, and bounding box. The guideline appears as a separately-tagged supplementary note. Any unresolved OCR ambiguity in the cited span surfaces as a confidence flag for human approval.

## 9.3 Component Diagram (textual)

```
SEED REGISTRY (YAML, per jurisdiction)
        │
        ▼
[1] DISCOVERY ── Crawl4AI (robots-aware) ── manual URL input
        │
        ▼
[2] HARVEST / TRIAGE ── type detection · discovery confidence · human go-ahead
        │
        ▼
[3] EXTRACTION ── file-type router
        ├── HTML  → markdown + legal parser
        ├── native PDF → Docling
        └── scanned PDF → Qwen2-VL + Tesseract (consensus)
        │   (emits canonical JSON: hierarchy + offsets + page + bbox + hash)
        ▼
[4] INDEXING ── BGE-M3 embeddings → Qdrant (hybrid)  [+ legal KG, Phase 2]
        │
        ▼
[5] MAPPING ── RDTII YAML rubric + Llama 3.1 (constrained JSON schema)
        │
        ▼
[6] CVR LOOP ── Gate 1 Span Match → Gate 2 NLI → Gate 3 Structural
        ├── pass → verified
        └── fail → reject / human review
        │
        ▼
[7] OUTPUT ── JSON / JSONL / CSV + provenance bundle + append-only ledger
        │
        ▼
[8] AUDIT UI ── 9-page surface (see §11)
```

## 9.4 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Crawling | Crawl4AI | Native clean-markdown output; robots-aware |
| HTML parse | markdown parser + custom legal-structure parser | Preserves article/section hierarchy |
| Native PDF | Docling | Layout-aware, open source |
| OCR | Qwen2-VL 7B + Tesseract (consensus) | Bengali/Thai support; cross-validation |
| Embeddings | BGE-M3 | Multilingual (100+ langs), hybrid dense+sparse |
| Vector store | Qdrant | Open source, self-hostable, hybrid search |
| Knowledge graph (Phase 2) | Kùzu / Postgres property graph | Embedded, no extra service for self-host |
| Metadata DB | Postgres | Reliable, version graph |
| Object storage | MinIO | S3-compatible, self-hostable |
| LLM serving | vLLM | Throughput, OpenAI-compatible API |
| Classifier LLM | Llama 3.1 8B (default, local) | Open weights, fits 24 GB GPU |
| Model router | Custom abstraction | Local + cloud adapters, escalation strategy |
| NLI verifier | DeBERTa-v3 (MNLI/FEVER) | Entailment scoring |
| Output structuring | Outlines / Pydantic | Grammar-constrained JSON |
| Orchestration | Prefect 2 | Lightweight pipeline orchestration |
| Backend | FastAPI | Standard async API |
| Frontend | React + Tailwind + shadcn/ui + PDF.js | Audit UI with bbox overlay |
| Deployment | docker-compose | Single-command self-host |
| License | Apache 2.0 | Hackathon requirement |

---

# 10. Data Model & Output Specification

## 10.1 The Output Record (the actual deliverable)

The product's primary deliverable is a **machine-readable file** (JSON Lines / CSV), one record per mapping:

```json
{
  "record_id": "BD-DSA-2018-s26-1-p6.1",
  "jurisdiction": "BD",
  "indicator": "6.1",
  "indicator_name": "Data localization requirement",
  "pillar": 6,
  "verbatim_span": "...shall not save such data outside Bangladesh",
  "principal_rule": "...",
  "exceptions": [],
  "conditions": [],
  "citation": {
    "instrument_id": "BD-DSA-2018",
    "instrument_type": "act",
    "authority": "primary_legislation",
    "section": "26(1)",
    "page": 14,
    "char_offset": [12453, 12527],
    "bbox": [72, 248, 540, 286],
    "source_url": "https://bdlaws.minlaw.gov.bd/act-1261/section-46556.html",
    "source_hash_sha256": "a3f5...b9c2",
    "retrieved_at": "2026-05-17T08:14:22Z+06:00"
  },
  "discovery_tags": ["crawl:native-pdf", "parser:docling"],
  "verification": {
    "gate1_span_match": "exact",
    "gate1_edit_distance": 0,
    "gate2_nli": 0.94,
    "gate3_structural": "pass",
    "final_decision": "verified",
    "auto_approved": false,
    "model": "llama-3.1-8b-instruct@local",
    "verifier": "deberta-v3-mnli"
  },
  "confidence": 0.94,
  "status": "verified",
  "schema_version": "1.0"
}
```

## 10.2 Export Artifacts

| Artifact | Format | Use |
|---|---|---|
| Classification records | JSON / JSONL | Programmatic consumption |
| RDTII matrix | CSV | Reporting, jurisdictions × indicators |
| Provenance bundle | ZIP (sources + hashes + records) | Independent re-verification |
| Ledger export | JSONL | Tamper-evident audit trail |

---

# 11. User Interface Requirements

ClauseChain's interface is a nine-page product surface implementing the full visible pipeline. Layout follows the established design system (Apple-clean, SF Pro typography, teal `#0FB5A7` accent, gradient text reserved for hero titles).

| Page | Name | Purpose |
|---|---|---|
| 1 | Workspace Dashboard | Coverage, KPIs, recent activity, pipeline health |
| 2 | Jurisdiction Detail | Per-jurisdiction instruments and coverage |
| 3 | Document Workspace (Audit View) | Single-clause review: source + classification + CVR chain + approve/edit/reject |
| 4 | RDTII Matrix | Jurisdictions × sub-criteria, exportable |
| 5 | Pipeline & Provenance Ledger | Tamper-evident hash-chained audit trail |
| 6 | Discovery & Crawl Console | Crawl4AI interface, manual URL, live monitor |
| 7 | Harvest Review & Triage | Type-grouped human go-ahead before extraction |
| 8 | Extraction & Markdown Workspace | Source → markdown, asset separation, OCR consensus diff (8.1) |
| 9 | Mapping Run | Live classification through the CVR gates, model routing |
| 10 | Source Trace View | Turnitin-style: every mapped span highlighted and linked to source |
| (Export) | Export Output | Per-record gate breakdown, discovery tags, JSON/CSV/JSONL download |

A persistent pipeline stepper (Discover → Harvest → Separate → Convert → OCR → Embed → Map → Verify → Export) makes the full process visible — a core requirement, since the brief expects every step to be shown.

UI principles: monospace for all hashes/citations/timestamps; the CVR verification chain visible by default on every classification; the verbatim span treated as a distinct evidence block, never body text; status colour used only for meaning (verified/pending/rejected/conflict).

---

# 12. Non-Functional Requirements

| # | Requirement | Target |
|---|---|---|
| NFR-1 Performance | Classification throughput on 24 GB GPU | ≥5 clauses/sec (batched, vLLM) |
| NFR-2 Scale | Demo corpus | ~15 instruments, ~600 clauses, ~3,000 PDF pages |
| NFR-3 Cost | Self-hosted operating cost | $0 recurring (no mandatory paid API) |
| NFR-4 Cost control | Cloud routing budget | Per-run token cap; pause/fallback on cap |
| NFR-5 Reliability | Crawl resilience | Manual-download fallback for priority instruments |
| NFR-6 Reproducibility | Citation re-verification | 100% from provenance bundle, offline |
| NFR-7 Portability | Deployment | Single docker-compose; no external dependency for default stack |
| NFR-8 Determinism | Canonical dataset | Pinned local weights; model+version logged per record |
| NFR-9 Observability | Pipeline visibility | Every stage streamed to UI; every event logged to ledger |

---

# 13. Compliance & Governance

ClauseChain is designed for use by public-sector and intergovernmental bodies. It therefore meets recognized international standards for data protection, accessibility, and governance.

## 13.1 Data Protection (GDPR & Equivalents)

ClauseChain processes *published legal texts*, not personal data of individuals, in its core function. Nonetheless, because it may be deployed by data-protection authorities and operate on documents that contain incidental personal data (e.g., named officials, case parties), it adheres to GDPR principles and their regional equivalents (Singapore PDPA, Thai PDPA, the draft Bangladesh PDPA).

| GDPR principle | How ClauseChain complies |
|---|---|
| **Lawfulness, fairness, transparency** (Art. 5(1)(a)) | Processes only publicly published legal instruments; all processing is logged and auditable in the provenance ledger. |
| **Purpose limitation** (Art. 5(1)(b)) | Data is used solely for regulatory classification; no secondary use, profiling, or marketing. |
| **Data minimisation** (Art. 5(1)(c)) | Extracts only legal-text content; non-content assets (signatures, photos) are separated and not processed for content. |
| **Accuracy** (Art. 5(1)(d)) | The entire CVR loop exists to enforce accuracy; corrections via human review are versioned. |
| **Storage limitation** (Art. 5(1)(e)) | Source documents and intermediate artifacts are retained only as needed for provenance; configurable retention. |
| **Integrity & confidentiality** (Art. 5(1)(f)) | Hash-anchored, tamper-evident ledger; self-hosted default keeps data within the operator's infrastructure. |
| **Accountability** (Art. 5(2)) | Every action — machine or human — is logged with attribution; auto-approved actions are tagged. |
| **Data sovereignty / residency** | All-local default means no data leaves the operator's jurisdiction; cloud routing is opt-in and disclosed. Critical for governments unwilling to send draft legislation to foreign APIs. |
| **Right to rectification** (Art. 16) | Where incidental personal data appears, the human-review and edit flow allows correction; edits are auditable. |
| **Privacy by design & default** (Art. 25) | Minimisation, local processing, and audit logging are architectural defaults, not add-ons. |

A Data Protection Impact Assessment (DPIA) template is included in the repository for operators deploying in regulated environments.

## 13.2 Accessibility (WCAG 2.1 AA)

The interface conforms to **WCAG 2.1 Level AA**, the standard referenced by most public-sector procurement (including UN web-accessibility guidance, EU EN 301 549, and US Section 508).

| WCAG principle | Implementation |
|---|---|
| **Perceivable** | Text alternatives for all non-text content; status never conveyed by colour alone (icons + labels accompany the verified/pending/rejected colours); minimum 4.5:1 contrast for body text. |
| **Operable** | Full keyboard navigation (the ⌘K command palette is keyboard-first); no keyboard traps; visible focus states; no time-limited actions without extension. |
| **Understandable** | Plain-language labels and error messages (no raw stack traces); consistent navigation across all nine pages; predictable interaction patterns. |
| **Robust** | Semantic HTML and ARIA roles; compatible with assistive technologies (screen readers); tested against automated (axe) and manual checks. |

Accessibility is treated as a requirement, not a feature: a UN-grade tool must be usable by analysts with disabilities, and public-sector procurement frequently mandates AA conformance.

## 13.3 Open-Source Governance & Ethical Use

- **License:** Apache 2.0 — permissive, patent-protective, suitable for a global public good.
- **Modularity / no vendor lock-in:** every model and service is swappable; the default stack is fully open-weight and self-hostable.
- **Ethical crawling:** robots.txt respected; rate-limited; no bypassing of CAPTCHA/login/access controls.
- **Transparency of automation:** auto-approved (autonomous) decisions are visibly tagged so they can be distinguished from human decisions and audited after the fact.
- **Human authority:** the system is decision-support, not a legal authority; it surfaces conflicts and ambiguity for human adjudication rather than resolving them silently.

## 13.4 Standards Alignment Summary

| Standard | Status |
|---|---|
| GDPR (EU 2016/679) principles | Aligned (§13.1) |
| WCAG 2.1 Level AA | Target conformance (§13.2) |
| EN 301 549 / Section 508 (accessibility procurement) | Aligned via WCAG AA |
| Apache License 2.0 | Adopted |
| ISO 8601 (timestamps) | Used throughout provenance records |
| SHA-256 (FIPS 180-4) | Citation hashing |

---

# 14. Demo Scope & Data Sources

## 14.1 Data Sources & Scope for Demo (Q3)

> *(≈245 words — directly answers application Q3.)*

The demo spans three jurisdictions chosen for a deliberate gradient of technical difficulty and policy diversity.

**Bangladesh** (mixed English/Bengali; HTML + heavy scanned PDF; less-curated sources):
- Digital Security Act 2018 — `bdlaws.minlaw.gov.bd` (HTML)
- Draft Personal Data Protection Act 2023 — ministry portal (PDF)
- ICT Act 2006, as amended — HTML + scanned amendments
- Bangladesh Telecommunication Regulatory Act 2001 — selected provisions

**Thailand** (Thai + English; mature PDPA; scanned older amendments):
- Personal Data Protection Act B.E. 2562 (2019) — `pdpc.or.th` (HTML + PDF, both languages)
- Computer Crime Act B.E. 2550 (2007, amended 2017) — Royal Gazette (scanned PDF)
- ETDA Royal Decrees on electronic transactions

**Singapore** (clean English HTML; gold-standard for benchmarking):
- Personal Data Protection Act 2012, as amended — `sso.agc.gov.sg` (HTML)
- Cybersecurity Act 2018
- Selected MAS notices on cross-border data

Target prototype corpus: ~15 primary instruments, ~600 clauses, ~3,000 PDF pages.

Document types covered: structured HTML, native digital PDF, scanned image-based PDF (including Bengali and Thai scripts), and ministry HTML guidelines. The trio gives three distinct challenges — Singapore (easy: clean English HTML, for benchmarking), Thailand (medium: Thai-script OCR, bilingual drafting), Bangladesh (hard: mixed Bengali/English, scanned-PDF heavy). Demonstrating success across this gradient — especially Bengali scanned documents most teams avoid — is the core technical proof. The seed registry is extensible: adding a jurisdiction is one YAML file plus confirmation that BGE-M3 covers the language.

## 14.2 Evidence & Citation Method (Q4)

> *(≈245 words — directly answers application Q4.)*

Citations in ClauseChain are not produced by the LLM — they are *imposed on* the LLM's output by structural constraint, then independently verified.

Every classification record carries:
- `verbatim_span` — text that must appear character-for-character in the retrieved source (length-proportional fuzzy tolerance, applied only to known-OCR regions, never to paraphrase)
- `source_url` — a stable URL to the original document
- `source_hash_sha256` — hash of the source file at retrieval time
- `instrument_id`, `section_number`, `page`, `char_offset`, `bbox`
- `retrieved_at` — ISO 8601 timestamp

Verification runs in three sequential gates:

**Gate 1 — Span Match.** The verbatim_span is matched against the source. Exact match preferred; small fuzzy tolerance only to absorb OCR noise (e.g., Bengali conjuncts, Thai tone marks). The edit distance is logged so reviewers can audit every fuzzy match. Failure → reject.

**Gate 2 — Entailment.** A DeBERTa-v3 NLI model checks whether the span entails the classification claim, against a gold-set-calibrated threshold. Failure → human review, not silent acceptance.

**Gate 3 — Structural Plausibility.** The cited section must exist in the parsed structure, and the rubric's operative predicates for the assigned sub-criterion must be present.

Any third party can re-verify independently: fetch the source via `source_url`, recompute SHA-256, locate the bounding box on the cited page, and re-run the NLI score locally. This is hash-anchored provenance — hallucinated citations become structurally impossible, not merely unlikely. The Source Trace View (Page 10) renders every citation as a highlighted span linked to its origin, similarity-report style.

---

# 15. Evaluation & Acceptance Criteria

## 15.1 Gold-Standard Evaluation Set

A hand-labeled set built by the team's legal lead: ~20 clauses per jurisdiction (BD/TH/SG), each labeled with the correct indicator, verbatim span, principal rule, exceptions, and authority. Stored in the repository and committed to version control.

## 15.2 Metrics

| Metric | Definition | Target |
|---|---|---|
| Classification F1 | Per pillar, per language, overall | ≥ 0.75 all jurisdictions |
| Citation accuracy | % of verbatim spans verifiably present in source | ≥ 0.95 |
| Citation precision | % of classifications citing the *correct* span | Reported honestly |
| Recall | % of relevant clauses found (false-negative measure) | Reported (most teams hide this) |
| NLI calibration | Correlation of NLI score with human-judged correctness | Used to set Gate 2 threshold |
| CVR rejection rate | % of model outputs rejected by the loop | Reported as a trust signal |
| Inter-annotator agreement | Cohen's κ between two legal reviewers on the gold set | Reported (distinguishes model error from genuine ambiguity) |

## 15.3 Baseline Comparison

The same gold set is run against a naive frontier-model baseline (simple "classify and cite" prompt, no CVR loop), measuring the same metrics. Reporting both demonstrates the value the verification architecture adds.

## 15.4 Acceptance Criteria (application stage)

The product is acceptance-ready when: O1–O7 (§2.2) are met; all MUST functional requirements are implemented; the demo runs end-to-end on the three jurisdictions; and a third party can reproduce at least one citation from the exported provenance bundle without assistance.

---

# 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bengali/Thai OCR quality insufficient | Med | High | Dual-engine consensus; fall back to English-only demo for BD if needed; show Bengali as proof-of-concept |
| OCR fuzzy tolerance masks a paraphrase | Med | High | Length-proportional, OCR-region-only, edit distance logged and auditable |
| Bounding-box misalignment on scans | Med | High | Region-level fallback when bbox confidence low; test on demo docs early |
| NLI weak on dense legal language | Med | Med | Calibrate threshold on gold set; LLM-as-NLI fallback for borderline scores |
| Crawler blocked by government site | Med | Med | Manual-download fallback for priority instruments |
| Cloud routing cost runaway (L3) | Low | Med | Per-run token budget cap; pause/fallback |
| Reproducibility vs. cloud model drift | Med | Med | Pin local weights for canonical dataset; log model+version per record |
| Knowledge graph not ready by deadline | High | Low | Vector-only is a credible Alpha; graph is a Round-1 deliverable |
| False negatives (missed clauses) invisible | Med | High | Recall-oriented first pass; measure recall explicitly; human can browse unclassified clauses |

---

# 17. Roadmap

| Phase | Window | Deliverable |
|---|---|---|
| **Application (Alpha)** | by 25 May 2026 | Backend engine performing discovery, extraction, mapping, categorization on sample documents; machine-readable output sample; nine-page UI; technical memo; concept video |
| **Round 1 (Prototype)** | Jun–Jul 2026 | All three jurisdictions; ≥200 labeled clauses; legal knowledge graph layer (amendments, cross-references, conflicts); bonus pillars (8, 12); inter-annotator reliability |
| **Round 2 (Production)** | Aug–Sep 2026 | Public hosted demo; full provenance verification UI; cross-country comparison view; contributor documentation; workshop-quality paper on the CVR loop |
| **Finals** | 15 Oct 2026, Bangkok | Live on-site demonstration across three jurisdictions; open-source release |

---

# Appendix A — Application Question Cross-Reference

| Application field | PRD section |
|---|---|
| Project Title | §1.1 |
| Short Proposal Summary (200w) | §1.2 |
| Problem Understanding & Objectives (200w) | §2.1 |
| Policy area (Pillar 6 & 7) | §3.1 |
| Q1.1 Linguistic conflict (150w) | §8.1 |
| Q1.2 Precedence + rationale (150w) | §8.2 |
| Q1.3 Programming the AI (150w) | §8.3 |
| Q2 End-to-end approach (250w) | §9.1 |
| Q3 Data sources & scope (250w) | §14.1 |
| Q4 Evidence & citation method (250w) | §14.2 |
| Q5 Three-source authority scenario (250w) | §9.2 |
| Q6 Anti-hallucination design (250w) | §7.1 |
| Technical Memo (750w) | §9 + §7 + §15 (condense to 750w for upload) |

---

# Appendix B — Glossary

| Term | Definition |
|---|---|
| **RDTII** | Regional Digital Trade Integration Index — the UN framework against which clauses are mapped |
| **CVR Loop** | Cite-Verify-Reject — the three-gate verification mechanism |
| **Verbatim span** | The exact, character-for-character quote from the source that supports a classification |
| **Hash-anchored citation** | A citation bound to the SHA-256 hash of its source, enabling independent re-verification |
| **Autonomy level (L0–L3)** | The degree of human gating in a run, from review-everything to fully autonomous |
| **Operative predicate** | A rubric-defined phrase pattern that must be present for a sub-criterion to apply |
| **Provenance ledger** | The append-only, hash-chained audit trail of all system events |
| **Discovery confidence** | A score indicating whether a crawled document is the right type from the right authority |

---

*ClauseChain · Apache 2.0 · Submitted to the UN Global Hackathon: AI for Digital Trade Regulatory Analysis 2026 · Anchored by UNESCAP, operated by KMITL.*
