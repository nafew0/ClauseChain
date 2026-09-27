# ClauseChain — Challenges, Edge Cases & Architecture Decisions

> A working engineering document. For each pipeline stage: what can go wrong, why it's hard, a concrete example, and how we handle it. Plus the four cross-cutting decisions you asked about — autonomy levels (human-in-the-loop toggle), multi-LLM (cloud + local) abstraction, GraphRAG vs vector, and file-type separation.

---

## How to read this

The document is in three parts:

1. **Cross-cutting architecture decisions** — the four big design choices that affect every stage (your autonomy toggle, multi-LLM support, knowledge-graph RAG, file-type routing).
2. **Stage-by-stage challenges** — walking the pipeline from crawl to export, enumerating failure modes at each step.
3. **Edge-case catalog + priority matrix** — a quick-reference table and what to actually build for the hackathon vs. what to defer.

A note on scope: there are *many* edge cases here. You will not solve all of them in 9 days, nor should you. The priority matrix at the end tells you which ones to handle now (because a judge will hit them in the demo) versus which to acknowledge in the pitch as "known, roadmapped." **Naming an edge case you don't yet handle is itself a sign of maturity** — it signals you understand the problem domain. Don't hide the gaps; frame them.

---

# PART 1 — CROSS-CUTTING ARCHITECTURE DECISIONS

## 1.1 Autonomy Levels (the human-in-the-loop toggle)

You want a selectable spectrum: from "human approves every step" to "fully autonomous, skip all permissions" (the Claude Code `--dangerously-skip-permissions` model). This is the right instinct, and it's also a *strong differentiator* — most teams will hardcode one or the other.

### Design: four autonomy levels, set per-run (and overridable per-stage)

| Level | Name | Behavior | When to use |
|---|---|---|---|
| **L0** | Manual / Review-everything | Human confirms after *every* stage: which documents to keep after crawl, which extractions look right, which classifications to accept. Nothing proceeds without a click. | High-stakes jurisdictions, the demo's "trust" narrative, building the gold set |
| **L1** | Checkpoint | Human confirms at *stage boundaries* only — approve the crawled document set, then let extraction+classification run, then review the final classifications. | Default for analysts |
| **L2** | Exception-only | Fully automatic *except* when confidence is low or a conflict is detected. Only flagged items reach a human. | Bulk processing of well-understood jurisdictions |
| **L3** | Autonomous / skip-permissions | Everything runs end to end, no human gate. Output still passes the CVR loop (verification is never skipped — only *human review* is skipped). Everything is logged to the ledger for after-the-fact audit. | Re-runs, large-scale crawls, CI/automated refresh |

### The crucial distinction

**Autonomy level controls human *gating*, never the CVR verification gates.** Even at L3 "skip permissions", the Span Match / NLI / Structural gates still run — they're machine checks, not human checks. What L3 skips is the human *approval* step, not the *verification* step. This distinction is worth stating explicitly in your pitch, because it's the thing that makes "fully autonomous" safe in a legal context: autonomy removes the human bottleneck, not the safety rail.

```
Autonomy = how often a HUMAN must click "approve"
CVR gates = machine verification, ALWAYS runs regardless of autonomy
```

### Implementation notes

- Store autonomy as a run-level config with optional per-stage overrides (e.g., "L2 overall, but L0 for the OCR stage because Bengali scans are risky").
- Every auto-approved action at L2/L3 still writes a ledger entry tagged `auto_approved: true` so the audit trail distinguishes human decisions from machine decisions. A reviewer can later filter "show me everything the system auto-approved" and spot-check.
- The UI should show the current autonomy level prominently and let the user dial it up/down mid-run. If they switch from L3 to L0, the next stage waits for a click.
- **Edge case:** a user sets L3, walks away, and the crawler pulls a wrong jurisdiction's law. At L3 nothing stops it — so the safeguard is that the *discovery confidence* (does this document match the requested jurisdiction/topic?) is itself one of the things logged and, at L2, flagged. At L3, it still runs but is visibly tagged in the ledger so cleanup is one filter away.

## 1.2 Multi-LLM Support (cloud + local, every stage)

You're right not to lock to local models only. Build a **provider-abstraction layer** so every model call — classification, OCR, NLI, embeddings, entity extraction — can route to a local model *or* a cloud API, swappable by config.

### The abstraction

Define a thin internal interface per task type, and implement adapters behind it:

```
ModelRouter
├── chat/completion    → [Llama 3.1 8B (vLLM, local) | GPT-4o | Claude | Gemini | Qwen-Max | DeepSeek]
├── embedding          → [BGE-M3 (local) | OpenAI text-embedding-3 | Cohere embed | Voyage]
├── ocr / vision       → [Qwen2-VL (local) | GPT-4o vision | Gemini | Claude vision | Azure Document Intelligence | Google Document AI]
└── nli / entailment   → [DeBERTa-v3 (local) | any chat model in NLI-prompt mode]
```

