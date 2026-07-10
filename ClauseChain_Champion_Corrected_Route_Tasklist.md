# ClauseChain Champion Route - Corrected Architecture and Implementation Tasklist

**Status:** Execution source of truth from 10 July 2026  
**Goal:** Champion-grade submission, with no exported row that cannot survive document-by-document review.  
**Deadline:** Submit 19 July 2026; hard deadline 20 July 2026 Bangkok time.  
**Scope lock:** Singapore, Australia, Malaysia; Pillars 6 and 7; evidence quality before optional features.

---

## 1. The non-negotiable product promise

ClauseChain is not a chatbot and does not ask a model to author legal evidence.

For every exported row, ClauseChain must prove:

1. The source is official, domestic, current, and in force.
2. The source artifact used by the engine is immutable and hashed.
3. The cited provision exists at the claimed article/section/subsection.
4. The verbatim snippet is constructed from stored source tokens or character offsets, not rewritten by an LLM.
5. The PDF/HTML location resolves to the evidence, with page/anchor and bounding box where available.
6. The full rule, including material conditions, exceptions, definitions, and cross-references, was considered.
7. The indicator mapping passes deterministic legal-fit gates.
8. The NEW/KNOWN label is correct at provision level.
9. A human reviewer approved the final row.

**Export rule:** any failed or unknown item blocks the row from the final submission. Warnings may enter the review queue, never the final file.

---

## 2. Final decision on Docling, PDF libraries, OCR, and VLM

### 2.1 Docling decision

**Do not use Docling Markdown as the canonical text, retrieval corpus, verbatim source, or citation source.**

The AU benchmark found that Docling Markdown:

- flattened an entire provision into one paragraph;
- normalised punctuation and spacing;
- omitted or rearranged some page furniture;
- inserted Markdown headings that the current statute parser misread;
- produced 9.68%-18.76% normalised edit distance from the visually verified native text on the selected pages;
- failed to improve the current parser's section-unit output.

Claude's warning is therefore correct **for `.md` in the canonical evidence path**.

Docling may still be used as an **optional layout sidecar** when objective routing tests identify a complex page. If used:

- consume Docling JSON, not Markdown;
- retain labels, hierarchy suggestions, provenance, page number, and bbox only;
- never use Docling-normalised text as the exported quotation;
- align any proposed region back to native PDF spans or OCR tokens;
- record the Docling version and decision reason;
- require a benchmark showing that it fixes the failing fixture.

### 2.2 Australia route

Australia exposes multiple representations of the same official compilation:

- an **authorised PDF**, used for the final quotation, page proof, and citation;
- EPUB-derived structured XHTML/HTML, used as a structure and anchor oracle;
- Word/EPUB metadata tied to the same `registerId`, compilation number, and date.

The champion AU route is:

```text
legislation.gov.au latest-version API
  -> acquire compilation metadata
  -> acquire authorised PDF and hash it
  -> acquire official EPUB-derived XHTML for structure
  -> parse section/subsection hierarchy from XHTML classes/anchors
  -> align each structured provision to the authorised PDF text spans
  -> create CitationProof(page, bbox, offsets, source hash)
  -> only then retrieve/map/export
```

The XHTML is a parsing accelerator, not the legal authority. The authorised PDF remains the evidence artifact.

### 2.3 Born-digital PDF route

For a clean born-digital page:

1. Extract PyMuPDF `dict`/`rawdict` blocks, lines, spans, fonts, and bboxes.
2. Preserve the source-order extraction and a coordinate-sorted view separately.
3. Remove repeating headers/footers only in the searchable view; never delete them from the raw artifact.
4. Construct citations from original spans and offsets.
5. Use structured portal HTML/XHTML where available to identify hierarchy.
6. Do not OCR the page merely because OCR is available.

### 2.4 OCR route

OCR is used only for image-only pages or pages whose native text layer fails quality checks.

```text
page image
  -> orientation/dewarp/contrast preprocessing
  -> PaddleOCR primary
  -> token text + recognition confidence + bbox
  -> section/citation-token integrity checks
  -> optional second-engine comparison
  -> low-confidence or disagreement -> review/VLM repair lane
```

Rules:

