# ClauseChain — Final Submission Answers

Drafted from `ClauseChain_PRD_Application.md`. Word counts noted under each
answer. Copy-paste the **answer text only** into the submission form.

---

## Project Title

**ClauseChain — Measured Legal Evidence for Digital Trade**

---

## Short Proposal Summary (≤ 200 words)

ClauseChain is an open-source AI pipeline that maps digital trade regulation
to the UN RDTII framework, covering Pillar 6 (Cross-Border Data Policies),
Pillar 7 (Domestic Data Protection), Pillar 8 (Internet Intermediary
Liability and Content Access), and Pillar 2 (Public Procurement of ICT Goods
and Services, scoped to Bangladesh).

Its distinguishing feature is not citation alone. ClauseChain verifies the
full evidence chain before any output ships: exact span, source authority,
current-law status, legal structure, predicate meaning, and counter-evidence.
The model is never allowed to classify freely. It fills a structured legal
predicate tuple with fields for actor, action, object, modality, condition,
and exception. A rubric-as-code engine then maps that tuple to RDTII
indicators only after eight verification gates pass.

The demo covers Singapore (clean HTML baseline), Thailand (bilingual
rule-and-exception), and Bangladesh (scanned OCR plus source-status conflict),
across English, Thai, and Bengali.

ClauseChain ships with a reproducible benchmark pack: labeled clauses,
negative cases, OCR stress examples, evaluation scripts, and per-stage metrics
with bootstrap confidence intervals. A working audit UI prototype runs at
`/pipeline/{crawl,harvest,extract,map,trace,export}`. The codebase is Apache
2.0, self-hostable, and provider-agnostic, with optional per-task routing to
OpenAI or Anthropic.

*(~195 words)*

---

## Problem Understanding & Objectives (≤ 200 words)

Regulatory mapping for digital trade is still largely manual. Analysts must
locate statutes, amendments, gazettes, regulator guidance, and translations;
decide which sources are binding and current; identify relevant clauses;
interpret rule-and-exception structures; and map results to a framework such
as RDTII. The process is slow, expensive, and hard to reproduce. It is
especially difficult in jurisdictions where key documents are scanned,
multilingual, frequently amended, or scattered across portals.

Generic AI is not enough. A retrieval-augmented system can quote the right
words from the wrong source, cite a repealed provision, miss an exception,
treat a guideline as binding law, or confuse a domestic retention rule with
a cross-border transfer restriction. In legal and policy work, these errors
are not acceptable.

Objectives:

1. Automate evidence compilation for RDTII Pillars 2 (Bangladesh), 6, 7, and
   8 from official sources.
2. Preserve reviewability so every output binds to a verifiable citation,
   source status, and predicate tuple.
3. Block hallucination through eight verification gates and abstention logic.
4. Measure accuracy per stage with bootstrap confidence intervals.
5. Stay public-good: Apache 2.0, self-hostable, reproducible benchmark, and
   an open contributor workflow for new jurisdictions.

*(~195 words)*

---

## Policy Area

**Selected for this submission:**

- **Pillar 6 — Cross-Border Data Policies** *(mandatory)*
- **Pillar 7 — Domestic Data Protection and Privacy** *(mandatory)*
- **Pillar 8 — Internet Intermediary Liability and Content Access** *(bonus)*
- **Pillar 2 — Public Procurement of ICT Goods and Services** *(bonus — Bangladesh)*

ClauseChain treats RDTII as a rubric-as-code config (`configs/rdtii/pillar_*.yaml`),
so the system is pillar-extensible: new policy areas can be added through
rubric definitions, source packs, labeled examples, and benchmark cases while
reusing the same discovery, extraction, authority-resolution, predicate,
verification, audit, and export pipeline.

For Pillar 8, ClauseChain targets evidence on platform and ISP liability,
safe-harbour rules, content takedown or blocking orders, user-identity
requirements, and monitoring obligations. Demo sources include Singapore
online-safety and intermediary-liability materials, Thailand Computer Crime
Act materials, and Bangladesh digital and cyber security and telecom-content
materials. Guidelines or regulator notices are used only as context, unless
a binding legal source supports the claim.

For Pillar 2 (Bangladesh), ClauseChain targets public procurement rules for
ICT goods and services, specifically: domestic-preference and
non-discrimination requirements, patent and technology specification
constraints in tender documents, and Bangladesh's absence from the WTO
Government Procurement Agreement (GPA). Bangladesh is not a GPA signatory,
which is directly measurable from official WTO and government sources and
constitutes a verifiable RDTII indicator. Bangladesh anchor instruments:

- BPPA procurement rules and standard tender documents (`bppa.gov.bd`)
- Department of Public Procurement materials (`dpp.gov.bd`)
- Statutory procurement framework via the official laws portal
  (`bdlaws.minlaw.gov.bd`)