Each adapter normalizes inputs/outputs to a common schema, so the rest of the pipeline doesn't know or care which provider answered.

### Why this matters for the hackathon specifically

- **The judging rubric rewards "no vendor lock-in" and "open-weight, self-hostable."** So your *default* config must be all-local (Llama, BGE-M3, Qwen2-VL, DeBERTa). That's the headline.
- **But** the architecture should *demonstrate* it can also route to cloud models — because (a) it shows engineering maturity, (b) it lets a future UN office trade cost for quality, and (c) it gives you a fallback if the L40S struggles on demo day. The pitch line: *"Open-weight by default, cloud-capable by design. The same pipeline runs on a $0 self-hosted stack or on frontier APIs — the operator chooses the cost/quality point."*

### Routing strategies to support

1. **Fixed:** every call to provider X (simplest; the default).
2. **Per-stage:** local for cheap/bulk stages (embedding, first-pass classification), cloud for hard ones (ambiguous clause adjudication, low-confidence re-check).
3. **Escalation / cascade:** try local first; if confidence < threshold, *escalate* the same item to a stronger cloud model and re-run. This is cost-efficient and quality-aware — most items resolve locally, only the hard ones cost API money. **This is the strategy to show in the demo** — it's the most sophisticated and the most defensible.
4. **Ensemble / consensus:** run two providers, compare; disagreement triggers human review. Expensive; reserve for the gold-set construction or the highest-stakes classifications.

### Challenges this introduces

- **Output-format drift:** different models format JSON differently, hallucinate extra keys, or wrap output in markdown fences. Mitigation: enforce schema with grammar-constrained decoding locally (Outlines), and for cloud models use their native JSON/structured-output modes plus a strict parser that rejects malformed output and retries once.
- **Citation semantics differ:** a cloud model might paraphrase even when told not to. The CVR Span-Match gate catches this regardless of provider — which is exactly why provider-independence is safe. The verification layer is the great equalizer: it doesn't trust *any* model, local or frontier.
- **Cost runaway at L3 autonomy + cloud routing:** an autonomous run hammering GPT-4o on 3,000 clauses gets expensive fast. Mitigation: per-run token budget caps, with the run pausing (or falling back to local) when the cap is hit. Show the running cost in the UI.
- **Determinism / reproducibility:** cloud models change under you (silent version bumps). For a system whose whole pitch is reproducibility, this is a real tension. Mitigation: record the exact model + version + params in every ledger entry; for the canonical/published dataset, prefer pinned local weights (which never change) so the provenance claim holds. State this honestly: *"reproducibility guarantee is strongest with pinned open weights; cloud routing trades some reproducibility for quality."*
- **Data residency / confidentiality:** sending a government's draft legislation to a US cloud API may be politically unacceptable for some UN use cases. Mitigation: the all-local default sidesteps this entirely; document it as a feature ("sovereign deployment, nothing leaves your infrastructure").

## 1.3 Knowledge-Graph RAG vs Plain Vector (Qdrant)

You asked whether to use knowledge-graph RAG instead of plain Qdrant. Based on the research, the answer is: **neither alone — use a hybrid, and be deliberate about which parts get the graph.**

### What the evidence says

The 2026 practitioner consensus is clear and consistent across sources: GraphRAG meaningfully outperforms vector-only retrieval *specifically* on the kinds of queries that involve relationships, multi-hop reasoning, and reconciling information spread across multiple documents — and legal/regulatory corpora are a textbook case. Legal datasets often contain layered relationships between cases, statutes, and precedents. GraphRAG enables structured exploration across these references, allowing legal teams to uncover relevant but non-obvious connections.

The failure mode of vector-only RAG is precisely the one that would hurt ClauseChain most: Vector search retrieves chunks that look similar. GraphRAG retrieves chunks that are actually connected. A compliance-documentation example from the research mirrors our exact problem — the vector store retrieved the right individual chunks, but the LLM stitched them together wrong because the correct answer required connecting separate documents (a scope clause, a classification, and a date threshold) that only made sense together.

But the same sources are equally clear about the cost: GraphRAG is more complex and slower. One benchmark found GraphRAG delivers 1.5x better accuracy overall, and 2x better on complex queries. The tradeoff: 2.4x higher latency on average. And for simple lookups it's overkill: On simple factual retrieval, vanilla vector RAG with a decent embedding model performs comparably. You don't need a knowledge graph to look up a single fact in a single document.

The migration advice is unanimous — don't rip out vectors: The 2025 consensus among practitioners is clear: don't rebuild from scratch. Successful migrations layer graph capabilities on top of existing vector infrastructure rather than replacing it.

### Where ClauseChain genuinely needs the graph

Map it to our actual tasks:

| Task | Needs graph? | Why |
|---|---|---|
| Clause → RDTII pillar similarity match | **No** — vector is fine | It's a semantic similarity lookup on a single chunk. This is the "simple factual retrieval" case. |
| Amendment chain reconciliation (Act → Amendment 2017 → Amendment 2021) | **Yes** | Temporal multi-hop: "what is the *current* text of §26 after all amendments?" is a chain-following query — exactly where vector RAG hits its ceiling. |
| Cross-reference resolution ("subject to section 12", "notwithstanding §8") | **Yes** | These are explicit edges between clauses. A vector store sees them as unrelated chunks. |
| Conflict detection between two sources | **Yes** | This is the "gap detection" / comparison use case the regulatory-compliance research specifically highlights as where vector RAG fails and graph wins. |
| Definitions propagation ("'personal data' means…" used 40 sections later) | **Yes** | A definition node linked to every clause that uses the term — graph-native. |
| Multi-jurisdiction comparison (BD §X vs TH §Y on same indicator) | **Yes** | Cross-document relational reasoning — the RDTII matrix is literally a relational view. |

### Recommendation: Hybrid (vector backbone + lightweight legal knowledge graph)

**Phase 1 (hackathon application):** Vector retrieval (Qdrant + BGE-M3) as the backbone. This is enough to demo Task 1 + Task 2 end to end. Ship it.

**Phase 2 (Round 1, if shortlisted):** Add a **legal knowledge graph layer** on top, modeling:
- **Nodes:** Instrument, Part, Chapter, Section, Sub-clause, Definition, RDTII-Indicator, Jurisdiction
- **Edges:** `amends`, `cross_references`, `defines`, `subject_to`, `overrides`, `maps_to_indicator`, `conflicts_with`, `same_indicator_as` (cross-jurisdiction)

Retrieval becomes: vector search to find candidate clauses → graph traversal to pull in connected context (the definition, the amendment, the cross-referenced section) → hand the *connected* bundle to the classifier. This directly attacks the "LLM stitched the chunks together wrong" failure.

Storage options for the graph: Neo4j (mature, but heavier), or a lighter embedded option (e.g., Kùzu, or even a property graph in Postgres via the existing metadata DB to avoid adding infrastructure). For the hackathon's self-hosting constraint, an embedded graph (Kùzu) or Postgres-backed graph keeps the deployment to a single docker-compose with no extra service. Mention Neo4j as the production option.

### What to say in the pitch

> *"We use a hybrid retrieval architecture: dense vector search (BGE-M3 + Qdrant) as the fast backbone for clause-to-indicator matching, augmented by a legal knowledge graph that models the relationships vector search is blind to — amendment chains, cross-references, definitions, and cross-source conflicts. Vector search finds chunks that look relevant; the graph ensures we retrieve chunks that are actually connected. This is what lets us correctly answer 'what does §26 say *after* the 2021 amendment' instead of confidently citing superseded text."*

That last sentence is a mic-drop for a legal-tech audience. It shows you understand the failure mode they fear most.

### Honest caveat for your build plan

Building a good knowledge graph from raw legal text is *itself* an extraction problem (you need to detect "amends", "subject to", etc. reliably). For the application deadline, **do not block on the graph.** Vector-only is a credible Alpha. Add the graph in Round 1 where you have weeks, not days. Promising it in the pitch as the Round-2 architecture is fine and shows roadmap maturity.

## 1.4 File-Type Separation & Routing

You already do this in your RAG product, so this is mostly carry-over. The pipeline ingests a heterogeneous pile and must route by *true* type, not by extension.

### Router logic

1. **Sniff the real type** — don't trust the extension or the URL. A `.pdf` may be a scanned image; a `.html` may be a JS-rendered shell with the real content in an embedded object; a `.docx` may be a renamed file. Use content sniffing (magic bytes) + a quick probe.
2. **For PDFs, the critical fork:** *native/digital* (has a real text layer) vs *scanned/image* (no text layer, or a garbage one). Detect by attempting text extraction and measuring the character-to-page ratio and the proportion of extractable vs. image area. A PDF with <X chars/page or >Y% image coverage → route to OCR.
3. **Separate asset streams**, as you described — extract and store images, tables, and embedded files separately, each with a reference back to its location in the parent document. This matters for ClauseChain because: a scanned signature page is noise, but a table of "data categories" is signal; a stamp/seal is metadata (authenticity) not content.

### Per-type handling

| Type | Handler | Notes / edge cases |
|---|---|---|
| HTML | trafilatura + custom legal parser | JS-rendered sites need Playwright to get the DOM first. Watch for "cookie wall" / consent pages masquerading as the document. |
| Native PDF | Docling | Multi-column layouts, footnotes, marginal notes can scramble reading order. |
| Scanned PDF | Qwen2-VL + Tesseract consensus | The hard one — see Stage 3 below. |
| DOCX | python-docx / Docling | Tracked changes and comments can pollute extraction; decide whether to accept/reject changes. |
| Images (standalone) | Vision OCR | A photographed law page (common in some jurisdictions) — perspective distortion, glare. |
| Markdown / TXT | Direct parse | Rare for primary sources but common for guidelines. |
| Tables (extracted) | Dedicated table parser | Data-category tables, retention-period schedules — high-value, easy to mangle. |