- Paddle confidence is `mean_ocr_confidence`, never CER.
- True CER/WER requires human-transcribed ground truth.
- Citation tokens such as `33D(1)`, `187A`, `(iii)`, and `474.17A` receive separate exact-match checks.
- Local Tesseract is a resilience fallback, not an automatic authority. The benchmark observed `(1) -> ()` and `(iii) -> (ii)` errors.
- OCR-derived exported snippets require page+bbox evidence and human approval.

### 2.5 VLM route

VLM is a bounded repair lane, not the default parser and never the verbatim authority.

Trigger only if one or more are true:

- expected section cannot be located;
- section sequence is invalid or unexpectedly discontinuous;
- native and OCR text disagree over a critical citation token;
- multi-column/table/schedule reading order fails;
- the page has mixed image/text regions that cannot be reconstructed deterministically;
- layout confidence is below the configured threshold.

The VLM may return region classification, proposed reading order, or structured fields. Every field used in evidence must align back to native/OCR spans. Unaligned VLM text is review-only and cannot export.

---

## 3. AU benchmark completed on 10 July

### 3.1 Pages

| Case | Authorised compilation page tested | Why selected |
|---|---|---|
| Privacy Act | `C2026C00227`, source PDF page 267, s.33D | subsections, prior-section continuation, privacy-impact provision |
| TIA Act | `C2026C00209` volume 2, source PDF page 16, s.187A | data-retention rule, notes, cross-references, nested enumeration |
| Telecommunications Act | `C2026C00224` volume 2, source PDF page 130, s.317ZH | lettered section, cross-act references, rule limitations |
| Criminal Code | `C2026C00243` volume 3, source PDF page 109, ss.474.17/474.17A | Schedule context, decimal sections, Roman subitems |

### 3.2 Extraction comparison

The percentage below is **normalised edit distance from the visually checked, coordinate-sorted native text**, not true OCR CER.

| Method | Privacy s.33D | TIA s.187A | Telecom s.317ZH | Criminal 474.17 | Decision |
|---|---:|---:|---:|---:|---|
| Poppler layout/native | 0.00% | 0.00% | 0.00% | 0.00% | excellent reference extraction |
| Local Tesseract | 0.06% | 0.00% | 0.00% | 0.06% | visually strong but made critical enumeration errors |
| Configured PaddleOCR | 3.72% | 3.88% | 2.68% | 4.40% | strong OCR; punctuation/footer differences; not preferable to native |
| Docling Markdown | 15.64% | 10.09% | 9.68% | 18.76% | reject as canonical evidence text |

Paddle mean confidence was approximately `0.9950-0.9973`, which did not measure the edit differences and must not be converted to CER.

### 3.3 Current parser failures exposed by the benchmark

The extraction text was mostly correct. The regex statute parser was not.

- It treated the sentence `Section 187B removes...` inside a note as a new section.
- It treated printed page numbers such as `102` as section headings after coordinate sorting.
- It failed on decimal Schedule sections such as `474.17` and `474.17A`.
- It depends on exact indentation and double-space formatting.
- It may merge or split subsections incorrectly when formatting changes across extraction engines.

**Conclusion:** AU P7 recall repair is primarily a structure-parser task, not an OCR task and not a Docling-Markdown task.

---

## 4. Corrected evidence data contract

### TASK E1 - Add immutable source artifacts

- [ ] Add `SourceArtifact` with source URL, retrieved URL, MIME type, byte length, SHA-256, access timestamp, official domain, register/version ID, and local archived path.
- [ ] Store authoritative status separately from domain authority.
- [ ] Store compilation/effective/amendment dates as evidence-backed fields, not inferred strings.
- [ ] Reject HTML error pages, login pages, and mislabeled downloads before parsing.

**Acceptance:** every candidate and final row points to an existing `SourceArtifact` hash.

### TASK E2 - Add page and token provenance

- [ ] Add `PageArtifact` with page number, width/height, route, raw text, searchable text, page image hash, and quality signals.
- [ ] Add `TextSpan`/`OCRToken` with original text, char offsets, bbox/quad, extraction method, engine version, and confidence when applicable.
- [ ] Preserve PyMuPDF native spans, not only page-level text.
- [ ] Preserve OCR boxes through graph/storage/export; do not drop metadata in `SqliteGraphStore`.

**Acceptance:** a selected snippet can render a page crop/highlight without rerunning extraction.

### TASK E3 - Add `CitationProof`