- WTO GPA membership list (`wto.org`)

These documents are challenging because procurement rules exist partly in
English and partly in Bengali gazette notifications, ICT-specific provisions
are scattered across a general procurement framework rather than consolidated
in one instrument, and the authority resolver must build a current-law graph
across primary legislation, BPPA rules, and amendment circulars.

---

## Q1.1 — Linguistic Conflict Between the Two Phrases (≤ 150 words)

At the surface, the two phrases look contradictory. Phrase 1 says an
organisation "shall not transfer" personal data outside Country A, which
reads as a flat prohibition. Phrase 2 says transfer may occur in accordance
with requirements ensuring comparable protection, which reads as an explicit
allowance. A token-level contradiction detector treats them as mutually
exclusive.

Legally, they are not in conflict. They form one composite rule: phrase 1
states the default prohibition, and phrase 2 supplies the conditional
pathway that qualifies it. The legal effect is that transfer is prohibited
unless comparable-protection requirements are satisfied.

The trap is structural. An AI that chunks the two phrases apart can emit two
contradictory outputs: a Pillar 6 transfer ban from phrase 1 and a permissive
cross-border allowance from phrase 2. The conflict is framing, not substance.

*(~145 words)*

---

## Q1.2 — Which Phrase Takes Precedence, and the Policy Rationale (≤ 150 words)

Neither phrase alone is the primary regulatory standard. The standard is a
composite conditional transfer regime: transfer is prohibited by default
unless statutory comparable-protection requirements are met. Phrase 1 sets
the baseline, and phrase 2 supplies the legally permitted pathway. Read
together, they form one operative rule.

The policy rationale is data protection by default with controlled
cross-border flow. The legislature protects data subjects by requiring that
comparable safeguards travel with the data, while keeping trade-enabling
transfers lawful under defined conditions. Classifying the rule as a total
localization ban would misstate the law and overstate the trade barrier.
Classifying it as an open permission would understate the protection.

ClauseChain therefore maps the rule to a conditional cross-border transfer
indicator under Pillar 6, with modality `prohibited_by_default` and
condition `comparable_protection_required`, which is neither localization
nor open permission.

*(~145 words)*

---

## Q1.3 — How ClauseChain Programs This Decision (≤ 150 words)

The decision is mechanical, not freeform. It follows five deterministic steps:

1. Structural parse: the legal parser identifies the principal prohibition
   and the exception connector ("except", "unless", "provided that") inside
   the same legal node.
2. Rule-unit binding: the Rule Unit Builder binds the principal rule,
   exception, and condition into a single rule unit. Chunking and retrieval
   operate on rule units, so the exception is never separated from the rule.
3. Predicate extraction: the model fills a constrained tuple with
   `modality = prohibited_by_default`, `condition = comparable_protection`,
   and `exception = statutory_requirements_satisfied`, each tied to span IDs.
4. Rubric-as-code mapping: RDTII Pillar 6 indicators are evaluated against
   the tuple deterministically, before any LLM call.
5. Verification gates: Gate G5 (Structure) rejects if the exception is
   missing; Gate G7 (RDTII) rejects if required predicates are absent or an
   exclusion triggers. Any failure routes to human review.

*(~148 words)*

---

## Q2 — End-to-End Approach: Collect, Extract, Classify, Explain, Cite, Export (≤ 250 words)

ClauseChain runs as a ten-stage typed pipeline. Each stage produces an
artifact and a measurable quality signal.

Collect: discovery seeds from per-jurisdiction packs (official statute
databases, gazettes, regulator portals). Scrapy, Playwright, and Crawl4AI
crawl politely with robots awareness and rate limiting. Candidates are
tagged as law, regulation, amendment, guideline, draft, or translation.

Acquire: raw bytes are saved with SHA-256, retrieval timestamp, HTTP headers,
MIME type, and redirect chain. PDFs are rendered to page images for audit.

Resolve: each source is classified as binding, non-binding, draft, repealed,
consolidated, amendment, or translation, and an amendment graph is built.

Extract: HTML through Trafilatura, native PDFs through Docling, scanned PDFs
through PaddleOCR-VL targeting under 5 percent CER. Low-confidence regions
escalate to gpt-5.4-mini or claude-haiku-4-6 for VLM repair. Output includes
text, bbox, and per-token OCR confidence.

Structure: the legal parser builds a section tree, and the Rule Unit Builder
binds principal rules with their exceptions, conditions, definitions, and
cross-references.

Classify: hybrid retrieval combines BM25 with BGE-M3 or Qwen3-Embedding plus
cross-encoder reranking. The model fills a constrained legal predicate tuple,
and rubric-as-code maps it to RDTII indicators for Pillars 2, 6, 7, and 8.