### Visualization + human go-ahead on the scraped set

Your instinct here is correct and important. After crawl, **before** extraction, show the human the harvested set: each document with its detected type, source URL, detected jurisdiction/language, a thumbnail/preview, and a discovery-confidence score. The human (at L0/L1) confirms which to keep. This is the "crawler pulled the wrong document" safeguard — caught early, before you waste compute extracting and classifying junk.

---

# PART 2 — STAGE-BY-STAGE CHALLENGES

## Stage 1 — Discovery / Crawling

**Goal:** find the right legal documents on official sources without pulling junk.

### Challenges & edge cases

**1.1 Pulled the wrong document.** (Your example.) The crawler grabs a press release, a FAQ, a draft that was never enacted, a repealed law, or another country's law hosted on a mirror.
- *Mitigation:* (a) Discovery-confidence score per document — combine URL-domain authority (is it the official gazette domain?), document-type classifier output, and a relevance check (does it mention the target topic/jurisdiction?). (b) Human go-ahead on the harvested set at L0/L1. (c) At L2/L3, low-confidence docs are still tagged in the ledger for one-filter cleanup.

**1.2 Repealed / superseded law looks current.** A government site keeps the 2006 Act prominently linked even though a 2018 Act replaced it.
- *Mitigation:* Detect status markers ("repealed", "as amended up to…", commencement/repeal notices). Cross-check against the amendment graph (Phase 2). At minimum, surface publication/amendment dates and flag when two instruments cover the same subject — let the conflict-resolution flow handle precedence.

**1.3 Draft vs. enacted.** A bill, a consultation draft, and the final act all exist online; they differ in legally crucial ways.
- *Mitigation:* The document classifier must distinguish `bill/draft` from `enacted act`. Authority hierarchy in the seed config encodes that drafts are non-binding. Tag clearly; never let a draft become a binding citation.

**1.4 Robots.txt / rate limits / blocking.** Government sites may disallow crawling or block you after N requests.
- *Mitigation:* Respect robots.txt (also an ethics/compliance point you can cite in the pitch). Rate-limit, identifying User-Agent, exponential backoff. Maintain a **manual-download fallback** for your ~15 priority instruments so a blocked crawler never breaks the demo.

**1.5 JS-rendered / login-walled / CAPTCHA content.** The real text only appears after JS execution, or behind a portal.
- *Mitigation:* Playwright for JS rendering. For login/CAPTCHA — **do not** attempt to bypass; flag for manual retrieval. (Also the right ethical posture.)

**1.6 Dynamic URLs / infinite calendars / crawler traps.** Some sites generate endless parameterized URLs.
- *Mitigation:* URL canonicalization, depth limits, visited-set dedup, domain allow-listing from the seed registry.

**1.7 The same law at multiple URLs (mirrors, PDF + HTML versions).** You ingest the same Act twice.
- *Mitigation:* Content hashing + near-duplicate detection (see Stage 2). Prefer the most authoritative source per the hierarchy.

**1.8 Manual URL input.** (Your requested feature.) User pastes a URL to scrape directly.
- *Design:* An input field that accepts a URL, runs the same type-detection + discovery-confidence pipeline, previews the result, and asks for go-ahead before ingestion. Same safeguards as automated crawl — a pasted URL is not more trusted than a crawled one. (Security note: validate the URL, block internal/loopback addresses to prevent SSRF, and never auto-execute anything the page suggests.)

## Stage 2 — Document Classification & Deduplication

**Goal:** correctly tag each document's type/authority and avoid double-counting.

### Challenges & edge cases

**2.1 Misclassified instrument type.** A guideline gets tagged as primary legislation, or vice versa — corrupting the authority hierarchy.
- *Mitigation:* Classifier + rule-based cues (gazette numbering, enacting formula like "BE IT ENACTED", presence of section numbering). At L0/L1 the human confirms type on the review screen. Wrong type is high-impact (a non-binding guideline cited as law is a serious error), so weight this for human review even at L2.

**2.2 Near-duplicates with subtle differences.** Two PDFs of "the same" act differ by an amendment you can't see at a glance.
- *Mitigation:* Don't dedup purely on hash (they'll differ). Use near-duplicate detection (minhash/simhash on extracted text) to *cluster* candidates, then compare versions and keep the version graph rather than discarding.

**2.3 Compilation vs. original + amendments.** Some jurisdictions publish a "consolidated/compiled" version (original with amendments already merged); others only publish original + separate amendments.
- *Mitigation:* Detect "consolidated"/"compilation" markers. If a consolidated version exists and is authoritative, prefer it (it sidesteps amendment-chain reconstruction). If only original+amendments exist, you *must* reconstruct (Phase 2 graph). State which mode applies per instrument.

