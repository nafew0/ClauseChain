# ClauseChain — Dev Plan & Task Distribution (Guiding Star)

**The plan we execute from. Everything else is a supporting reference, pointed to from the task that needs it.**

| Field | Value |
|---|---|
| Role of this doc | **GUIDING STAR.** Read this first; it links out to the others when needed. |
| Operating model | **You = lead + verifier. Claude (me) = executes all build/legal/research tasks; you check the output.** The "AI-1 / AI-2 / Legal" labels below are **task-buckets, not people.** |
| Window | **REBASED 4 Jul 2026 → submit 19 Jul (buffer day; hard deadline 20 Jul Bangkok, no resubmission after).** ~15 days. **P0 is DONE** (engine scaffold green) but **P1/P2 never started — engine idle since 23 Jun.** **Core freeze Jul 16.** |
| Scope (rebased 4 Jul) | **Core ONLY: SG/AU/MY × Pillars 6&7 flawless.** The 22-Jun stretch tracks are **CUT by default**: Round-2 economies (score 0 in Round 1; the R2 gold ingest is already banked as finals insurance) and the bonus pillar. They return ONLY if the core freezes early. Order if time appears: bonus pillar (scores in R1) → R2 economies (doesn't). **NEW in scope: the Malaysia error-audit pass (§6 P2′ — MY carries double weight for error-checking, confirmed).** |
| Companion docs | **`ClauseChain_Gap_Analysis_4Jul.md` (the full-corpus delta list — source of the 4-Jul changes)** · `ClauseChain_Round1_Build_Guide.md` (architecture · phases · **§7.1 official Zone-3 scoring/weights/polarity**) · `ClauseChain_Legal_Matching_DoDont.md` (legal rules · **§9.1 scoring criteria** · §13 worked-example bank) · `ClauseChain_Championship_GraphRAG_Strategy.md` (graph: **§12 swappable `GraphStore`, SQLite default / Neo4j optional**) · `Hackthon_Knowledge/CHAMPION_GUIDE_*.md` (manual-SOP→component map + pitch arsenal) · the **`NOTES_*June_*.md`** session digests in `Hackthon_Knowledge/` |

> **North star.** Win Round 1 by making SG/AU/MY unbeatable, then bank finals insurance by covering the 7 Round-2 economies before the window closes — **without ever letting Round-2 work destabilize the frozen core.** Cost-efficiency, speed, and reviewable evidence are all scored; build for them on purpose.

---

## 0. What changed — read once

These are the deltas since the last plan; each is wired into the sections below. Tags: **[confirmed]** = high-accuracy caption/official file; **[verify]** = lower-quality SRT only.

### 0A. 4-July full-corpus gap analysis (details: `ClauseChain_Gap_Analysis_4Jul.md`)

Every session (slides×transcripts, 1/4/5/11/12/15 Jun), the submission kit, and the full RDTII guides + both gold DBs were deep-read and diffed against this plan. The deltas that change execution:

- **🔴 [fact] Engine idle since 23 Jun; P1/P2 unbuilt.** `run.py` runs green but emits stubs; `extractors/retrieval/predicate/rdtii/verifier/discovery` don't exist. → Phases rebased (§6), stretch cut (header).
- **🔴 [confirmed — official guide, full read] Our P7 scoring rubric had 3 errors.** **7.5 = court-order test** (access *without* independent judicial authorization = 1; warrant-gated = 0); **7.2 has a 0.5 tier** (non-dedicated and/or dedicated-sectoral-only; 0 needs a dedicated *horizontal* framework); **7.4 has a 0.5 tier** (sector-specific only; 1 needs all-sectors DPO). Plus **P7 weights: 7.1=31 · 7.2=31 · 7.3=16 · 7.4=6 · 7.5=16 (%)**; 7.3 no-period-specified → record, score 0; 6.3 rules on *already-established* data centres → record, score 0 (licensing → 9.4). ✅ Fixed in DoDont §9.1 / Build Guide §7.1 / `pillar_*.yaml` (4 Jul).
- **🟠 [confirmed — 1-Jun deck p5 + transcript] Malaysia sample data contains DELIBERATE planted errors; MY weight 20 vs SG/AU 10** ("error-checking AND new data collection"; full accuracy = full points, prorated otherwise). Resolves the old "verify 2× weighting" task. → **New scored feature: the MY KNOWN-baseline error-audit pass** (§6 P2′) — re-verify every MY master row (URL live, law current, article exists, mapping correct) and emit corrections. Doubles as the gates' regression suite + a demo moment.
- **🟠 [confirmed — 15-Jun SRT 01:17:16] Judging PRIMARILY reviews the submitted output file**; running code is selective ("may"). → Priority: (1) consolidated CSV/JSON quality, (2) reproducible repo/README, (3) everything else.
- **🟠 [near-confirmed — asked TWICE on 15 Jun; 2nd answer clean] CPU-only / no GPU / no internet / no API keys / no secrets in repo.** Upgraded from [verify]. → **Path A is now the literal clone-default** (§3A flipped); Path B still generates our submitted output + demo.
- **🟠 [action] The ~28-Jun submission-portal email to the team head carries the form link AND the pitch-deck/video format + size specs** (never stated in-session). Retrieve it (application mail: testidp@just.edu.bd).
- **[confirmed] Submission-kit specifics:** README template = 17 sections (only Quick Start mandatory for R1, rest "mandatory for Stage 3") incl. **`logs/cost_report.json` + measured-cost table with an open-weight-swap total** ("judges will verify cost claims against your code"), Known Limitations, `evaluate.py --sample-kit`; **deck slide 7** demands chunking strategy, retrieval type, the 100%-citation-match guarantee, anti-hallucination, an example input→output; slide 6 demands stack **licensing compliance**; slide 10 → include a brief competitive-landscape line. MY portal per official README = `federalgazette.agc.gov.my` (support alongside `lom.agc.gov.my`).
- **[confirmed] New folds:** Claude-for-Legal SKILL.md **citation tiering `[settled]/[verify]/[verify-pinpoint]`** ("pinpoint cites carry the highest fabrication risk — ALWAYS verify vs primary source" → G1/G2 framing; judges' reference plugin; usable as a base if modular) + scope-first / **effective ≠ enforcement date** / "identify the delta" / "no gaps → still write the doc"; **dangling-reference gate** (mechanically verify cross-referenced instruments still exist/are in force before concluding — Qian Xiao Q&A); **judges-look-for (Varanyu slide 55): Impact · Feasibility · Scalability · Innovation · Adoption** → address all five in the deck; **TINA / "legal TINA"** (ESCAP's own tool, plugged by advisory-board member Henry Gao) → look at once, cite in pitch; **`reviewer_decision`** JSON field (EUI 12-field spec); **"horizontal" = applies to ALL sectors** (financial+banking = sectoral; 15-Jun); nested act + implementing regulation = **separate adjacent rows** + Notes explaining the hierarchy; OCR is judged by tracing our URL and diffing our extracted text.
- **[corrections to our own syntheses]** Qian Xiao's P6 noise-audit charts are **AI-generated illustrations** (captioned "ChatGPT"), not a prior experiment — keep the design, don't cite it as her result. The "RAG 4-step" framework is hers (OpenAI Cookbook), not Rathachai's. Hold-out re-run also happens in **Round-1** technical judging (1-Jun Overview p17), not only 3 Aug. `QnA.docx` is NOT just our question list — it holds official answers (MVP acceptable; deployment optional) — §13 fixed.

### 0B. 11–15 June workshops + Q&A + the Round-2 DB (22-Jun digest)

**Scope & strategy**
- **[confirmed] Extra economies score 0 in Round 1** (only the 3 designated + their *additional pillars* score). Yet we still build the 7 Round-2 economies now — they can't be done in the 1-week gap, and the **Round-2 gold DB just arrived** to validate against. → Core-first, R2 additive (§6).
- **[confirmed] We now have the finals answer key:** `Hackthon_Knowledge/ESCAP-RDTII-2.1_ Round 2 Database.xlsx` — populated, government-verified gold for **China, India, Indonesia, Lao PDR, Mongolia, Russian Federation, Thailand** (Timor-Leste absent). Same schema as the Round-1 master DB. → our R2 KNOWN/eval baseline (§13).

**Output & submission rules**
- **[confirmed] Additional columns are allowed**, appended after the 13 template columns → we WILL add `Coverage` (Horizontal/Sectoral), `Verbatim Snippet (English)` (non-EN sources), `Status` (in force/amended/repealed). `Location Reference` is **optional** (the xlsx "required" is an error).
- **[confirmed] Final submission = ONE consolidated CSV/JSON** (per-pillar files only during dev). **No resubmission after the deadline** (re-upload allowed up to 20 Jul, frozen after). `Last Amended` = month+year when available.
- **[confirmed] NEW = provision-level** even inside a known law — the 20-point lever, now official. Evaluated **against the FULL known evidence; goal = find MORE, not less.** A **repealed law cited as current = penalty** (mark `Status`). **No-evidence → record "no provision found"**, never blank.
- **[confirmed] Judging = document-by-document** (they check each row's URL is live + the doc really contains the snippet + the mapping fits the indicator criteria) plus a **human-verification stage**; the tool must also prove **end-to-end automation**. Support both a clean batch run and per-row review.

**Runtime, cost & interfaces**
- **[confirmed] Cost-efficiency AND speed are scored** — but they're a minority of the 30% Architecture block, while **accuracy (40%) + resilience (30%) are the prize.** Our corpus is small, `nano`/`mini` are cheap, and Neo4j+OCR are already self-hosted. → Both profiles ship as `models.yaml` profiles (§3A); we measure + report $/doc (it's ~cents). *(4-Jul update: clone-default = Path A — see §0A.)*
- **[near-confirmed — upgraded 4 Jul] CPU-only / no GPU / no API keys / no internet at eval** — asked twice on 15 Jun; the second answer is clean and self-consistent. **Path A (key-free local) is the clone-default** (§3A); email confirmation (§14 Q1) is now belt-and-braces, not blocking.
- **[confirmed] CLI is NOT mandatory** (any documented, clonable interface is fine). **A polished UI is NOT required for Round 1 but IS required in the Final** → since we're prepping finals now, build the UI as a real (additive) deliverable, not an afterthought.

**Technical method (12 June: Rathachai "RAG and LLMs"; Qian Xiao "AI-Assisted Legal Document")**
- **[confirmed] "Broad recall, NOT top-k"** — validated twice (Qian Xiao's semantic-similarity-bottleneck / Direct-Corpus-Interaction slides + Nikita on 5 Jun): *"if evidence is filtered out early by top-k, no downstream reasoning recovers it."*
- **[confirmed] Noise Audit for Zone-3 scoring** (Qian Xiao): run several **persona LLM judges independently**, measure disagreement (**Krippendorff's Alpha**), and **report an uncertainty band, not a single 0/0.5/1.** → our Zone-3 differentiator (§6 P3′, Build Guide §7.1). *(4-Jul correction: her P6 whisker/heatmap slides are AI-generated ILLUSTRATIONS of the method, not a run she performed — implement it, don't cite it as her prior art.)*
- **[confirmed] GraphRAG-for-legal schema** (Rathachai): `Document → Article → Paragraph → Item → Subitem` with **`AMENDS` / `REVOKE`** edges = essentially our `GraphStore` model; adopt those edge types (powers the currentness gate + amendment story).
- **[confirmed] Design rules:** *"don't collapse evidence into scores too early — keep source/interpretation/score separate"* + *"always model uncertainty (legal text is vague, translated, outdated, sector-specific)."* Skip fine-tuning; RAG + prompting. CPU is fine for inference — **the real cost is preprocessing/embedding** (precompute + cache). Study Anthropic's **"Claude Code for Legal"** plugin for legal prompt patterns (effective-vs-enforcement dates, "identify the delta," verify-before-cite). Model-size rules of thumb: >10B general, >30B tool-use/mapping, >120B Thai → informs the local-model choice.

**Pitch framing (11 June: Varanyu; Xiaochen Zhang/AI 2030)** — mostly deck ammunition (§11): "model ≠ system" (Knowledge + Governance layers are first-class), trust > compliance, human accountability, the development-divide narrative, anchor responsible-AI on **UNESCO + OECD** principles.

---

## 1. Operating model (the rules that keep us shippable)

1. **Contracts first, then build.** The shared shapes (Pydantic stage models + the `LLMProvider`/`OCREngine`/`GraphStore` interfaces + the template-exact writer) are locked. ✅ **Done in P0.** Don't change shapes casually; if you must, note it in `engine/DECISIONS.md`.
2. **Main is always green.** At any moment `run.py --economy Singapore --pillar 6` must run end-to-end and write a template-valid file. A change that breaks that doesn't land. This is what lets us "submit early if we had to."
3. **One vertical slice before breadth.** One economy + one pillar fully working (crawl→…→CSV) before adding more. Depth first kills integration risk.
4. **Core only (4 Jul).** SG/AU/MY × P6+P7 reaches flawless and **freezes Jul 16**. Round-2 economies and the bonus pillar are cut by default; anything reinstated lives on branches, **additive-only** to the frozen core.
5. **The Legal playbook is law.** All prompts, rubric rules, and "is this mapping correct?" calls come from `ClauseChain_Legal_Matching_DoDont.md`. We don't invent legal logic; we encode it, and **you verify** the substantive calls.

---

## 2. Task-buckets (who-does-what, all executed by Claude, verified by you)

The pipeline is a **spine** + two **organs** + a **brain**. I (Claude) build all four; **you verify** at each checkpoint. Labels are buckets, not people.

| Bucket | Modules | One line |
|---|---|---|
| **Spine** (lead/glue) | `packages/core` (schemas, orchestrator), `run.py`, `apps/api` (FastAPI), `apps/web` (Next.js UI), `export/` (template-exact CSV/JSON), `configs/models.yaml`, repo/CI/Docker, eval runner | Make every part run as one command and produce the graded output. ✅ scaffold done. |
| **Discovery & extraction** (Zone 1) | `packages/connectors` (per-portal crawlers), `packages/extractors` (HTML/PDF/**OCR** + `OCREngine` impls), the **multilingual** path | Get the law in: crawl official portals; turn HTML/PDF/scanned/multilingual pages into clean text + locations. |
| **Retrieval & mapping** (Zone 2) | `packages/retrieval` (BM25+dense+rerank, **broad recall**), `packages/predicate`, `packages/rdtii` (rubric map), `packages/verifier` (G1–G8), `packages/discovery` (NEW/KNOWN), `providers/` | Find the right clause, extract its legal meaning, map to `P6-I1…P7-I5`, verify it. |
| **Substantive / legal** (brain) | `configs/rdtii/pillar_6.yaml`+`pillar_7.yaml`, `configs/jurisdictions/*` + `known_provisions`, the **gold sets**, mapping-rationale review, the QC-checklist gates, the pitch's policy half | Decides what "correct" means and builds the answer key. **You are the final human-in-the-loop here.** |

**Your verification role (the bottleneck that matters):** you don't write code, but you (a) confirm each checkpoint demo actually runs, (b) **approve/override every Zone-3 score and every NEW finding** before it ships (no AI-only final calls), and (c) sanity-check legal mappings against the playbook. I produce; you decide.

---

## 3. The locked contract (✅ done in P0 — engine/)

Already committed and green (16 tests). Everyone/everything codes against these:
1. **Stage artifacts** (`packages/core/schemas.py`): `SourceDocument`, `ExtractedPage`(text+bbox+confidence), `RuleUnit`, `PredicateTuple`, `CandidateFinding`, `MappedFinding`, `GateResult`, `RunEnvelope`.
2. **Interfaces** (`packages/core/interfaces.py`): `LLMProvider`, `EmbeddingProvider`, `OCREngine`, `GraphStore` (all Protocols — swappability = 15 pts).
3. **Template-exact writer** (`packages/export/csv_writer.py`): the 13-column header is **asserted byte-equal to `OUTPUT_TEMPLATE_31MAY.xlsx`** by `tests/test_template_contract.py` (the xlsx is vendored as a fixture). Extra columns (Coverage, Verbatim-English, Status) append AFTER the 13.
4. **Run interface:** `run.py --economy Singapore --pillar 6` (also `--country`) → `orchestrator.run()` → `list[MappedFinding]` → writer emits `output.csv` + `output.json`. Currently returns dummy data; we replace one stage stub at a time, keeping main green.

> The riskiest thing (integration) is already solved. From here it's "replace one box, keep main green."

---

## 3A. Model routing — TWO PROFILES (decided 23 Jun; **clone-default flipped to Path A on 4 Jul**)

**Our goal is the best possible OUTPUT, not the organizer's cost-efficiency sub-score.** Cost-efficiency is one factor inside the 30% Architecture block; **Substantive Accuracy (40%) + Technical Resilience (30%) are the prize**, and mapping accuracy tracks model quality (12-Jun: tool-use wants a capable model). Our corpus is small, `nano`/`mini` are cheap, and the cost-heavy infra (**Neo4j + OCR are already self-hosted**), so cloud reasoning costs ~cents/doc. The swappable design lets us ship BOTH profiles via `configs/models.yaml` with no code change — which is itself the 15-pt modularity demo.

**Division of labour (4 Jul):** **Path A = the profile a fresh clone runs** (the judges' environment is near-confirmed CPU-only/no-keys/no-internet — §0A); **Path B = the profile WE run** to generate the submitted output and drive the live demo. Judges verify the submitted output document-by-document (URL live + snippet matches), so they never need to re-run our cloud LLM to check it.

**Path B — "hybrid-accuracy" — for OUR runs, the submitted output, and the live demo:**
| Stage | Engine |
|---|---|
| OCR | **local, self-hosted** (cost already absorbed) |
| Embeddings | **local BGE-M3** (free, multilingual → also unlocks TH/CN/RU/LA; precompute + cache) |
| Sparse retrieval | **BM25** (free, deterministic) |
| Graph / retrieval expansion | **Neo4j GraphRAG** (self-hosted; amendment/cross-ref expansion lifts recall + powers the demo's "why this row" path) |
| Query expansion / rerank | **`gpt-5.4-nano`** (cheap) |
| Predicate + RDTII mapping + rationale | **`gpt-5.4-mini`** (escalate to a larger model only on low confidence / thin score-margin) |

→ cost stays in cents/doc (we still **measure + report $/doc**); accuracy and the graph story are maximized.

**Path A — "portable / key-free" — the CLONE-DEFAULT (`models.yaml` default profile):**
Same pipeline, but cloud LLM → **local LLM** (Ollama/llama.cpp, small quantized model that runs CPU-only — the deterministic gates carry accuracy) and Neo4j → the default **SQLite `GraphStore`**. Runs with **zero API keys, zero internet, zero GPU, zero secrets in the repo** — matches the near-confirmed eval environment (§0A) and gives us a strong cost-efficiency number. Lower mapping accuracy, but it never hard-fails. README documents it as what a fresh clone runs, with clear config instructions for enabling Path B.

**Why both is the smart move:** the **submitted output is generated with Path B** (best accuracy) and is independently verifiable by judges **document-by-document** — they don't need to re-run our LLM to check it. When they run the repo in their locked-down sandbox, **Path A runs anyway.** We get cloud accuracy AND the resilience/cost story. `model_version` is recorded per row so every output states which model produced it.

**Residual question (§14 Q1, no longer blocking):** the CPU/no-key answer came from the SRT (asked twice, second answer clean) but not the high-accuracy caption; the email confirmation is belt-and-braces only — the Path A default is correct under every possible answer.

---

## 4. Git & workflow (solo + Claude)

- **Branches:** `main` stays green; feature work on short branches (`feat/sg-connector`, `feat/zone3-noise-audit`, `feat/r2-thailand`). Round-2 economies live on their own branches and merge only when they don't touch the frozen core.
- **Definition of mergeable:** `run.py` still runs for SG, a smoke test exists, no silent schema change.
- **`engine/DECISIONS.md`:** one line every time a shared shape or a routing/scope call changes.
- **Verification loop replaces standups:** I land a task → you run the checkpoint command / review the rows → accept or send back. Keep a simple Todo/Doing/Verify/Done list.

---

## 5. How to drive me (Claude) well

- **One module to one contract at a time.** Point me at the schema + interface + the relevant Build-Guide / playbook section; I implement to it with a test and a tiny runnable example.
- **Legal logic comes from the playbook**, not my invention — I paste §1 golden rules + §6 disambiguation pairs + §13 examples into mapping/predicate prompts; you confirm the calls.
- **Always demand the runnable proof:** "show it working on this one SG provision," "show the eval number move."
- I also write the FastAPI/Next.js glue, the review UI, the pitch deck draft, and the gold-set first passes for you to verify.

---

## 6. Phase plan (REBASED 4 Jul; ~15 days — compressed, stretch cut)

Each phase: **goal → bucket tasks → checkpoint (what must run, what you verify).** Core only; the old P4 (Round-2 economies) is **cut by default** and returns only if the core freezes early. Priority within every phase follows the 15-Jun ruling: **the consolidated output file is the primary judged artifact** — when in doubt, spend the hour on output quality.

### P1′ — Vertical slice · **Jul 5–9** · *"one real answer, end to end"*
Goal: **Singapore + Pillar 6, real, end-to-end, no manual steps.** No UI.
- **Spine:** wire real stages into the orchestrator as they land; harden `run.py`; finalize CSV+JSON from real data; keep CI green. Flip `models.yaml` default to **Path A** (§3A) and verify a full CPU-only key-free run.
- **Discovery:** real SG connector (the fetch spike already works on `sso.agc.gov.sg`); HTML extraction → `ExtractedPage` with section anchors + char offsets.
- **Retrieval/mapping:** broad-recall retrieval for P6-I1…I4 → predicate tuple → rubric map → gates **G1 (span exists)**, **G3 (authority)**, **G4 (currentness)** → **NEW/KNOWN tag** vs the KNOWN index already built from the master DB's parsed Impact column. Prompts from the playbook (incl. the corrected §9.1 criteria).
- **Legal:** SG P6 gold rows labelled; review first outputs; flag wrong mappings.
- **✅ Checkpoint (Jul 9):** `run.py --economy Singapore --pillar 6` → real template-valid CSV+JSON from the live source, verbatim citations + NEW/KNOWN tags, matching the SG gold on easy cases. **You verify:** the SG s.26 → **P6-I4** row with the "unless…" exception caught (not mis-coded as a 6.1 ban).

### P2′ — Core breadth + OCR + the MY error-audit · **Jul 9–13** · *"SG/AU/MY × P6+P7, and the double-weight Malaysia points"*
**Sequence:** SG stable → **MY** (double weight 20, CONFIRMED: scanned gazettes + OCR **plus the planted-error audit**) → **AU** (clean HTML, cheap, never skip — mandatory & graded on coverage).
- **Spine:** generalize orchestrator for any economy/pillar; finalize JSON envelope (coverage, status, archived_copy, ocr_quality_cer, **reviewer_decision**); prove modular swap (local↔cloud) + per-run cost meter writing **`logs/cost_report.json`**.
- **Discovery:** harden SG; build MY (`lom.agc.gov.my` **+ `federalgazette.agc.gov.my`** + gazettes; **OCR path, CER<5%, bbox**); build AU (`legislation.gov.au`). Multilingual extraction path only as far as the Round-1 scanned-PDF deliverable needs (original-language + English columns). Live crawling (JS/anti-bot) + archived-copy fallback throughout.
- **Retrieval/mapping:** add **Pillar 7** (P7-I1…I5, incl. polarity AND the corrected criteria: **7.5 court-order test, 7.2/7.4 0.5-tiers**); rule-unit builder (rule + exception + Schedule cross-refs); reranking; gates **G2/G5/G6/G7** + the **dangling-reference check** in G4/G8; carry NEW/KNOWN across economies.
- **⭐ MY ERROR-AUDIT PASS (new, scored — §0A):** re-verify every MY master-DB row — URL resolves? law current (not repealed/superseded)? cited article exists in the parsed tree? mapping fits the indicator criteria? Emit corrections (fixed URL / Status flag / remap) in output + Notes. These planted-error catches become the G1–G8 regression suite and a screen-recording moment.
- **Legal:** MY then AU `known_provisions` + P6+P7 gold; disambiguation notes (6.1-vs-6.4, 7.2 cyber, 7.3 retention-direction) into the rubric; review the error-audit findings.
- **✅ Checkpoint (Jul 13):** SG+MY solid, AU passing, P6+P7 end-to-end vs gold; OCR + modular-swap demoed; ≥1 planted MY error caught and corrected. **You verify:** the scanned-PDF→citation path (deliverable #4 material) and a CER<5% number.

### P3′ — Differentiators + CORE FREEZE · **Jul 13–16** · *"the points other teams miss"*
- **Spine:** wire G1–G8 + Discovery Tag + confidence into every row; consolidated single-file output; **Run console + Evidence-Audit UI only if the engine is done** (§12 cut order — the review/approve flow for you can be a spreadsheet if time is short).
- **Discovery:** amendment/"Last Amended" detection + dead-link→archive fallback feeding G4/`Status`.
- **Retrieval/mapping:** **NEW-discovery recall maximization + false-positive control** (the 20-pt lever — go wide, kill false NEWs); counter-evidence (G8); **Zone-3 scoring as a NOISE AUDIT** — multi-persona judges, Krippendorff's-Alpha disagreement, **uncertainty band + flag-for-review**, per the corrected §7.1/§9.1 criteria (P7 polarity + court-order test + P6 government-data exclusion). Scores are **AI suggestions only**.
- **Legal:** validate NEW finds; **you approve/override every Zone-3 score**; finalize QC gates; start the pitch's policy narrative.
- **🔒 CORE FREEZE (Jul 16):** SG/AU/MY × P6+P7 is flawless and submittable. **From here everything is additive-only.** You demo a full 3-economy run with NEW rows + audit trail.

### P4 — Round-2 economies · **CUT (4 Jul)** · *reinstate only if the core freezes early*
The R2 gold DB is already ingested (`data/known_index_round2.json`, 809 rows) — that plus the config-driven jurisdiction-pack design IS the finals insurance. If the core freezes before Jul 16, reinstate in this order: **bonus pillar (scores in Round 1) → Thailand → China** (multilingual proof), on branches, never touching the frozen core.

### P5′ — Package, harden, submit · **Jul 16–19** · *"win the submission"*
- **Spine:** README = **the full official 17-section template** (Quick Start mandatory; also: cost table w/ open-weight-swap total + `logs/cost_report.json`, Known Limitations, `pytest tests/`, `evaluate.py --sample-kit`, LLM/OCR-swap sections, pinned versions, Apache-2.0, Team, Acknowledgements UNESCAP+KMITL); one-command run; **consolidated CSV+JSON**; edge-case hardening; **fresh-machine quick-start test with a stopwatch**; **≤10-min screen recording** (scanned-PDF→citation, live crawl, `.env` model swap, a MY planted-error catch).
- **Retrieval/Discovery:** final benchmark `report.md` (recall vs full gold, CER, $/run, time) with confidence intervals; live-demo dry runs (3-Aug demo runs live).
- **Legal:** finish the **pitch deck** (official 12-slide template; slide 7 = chunking/retrieval-type/100%-citation-guarantee/example I-O; slide 6 = licensing compliance; map to 40/30/30 + Impact·Feasibility·Scalability·Innovation·Adoption + failure-mode catches + responsible-AI UNESCO/OECD + a competitive-landscape line + TINA nod); final accuracy review.
- **🚀 Jul 19 (buffer day):** upload the 4 deliverables (prototype repo, consolidated output, pitch deck, video) via the portal form. Re-upload allowed until 20 Jul Bangkok; frozen after. **Prereq: retrieve the ~28-Jun portal email — it has the form link + deck/video format & size specs.**

---

## 7. Where we are now (4 Jul) & immediate next actions

**Done (P0 + 23-Jun P1 kickoff, in `engine/`):** clean Apache-2.0 repo; schemas + interfaces + template-asserting writer (16 tests green); `models.yaml` two profiles (`hybrid_accuracy` default + `local_fallback`) with Ollama + BGE-M3 providers; **SqliteGraphStore** (default) + Neo4j optional behind `GRAPH_BACKEND`; OpenAI+Gemini REST providers + fallback; rubric YAMLs (**P7 criteria corrected 4 Jul** — court-order test, 0.5 tiers, weights); SG/MY/AU jurisdiction packs; **KNOWN indexes built from BOTH gold DBs** (R1: 252 rows/306 article refs; R2: 809 rows/1373 refs); appended output columns (Coverage/Verbatim-English/Status) in the writer; eval scoreboard; SG fetch + scanned-PDF spikes passed. **NOT built: everything between the connector and the writer** — extractors, retrieval, predicate, rdtii mapper, verifier gates, discovery diff. `run.py` still emits stubs.

**Do next (P1′ kickoff — in order):**
1. **Retrieve the ~28-Jun submission-portal email** (team-head inbox; application mail testidp@just.edu.bd) → form link + deck/video format/size specs.
2. **Flip `models.yaml` default to Path A** and verify one full CPU-only, key-free, no-internet run (cached fixtures OK for the offline case).
3. Build the **real SG vertical slice**: connector → extractor → broad-recall retrieval → predicate → rubric map → gates G1/G3/G4 → NEW/KNOWN → template CSV/JSON (P1′, checkpoint Jul 9).
4. Wire the per-run **cost meter → `logs/cost_report.json`** (measured, incl. the open-weight-swap comparison row).
5. (Optional, belt-and-braces) email ESCAP the residual §14 questions.

---

## 8. Cadence (solo + Claude)

- **Per-task verify loop:** I deliver a runnable module + its checkpoint command; you run it / read the rows and accept or bounce. That replaces standups.
- **End-of-phase demo (to yourself):** run the engine, not slides. If the checkpoint command doesn't run, that's the only priority until it does.
- **Weekly "green check":** main runs SG end-to-end + the eval scoreboard hasn't regressed.

---

## 9. Definition of Done

- **A row is done** when it passes all QC gates (verbatim exists, exact article+paragraph, current source, correct indicator, Discovery Tag, live URL) — DoDont §12.
- **A Zone-3 score is done** only after **you approve/override** the AI suggestion; it ships with an **uncertainty band** (noise-audit), never a bare number.
- **A gold set (economy × pillar) is done** when every indicator has ≥1 labelled row (or a justified "no provision found → cite the governing law" row).
- **A pillar YAML is done** when it encodes the official 0/0.5/1 criteria, weights, and P7 polarity (Build Guide §7.1 / DoDont §9.1) and round-trips a gold row through the scorer.
- **A Round-2 economy is done** when its output validates against the Round-2 gold DB **and** it touched zero core files.
- **A module is done** when it respects the contract, has a smoke test, and `run.py` still works.

---

## 10. Traps to avoid (updated)

- ❌ **Letting anything slip the core.** Core freezes Jul 16; R2 economies + bonus pillar are already cut — do not un-cut them before the freeze.
- ❌ **Treating extra economies as Round-1 points.** They score 0 in Round 1 — they're finals insurance only (and the R2 gold ingest already banked it).
- ❌ **A clone that needs keys/internet/GPU.** The eval environment is near-confirmed CPU-only/no-keys/no-internet — Path A is the clone-default (§3A); no secrets in the repo; Path B (cloud) generates OUR submitted output and still gets measured + reported.
- ❌ **Treating the repo as the primary judged artifact.** Judges primarily review the **submitted output file**; code-running is selective. Output polish first.
- ❌ **Skipping the MY error-audit.** Malaysia is double-weight *because* of the planted errors — finding them is scored work, not optional QA.
- ❌ **Top-k retrieval.** Broad recall, then gates cut — top-k drops evidence you can't recover (12-Jun).
- ❌ **A bare Zone-3 number.** Always a noise-audit uncertainty band + human approval.
- ❌ **Collapsing evidence into scores early.** Keep source / interpretation / score separate (12-Jun).
- ❌ **A repealed law cited as current** = penalty. Mark `Status`; only record active laws unless flagged.
- ❌ **Leaving an empty row** for "no measure." Record "no provision found" + the governing law.
- ❌ **Hardcoding a model / breaking the template header / shipping an unverifiable quote or dead URL.**
- ❌ **Over-building UI before the core runs** — but DO build it as a real deliverable for the Final (required there).

---

## 11. Deliverables → (all built by Claude, verified by you)

| # | Deliverable | Notes |
|---|---|---|
| 1 | Functional prototype + README (**full 17-section official template**; Quick Start mandatory) | clone→run, **Path A key-free local default**; CLI fine (not mandatory); pinned versions; `logs/cost_report.json` + measured-cost table w/ open-weight-swap total; Known Limitations; `evaluate.py --sample-kit`; no secrets in repo |
| 2 | Structured output (CSV+JSON) — **the PRIMARY judged artifact** | **one consolidated file**, template-exact 13 cols + appended Coverage/Verbatim-English/Status (+ `reviewer_decision` in JSON); every row verifiable in seconds |
| 3 | Technical pitch deck (official 12-slide template) | slide 7: chunking/retrieval-type/**100%-citation guarantee**/example I-O; slide 6: licensing compliance; 40/30/30 + Impact·Feasibility·Scalability·Innovation·Adoption + failure-mode catches + responsible-AI (UNESCO/OECD) + "we automated ESCAP's own SOP" + competitive landscape + TINA nod. **Format/size specs in the ~28-Jun portal email.** |
| 4 | ≤10-min screen recording | scanned-PDF→citation + live crawl + `.env` model swap + a MY planted-error catch |
| 5 | Live demo + interview (3 Aug) | prototype runs live on a hold-out economy; runs end-to-end after a human-verification pass. (Hold-out re-runs also happen in Round-1 technical judging.) |

---

## 12. If we fall behind (cut in this order)

Protect the scored core. Cut: **(1) Round-2 economies** (insurance, 0 Round-1 points) → **(2) bonus pillar** → **(3) extra-mile UI screens** (keep Run console + Evidence Audit) → **(4) Zone-3 polish** (keep it as a suggestion) → **(5) simplify** a lagging mandatory economy (cover fewer indicators robustly) — **never drop SG/AU/MY, the engine, the template-exact output, verbatim citations, NEW/KNOWN, the audit trail, or your gold review.** A smaller flawless submission beats a broad broken one.

---

## 13. What ESCAP gave us (map / verify / knowledge)

**Use-types: KNOWLEDGE / MAP (engine input) / VERIFY (answer key) / TEMPLATE.**

**Answer keys (VERIFY) + seeds (MAP):**
- `Sample Kit/ESCAP-RDTII-2.1_ Round 1 Database.xlsx` — AU/SG/MY gold, all pillars. **PRIMARY Round-1 NEW/KNOWN baseline** (parse Impact col → (instrument+article) index). ✅ ingested.
- **`ESCAP-RDTII-2.1_ Round 2 Database.xlsx` (root) — Round-2 FINALS gold** for CN/IN/ID/LA/MN/RU/TH (government-verified; same schema; no Timor-Leste). → R2 KNOWN/eval baseline + multilingual fixtures + few-shot mining. **Extend `build_known_index.py` to read it.**
- `Mail Content 10 June/…Legal Inventory.csv` — 384-row all-pillar inventory (secondary; crawler seeds + bonus-pillar seeds; NOT the primary KNOWN baseline).
- `Resource Library/Sample governemnt portals_Pillar 6_7.csv` — 93 P6/P7 provisions w/ official URLs (seed list + known list).

**Templates:** `OUTPUT_TEMPLATE_31MAY.xlsx` (13-col schema — vendored as the engine fixture; **unchanged** as of 22 Jun) · `README_template.md` (Quick-Start shape; **unchanged**) · `Pitch Deck_REGTECH_rev1.pptx`.

**Knowledge (already distilled — don't re-read raw):** RDTII guides → rubric YAML; the **three `NOTES_*June_*.md`** digests (11/12/15 June) → §0 above; `CHAMPION_GUIDE_*.md` → pitch arsenal + manual-SOP map; DoDont §13 → worked examples.

**Sample legislation fixtures** (`Sample Kit/Sample legislations/`): clean text (MY PDPA, SG Telecom), consolidated (Niue 683pg), scanned (Pakistan PECA, India Procurement → OCR), domestic-language (Lao → OCR+translation), multilingual (India gazette). AI-1's extractor/OCR/multilingual test set.

**`QnA.docx` (root)** — *(corrected 4 Jul; the old "our own question list — ignore" note was wrong)*: contains official organizer answers — **an MVP prototype is acceptable; server deployment optional if the README lets judges run it** (Thanavit); translation ruling: the native-language version updates first, check each version's history, even government English versions are "not officially translated" (Juntong, Kazakhstan example).

---

## 14. Open questions to email ESCAP (structured window closed 15 Jun; channel still open)

Witada: *"send us questions in email if you have problems."* Still worth confirming:
1. **Runtime [downgraded 4 Jul — belt-and-braces only]:** confirm the eval sandbox is CPU-only / no GPU / no provided API keys / no internet. The 15-Jun re-read shows this was asked twice and the second answer is clean ("should not assume GPU or internet access… will not provide private API key") — **Path A is the clone-default regardless of the reply** (§3A), so this no longer blocks anything.
2. **Zone-3:** are the 0/0.5/1 scores judged for *accuracy*, or credited only as bonus functionality? *Decides how much to polish the noise-audit scorer.*
3. **Hold-out economy (3 Aug):** is a seed portal URL provided, or must discovery start cold? *Decides generic-connector cold-start investment.*
4. **[if the ~28-Jun portal email can't be found]** re-request the submission-form link + deck/video format & size specs.

*(Already answered on 15 Jun — no need to ask: additional columns allowed ✅, Coverage column ✅, Location Reference optional ✅, consolidated file ✅, NEW=provision-level ✅, eval vs full known ✅, document-by-document testing ✅.)*

---

> **Bottom line (4 Jul):** The scaffold is green but the pipeline is unbuilt and 15 days remain — so the stretch is cut and every day goes to the core. Build the real SG slice by Jul 9, all three economies (including the double-weight **Malaysia error-audit**) by Jul 13, freeze Jul 16, package Jul 16–19, and submit Jul 19 with a day of buffer. Ship the broad-recall, gate-verified (now with the **corrected P7 criteria** incl. the 7.5 court-order test), noise-audited engine — **Path A key-free by default for the judges, Path B accuracy-first for our submitted output** — and remember the judges grade the **output file** first: a consolidated, reviewable, fully-cited CSV/JSON where every row verifies in seconds is the championship.