- [ ] Include source hash, page/anchor, bbox list, token/span IDs, exact snippet, article path, and verification timestamp.
- [ ] Construct `verbatim_snippet` by slicing stored spans/tokens.
- [ ] Prevent an LLM-returned free-text snippet from entering export directly.
- [ ] Store both exact original and normalised-search forms.

**Acceptance:** changing one character in a snippet makes the proof gate fail.

### TASK E4 - Preserve provenance in final JSON

- [ ] Consolidated JSON must retain archived copy, access date, source hash, extraction route, OCR metrics, graph/evidence path, all gate results, reviewer decision, and CitationProof.
- [ ] CSV remains template-compatible; JSON carries the complete audit record.
- [ ] Add a test that consolidating outputs cannot discard JSON-only provenance fields.

---

## 5. Corrected document routing implementation

### TASK R1 - Replace the 25-character PDF classifier

- [ ] Classify per page using text coverage, image coverage, glyph/vector characteristics, span count, Unicode quality, and section-token sanity.
- [ ] Detect suspicious hidden OCR layers rather than trusting any text layer over 25 characters.
- [ ] Return `NATIVE_SIMPLE`, `NATIVE_COMPLEX`, `SCANNED`, `MIXED`, or `REVIEW` with reasons.
- [ ] Log the route decision per page.

**Acceptance:** every benchmark page receives a stable, explainable route.

### TASK R2 - Implement native PDF span extraction

- [ ] Use PyMuPDF `dict`/`rawdict` to retain blocks, lines, spans, fonts, sizes, flags, and bboxes.
- [ ] Produce separate source-order and coordinate-order representations.
- [ ] Identify repeating page headers/footers by geometry and frequency, not regex deletion.
- [ ] Preserve original Unicode punctuation.

**Acceptance:** all four AU benchmark pages reproduce every critical citation token exactly.

### TASK R3 - Implement AU structured XHTML acquisition

- [ ] Extend `acquire_au_act()` to inspect the official `Documents` API formats for the chosen `registerId`.
- [ ] Acquire the authorised PDF and official EPUB-derived XHTML for the exact same compilation.
- [ ] Store both under one compilation/version record with their separate authority roles.
- [ ] Parse XHTML paragraph classes, anchors, Parts, Divisions, Schedules, sections, subsections, items, notes, and endnotes.
- [ ] Exclude TOC entries from operative provision nodes while retaining them as navigation hints.

**Acceptance:** s.187A is one correct section; its note mentioning s.187B does not create a false section.

### TASK R4 - Implement source alignment

- [ ] Align XHTML provision text to PDF native spans using section ID + normalised text windows.
- [ ] Require exact original-text recovery from PDF spans for the exported snippet.
- [ ] Record alignment score and mismatches.
- [ ] Route unresolved alignment to human review.

**Acceptance:** each AU gold provision has an authorised-PDF page and bbox proof.

### TASK R5 - Correct legal citation grammar

- [ ] Support integer sections: `33D`, `187A`, `317ZH`.
- [ ] Support decimal Schedule sections: `474.17`, `474.17A`.
- [ ] Support regulations, clauses, articles, Schedules, Parts, Divisions, paragraphs, subparagraphs, and Roman items.
- [ ] Model hierarchical paths, e.g. `Schedule > s.474.17A > (1) > (c) > (iii)`.
- [ ] Never identify a section heading from plain body text that merely says `section 187B`.
- [ ] Never treat a page number/header/footer as a section.

**Acceptance:** fixture tests cover every grammar above and have zero false section starts.

### TASK R6 - OCR route and metrics

- [ ] Rename current `ocr_quality_cer` proxy to `mean_ocr_confidence`.
- [ ] Add true CER/WER calculation against a versioned human-gold page set.
- [ ] Add `citation_token_accuracy` and `section_structure_accuracy`.
- [ ] Ensure Paddle returns page numbers and bboxes; block OCR citations without them.
- [ ] Keep Tesseract fallback, but flag cross-engine citation-token disagreement.

### TASK R7 - Conditional Docling JSON adapter

- [ ] Implement only after R1-R6 are green.
- [ ] Input: a page already classified `NATIVE_COMPLEX` or `REVIEW`.
- [ ] Output: layout labels/hierarchy/bboxes only.
- [ ] Align to canonical PDF/OCR spans.
- [ ] Add a fixture that Docling demonstrably fixes; otherwise keep disabled.