Explain and cite: every claim outputs six mandatory RDTII fields (instrument
title, last-amendment date, source URL, scope, relevant provisions, impact),
plus span IDs, section, bbox, char offsets, SHA-256, and model identity.

Verify and export: eight gates (G1 to G8) check every output. Verified claims
ship as JSONL, CSV matrix, Markdown report, and a provenance bundle
re-verifiable from raw bytes.

*(~245 words)*

---

## Q3 — Data Sources and Scope for the Demo (≤ 250 words)

Three jurisdictions form the core demo pack, each chosen to exercise a
different part of the pipeline.

Singapore is the clean-HTML baseline. Anchor instruments: PDPA 2012
(rev. 2021) ss. 13, 17, 26(1); Personal Data Protection Regulations 2021;
PDPC transfer-limitation guidance; IMDA online-safety and
copyright-intermediary materials. Domains: `sso.agc.gov.sg`, `pdpc.gov.sg`,
`imda.gov.sg`.

Thailand is the host-country multilingual stress test. Anchor instruments:
PDPA B.E. 2562 ss. 26, 27 to 29, 41; Royal Gazette PDFs; PDPC sections 28 to
29 cross-border-transfer notifications; ministry materials. Domains:
`ratchakitcha.soc.go.th`, `pdpc.or.th`, `mdes.go.th`.

Bangladesh is the OCR and source-status stress test. Anchor instruments:
Personal Data Protection Act 2026 (P6/P7); National Data Management Act 2026
(P6/P7); Cyber Protection Act 2026 (P8); BPPA procurement rules and standard
tender documents (P2); Bangladesh Government Press gazette scans. Domains:
`bdlaws.minlaw.gov.bd`, `dpp.gov.bd`, `bppa.gov.bd`.

Document types: official HTML statutes, native PDFs, scanned gazette PDFs,
regulator notices, circulars, guidance, standard tender documents, draft and
consultation materials, and unofficial translations. Original-language
binding law controls; guidance, translations, and commentary are marked
non-binding reviewer aids.

Source authority tiers, applied to every ingested document: G1 is binding
current law (statute pages, current gazettes); G2 is binding subordinate law
(regulations, circulars with legal force); G3 is official guidance
(guidelines, FAQs, advisories); G4 is non-current material (drafts,
consultations); G5 is reviewer aids only (unofficial translations, news).

RDTII scope: core covers Pillar 6 and Pillar 7; optional extension covers
Pillar 2, Pillar 8, and Pillar 12.

*(~243 words)*

---

## Q4 — Evidence and Citation Method (Anti-Hallucination) (≤ 250 words)

Every claim binds to a machine-verifiable citation object carrying the six
mandatory RDTII output fields (instrument title, last-amendment date, source
URL, scope, relevant provisions, impact), plus raw-source SHA-256, retrieval
timestamp, source status, authority tier, section, page, char offsets, bbox,
verbatim quote, span SHA-256, OCR confidence, and all eight gate results.
Cost per 50-page document: cloud-only ≈ USD 0.20; hybrid ≈ USD 0.06;
local-only ≈ USD 0.00 marginal.

Traceability: the quote must appear exactly in the extracted text; section,
page, and bbox must resolve in the audit UI; the source URL must be live or
preserved in the provenance bundle. OCR fuzzy matching is allowed only in
OCR-tagged regions, must log edit distance ≤ 3, and must attach the original
page image.

Eight verification gates run before any output ships:

- G1 Span: exact match, or OCR fuzzy within edit distance 3.
- G2 Location: bbox IoU ≥ 0.85, or section-path match.
- G3 Authority: source tier G1 or G2; guidelines never binding.
- G4 Currentness: `binding_current`; repealed, draft, or superseded fail.
- G5 Structure: cited node is correct legal unit with exceptions present.
- G6 Tuple: multilingual NLI entailment ≥ 0.70.
- G7 RDTII: required rubric predicates present, no exclusion triggered.
- G8 Counter-evidence: search for repeal, amendment, conflict, or definition shift.

Provenance bundle: raw sources, hashes, extracted text, predicate tuples,
gate results, and model identity ship together. A second analyst on a
different machine can re-verify every claim from raw bytes.

*(~225 words)*

---

## Q5 — Three-Source Scenario: HTML Regulation, Scanned Amendment, Ministry Guideline (≤ 250 words)

Given three sources at once (an official HTML regulation, a scanned older
amendment, and a paraphrasing ministry guideline), ClauseChain processes them
as follows.

1. Authority resolution: the HTML on the official statute domain is tagged
   `binding_current` at tier G1 or G2. The scanned amendment is binding but
   marked `superseded` if the HTML is its consolidated version; otherwise it
   remains binding for amendment history. The guideline is tagged
   `non_binding_context` at tier G3, and Gate G3 refuses any binding claim
   sourced solely from it.

