# ClauseChain — Full-Corpus Gap Analysis (4 July 2026)

**What this is:** every workshop day (1/4/5/11/12/15 June — slides matched against transcripts/SRTs), the submission kit (templates, output xlsx, QnA.docx, 10-June mail, assignments), and the official RDTII 2.1 guides + both gold databases were deep-read and cross-checked against our plan suite (Dev Plan · Build Guide · DoDont · GraphRAG Strategy · Simple Guide · Champion Guide) and the actual `engine/` state.

**Verdict in one line:** the plan is knowledge-complete to ~95% and better-informed than any competitor's is likely to be — but (a) we are **~11 days behind our own schedule with 16 days left**, (b) our **Pillar-7 scoring rubric contains three real errors** vs the official guide, and (c) a handful of judge-stated facts (Malaysia planted errors, output-file-first judging, CPU/no-key eval environment) need to reshape priorities *now*.

---

## 🔴 1. CRITICAL — Execution, not knowledge, is the gap

- Engine last touched **23 June** (git + `engine/DECISIONS.md`). It runs green end-to-end (16/16 tests, template-valid CSV/JSON) **but still emits stub data**. The pipeline's middle — `extractors`, `retrieval`, `predicate`, `rdtii` mapper, `verifier` (G1–G8), `discovery` (NEW/KNOWN) — does not exist as code.
- Per the Dev Plan: P1 (real SG slice) was due 27 Jun, P2 (3 economies × P6+P7) due 6 Jul, core freeze 11 Jul. None started. **Deadline: 20 July, Bangkok time. No resubmission after.**
- **Proposed rebase (apply Dev Plan §12 cut order):**
  - **P1′ Jul 5–9:** real SG × P6 vertical slice (connector→extract→broad-recall retrieve→map→G1/G3/G4→NEW/KNOWN→CSV).
  - **P2′ Jul 9–13:** + P7, + MY (OCR path + error-detection pass, see §3), + AU. Eval vs master DB.
  - **P3′ Jul 13–16:** NEW-recall maximization, G2/G5–G8, Zone-3 noise-audit (suggestion-level), amendment/Status, consolidated output. **CORE FREEZE Jul 16.**
  - **P5′ Jul 16–19:** README (full template), cost report, deck, ≤10-min video, fresh-machine test, **submit Jul 19** (buffer day).
  - **CUT NOW:** P4 Round-2 economies (0 Round-1 points; the R2 gold ingest is already done — that's enough finals insurance) and the bonus pillar unless the core freezes early. Keep the Run-console/Evidence-Audit UI only if the engine is done.
- **Check the team-head inbox for the submission-portal email (~28 June)** — it carries the form link **and the pitch-deck/video format + file-size specs** that were never stated in any session. Application email on record: testidp@just.edu.bd (current: chatgpt2@bdren.net.bd). This is blocking knowledge for deliverables 3–4.

## 🔴 2. CRITICAL — Our Pillar-7 scoring rubric is wrong in three places (official guide, verified)

Official criteria (RDTII 2.1 guide pp.57–63 + methodology sheet — full read):

| Ind. | Official scoring | Our docs/YAML today | Fix |
|---|---|---|---|
| **7.5** | 1 = government can access personal data **without authorization of an independent judicial body**; access requiring a court order/warrant → **0** | "any access power exists = 1" — **no court-order test** | Add the judicial-authorization test to `pillar_7.yaml`, DoDont §9.1, Build Guide §7.1. Without it we'd mis-score every warrant-gated access power (false 1s). |
| **7.2** | 1 = none; **0.5 = non-dedicated framework and/or dedicated sectoral-only**; 0 = dedicated **horizontal** framework | No 0.5 tier ("—") | Add the 0.5 tier + horizontal condition. |
| **7.4** | 1 = DPO (or DPO+DPIA) required **all sectors**; **0.5 = sector-specific only**; (0.25 DPIA-only — theoretical); 0 = none | "1: either required; 0: neither" — no 0.5, no all-sectors condition | Add tiers. |
| 7.3 | 1 = minimum period **specified**; no period specified → **record the measure, score 0** | Direction correct; "record at 0" nuance missing | Add note. |
| **P7 weights** | **7.1 = 31% · 7.2 = 31% · 7.3 = 16% · 7.4 = 6% · 7.5 = 16%** | Absent everywhere (we only had P6's 38/31/12/12/8) | Add to §7.1/§9.1 + YAML. 7.1+7.2 = 62% of the pillar. |
| 6.3 (nuance) | Rules on **already-established** data centres (security/registration/licensing) → record, **score 0.00**; data-centre *licensing* → 9.4 not 6.3 | Not captured | Add exclusion. |
| 6.1/6.2 | 0.5 includes "transfer prohibited to **one country**"; 1 includes "≥2 category-2 measures" | Mostly present | Confirm YAML wording. |

Update order per doc governance: **DoDont §9.1 first → mirror Build Guide §7.1 → `engine/configs/rdtii/pillar_7.yaml`**.

## 🟠 3. HIGH — Malaysia's sample data contains DELIBERATE planted errors (we never planned for this)

1-June Overview deck p.5 + spoken (transcript L64–66): country weights **SG 10 / AU 10 / MY 20**; Malaysia's brief is *"error-checking AND new data collection"* — the sample data for MY contains **planted errors teams must detect and correct**; full accuracy = full points, partial = prorated. This resolves the Dev Plan's open "verify MY 2× weight" task — **confirmed** — but our plan has no error-detection feature at all.
→ **Add an "audit the KNOWN baseline" pass for MY**: re-verify every MY master-DB row (URL live? law current? article exists? mapping correct?) and emit corrections (wrong URL → fixed; repealed → flagged; wrong indicator → remapped) in the output/Notes. This is also a ready-made demo moment ("our gates caught ESCAP's planted errors") and doubles as the G1–G8 regression suite.

## 🟠 4. HIGH — Eval environment: treat CPU-only / no GPU / no internet / no API keys as near-confirmed

The 15-June re-read shows this was asked **twice**; the second answer is clean and self-consistent (SRT 01:19:46): *"should not assume that GPU or internet access will be available… will not provide private API key… run on standard CPU-based environment"*, plus **no secret credentials in the repo**; external services need clear config instructions in the README. Our plan filed this as "garbled, verify."
→ **Path A (key-free, local, CPU, SQLite graph) must be the literal clone-default** in `models.yaml`/README; Path B (cloud nano/mini + Neo4j) remains what generates our submitted output and drives the demo — that split is already designed, just flip the default and pick a CPU-runnable local model (Rathachai's sizing: >10B general, >30B tool-use; on CPU that means a small quantized model + our deterministic gates carrying accuracy).

## 🟠 5. HIGH — Judges primarily review the SUBMITTED OUTPUT FILE

15-June (SRT 01:17:16, missed by our notes): evaluation *"primarily review[s] the submitted output file"* + deck/video/docs; running the code is a *may* (selective, or an on-request demo). Document-by-document: URL live → doc exists → snippet present → mapping fits criteria; **tested against the FULL known evidence** ("find more than what we found, not less").
→ Priority order for the remaining days: **(1) consolidated CSV/JSON quality — every row verifiable in seconds, (2) reproducible repo + README, (3) everything else.** Also: judges "have a solution to check your output" → expect programmatic validation; keep the header byte-exact (already asserted in CI).

## 🟡 6. MEDIUM — Submission-kit specifics not yet in the plan

- **README:** official template has 17 sections; only Quick Start is mandatory for Round 1 but the rest are "mandatory for Stage 3" — fill them all: **`logs/cost_report.json` + measured-cost table incl. an open-weight-swap total** ("Judges will verify cost claims against your code"), Known Limitations ("transparency builds credibility"), `pytest tests/`, **`evaluate.py --sample-kit` reproduction script**, LLM-swap and OCR-swap sections, pinned versions (no "latest"), Apache-2.0 LICENSE, Team, Acknowledgements (UNESCAP **and KMITL**).
- **Pitch deck (12 slides, template):** slide 7 "Backend Logic" explicitly demands **chunking strategy, retrieval type (semantic/keyword/hybrid), how the system guarantees the citation matches the source 100%, anti-hallucination mechanisms, an example input→output**; slide 6 demands **licensing compliance of the whole stack**; slide 10 asks for competitive advantage → include a short **competitive-landscape** line (Zhang: unresearched "nobody does this" claims are the #1 failure he sees; judges may include these speakers).
- MY portal in the official README table is **federalgazette.agc.gov.my** (we configured lom.agc.gov.my) — support both.
- QnA.docx is **not** just our question list (Dev Plan §13 mischaracterizes it): it contains official answers — **MVP prototype is acceptable; server deployment optional if the README lets judges run it**; Kazakhstan translation ruling (native version updates first — check version history; even official English is "not officially translated").
- Judges' worked example rows in the output template contain organizer errors (SG PDPA labeled "Act 709", a prohibition snippet mapped to "consent exception") — schema is law, example content is not.

## 🟡 7. MEDIUM — New knowledge worth folding into gates/pitch

- **Claude-for-Legal SKILL.md** (12 June, slides our notes never captured; the moderator: teams who study it "already achieved the result"): adopt its **citation-confidence tiering `[settled] / [verify] / [verify-pinpoint]`** — "pinpoint citations carry the highest fabrication risk and should ALWAYS be verified against a primary source" (maps 1:1 to our G1/G2); its workflow rules: **scope first** (does the law apply — jurisdiction/threshold/sector), **effective date ≠ enforcement date**, "identify the delta", "if no gaps, still write the doc — evidence that you looked" (= our no-provision-found rows); **when ambiguous, say so — don't paper over uncertainty** (= our uncertainty band). Also 15-Jun: using that plugin as a base is explicitly allowed if modular/swappable.
- **Dangling-reference gate** (Qian Xiao Q&A): a mechanical check that every cross-referenced instrument still exists/is in force **before the agent concludes** — cheap add to G4/G8.
- **"What judges usually look for" (Varanyu slide 55, missed by notes): Impact · Feasibility · Scalability · Innovation · Adoption** — address all five explicitly in the deck; he may be a final-round commentator. "The best solution is rarely the most complicated."
- **TINA ("legal TINA")** — ESCAP's own tool, plugged by advisory-board member Henry Gao (4 Jun, spoken only). Look at it once; cite it in the pitch as complementary.
- **EUI 12 minimum fields**: we cover 11; add **`reviewer_decision`** to the JSON envelope (accept/override/pending) — it also showcases the HITL story.
- **Coverage semantics sharpened (15 Jun)**: "horizontal" only if it applies to **ALL** sectors (financial+banking = sectoral); hierarchy = authorizing body, not coverage.
- **Nested act + implementing regulation** → separate **adjacent** rows + Notes explaining the cross-reference/hierarchy.
- OCR verification method (15 Jun): judges trace your URL and diff your extracted text — ship scanned inputs + extracted text side by side, flag OCR issues in Notes.
- Supranational instruments count as domestic measures where binding (Russia rows cite Eurasian Economic Commission) — R2-relevant only.
- Pitch ammunition: paperless trade worth **US$36–257bn/yr** to Asia-Pacific exports (Zhang slide 3); RDTII scores "presence and characteristics of policy measures — not their quality"; "the goal is to relieve the workload of legal experts — not just an information-retrieving system" (Qian Xiao); Zhang's deck subtitle is literally "Regulatory Intelligence"; DTRS similarity formula (guide Annex IV) = cheap cross-jurisdiction bonus view for finals.

## 🟢 8. LOW — Doc hygiene & housekeeping

- Build Guide §12 + Champion Guide still say "CLI is mandatory" (superseded 15 Jun: any documented, clonable interface); Build Guide dates (freeze 5 Jul) are stale vs Dev Plan (11 Jul) vs reality (needs the §1 rebase).
- Dev Plan §0 calls Qian Xiao's P6 noise-audit charts a "worked example" — they are **AI-generated illustrations** (captioned "Image Source: ChatGPT"), not prior results. Keep the design, don't cite it as her experiment in the pitch. (Attribution fixes: the "RAG 4-step" framework is Qian Xiao's [OpenAI Cookbook], not Rathachai's; the judges-panel misattributions in NOTES_11June are flagged in the session digests.)
- `Indicator_ID` float trap in the master DBs (4.1 means 4.10; "4.01" means 4.1) — harmless for P6/P7 (no two-digit decimals) but check `build_known_index.py` isn't float-parsing IDs for the all-pillar rows.
- 12-June `NOTES_12June_Workshop_FILES_MISSING.md` is an obsolete stub — delete.
- Round-2 xlsx shows as git-modified (Excel metadata touch) — don't commit noise.

## ✅ 9. What we did NOT miss (independently re-verified)

NEW = provision-level, judged vs FULL known evidence (20-pt lever) · broad recall not top-k · P6-I1…I4 + P7-I1…I5 = 9 regulatory indicators, 6.5 skipped, 7.5 mandatory · P6 weights 38/31/12/12/8 · P7-I1/I2 polarity · government-data exclusion · one row per provision×indicator, extras appended after the 13 columns, Location Reference optional, one consolidated file · "no provision found" never blank · repealed-cited-as-current = penalty · archive+access-date · G1–G8 = their own checklist · GraphRAG schema + AMENDS/REVOKES · swappable GraphStore/LLM/OCR · measured $/doc · hold-out generalization by YAML · Zone-3 as human-approved suggestion with uncertainty band. Our KNOWN indexes (R1: 252 rows; R2: 809 rows) are already built. The plan's knowledge base is championship-grade — the remaining risk is shipping it.

## ▶️ 10. Do-this-week list

1. **Find the ~28-June submission-portal email** (both inboxes) → extract deck/video format specs.
2. Fix the **P7 rubric** (DoDont §9.1 → Build Guide §7.1 → `pillar_7.yaml`): 7.5 court-order test, 7.2/7.4 tiers, 7.3 record-at-0, P7 weights, 6.3 established-DC exclusion.
3. Flip `models.yaml` clone-default to **Path A**; verify a full CPU-only, key-free run.
4. Start **P1′ (real SG × P6 slice)** immediately — everything else is downstream.
5. Add the **MY error-detection pass** to the P2′ scope.
6. Adopt the **rebased schedule** (§1) and mark P4/bonus-pillar as cut-unless-early.