## Stage 3 — Ingestion / Extraction (the hardest stage)

**Goal:** turn each document into clean, structure-preserving text. Three sub-pipelines; OCR is where most pain lives.

### HTML extraction challenges

**3.1 Boilerplate contamination.** Nav menus, sidebars, "related links", cookie banners bleed into the extracted text.
- *Mitigation:* trafilatura handles most; add site-specific cleaners for your priority domains.

**3.2 Structure loss.** The HTML uses `<div>` soup with no semantic section markers; your parser can't find "Section 26".
- *Mitigation:* Regex + heuristic legal parser keyed on numbering patterns ("Article N", "Section N", "(1)", "(a)", Roman numerals). Per-jurisdiction numbering conventions differ — Thai and Bengali statutes number differently from common-law ones. Build a small per-jurisdiction numbering grammar.

### Native PDF challenges

**3.3 Reading-order scramble.** Multi-column layouts, sidebars, footnotes get linearized in the wrong order.
- *Mitigation:* Docling's layout analysis; validate by checking that section numbers appear in ascending order, flag where they don't.

**3.4 Footnotes/endnotes merged into body.** A footnote definition gets spliced mid-sentence.
- *Mitigation:* Layout model should separate note regions; keep them as linked-but-distinct nodes.

**3.5 Tables flattened.** A retention-schedule table becomes an unreadable run-on string.
- *Mitigation:* Dedicated table extraction; preserve as structured rows, not flattened text.

### Scanned PDF / OCR challenges (the differentiator, and the danger zone)

**3.6 Low-quality scans.** Skew, noise, bleed-through, faded ink, stamps over text, handwritten annotations.
- *Mitigation:* Pre-process (deskew, denoise, binarize). Qwen2-VL is more robust to this than Tesseract; the consensus mechanism uses the agreement to gate confidence. Unresolvable regions get flagged, never silently guessed.

**3.7 Bengali/Thai script OCR errors.** Conjunct characters (যুক্তাক্ষর) in Bengali; tone marks and the absence of inter-word spaces in Thai. These produce systematic, not random, errors.
- *Mitigation:* Language-specific OCR (Tesseract `ben`/`tha` packs; Qwen2-VL is strong multilingually). **Critical interaction with the CVR Span-Match gate:** the gate allows ≤2 edit-distance fuzzy match *specifically* to absorb OCR noise — but this is a double-edged sword (see 3.8). Track OCR confidence per region and propagate it into the classification confidence.

**3.8 OCR error vs. paraphrase — the fuzzy-match dilemma.** Your Span-Match gate tolerates small edits for OCR. But a 2-character tolerance could also let a *paraphrase* sneak through, defeating the anti-hallucination guarantee.
- *Mitigation:* This needs care. (a) Make the fuzzy tolerance *character-level and length-proportional*, not a flat 2 edits — a 200-char span shouldn't get the same absolute tolerance as a 20-char one. (b) Only apply fuzzy tolerance when the source region is *known to be OCR'd* (flag from Stage 3); for native-text sources, require *exact* match. (c) Log the edit distance on every span match in the ledger, so a reviewer can audit "show me all citations that needed fuzzy matching" and verify they were genuine OCR fixes, not smuggled paraphrases. This turns the dilemma into an auditable, defensible policy — exactly the kind of nuance judges reward.

**3.9 Multi-language documents.** A single PDF mixes English and Bengali (common in Bangladesh — English law text with Bengali headers, or bilingual columns).
- *Mitigation:* Per-region language detection before OCR; route each region to the right OCR config. Don't assume one language per document.

**3.10 The model "helpfully" corrects the law.** A vision-LLM doing OCR may "fix" what it thinks is a typo in the statute, or normalize archaic spelling — silently altering legal text.
- *Mitigation:* Instruct OCR for *transcription fidelity, not correction*. The consensus check (two engines) catches divergence. This is a subtle, serious risk worth naming in the pitch — it shows you understand that even OCR can hallucinate.

## Stage 4 — Structure Parsing & Chunking

**Goal:** preserve the legal hierarchy and chunk at clause boundaries with parent context.

### Challenges & edge cases

**4.1 Naive chunking splits a rule from its exception.** A 512-token window cuts off mid-clause, separating "shall not transfer" from "except where…". This *directly causes* the Q1 linguistic-conflict problem.
- *Mitigation:* Chunk at clause boundaries, not token counts. Attach parent-section context as metadata to every sub-clause chunk. Keep rule+exception as a single retrievable unit (your Q1.3 answer). This is where the discourse-linking component lives.

**4.2 Deeply nested / inconsistent numbering.** §26(1)(a)(iii) proviso 2 — five levels deep, and the numbering style shifts within one act.
- *Mitigation:* Recursive structure parser with a per-jurisdiction grammar; store the full path (`26.1.a.iii.proviso2`) so citations are unambiguous.