### TASK R8 - Conditional VLM repair adapter

- [ ] Define `PageRepairEngine` behind a provider interface.
- [ ] Restrict outputs to region labels, reading order, and proposed structured fields.
- [ ] Require canonical-span alignment and record model/version/prompt.
- [ ] Never export unaligned VLM-generated text.
- [ ] Keep disabled unless a mandatory fixture requires it.

---

## 6. Authority and currentness hard gates

### TASK A1 - Source-type filter before retrieval

- [ ] Reject bills, drafts, consultations, international agreements, secondary commentary, company policies, and repealed instruments from the P6/P7 evidence corpus.
- [ ] Keep rejected documents as discovery leads with explicit reason codes.
- [ ] Remove the Malaysian Amendment Bill and RCEP agreement from final-evidence eligibility.

### TASK A2 - Version/currentness resolver

- [ ] Model `draft`, `not_yet_effective`, `in_force`, `amended`, `repealed`, `superseded`, and `unknown`.
- [ ] Store the official fact supporting the status.
- [ ] Treat URL liveness and legal currentness as different gates.
- [ ] Make `unknown` block final export.
- [ ] Stop assigning `status="in_force"` unconditionally.

### TASK A3 - Fix absence handling

- [ ] Replace automatic score-zero rows with `NO_EVIDENCE_FOUND_PENDING_REVIEW`.
- [ ] Configure the governing instrument per economy+indicator; never select `corpus[0]`.
- [ ] Store a `SearchCoverageManifest`: portals, instruments, queries, dates, exclusions, and unresolved failures.
- [ ] Require human approval before converting absence to a score-zero final row.

---

## 7. Retrieval and legal mapping recovery

### TASK L1 - Close KNOWN recall before NEW discovery

- [ ] Rebuild AU corpus with the structured-XHTML/PDF-alignment route.
- [ ] Re-run full known-anchor evaluation for every economy+pillar.
- [ ] Investigate every recall hole as one of: acquisition, structure, normalisation, retrieval, mapping, gold-parser error, or genuinely obsolete gold.
- [ ] Maintain an adjudication file for gold rows that are ambiguous or wrong.

**Freeze target:** 100% of resolvable KNOWN anchors reproduced; every unresolved anchor explicitly adjudicated with evidence.

### TASK L2 - Make retrieval claims measurable

- [ ] Rename “not top-k” to recall-driven retrieval.
- [ ] Report candidate recall before LLM screening.
- [ ] Report screen survival recall.
- [ ] Log every cap and which known anchors would have been lost without injection.
- [ ] Add exact section/article and defined-term queries alongside dense retrieval.

### TASK L3 - Strengthen rule-unit construction

- [ ] Carry principal rule, conditions, exceptions, notes, definitions, and cross-references as linked but separate spans.
- [ ] Allow context to cross page boundaries.
- [ ] Ensure the exported snippet is concise while `raw_context` contains the whole composite rule.

### TASK L4 - Human review contract

- [ ] Every final row has `reviewer_decision=approved`, reviewer name/role, timestamp, and optional correction note.
- [ ] NEW rows require independent source/citation and mapping checks.
- [ ] Zone-3 scores require explicit approval/override.
- [ ] Pending rows cannot enter `consolidated_final.csv`.

---

## 8. Champion validation suite

### TASK V1 - Extraction gold set

- [ ] Create at least 30 manually checked pages across clean native, complex native, scanned, mixed, and multilingual documents.
- [ ] Include section numbers, decimal sections, Roman items, Schedules, exceptions, headers/footers, and cross-page provisions.
- [ ] Version gold text and structural labels in fixtures.

### TASK V2 - Required metrics

| Metric | Champion gate |
|---|---:|
| Exported snippet source-span verification | 100% |
| Critical citation-token accuracy | 100% on exported rows |
| Article/subsection location resolution | 100% on exported rows |
| Official/current/in-force evidence | 100% on exported rows |
| Resolvable KNOWN provision recall | 100% |
| Approved NEW precision | 100% on submitted NEW rows |
| Final rows with reviewer approval | 100% |
| Final rows with complete CitationProof | 100% |
| Unknown status / unresolved citation in final | 0 |

### TASK V3 - Regression fixtures from this audit

