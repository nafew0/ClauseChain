# ClauseChain — Dev Plan & Task Distribution (Guiding Star)

**The plan we execute from. Everything else is a supporting reference, pointed to from the task that needs it.**

| Field | Value |
|---|---|
| Role of this doc | **GUIDING STAR.** Read this first; it links out to the others when needed. |
| Operating model | **You = lead + verifier. Claude (me) = executes all build/legal/research tasks; you check the output.** The "AI-1 / AI-2 / Legal" labels below are **task-buckets, not people.** |
| Window | **Today 22 Jun 2026 → submit 20 Jul (Bangkok time).** ~4 weeks. **P0 is DONE** (engine scaffold built & green). **Core freeze ~11 Jul.** |
| Scope (decided 22 Jun) | **Core-first, Round-2 additive.** Ship **SG/AU/MY × Pillars 6&7 flawless** (that's what gets us shortlisted — extra economies score **0** in Round 1). THEN, in the same 4 weeks, build the **7 Round-2 finals economies** as a strictly additive track (we can't do them in the 1-week round gap). Order after core: **multilingual/OCR hardening → Round-2 economies → bonus pillar (only if time).** |
| Companion docs | `ClauseChain_Round1_Build_Guide.md` (architecture · phases · **§7.1 official Zone-3 scoring/weights/polarity**) · `ClauseChain_Legal_Matching_DoDont.md` (legal rules · **§9.1 scoring criteria** · §13 worked-example bank) · `ClauseChain_Championship_GraphRAG_Strategy.md` (graph: **§12 swappable `GraphStore`, SQLite default / Neo4j optional**) · `Hackthon_Knowledge/CHAMPION_GUIDE_*.md` (manual-SOP→component map + pitch arsenal) · the three **`NOTES_*June_*.md`** session digests in `Hackthon_Knowledge/` (11/12/15 June — the source of the §0 changes below) |

> **North star.** Win Round 1 by making SG/AU/MY unbeatable, then bank finals insurance by covering the 7 Round-2 economies before the window closes — **without ever letting Round-2 work destabilize the frozen core.** Cost-efficiency, speed, and reviewable evidence are all scored; build for them on purpose.

---

## 0. What changed (11–15 June workshops + Q&A + the Round-2 DB) — read once

These are the deltas since the last plan; each is wired into the sections below. Tags: **[confirmed]** = high-accuracy caption/official file; **[verify]** = lower-quality SRT only.

**Scope & strategy**
- **[confirmed] Extra economies score 0 in Round 1** (only the 3 designated + their *additional pillars* score). Yet we still build the 7 Round-2 economies now — they can't be done in the 1-week gap, and the **Round-2 gold DB just arrived** to validate against. → Core-first, R2 additive (§6).
- **[confirmed] We now have the finals answer key:** `Hackthon_Knowledge/ESCAP-RDTII-2.1_ Round 2 Database.xlsx` — populated, government-verified gold for **China, India, Indonesia, Lao PDR, Mongolia, Russian Federation, Thailand** (Timor-Leste absent). Same schema as the Round-1 master DB. → our R2 KNOWN/eval baseline (§13).

**Output & submission rules**
- **[confirmed] Additional columns are allowed**, appended after the 13 template columns → we WILL add `Coverage` (Horizontal/Sectoral), `Verbatim Snippet (English)` (non-EN sources), `Status` (in force/amended/repealed). `Location Reference` is **optional** (the xlsx "required" is an error).
- **[confirmed] Final submission = ONE consolidated CSV/JSON** (per-pillar files only during dev). **No resubmission after the deadline** (re-upload allowed up to 20 Jul, frozen after). `Last Amended` = month+year when available.
- **[confirmed] NEW = provision-level** even inside a known law — the 20-point lever, now official. Evaluated **against the FULL known evidence; goal = find MORE, not less.** A **repealed law cited as current = penalty** (mark `Status`). **No-evidence → record "no provision found"**, never blank.
- **[confirmed] Judging = document-by-document** (they check each row's URL is live + the doc really contains the snippet + the mapping fits the indicator criteria) plus a **human-verification stage**; the tool must also prove **end-to-end automation**. Support both a clean batch run and per-row review.

**Runtime, cost & interfaces**
- **[confirmed] Cost-efficiency AND speed are scored** — but they're a minority of the 30% Architecture block, while **accuracy (40%) + resilience (30%) are the prize.** Our corpus is small, `nano`/`mini` are cheap, and Neo4j+OCR are already self-hosted. → **DEFAULT = accuracy-first cloud-primary (Path B), plus a mandatory key-free local fallback (Path A)** — both as `models.yaml` profiles (§3A). We still measure + report $/doc (it's ~cents).
- **[verify] CPU-only / no GPU / no API keys at eval** — SRT-only, NOT in the accurate caption. **Path A (key-free local) neutralizes this risk** regardless of the answer; still email ESCAP to confirm (§14 Q1).
- **[confirmed] CLI is NOT mandatory** (any documented, clonable interface is fine). **A polished UI is NOT required for Round 1 but IS required in the Final** → since we're prepping finals now, build the UI as a real (additive) deliverable, not an afterthought.