**4.3 Cross-references break when chunked.** "subject to section 12" — section 12 is in a different chunk, possibly a different document.
- *Mitigation:* This is the **graph case.** Detect cross-reference phrases, create edges, resolve at retrieval time by pulling the referenced node. Phase 2.

**4.4 Definitions used far from where defined.** "personal data" defined in §2, used in §26.
- *Mitigation:* Definition node linked to all usages (graph). In Phase 1 (vector-only), inject the definitions section into the classifier's context for any clause that uses a defined term.

## Stage 5 — Embedding & Indexing

**Goal:** make clauses retrievable across languages.

### Challenges & edge cases

**5.1 Cross-lingual retrieval gap.** A query/rubric in English must retrieve a clause in Thai or Bengali.
- *Mitigation:* BGE-M3 is genuinely multilingual and handles cross-lingual retrieval — but *test it* on your actual Bengali/Thai clauses early (Day 2-3), don't assume. If it underperforms on Bengali specifically, consider per-language fine-tuning (Round 1) or translating the rubric into each target language for retrieval.

**5.2 Legal jargon ≠ rubric language.** The law says "shall be retained within the territory"; the rubric says "data localization". Semantically related but lexically distant.
- *Mitigation:* Hybrid dense+sparse retrieval (BGE-M3 supports both). The rubric's `typical_phrases` and `operative_predicates` give the sparse/keyword side something to match. The graph's `maps_to_indicator` edges (Phase 2) make this exact.

**5.3 Embedding the wrong granularity.** Embed whole sections → retrieval too coarse; embed tiny fragments → lose context.
- *Mitigation:* Clause-level chunks with parent context (Stage 4). Possibly multi-granularity indexing (section AND clause) and retrieve at both levels.

## Stage 6 — Mapping / Classification

**Goal:** assign the correct RDTII indicator to each relevant clause.

### Challenges & edge cases

**6.1 One clause → multiple indicators.** A single provision touches both cross-border transfer (P6) and consent (P7).
- *Mitigation:* Allow multi-label output (array of indicators), each with its own verbatim span and confidence. Don't force a single label.

**6.2 Relevant clause missed (false negative).** The clause matters but retrieval didn't surface it or the classifier said "not applicable".
- *Mitigation:* False negatives are *invisible* — the scariest error class for a coverage tool. Mitigate with: (a) a recall-oriented first pass (lower the bar to "candidate"), then precision filtering; (b) the gold set measures recall explicitly; (c) at L0/L1, let the human browse *unclassified* clauses, not just classified ones, so misses are visible. **State in the pitch that you measure recall, not just precision** — most teams will only report precision because false negatives are easy to hide.

**6.3 Irrelevant clause classified (false positive).** A clause about telecom licensing gets tagged P6.
- *Mitigation:* The CVR loop (Gate 2 NLI, Gate 3 structural) is the primary defense. The rubric's operative-predicate check (Gate 3) kills most false positives.

**6.4 Ambiguous / genuinely hard clauses.** Even human lawyers would disagree.
- *Mitigation:* This is what confidence scores and human review are *for*. Low-confidence → flagged. Don't pretend the system resolves genuine legal ambiguity; surface it. (And measure inter-annotator agreement on your gold set — if your two lawyers disagree, the model's "error" may be legitimate ambiguity.)

**6.5 Rubric interpretation drift.** The model's notion of "6.1 data localization" subtly differs from the official RDTII definition.
- *Mitigation:* Encode the rubric precisely (YAML with predicates + examples). Validate against the gold set. The reference framework is provided during the competition — be ready to swap in the official definitions exactly.

**6.6 LLM emits malformed/over-eager output.** Extra keys, prose, refuses, or invents a sub-indicator that doesn't exist.
- *Mitigation:* Grammar-constrained decoding (local) / structured-output mode (cloud); closed enumeration of valid indicators; reject-and-retry on schema violation; the indicator must be from the fixed list or `null`.

## Stage 7 — CVR Verification (Cite → Verify → Reject)

**Goal:** make hallucinated/unsupported classifications structurally impossible to ship.

### Challenges & edge cases

**7.1 Span-match false confidence on OCR text.** Covered in 3.8 — the fuzzy-tolerance dilemma. Length-proportional tolerance + OCR-only application + ledger logging.

**7.2 NLI model wrong on legal language.** General-domain NLI (trained on MNLI/FEVER) may misjudge entailment between dense statutory language and a rubric claim.
- *Mitigation:* Test NLI calibration on the gold set; tune the threshold per the calibration curve, don't assume 0.7. Consider a legal-domain NLI or an LLM-as-NLI fallback for borderline scores. Log NLI scores so the threshold is auditable. **Honest framing:** NLI is the softest gate; don't oversell its precision. Position it as one of three independent checks, not an oracle.