- [ ] Privacy Act s.33D: preserve `(1)`, `(a)`, `(b)`, `(2)` and page 249/source PDF page 267.
- [ ] TIA s.187A: do not create a false s.187B from Note 2.
- [ ] Telecommunications Act s.317ZH: do not create section 102 from the printed page number.
- [ ] Criminal Code Schedule: parse `474.17`, `474.17A`, and `(iii)` exactly.
- [ ] OCR confidence cannot populate CER.
- [ ] Consolidation cannot discard provenance/reviewer fields.
- [ ] Bills and international agreements cannot become final P6/P7 evidence.

### TASK V4 - Clean-machine modes

- [ ] `live`: crawl official portals and use configured providers.
- [ ] `offline-eval`: run against bundled corpus/fixtures without network.
- [ ] `submission-replay`: deterministically regenerate final CSV/JSON from approved findings.
- [ ] Remove or clearly isolate stub output so it cannot be mistaken for the real pipeline.
- [ ] Pin dependencies and document model/weight requirements honestly.

---

## 9. Features frozen or cut until core proof is green

- [ ] No extra economies.
- [ ] No bonus pillar.
- [ ] No multi-persona noise audit.
- [ ] No Neo4j/GraphRAG presentation work unless an A/B test proves retrieval or currentness lift.
- [ ] No full VLM ingestion route.
- [ ] No Docling Markdown corpus.
- [ ] No broad UI build. A static evidence-review report is enough until the final rows are approved.

The evidence graph may continue as a data model, but it is not called GraphRAG until retrieval traverses provenance-backed edges and demonstrates measurable lift.

---

## 10. Execution order, 10-19 July

### 10 July - Stop the bleeding

- [x] Benchmark representative AU PDF pages visually and across native/Paddle/Tesseract/Docling routes.
- [x] Identify the AU structure-parser failure.
- [x] Decide no Docling Markdown in the canonical path.
- [x] Discover AU official EPUB-derived XHTML tied to the authorised PDF compilation.
- [ ] Implement E1-E4 data-contract/provenance fixes.
- [ ] Fix OCR confidence/CER naming immediately.

### 11 July - AU structure and proof vertical slice

- [ ] Implement R2-R5 and the AU XHTML acquisition route.
- [ ] Produce correct, source-aligned RuleUnits for the four benchmark pages.
- [ ] Render CitationProof highlights from stored spans.
- [ ] Add V3 regression tests.

### 12 July - Authority/currentness and absence

- [ ] Complete A1-A3.
- [ ] Remove ineligible source types from the corpus.
- [ ] Rebuild AU and MY corpora without bills/agreements as final evidence.

### 13-14 July - Recall closure

- [ ] Close AU P7, then MY P7, SG P7, MY P6 recall holes.
- [ ] Reach 100% of resolvable known anchors or document an evidence-backed adjudication.
- [ ] Do not spend time on NEW until this gate is met.

### 14-15 July - Legal review and NEW precision

- [ ] Review every KNOWN row.
- [ ] Review every proposed NEW row; reject aggressively.
- [ ] Convert approved rows into the final curation set.

### 16 July - Core freeze

- [ ] Run V1-V4 validation.
- [ ] Generate final consolidated CSV and provenance-complete JSON.
- [ ] Verify every final row document-by-document.
- [ ] Freeze only when all champion gates pass.

### 17-19 July - Submission package

- [ ] Fresh-machine rehearsal.
- [ ] Produce measured benchmark/cost report with honest limitations.
- [ ] Pitch: demonstrate one source-to-highlight-to-row proof path, one stale/ineligible source rejection, one AU structure recovery, and one validated NEW finding.
- [ ] Screen recording uses real evidence and shows human approval.
- [ ] Submit 19 July with one-day safety margin.

---

## 11. Definition of champion-ready

ClauseChain is champion-ready only when a judge can select any submitted row and, without trusting the model:

1. open the official current source;
2. see the exact provision and highlighted words;
3. verify the article/subsection and page/anchor;
4. inspect the surrounding rule, exception, and cross-reference context;
5. understand why the provision maps to the RDTII indicator;
6. verify why it is NEW or KNOWN;
7. see which deterministic gates passed;
8. see that a human reviewer approved it.

The winning line is:

> ClauseChain does not ask judges to trust an AI answer. It gives them a reproducible proof for every row.