**Technical method (12 June: Rathachai "RAG and LLMs"; Qian Xiao "AI-Assisted Legal Document")**
- **[confirmed] "Broad recall, NOT top-k"** — validated twice (Qian Xiao's semantic-similarity-bottleneck / Direct-Corpus-Interaction slides + Nikita on 5 Jun): *"if evidence is filtered out early by top-k, no downstream reasoning recovers it."*
- **[confirmed] Noise Audit for Zone-3 scoring** (Qian Xiao, built on RDTII **Pillar 6 with our exact weights**): run several **persona LLM judges independently**, measure disagreement (**Krippendorff's Alpha**), and **report an uncertainty band, not a single 0/0.5/1.** → our Zone-3 differentiator (§6 P3, Build Guide §7.1).
- **[confirmed] GraphRAG-for-legal schema** (Rathachai): `Document → Article → Paragraph → Item → Subitem` with **`AMENDS` / `REVOKE`** edges = essentially our `GraphStore` model; adopt those edge types (powers the currentness gate + amendment story).
- **[confirmed] Design rules:** *"don't collapse evidence into scores too early — keep source/interpretation/score separate"* + *"always model uncertainty (legal text is vague, translated, outdated, sector-specific)."* Skip fine-tuning; RAG + prompting. CPU is fine for inference — **the real cost is preprocessing/embedding** (precompute + cache). Study Anthropic's **"Claude Code for Legal"** plugin for legal prompt patterns (effective-vs-enforcement dates, "identify the delta," verify-before-cite). Model-size rules of thumb: >10B general, >30B tool-use/mapping, >120B Thai → informs the local-model choice.

**Pitch framing (11 June: Varanyu; Xiaochen Zhang/AI 2030)** — mostly deck ammunition (§11): "model ≠ system" (Knowledge + Governance layers are first-class), trust > compliance, human accountability, the development-divide narrative, anchor responsible-AI on **UNESCO + OECD** principles.

---

## 1. Operating model (the rules that keep us shippable)

1. **Contracts first, then build.** The shared shapes (Pydantic stage models + the `LLMProvider`/`OCREngine`/`GraphStore` interfaces + the template-exact writer) are locked. ✅ **Done in P0.** Don't change shapes casually; if you must, note it in `engine/DECISIONS.md`.
2. **Main is always green.** At any moment `run.py --economy Singapore --pillar 6` must run end-to-end and write a template-valid file. A change that breaks that doesn't land. This is what lets us "submit early if we had to."
3. **One vertical slice before breadth.** One economy + one pillar fully working (crawl→…→CSV) before adding more. Depth first kills integration risk.
4. **Core before Round-2, always.** SG/AU/MY × P6+P7 reaches flawless and **freezes (~11 Jul)** before Round-2 economies consume any time they'd take from the core. Round-2 work lives on branches and is **additive-only** to the frozen core.
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

## 3A. Model routing — TWO PROFILES; default = ACCURACY-FIRST (decided 23 Jun)

**Our goal is the best possible OUTPUT, not the organizer's cost-efficiency sub-score.** Cost-efficiency is one factor inside the 30% Architecture block; **Substantive Accuracy (40%) + Technical Resilience (30%) are the prize**, and mapping accuracy tracks model quality (12-Jun: tool-use wants a capable model). Our corpus is small, `nano`/`mini` are cheap, and the cost-heavy infra (**Neo4j + OCR are already self-hosted**), so cloud reasoning costs ~cents/doc. The swappable design lets us ship BOTH profiles via `configs/models.yaml` with no code change — which is itself the 15-pt modularity demo.

**Path B — "hybrid-accuracy" — DEFAULT for our runs, the submitted output, and the live demo:**
| Stage | Engine |
|---|---|
| OCR | **local, self-hosted** (cost already absorbed) |
| Embeddings | **local BGE-M3** (free, multilingual → also unlocks TH/CN/RU/LA; precompute + cache) |
| Sparse retrieval | **BM25** (free, deterministic) |
| Graph / retrieval expansion | **Neo4j GraphRAG** (self-hosted; amendment/cross-ref expansion lifts recall + powers the demo's "why this row" path) |
| Query expansion / rerank | **`gpt-5.4-nano`** (cheap) |
| Predicate + RDTII mapping + rationale | **`gpt-5.4-mini`** (escalate to a larger model only on low confidence / thin score-margin) |

→ cost stays in cents/doc (we still **measure + report $/doc**); accuracy and the graph story are maximized.

**Path A — "portable / key-free fallback" — SHIPS in the repo, runs anywhere:**
Same pipeline, but cloud LLM → **local LLM** (Ollama/llama.cpp) and Neo4j → the default **SQLite `GraphStore`**. Runs with **zero API keys, zero internet, zero GPU** — guarantees the tool executes in any sandbox and gives us a strong cost-efficiency number. Lower mapping accuracy, but it never hard-fails. README documents it as the default for a fresh clone. *(This refines GraphRAG Strategy §12: SQLite stays the portable default = Path A; Neo4j is our primary for Path B runs + demo.)*

**Why both is the smart move:** the **submitted output is generated with Path B** (best accuracy) and is independently verifiable by judges **document-by-document** (URL live + snippet matches) — they don't need to re-run our LLM to check it. If they DO run the repo in a locked-down sandbox, **Path A makes it run anyway.** We get cloud accuracy AND the resilience/cost story. `model_version` is recorded per row so every output states which model produced it.

**Open risk to close (§14 Q1):** whether the eval sandbox has internet/keys is **unconfirmed** (SRT-only). Path A neutralizes it regardless. If ESCAP confirms keys+internet are available, Path B can be the literal default everywhere; if not, Path A is the clone-default while Path B still generates our submitted output and drives the live demo.

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

## 6. Phase plan (rebased to 22 Jun; ~4 weeks)

Each phase: **goal → bucket tasks → checkpoint (what must run, what you verify).** Core-first; Round-2 is the additive P4 track.

### P1 — Vertical slice · **Jun 23–27** · *"one real answer, end to end"*
Goal: **Singapore + Pillar 6, real, end-to-end, no manual steps.** No UI yet.
- **Spine:** wire real stages into the orchestrator as they land; harden `run.py`; finalize CSV+JSON from real data; keep CI green.
- **Discovery:** real SG connector (the fetch spike already works on `sso.agc.gov.sg`); HTML extraction → `ExtractedPage` with section anchors + char offsets.
- **Retrieval/mapping:** broad-recall retrieval for P6-I1…I4 → predicate tuple → rubric map → gates **G1 (span exists)**, **G3 (authority)**, **G4 (currentness)** → **NEW/KNOWN tag** vs the KNOWN index already built from the master DB's parsed Impact column. Prompts from the playbook.
- **Legal:** SG P6 gold rows labelled; review first outputs; flag wrong mappings.
- **✅ Checkpoint (Jun 27):** `run.py --economy Singapore --pillar 6` → real template-valid CSV+JSON from the live source, verbatim citations + NEW/KNOWN tags, matching the SG gold on easy cases. **You verify:** the SG s.26 → **P6-I4** row with the "unless…" exception caught (not mis-coded as a 6.1 ban).

### P2 — Core breadth + multilingual/OCR foundation · **Jun 28 – Jul 6** · *"SG/AU/MY × P6+P7, and the hard-input path"*
**Sequence:** SG stable → **MY** (priority: scanned gazettes + OCR; *verify the rumored 2× weighting against the 1-Jun overview deck before over-investing*) → **AU** (clean HTML, cheap, never skip — mandatory & graded on coverage).
- **Spine:** generalize orchestrator for any economy/pillar; finalize JSON envelope (coverage, status, archived_copy, ocr_quality_cer); prove modular swap (local↔cloud) + per-run cost meter.
- **Discovery:** harden SG; build MY (`lom.agc.gov.my` + gazettes; **OCR path, CER<5%, bbox**); build AU (`legislation.gov.au`). **Build the multilingual extraction path now** (original-language primary + English; flag in Notes) — it serves the Round-1 scanned-PDF deliverable **and** unlocks the Round-2 multilingual economies. Live crawling (JS/anti-bot) + archived-copy fallback throughout.
- **Retrieval/mapping:** add **Pillar 7** (P7-I1…I5, incl. the polarity: 7.1/7.2 score *absence*); rule-unit builder (rule + exception + Schedule cross-refs); reranking; gates **G2/G5/G6/G7**; carry NEW/KNOWN across economies.
- **Legal:** MY then AU `known_provisions` + P6+P7 gold; disambiguation notes (6.1-vs-6.4, 7.2 cyber, 7.3 retention-direction) into the rubric.
- **✅ Checkpoint (Jul 6):** SG+MY solid, AU passing, P6+P7 end-to-end vs gold; OCR + modular-swap demoed. **You verify:** the scanned-PDF→citation path (deliverable #4 material) and a CER<5% number.

### P3 — Differentiators + CORE FREEZE · **Jul 7–11** · *"the points other teams miss"*
- **Spine:** wire G1–G8 + Discovery Tag + confidence into every row; **Run console + Evidence-Audit UI** (row ↔ highlighted source = the 15-pt audit trail) + a simple **review/approve UI** for you; consolidated single-file output.
- **Discovery:** amendment/"Last Amended" detection + dead-link→archive fallback feeding G4/`Status`.
- **Retrieval/mapping:** **NEW-discovery recall maximization + false-positive control** (the 20-pt lever — go wide, kill false NEWs); counter-evidence (G8); **Zone-3 scoring as a NOISE AUDIT** — multi-persona judges, Krippendorff's-Alpha disagreement, **uncertainty band + flag-for-review**, per the official §7.1 criteria (P7 polarity + P6 government-data exclusion). Scores are **AI suggestions only**.
- **Legal:** validate NEW finds; **you approve/override every Zone-3 score**; finalize QC gates; start the pitch's policy narrative.
- **🔒 CORE FREEZE (Jul 11):** SG/AU/MY × P6+P7 is flawless and submittable. **From here the core is additive-only.** You demo a full 3-economy run with NEW rows + audit trail.

### P4 — Round-2 economies (ADDITIVE track) · **Jul 11–17** · *"finals insurance, never at the core's expense"*
Only proceeds because the engine generalizes by config and we have the **Round-2 gold DB** to validate against. Each economy = a jurisdiction YAML + (if needed) a connector, on its own branch; **must not modify the frozen core.**
- **Order:** multilingual economies **Thailand → China → Russian Federation → Lao PDR** first (the path is built in P2 and they're the hard, high-signal ones), then **India → Indonesia → Mongolia** (easier). Timor-Leste only if everything else is done (no gold to validate against).
- **Discovery:** per-economy connectors + portals; OCR/translation for non-Latin scripts.
- **Retrieval/mapping:** reuse the same rubric/gates; validate output against the Round-2 gold (parse its Impact column → R2 KNOWN index, same tool as Round-1).
- **Legal:** spot-check each economy's rows vs the government-verified R2 gold; mine multilingual disambiguation examples back into the playbook.
- **✅ Checkpoint (Jul 17):** ≥4 Round-2 economies produce gold-validated output; core still green and frozen. **Cut rule:** if anything here slips, it's cut before the core or packaging — it's insurance, not the deliverable.

### P5 — Package, harden, submit · **Jul 16–20** · *"win the submission"*
- **Spine:** Quick-Start README (clone→venv→`.env`→one command), one-command run, **consolidated CSV+JSON**, edge-case hardening; **≤10-min screen recording** (scanned-PDF→citation, live crawl, `.env` model swap).
- **Retrieval/Discovery:** final benchmark `report.md` (recall vs full gold, CER, $/run, time) with confidence intervals; live-demo dry runs (3-Aug demo runs live).
- **Legal:** finish the **pitch deck** (problem→solution mapped to 40/30/30 + the failure-mode catches + the responsible-AI/UNESCO-OECD framing); final accuracy review.
- **🚀 Jul 20 (Bangkok):** upload the 4 deliverables (prototype repo, consolidated output, pitch deck, video). Re-upload allowed until the deadline; frozen after. (Submission link is emailed to the team head ~28 Jun — watch that inbox.)

---

## 7. Where we are now & immediate next actions

**Done (P0, in `engine/`):** clean Apache-2.0 repo; schemas + interfaces + template-asserting writer (16 tests green); `models.yaml` routing; **SqliteGraphStore** (default) + Neo4j optional behind `GRAPH_BACKEND`; OpenAI+Gemini REST providers + fallback; rubric YAMLs with the official §7.1 scoring/weights/polarity; SG/MY/AU jurisdiction packs; **KNOWN index built from the real master DB** (252 rows, 306 article refs parsed from Impact prose); eval scoreboard; SG fetch spike (httpx 200/264 KB — anti-bot didn't trigger) + scanned-PDF detection spike both passed.

**Do next (P1 kickoff):**
1. **Set up the two `models.yaml` profiles** per §3A: default **Path B** (cloud `gpt-5.4-nano`/`mini` reasoning + local BGE-M3 embeddings + local OCR + Neo4j GraphRAG) **and** the **Path A** key-free local fallback (local LLM + SQLite graph). Confirm both run; wire the per-run cost meter so we report $/doc.
2. **Extend `build_known_index.py`** to also ingest the **Round-2 DB** (per-country sheets) → R2 KNOWN/eval baseline (small change; finals-prep, do it now while it's fresh).
3. **Add the appended output columns** (`Coverage`, `Verbatim Snippet (English)`, `Status`) to the writer/schema (after the 13).
4. Build the **real SG connector → extractor → retrieval → mapper → gates G1/G3/G4 → NEW/KNOWN** vertical slice (P1).
5. **Email ESCAP** the still-open questions (§14) — the structured window closed, but the channel is open.

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

- ❌ **Letting Round-2 work slip the core.** Core freezes ~11 Jul; R2 is additive branches. If they compete, R2 yields.
- ❌ **Treating extra economies as Round-1 points.** They score 0 in Round 1 — they're finals insurance only.
- ❌ **Cloud WITHOUT a key-free fallback.** Cloud-primary IS our default for accuracy (§3A) — but ship Path A so the tool still runs with no keys/internet/GPU. The risk isn't using cloud; it's having no fallback (and not measuring/reporting the cost).
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
| 1 | Functional prototype + Quick-Start README | clone→run, key-free local default; CLI is fine (not mandatory) |
| 2 | Structured output (CSV+JSON) | **one consolidated file**, template-exact 13 cols + appended Coverage/Verbatim-English/Status |
| 3 | Technical pitch deck | 40/30/30 mapping + failure-mode catches + responsible-AI (UNESCO/OECD) + "we automated ESCAP's own SOP" + dev-divide narrative |
| 4 | ≤10-min screen recording | scanned-PDF→citation + live crawl + `.env` model swap |
| 5 | Live demo + interview (3 Aug) | prototype runs live on a hold-out economy; runs end-to-end after a human-verification pass |

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

**Not ours / skip:** `QnA.docx` is **our own question list** (not an ESCAP answer file) — ignore.

---

## 14. Open questions to email ESCAP (structured window closed 15 Jun; channel still open)

Witada: *"send us questions in email if you have problems."* Still worth confirming:
1. **Runtime [highest priority]:** at evaluation, do tools run **CPU-only / without GPU / without provided API keys / without internet** for the LLM side? (The 15-Jun answer was garbled; cost-efficiency is confirmed scored, but the hard constraints aren't.) *Decides whether Path A (key-free local) must be the literal clone-default, or whether Path B (cloud-primary) can run in the eval sandbox too.*
2. **Zone-3:** are the 0/0.5/1 scores judged for *accuracy*, or credited only as bonus functionality? *Decides how much to polish the noise-audit scorer.*
3. **Hold-out economy (3 Aug):** is a seed portal URL provided, or must discovery start cold? *Decides generic-connector cold-start investment.*

*(Already answered on 15 Jun — no need to ask: additional columns allowed ✅, Coverage column ✅, Location Reference optional ✅, consolidated file ✅, NEW=provision-level ✅, eval vs full known ✅, document-by-document testing ✅.)*

---

> **Bottom line:** P0 is done. Make SG/AU/MY × P6+P7 unbeatable and freeze it by ~11 Jul; build the **accuracy-first** (cloud-primary `nano`/`mini` + Neo4j GraphRAG + local OCR/embeddings, **with a key-free local fallback**), broad-recall, gate-verified, noise-audited engine the meetings told us wins; then bank the 7 Round-2 economies against their gold DB as pure additive insurance — cutting them, never the core, if time runs short. Submit a consolidated, reviewable, fully-cited package (with measured $/doc) on 20 July.