**7.3 All three gates pass but the classification is still wrong.** The span exists, entails the claim, and the predicates are present — yet a lawyer says it's misclassified (e.g., the clause is in a "definitions" or "non-operative" part).
- *Mitigation:* Gate 3 should check *clause role* (operative vs. definition vs. recital) not just predicate presence. And this residual error rate is exactly why human-in-the-loop exists and why you report F1 honestly rather than claiming perfection.

**7.4 Source changed since retrieval (hash mismatch on re-verify).** The government updated the page; the stored hash no longer matches.
- *Mitigation:* This is a *feature* — the re-verify flow detecting drift is the system working correctly. Surface it: "source changed since last verified on [date]", prompt re-ingestion. The version graph tracks this.

**7.5 Verification is expensive at scale.** Running NLI + structural checks on every clause × every candidate indicator is costly.
- *Mitigation:* Gate ordering — cheap Span-Match first (kills most), then structural, then NLI only on survivors. Batch NLI on the L40S.

## Stage 8 — Conflict & Version Reconciliation

**Goal:** when sources disagree, determine the controlling text correctly.

### Challenges & edge cases

**8.1 Amendment chain reconstruction.** Original + 3 amendments; what does §26 say *now*?
- *Mitigation:* The graph case. `amends` edges with dates; resolve to the latest controlling text. Phase 2. In Phase 1, surface all versions and let the human pick (conflict-resolution modal).

**8.2 Partial amendment.** An amendment changes §26(2) but not §26(1); you must merge, not replace.
- *Mitigation:* Sub-clause-level version tracking, not document-level. Hard; flag for human verification when an amendment's scope is ambiguous.

**8.3 Recency ≠ authority.** A newer *guideline* doesn't override an older *act*. Your default "newest wins" is wrong across authority levels.
- *Mitigation:* Resolution must consider *both* authority level *and* date: higher authority wins; within the same authority, newer wins. Encode this precedence explicitly. (Your Q5 answer already gets this right — make sure the code matches.)

**8.4 Genuine legal contradiction.** Two equally authoritative provisions actually conflict (it happens).
- *Mitigation:* Don't auto-resolve. Mark "unresolved conflict", surface both, let the human adjudicate and log the decision. A tool that *detects* genuine conflicts is more valuable than one that hides them.

## Stage 9 — Output / Export

**Goal:** emit the machine-readable files that are the actual deliverable.

### Challenges & edge cases

**9.1 The output, not the UI, is the deliverable.** (Worth repeating.) Judges want the `.jsonl`/`.csv`. The UI reads from it.
- *Mitigation:* Treat the structured output as the source of truth. Build the exporter early and test that a third party can open and understand it without the UI.

**9.2 Verbatim spans in output may carry copyright/quoting concerns.** Reproducing large chunks of some legal texts.
- *Mitigation:* Legal texts are generally not copyrightable in most jurisdictions (laws are public), but guidelines/commentary may be. Spans are short, attributed quotes anchored to source — defensible. Your lawyer can confirm per jurisdiction.

**9.3 Schema stability for downstream consumers.** If the output schema changes, downstream RDTII matrices break.
- *Mitigation:* Version the output schema. Document it. Treat it as an API contract.

**9.4 Provenance bundle completeness.** The "reproducibility" claim requires the export to contain *everything* needed to re-verify — source URLs, hashes, offsets, model versions.
- *Mitigation:* The provenance bundle export must be self-contained and round-trip-testable. Actually test: hand the bundle to your teammate and have them re-verify a citation cold.

## Stage 10 — Audit UI / Human Review

**Goal:** make human oversight fast, clear, and trustworthy.

### Challenges & edge cases

**10.1 Reviewer fatigue / rubber-stamping.** At scale, humans approve without really checking.
- *Mitigation:* Surface the *why* (verification chain, confidence) so review is fast but informed; prioritize the review queue by risk (low confidence, conflicts, fuzzy-matched spans first); track reviewer agreement rates to spot rubber-stamping.

**10.2 Human edits introduce errors.** A reviewer fat-fingers a verbatim span.
- *Mitigation:* The Edit modal validates the span against source in real time (your spec already has this) — the anti-hallucination guarantee applies to humans too.

**10.3 Bounding-box highlight misaligns with text.** The overlay points to the wrong region on the PDF.
- *Mitigation:* Bbox comes from the extraction stage; test alignment on native vs. OCR'd PDFs separately (OCR bboxes are noisier). A visibly wrong highlight destroys trust faster than almost anything — prioritize getting this right on the demo documents.

---

# PART 3 — EDGE-CASE CATALOG & PRIORITY MATRIX

## Quick-reference catalog