2. Extraction: HTML is parsed by Trafilatura with section anchors preserved.
   The scanned PDF runs through PaddleOCR-VL with per-token confidence;
   disagreements against Tesseract are logged with edit distance, bbox, and
   the original page image. A VLM repair pass (Qwen2-VL-7B local, or
   gpt-5.4-mini / claude-haiku-4-6 per operator config) runs only on
   low-confidence regions. Fuzzy matches must carry the original image and
   edit distance of three or less to pass G1.

3. Structure parsing: each binding source becomes a legal node tree (act,
   section, subsection, proviso). The Rule Unit Builder binds the principal
   rule with exception and condition before chunking, so retrieval never
   separates them.

4. Conflict resolution: if HTML and amendment disagree, G4 prefers the
   consolidated current text. The amendment is cited only when amendment
   history is the question; the guideline remains supplementary context and
   never controls.

5. Citation output: the system returns the §12.3 citation object tied to the
   binding source, including URL, SHA-256, section, page, bbox, quote, OCR
   confidence, and the eight gate results, all re-verifiable from the
   provenance bundle.

*(~240 words)*

---

## Q6 — Anti-Hallucination Technical Design (≤ 250 words)

What the model is allowed to do: extract candidate spans from retrieved
context only; fill constrained JSON schemas (Pydantic, Outlines); identify
legal predicate tuple fields (actor, action, object, modality, condition,
exception); suggest RDTII indicators from a fixed enumeration; assign
calibrated confidence; output `not_applicable` or `insufficient_evidence`;
and explain a decision only after verification passes.

What the model is not allowed to do: cite documents outside the retrieved
set; invent sections, URLs, pages, or quotations; treat a guideline as
binding law unless source metadata supports it; use training-memory legal
knowledge as evidence; collapse rule and exception into a single conclusion;
override authority or currentness gates; or emit `verified` without all
required gate results.

Linking claims to evidence: each predicate field links to evidence spans by
`span_id`. Each span carries char offsets, source SHA-256, section path,
page, bbox where available, and OCR confidence. The minimum citation object
is machine-verifiable: the quote must appear exactly in the extracted text,
or, inside OCR-tagged regions, fuzzy-match within edit distance 3 with the
original page image attached. The provenance bundle preserves raw bytes, so
a second analyst on a different machine can reproduce every claim.

Concrete failure case caught: a naive RAG retrieves a ministry guideline
paraphrasing a cross-border rule and a repealed act, then cites the cleaner
guideline as binding law. ClauseChain blocks this: G3 tags the guideline
`non_binding_context`; G4 detects `repealed` status; G8 surfaces the current
consolidated text. The system cites only the current binding section, or
abstains if none is found.

*(~240 words)*

---

## Relevant Skills and Experience (free-text, optional)

Full-stack engineering (Next.js 16 / React 19 / TypeScript / Tailwind on the
audit UI; FastAPI / Django / Celery on the backend); applied NLP and retrieval
(BM25 + multilingual dense embeddings, cross-encoder reranking, constrained
LLM decoding with Outlines / Instructor); document-AI pipelines (Docling,
PaddleOCR-VL, Trafilatura, Qwen-VL); model serving on vLLM and routing across
local + OpenAI + Anthropic; reproducible benchmarking with bootstrap
confidence intervals.

Working artifacts already in-repo: 1,683-line PRD (`ClauseChain_PRD_Application.md`),
720-word concept video script (`VIDEO_SCRIPT.md`), and a live UI prototype at
`/pipeline/{crawl,harvest,extract,map,trace,export}`.

Cloud model routing (per-task, swappable): OCR VLM repair → gpt-5.4-mini /
claude-haiku-4-6; predicate extraction → gpt-5.4-mini / claude-haiku-4-6;
RDTII mapping → gpt-5.4 / claude-sonnet-4-6; NLI verifier → gpt-5.4-mini /
claude-haiku-4-6; embeddings (cloud) → text-embedding-3-large. All local
defaults remain fully functional without cloud credentials.

---

## Submission Checklist

- [ ] Project Title pasted
- [ ] Short Proposal Summary pasted (≤ 200 words)
- [ ] Problem Understanding & Objectives pasted (≤ 200 words)
- [ ] Policy area selected: Pillar 2 (BD) + Pillar 6 + Pillar 7 + Pillar 8
- [ ] Q1.1, Q1.2, Q1.3 pasted (each ≤ 150 words)
- [ ] Q2 pasted (≤ 250 words)
- [ ] Q3 pasted (≤ 250 words)
- [ ] Q4 pasted (≤ 250 words)
- [ ] Q5 pasted (≤ 250 words)
- [ ] Q6 pasted (≤ 250 words)
- [ ] Team-member profiles uploaded (PDF)
- [ ] Relevant skills section filled