| # | Edge case | Stage | Severity | Handle for app? |
|---|---|---|---|---|
| 1 | Crawler pulls wrong/repealed/draft document | 1 | High | ✅ Yes — human go-ahead + confidence score |
| 2 | Robots/CAPTCHA/login block | 1 | Med | ✅ Manual fallback for priority docs |
| 3 | Manual URL input with SSRF risk | 1 | Med | ✅ Validate + preview + go-ahead |
| 4 | Duplicate / near-duplicate documents | 2 | Med | ⚠️ Basic dedup; full version graph later |
| 5 | Misclassified instrument type | 2 | High | ✅ Human confirms type at L0/L1 |
| 6 | Low-quality / skewed scans | 3 | High | ✅ Preprocess + consensus + flag |
| 7 | Bengali/Thai OCR systematic errors | 3 | High | ✅ Lang packs + consensus; the differentiator |
| 8 | OCR-fuzzy-match smuggling a paraphrase | 3/7 | High | ✅ Length-proportional, OCR-only, logged |
| 9 | OCR model "corrects" the law | 3 | Med | ⚠️ Consensus catches; name it in pitch |
| 10 | Multi-language single document | 3 | Med | ✅ Per-region language detection |
| 11 | Chunking splits rule from exception | 4 | High | ✅ Clause-boundary chunking (your Q1) |
| 12 | Cross-references / definitions elsewhere | 4 | High | ⚠️ Inject definitions now; graph in Round 1 |
| 13 | Cross-lingual retrieval gap | 5 | High | ✅ Test BGE-M3 on real Bengali/Thai early |
| 14 | One clause → multiple indicators | 6 | Med | ✅ Multi-label output |
| 15 | False negatives (missed clauses) | 6 | High | ✅ Recall-oriented pass + measure recall |
| 16 | Ambiguous clauses | 6 | Med | ✅ Confidence + human review |
| 17 | Malformed LLM output | 6 | Med | ✅ Grammar-constrained / structured mode |
| 18 | NLI wrong on legal language | 7 | High | ✅ Calibrate threshold on gold set |
| 19 | All gates pass but still wrong | 7 | Med | ⚠️ Clause-role check + honest F1 |
| 20 | Source changed since retrieval | 7 | Low | ✅ Re-verify detects drift (feature) |
| 21 | Amendment chain reconstruction | 8 | High | ⚠️ Surface versions now; graph in Round 1 |
| 22 | Recency vs. authority precedence | 8 | High | ✅ Encode both in resolution logic |
| 23 | Genuine legal contradiction | 8 | Med | ✅ Mark unresolved, human adjudicates |
| 24 | Output schema stability | 9 | Med | ✅ Version + document the schema |
| 25 | Provenance bundle incomplete | 9 | High | ✅ Round-trip test the export |
| 26 | Bounding-box misalignment | 10 | High | ✅ Test on demo docs (trust-critical) |
| 27 | Reviewer fatigue / rubber-stamping | 10 | Low | ⚠️ Risk-prioritized queue |
| 28 | Cost runaway (L3 + cloud) | X-cut | Med | ✅ Token budget caps |
| 29 | Reproducibility vs. cloud drift | X-cut | Med | ✅ Pin weights for canonical; log versions |
| 30 | Data residency (cloud) | X-cut | Med | ✅ All-local default = sovereign |

## What to actually build for the application (9 days)

**Must work in the demo (a judge will hit these):**
- Crawl + manual URL input + human go-ahead on harvested set (edge 1, 3)
- File-type routing incl. native-vs-scanned PDF fork (your existing capability)
- OCR consensus on at least a few Bengali + Thai pages (edge 6, 7) — *the* differentiator
- Clause-boundary chunking (edge 11)
- Vector retrieval (Qdrant + BGE-M3), tested cross-lingual (edge 13)
- CVR loop, all three gates, with the fuzzy-match policy logged (edge 8, 18)
- The autonomy toggle (at least L0/L1/L3 visibly working) — strong differentiator
- The multi-LLM router (even if you only wire 1 local + 1 cloud adapter to prove it)
- Machine-readable output file + provenance bundle (edge 25) — *the actual deliverable*
- Audit UI with correct bounding boxes on demo docs (edge 26)

**Acknowledge as roadmapped (don't build now, name in pitch):**
- Knowledge graph layer for amendments/cross-refs/conflicts (edge 12, 21) → Round 2 architecture
- Full version-graph reconstruction (edge 4, 8.2)
- Legal-domain NLI fine-tuning (edge 18)
- Cross-jurisdiction comparison view (the parallel-coordinates visualization)

**The framing for unbuild items:** *"We've identified these failure modes and designed the architecture to accommodate them; here's our roadmap to handle each."* That sentence, backed by this catalog, is what separates a team that built a demo from a team that understands the problem.

---

## One closing thought on strategy

The temptation will be to build breadth — handle every edge case shallowly. Resist it. **Depth on the differentiators wins:** the OCR-consensus on Bengali/Thai, the CVR loop with its honest fuzzy-match policy, the autonomy toggle, and a real machine-readable output file. A judge who sees those four things done *well*, plus this catalog showing you understand the other 26, will trust you more than a team demoing 30 half-working features.

The edge cases you *name but defer* are not weaknesses in your pitch — they're evidence you've thought further ahead than the teams who didn't mention them at all.
