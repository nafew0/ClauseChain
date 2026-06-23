# ClauseChain — Champion Guide
## From ESCAP's Manual RDTII Process to an Automated Evidence Engine

**Status:** Knowledge synthesis + pitch-narrative source (the manual-SOP→automation mapping in Parts 2–3 and the ranked differentiators in Part 9 feed the deck and interview). **Team execution governs from `../ClauseChain_Dev_Plan_and_Task_Distribution.md` (the guiding star) and its companion docs** — this guide's scoring rules were merged into Build Guide §7.1 / DoDont §9.1 on 11 June; where wording differs, those files win. Built from every file in `Hackthon_Knowledge/` (workshops 1/4/5 June, 10 June mail, RDTII 2.1 guides, sample kit, templates, assignments). Today = 11 June. **Submission = 20 July, midnight.**

**The premise of this document:** only the champion's solution gets adopted. We are not building "a tool that works" — we are building the tool ESCAP can actually run instead of their researchers. Every design decision below is traceable to (a) how their researchers actually work, and (b) how judges score.

---

# PART 1 — THE GAME

## 1.1 What is actually being scored (the champion equation)

| Block | Points | What judges literally test |
|---|---|---|
| **Substantive Accuracy** | **40** | Correct indicator mapping (exact `P6-I1`-style codes) · **discovery of NEW evidence beyond the sample kit (~20 of the 40 — the single biggest lever)** · citation fidelity: exact article+paragraph, verbatim snippet (paraphrase = deduction), working URL, clear mapping rationale |
| **Technical Resilience** | **30** | Live portal crawling, autonomously (pre-downloaded-PDFs-only = **zero** crawl points) · OCR on scanned PDFs, error <5% · handles **both HTML and PDF** ("HTML is harder than PDFs" — Dr. Witada; doing both = explicit differentiator) · end-to-end with no manual steps |
| **Architecture** | **30** | Swap LLM/OCR via config, not code (hardcoded = fail) · audit trail: verbatim snippet + source path in **every** row, instantly verifiable · **measured** cost per document (not estimates) |

Direct judge quotes that define the meta-game:

> "Finding valid and accurate evidence **beyond the provided sample kit** is a major differentiator." — Dr. Witada
> "Same sample kit, different discoveries: Team A found 3 known provisions (20/40). Team B found the same 3 **plus new evidence** (>20/40)."
> "We value **solving pain points** more than a general tool." (depth > breadth)
> Anti-bot handling (Singapore's portal has it): "if your tool can go around that, you will get more points."

**Hard requirements gathered from Q&A:** command-line interface required (GUI optional on top) · the 10-minute constraint is *runtime*, setup excluded · live demo on 3 Aug runs on a **hold-out economy we've never seen** → the engine must generalize by design, not be tuned to SG/AU/MY.

## 1.2 Round structure

- **Round 1 (now → 20 Jul):** Pillars 6 & 7, **Singapore, Australia, Malaysia**. Optional extra pillars/economies = extra points.
- **31 Jul:** top-20 shortlist → **3 Aug:** live demo + interview (hold-out economy) → **5 Aug:** 5 finalists → **Oct:** Bangkok finale.
- **Final round:** 3 of 8 extra economies (Thailand, China, India, Indonesia, Russia, Lao PDR, Mongolia, Timor-Leste — Timor-Leste worth double as the hard case). Our jurisdiction-pack design (Part 4) is what makes this cheap later.
- **Our stance (decided 3 Jun): every optional is our mandatory** — Zone 3 scoring, bonus pillar, extra economies as proof of scale — but never at the cost of the SG/AU/MY core. Core freeze ~5 July; stretch goals are additive-only after that.

---

# PART 2 — HOW ESCAP DOES IT MANUALLY (what we must replicate)

This is the heart of the brief. The 5 June workshop demonstrated the actual researcher workflow; the internal guide codifies it. Our engine succeeds exactly to the degree it mirrors this process — including its implicit rules.

## 2.1 The lifecycle (and what the hackathon automates)

ESCAP's database lifecycle has 5 steps; **the hackathon automates only Step 1 (desk research)** — the foundation everything else sits on:

1. **Desk research** ← *the hackathon* (split into Zone 1 + Zone 2 below)
2. Internal review for consistency/accuracy (human QA)
3. Economy verification with government focal points
4. Score calculation per the framework
5. Publish + knowledge products

Scale of the pain we're removing: **10+ researchers per update cycle, 1–4 weeks per country, 2,600+ regulations identified so far, 6–12-month refresh cadence**, "very costly… if we manage to make it happen this way, then we'll be able to sustain our work" (Dr. Yann). This sentence is the pitch: we are the sustainability plan for the RDTII.

## 2.2 Zone 1, manually: find the right official sources

A researcher walks this exact sequence:

1. **Understand the legal system.** Civil law → statutes dominate. Common law → case law can matter (Micronesia: yes for company matters). Mixed → context. Jurisdiction quirk: **China — court cases don't count as legal sources.** → *Implication: source-acceptance rules are per-jurisdiction config, not global logic.*
2. **Walk the legal hierarchy.** Constitution → primary legislation (Acts/Statutes/Codes) → delegated/subsidiary legislation (rules, regulations, decrees) → administrative instruments (notifications, codes of practice, bylaws).
   - Government **notifications count as primary sources if authorized by primary law and in force** (e.g., ministry notifications that are legally binding).
   - **Guidelines/codes of practice count only if binding and mandated by law** — the tell is enabling language like *"Pursuant to Section 210 of the Financial Services Act…"*.
   - **National strategies/frameworks are usually NOT sources** (not issued under legal authority).
3. **Hierarchy ≠ coverage.** Horizontal (cross-sector) vs sectoral is an *independent axis* from rank. Sectoral instruments **are recorded** whenever the indicator calls for them; the **"controlling evidence"** (usually the horizontal instrument if one exists) is what drives the score. Both get recorded.
4. **Validity check — three tests before anything is recorded:**
   - Formally **adopted and officially published**? (Bills, drafts, consultation papers → never recorded. "Personal Data Protection Amendment Bill" = not yet a measure.)
   - **In force?** Look for the commencement wording ("enters into force on…"); publication ≠ effect.
   - **Current?** Not repealed/replaced/superseded; capture the latest amendment.
5. **Primary vs secondary.** Secondary sources (news, law-firm reviews, commentary) are **leads only** — never citations. (Exception: indicators 3.4, 5.3, 9.1 explicitly use them.) A real DB correction was shown where a law-firm review URL had to be replaced with the official statute link.

## 2.3 Zone 2, manually: read, extract, interpret

How a trained researcher reads a statute (Henry Gao's anatomy + Juntong's practice):

1. **Statute anatomy, in reading order:** title/objective (use the preamble to resolve ambiguity) → **definitions** (they decide whether "personal data" covers the case at all) → substantive obligations (the "meaty provisions") → institutional → enforcement/penalties → judicial review → **schedules/appendices — exceptions love to hide there** → cross-references & implementing regulations (follow them).
2. **Operative language:** `must / shall (not)` = binding; `may` = permissive; `should` = soft. The modality decides whether a provision is an obligation at all.
3. **Rule-and-exception:** *"unless," "subject to," "provided that," "unless otherwise provided"* — the exception can matter more than the headline rule.
4. **The interpretation questions, verbatim:** *"Who is regulated, what is required or prohibited, what data or services are covered, under what conditions, with what exceptions?"* The goal is "to extract the **legal function** of the provision so that it can be matched to the right indicator" — explicitly **not** keyword matching.
5. **Extract the WHOLE section, not the sentence.** Nikita, verbatim: surrounding paragraphs "give you important context to interpret what that relevant sentence would mean" — and plan for multiple relevant sections in one document.

## 2.4 The recording discipline (master DB format)

Master DB row = `Pillar_ID | Indicator_ID | Cat_Score | Raw Score | Act and/or practice | Coverage | Impact or comments | Timeframe | References | Note`. The format rules (from the Format-requirements PDF — also their data-cleaning spec):

- **Act column:** full English name + year + law number; **no article numbers here** (they belong in the Impact column); semicolons as separators.
- **Coverage:** `Horizontal` or named sectors, explicitly.
- **Impact:** cite **exact section/article/clause** + neutral legal explanation of *why it matters for the indicator*; no secondary-source content; if nothing exists, an informative statement still goes in.
- **Timeframe:** "Since [Month Year]; last amended [Month Year]" — or "Last reviewed in [date]" for negative findings.
- **References:** official URLs; broken links must be replaced.

**Juntong's pre-entry checklist (this becomes our gate suite):**
1. Right indicator and scope per the guide? 2. Source official, current, in force? 3. Captured the **exact provision**, not just the title? 4. Separated the rule from its exceptions/approvals/thresholds? 5. If no restriction found — did I still cite the general governing law as the reference basis?

## 2.5 Where humans are slow or fail (our opportunity)

From the DTI project (160+ countries, 5,000+ measures, same manual model): link rot (they archive everything + record access dates), translation of legal terminology, version/amendment tracking, multi-reviewer cross-checks — all named bottlenecks. From ESCAP's own hands-on: even *they* note researchers "did not record every provision… we picked the first-seen relevant provisions because of space/time limits." **That sentence is where our 20 NEW-evidence points live** (§6).

---

# PART 3 — THE TRANSLATION: manual step → engine component

| # | Manual step (their words) | Automated component | Where the human stays |
|---|---|---|---|
| 1 | "Gain familiarity" with economy's legal system | **Jurisdiction pack** (`jurisdictions/sg.yaml` …): portals, source-acceptance rules, citation grammar, language, calendar | Pack reviewed once by Legal |
| 2 | Find official sources (portals, search) | **Connector layer**: per-portal adapters + generic discovery (sitemap/search/crawl) seeded from portals CSV + Legal Inventory | — |
| 3 | Validity: adopted? in force? current? | **Status gate**: consolidation/version detection, commencement parsing, repeal/amendment chain | Flags reviewed in UI |
| 4 | Primary vs secondary | **Source classifier** (domain allowlists per pack + instrument-type rules: notification-with-enabling-act, guideline-pursuant-to) | — |
| 5 | Read structure, definitions, schedules | **Legal parser**: section tree w/ stable IDs, definitions table, schedule + cross-reference edges | — |
| 6 | "Who is regulated / what required / what data / conditions / exceptions" | **Predicate extractor** (LLM, structured output): actor, modality, action, data category, conditions[], exceptions[], territorial scope | — |
| 7 | Match legal **function** to indicator | **Rubric mapper**: per-indicator decision rules as code+prompt (Part 5), full-section context, multi-indicator fan-out | Low-confidence rows queued |
| 8 | Pre-entry checklist | **Verification gates G1–G8** (Part 7) — a row that fails a gate never reaches the CSV | Gate report visible |
| 9 | Record in DB format | **Writers**: template-exact CSV + extended JSON + run report | — |
| 10 | Internal review | **Review UI** (already our frontend's job): evidence vs source side-by-side, accept/reject, audit log | Yes — by design |
| 11 | Score 0/0.5/1 | **Zone 3 scoring engine** (official rules, Part 5.3) — *optional, we do it* | Human confirms score |

The pitch line this table earns: *"We didn't automate 'legal research' in the abstract — we automated ESCAP's own SOP, step by step, with their own checklist as our quality gates."*

---

# PART 4 — ARCHITECTURE (detailed)

## 4.1 System overview

```
                        ┌──────────────────────────────────────────────┐
                        │  CLI  (python run.py --economy SG --pillar 6)│
                        │  + thin API for the review UI                │
                        └──────────────────┬───────────────────────────┘
                                           │
                                    ┌──────▼──────┐      config: .env (LLM_PROVIDER,
                                    │ ORCHESTRATOR│      OCR_ENGINE, keys) + models.yaml
                                    │  (pipeline  │      + jurisdictions/*.yaml
                                    │   runner)   │      + rubric/pillar6.yaml, pillar7.yaml
                                    └──────┬──────┘
        ───────────── ZONE 1: DISCOVER ────┼──────────────────────────────────
                                           │
   ┌───────────────┐   ┌───────────────────▼───┐   ┌──────────────────────────┐
   │ SEED REGISTRY │──▶│ CONNECTOR LAYER       │──▶│ FETCHER                  │
   │ portals CSV + │   │ sso.agc.gov.sg        │   │ httpx → Playwright       │
   │ Legal Invent. │   │ legislation.gov.au    │   │ fallback (JS/anti-bot),  │
   │ + master DB   │   │ lom.agc.gov.my        │   │ robots+politeness, cache,│
   │ law lists     │   │ + GENERIC connector   │   │ ARCHIVE: snapshot+hash+  │
   └───────────────┘   │   (search/sitemap/    │   │ access-date every fetch  │
                       │    crawl) for ANY     │   └────────────┬─────────────┘
                       │    new economy        │                │
                       └───────────────────────┘   ┌────────────▼─────────────┐
                                                   │ DOCUMENT PROCESSOR       │
                                                   │ HTML extractor │ PDF text│
                                                   │ OCR fallback (swappable) │
                                                   │ + CER estimate, lang     │
                                                   │ detect, LEGAL PARSER →   │
                                                   │ section tree, stable IDs,│
                                                   │ definitions, schedules,  │
                                                   │ cross-ref edges          │
                                                   └────────────┬─────────────┘
                                                                │
                                    ┌───────────────────────────▼─────────────┐
                                    │ EVIDENCE STORE (SQLite + files)         │
                                    │ documents · sections · provisions ·     │
                                    │ edges (amends/cross-refs/implements) ·  │
                                    │ every chunk: doc id, section path, char │
                                    │ offsets, page, URL, fetch time, hash    │
                                    │ = a small legal knowledge graph         │
                                    └───────────────────────────┬─────────────┘
        ───────────── ZONE 2: MAP ──────────────────────────────┼──────────────
                                                                │
   ┌──────────────────────┐  ┌──────────────────────┐  ┌────────▼───────────┐
   │ CANDIDATE GENERATION │─▶│ PREDICATE EXTRACTOR  │─▶│ RUBRIC MAPPER      │
   │ hybrid retrieval:    │  │ LLM structured out:  │  │ per-indicator      │
   │ BM25 + dense + per-  │  │ actor, modality,     │  │ decision rules     │
   │ indicator query packs│  │ action, data class,  │  │ (code + prompt),   │
   │ broad recall, NOT    │  │ conditions[],        │  │ full-section ctx,  │
   │ top-N (their advice) │  │ exceptions[], scope  │  │ multi-indicator    │
   └──────────────────────┘  └──────────────────────┘  │ fan-out            │
                                                       └────────┬───────────┘
                                                                │
                                     ┌──────────────────────────▼─────────────┐
                                     │ VERIFICATION GATES G1–G8 (Part 7)      │
                                     │ existence · verbatim · citation depth ·│
                                     │ URL alive · in-force · scope ·         │
                                     │ controlling-evidence · dedupe          │
                                     └──────────────────────────┬─────────────┘
                                                                │
                                  ┌─────────────────────────────▼─────────────┐
                                  │ NEW/KNOWN CLASSIFIER                      │
                                  │ vs MASTER DB (primary baseline, law+      │
                                  │ provision level) → Discovery Tag          │
                                  └─────────────────────────────┬─────────────┘
        ─────────── ZONE 3 (optional = we do it) ───────────────┼──────────────
                                                                │
                       ┌──────────────────┐   ┌─────────────────▼──────────────┐
                       │ REVIEW UI        │◀──│ SCORING ENGINE                 │
                       │ (Next.js) source │   │ official 0/0.5/1 rules +       │
                       │ vs evidence,     │   │ coverage logic + controlling   │
                       │ accept/override, │   │ evidence + indicator weights   │
                       │ audit log        │   └─────────────────┬──────────────┘
                       └──────────────────┘                     │
                                       ┌────────────────────────▼──────────────┐
                                       │ WRITERS                               │
                                       │ CSV (template-exact, 13 cols) ·       │
                                       │ JSON (extended, snake_case) ·         │
                                       │ RUN REPORT (cost, telemetry, gates)   │
                                       └───────────────────────────────────────┘
```

## 4.2 Component explanations (the "why" in one breath each)

**Orchestrator.** One deterministic pipeline runner; every stage idempotent and resumable; a run is a directory with a manifest. *Why:* judges re-run us; reproducibility is architecture points, and resumability saves us during the live demo.

**Connector layer + generic connector.** Three first-class adapters (SG `sso.agc.gov.sg`, AU `legislation.gov.au`, MY `lom.agc.gov.my`) + one **generic connector** driven entirely by a jurisdiction YAML (start URLs, search templates, crawl rules). *Why:* the hold-out economy on 3 Aug and the 8 final-round economies must be "write a YAML," not "write code." This is the scalability answer judges asked about ("if you build for three countries, can it scale?").

**Fetcher.** Plain HTTP first; Playwright only when needed (JS rendering, anti-bot — Singapore's portal is the named case); per-domain politeness + caching; **every fetch archived with content hash and access date** (DTI's #1 pain: link rot — we never lose a source; broken-link replacement is a format rule we satisfy by construction).

**Document processor.** HTML→clean text and PDF-native text when available; **OCR only as fallback** (engine swappable via `OCR_ENGINE`: tesseract/paddle/cloud); emits a **CER estimate** per document into the JSON (`ocr_quality_cer` — the rubric measures OCR <5%). Language detection routes Lao/Hindi/Chinese docs in later rounds.

**Legal parser.** The differentiator most teams will skip. Converts a statute into a **section tree with stable IDs** (`sg-pdpa-2012/s26/2`), a definitions table, schedule nodes, and cross-reference edges ("subject to s 17", "Pursuant to Section 210…"). *Why:* (1) citation precision to `Art. 26(2)` depth requires knowing the tree; (2) the **existence gate** that kills hallucinated sections (their India IT Act s 70B(1)/(4) demo) is a tree lookup; (3) exceptions live in schedules — Gao's explicit warning; (4) enabling-act detection is how we classify notifications/guidelines as binding.

**Evidence store.** SQLite + files; provisions carry char offsets into the archived source. Edges (amends / cross-references / implements / enables) make it a pragmatic **legal knowledge graph** — the GraphRAG idea from TH2OECD at hackathon scale, queryable for "what amends this?", "what does this section point to?", and cross-country comparison in the UI.

**Candidate generation.** Per-indicator **query packs** (concept terms, statutory phrasings, known section names — multilingual later) over BM25 + dense embeddings, fused. **Broad recall, not top-N** — Nikita explicitly cautioned against top-N ranking ("review a broader set of results"). Recall here is cheap; precision comes from the mapper + gates.

**Predicate extractor.** One LLM call per candidate section returning a typed record: `{actor, modality(must/may/should+neg), action, data_category, conditions[], exceptions[], scope(territorial/sectoral), enabling_act?}`. *Why:* this is exactly Juntong's four interpretation questions, machine-readable — and it lets the next stage be (mostly) deterministic.

**Rubric mapper.** Per-indicator decision logic from Part 5, applied to predicates + full section text. Function-over-keywords is enforced structurally: e.g., 6.4 requires `action=transfer ∧ conditions≠∅ ∧ transfer-still-possible`; a keyword "must establish" never reaches a 6.3 verdict without an infrastructure object. Same provision can emit multiple rows (one per indicator) — their explicit instruction.

**Gates → NEW/KNOWN → writers.** Parts 6–8.

**Observability + eval harness.** Per-stage telemetry (counts, latencies, token costs), run logs, and an eval command that scores us against the master DB for SG/AU/MY using **their own vocabulary**: F1 (recall of known provisions), field accuracy, inter-annotator agreement, CER. *Why:* TH2OECD lesson #2 ("build observability early"), and the cost rubric line wants **measured** numbers — our run report prints $/document from real token/page counters.

**Config & swappability.** `.env`: `LLM_PROVIDER`, `LLM_MODEL`, `OCR_ENGINE` (the README template's own contract — we match it literally so judges find what they expect); `models.yaml` for provider details + fallback chain (commercial → open-source fallback is explicitly in the rubric); `rubric/*.yaml` (indicator rules, same for all countries) vs `jurisdictions/*.yaml` (portals, citation grammar, source-acceptance, calendar — e.g., Thai B.E. = Gregorian − 543 for finals).

## 4.3 Output contracts (exact — judges validate programmatically)

**CSV (13 columns, header names copied verbatim from `OUTPUT_TEMPLATE_31MAY.xlsx` at build time, order preserved):**
`Economy | Law Name | Law Number / Ref | Last Amended | Indicator ID | Article / Section | Discovery Tag | Location Reference | Verbatim Snippet | Mapping Rationale | Source URL | Confidence | Notes`

Rules we enforce in the writer (not by convention — by validator):
- One row per **provision × indicator**; no merged cells; example rows removed.
- `Economy` = official UN name. `Law Name` = full name + year, never abbreviations. `Indicator ID` ∈ {P6-I1…P6-I4, P7-I1…P7-I5} (P6-I5 is non-regulatory — treaty-sourced, not extracted).
- `Article / Section` always to paragraph depth (`Art. 26(2)`, `s 16(1)(a)`) — never bare `Art. 26`.
- `Verbatim Snippet` byte-equal to source text (gate-enforced). `Mapping Rationale` ≤300 chars. `Location Reference` = PDF page / HTML anchor.

**JSON (snake_case, extended):** everything above + `source_pdf_path`, `ocr_quality_cer`, `processing_time_seconds`, `model_version`, `retrieval_method`, `pdf_is_scanned`, `raw_context_before/after`, `access_date`, `archived_copy_path`, `translation` + `original_text` when non-English (DTI fields), `status` (in force/amended), `provenance` (section id + char offsets + content hash).

**⚠️ Indicator definitions conflict — resolved.** The Output Template's "Indicator Reference" tab contains GDPR-style definitions (adequacy/SCCs/consent…). The 5 June workshop, the methodology sheet, the sample DB, and the Legal Inventory all use the **methodology definitions** (ban/storage/infrastructure/conditional…). **The methodology definitions govern; the codes are the same strings either way.** (Resolved with Juntong, 5 June.)

---

# PART 5 — THE LEGAL DECISION LOGIC, ENCODED

This is the rubric mapper's spec. Each indicator: core test → traps (from their own workshops) → scoring rule (Zone 3).

## 5.1 Pillar 6 — Cross-border data policies

**Router rule (theirs, verbatim in spirit):** provision regulates *transfer abroad or localization* → Pillar 6 first; *domestic management/protection* → Pillar 7 first. One law often feeds both.
**Scope exclusion:** measures applying **only to government data are not scored** for Pillar 6.

| ID | Core test (legal function) | Distinguishing traps | Score (Zone 3) |
|---|---|---|---|
| **P6-I1** Ban & local processing | Transfer prohibited per se, OR data **must be processed** domestically (Korea: financial cloud must process credit data locally) | A transfer that remains possible under conditions is **6.4, not 6.1** (their #1 warned confusion). Banking-secrecy/confidentiality ≠ transfer ban (1 June example) | 1: personal data OR horizontal; also 1: ≥2 such reqs on non-personal/specific data; 0.5: single non-personal/specific-data/one-economy req; 0: free |
| **P6-I2** Local storage | A **copy** must stay domestically; transfer may still happen (Turkey social networks >1M users; Kazakhstan "personal data shall be stored in the territory…") | Storage-of-copy ≠ ban, ≠ processing-location, ≠ infrastructure | mirrors 6.1 pattern |
| **P6-I3** Infrastructure | Local **servers/data centres/facilities required as a condition of service** (Vietnam: ≥1 local server; China: server within mainland) | *"Licensee must establish network access control policies"* = a rulebook, **not** infrastructure (their hands-on trap). Local storage via rented capacity ≠ 6.3 (6.3 = facility precondition) | 1: any infrastructure requirement; 0: none |
| **P6-I4** Conditional flow | Transfer **allowed IF** consent / adequacy / contractual safeguards / approval (Palau: notify ministry + consent) | "If the law allows transfer subject to conditions… 6.4 rather than 6.1" (verbatim). SG PDPA s 26, MY PDPA s 129 live here | 1: personal data (any coverage) OR horizontal; 0.5: non-personal/specific data or sectoral; 0: no condition |
| **P6-I5** Binding commitments | **Non-regulatory.** Treaty status (CoE 108, CPTPP-type binding e-commerce chapters) from treaty databases | Never extracted from statutes — engine skips; Zone 3 can auto-check treaty status pages | 1: no binding agreement; 0: ≥1 |

Indicator weights (pillar-6 index, for the dashboard/pitch): 6.1 = 38%, 6.3 = 31%, 6.2 = 12%, 6.4 = 12%, 6.5 = 8%.

## 5.2 Pillar 7 — Domestic data protection & privacy

**Polarity warning (encode it!):** 7.1 and 7.2 score the **absence** of a framework (lack = 1 = more restrictive environment); 7.3/7.4/7.5 score the **presence** of requirements. Sign errors here are silent and fatal to Zone 3.

| ID | Core test | Traps (their examples) | Score |
|---|---|---|---|
| **P7-I1** Comprehensive DP framework | Horizontal personal-data law with sufficient substantive rights | Sectoral laws recorded but ≠ comprehensive; horizontal law **missing core rights (e.g., rectification) → 0.5** ("not comprehensive enough" — Juntong). No official checklist exists — judge substantively. **Innovation invited here** (organizers said going deeper than the binary is welcomed) | 1: lacks framework; 0.5: sectoral only / horizontal-but-thin; 0: comprehensive exists |
| **P7-I2** Dedicated cybersecurity framework | A framework **specifically designed** for cybersecurity (network security, incident response, CII, cyber-risk) | **The Assignment-1 trap:** MAS Cyber Hygiene Notice (sectoral, financial) is real and binding but **not controlling** when Cybersecurity Act 2018 exists — record it, don't score on it. ICT-licensee "cryptographic controls" = sectoral security clause, not a dedicated framework. Scattered security clauses in privacy laws don't count | 1: lacks dedicated framework; 0: exists |
| **P7-I3** Minimum retention | Keep data **≥ X period** (Bangladesh: e-commerce transaction data 6 years) | **"Not longer than necessary" is a retention LIMIT — the opposite — never 7.3** (their most-repeated warning). Hunt in sectoral law: telecom, AML/financial, health, employment | 1: minimum period specified; 0: not |
| **P7-I4** DPIA / DPO | Accountability obligations: officer appointment or impact assessments | It's not "has privacy law" — it's the **specific mechanisms** on top | 1: either required; 0: neither |
| **P7-I5** Government access | Law **enables/requires** government access to personal data (SG Criminal Procedure Code: police may access/search/copy computer data; Sri Lanka: telecom operators must open databases to the regulator) | **Look beyond the privacy statute**: criminal procedure, surveillance, telecom, national security — their explicit research lesson, and our richest NEW-evidence vein | 1: access power exists; 0: otherwise |

## 5.3 Zone 3 (scoring) — we ship it

Scoring is deterministic given gated evidence: apply the 0/0.5/1 rules above + coverage logic (+ controlling-evidence selection), emit per-indicator scores with the **evidence rows that justify them**, human-confirmable in the UI. Cheap to build once Zone 2 is clean ("Zone 3 is fast once Zone 2 output is clean" — Nikita), high pitch value, directly demonstrates we understood the framework end-to-end. Also auto-check the treaty/status pages for the non-regulatory indicators (6.5 list URLs are in the Non-regulatory PDF) as a bonus completeness move.

---

# PART 6 — THE NEW/KNOWN STRATEGY (banking the 20 points)

**The rules (10 June mail + 5 June Q&A — authoritative):**
- Baseline for KNOWN = the **master dataset** (`ESCAP-RDTII-2.1_ Round 1 Database.xlsx`) — primary reference.
- The 384-row **Legal Inventory** (all pillars, no provisions, no Impact) = secondary — use for structure/validation/seeds; evidence beyond it "may be classified as NEW."
- **Provision-level NEW inside a KNOWN law counts as NEW** (Juntong, verbatim: researchers "did not record every provision… we picked the first-seen relevant provisions because of space or time limits").

**Implementation.** Build a **KNOWN index** from the master DB: normalized law names/numbers + the article references parsed out of its Impact column. Classifier: law not in index → NEW; law known but provision absent → **NEW**; both present → KNOWN. Store the matched master row id for KNOWN (audit trail bonus: judges can see exactly which gold row we matched).

**Where to hunt NEW (highest yield first):**
1. **P7-I5 government access** — they tell us it lives outside privacy law: SG Criminal Procedure Code, Computer Misuse Act, telecom acts; AU Telecommunications (Interception and Access) Act, Surveillance Legislation Amendment; MY Communications and Multimedia Act 1998, criminal procedure. The master can't have been exhaustive here.
2. **P7-I3 minimum retention** — sectoral sweeps: AML/CFT, tax, telecom data retention, health records, employment. Each "keep for ≥ N years" in a digital-trade-relevant sector is a candidate row.
3. **Subsidiary legislation** under known acts (regulations/orders under SG PDPA, MY PDPA, AU Privacy Act) — the inventory shows they track instruments coarsely; per-provision subsidiary evidence is fresh.
4. **Sectoral 7.2/7.4** — health/financial cybersecurity rules, sectoral DPO/DPIA mandates (recorded as sectoral, never controlling).
5. **Recent amendments** post-dating the master's "last amended" stamps (e.g., MY PDPA 2024 amendments: DPO duties, breach notification).
Every NEW row must survive the same gates as KNOWN rows — a false NEW is worse than none (it's exactly the failure they showed in the hands-on).

---

# PART 7 — FAILURE-MODE DEFENSE (their taxonomy → our gates)

Their canonical failure list (Assignment 1) and live demos map 1:1 to gates. **A row that fails any gate is excluded (or flagged-for-review), never silently emitted.**

| Their named failure (their example) | Our gate |
|---|---|
| Hallucinated citation (India IT Act "s 70B(1)/(4)" — sections don't exist) | **G1 Existence:** cited section ID must resolve in the parsed section tree |
| Paraphrased/distorted snippet | **G2 Verbatim:** snippet must string-match archived source at recorded offsets (OCR-tolerant fuzzy threshold for scanned docs, mismatch reported) |
| Vague citation ("Art. 26") | **G3 Depth:** regex per jurisdiction's citation grammar requires paragraph-level reference |
| Broken/incorrect URL (MAS notice URL wrong) | **G4 URL alive + content check:** fetch returns the same document (hash family), else swap to archived copy + flag |
| Outdated law pulled (MAS 2019 notice superseded) | **G5 In-force/version:** consolidation date, amendment chain, repeal check; prefer latest consolidated text |
| Wrong answer to the core legal question (gambling-blocking → 9.1 false positive because gambling is illegal in SG; Bumiputera preference ≠ foreign exclusion) | **G6 Function check:** mapper verdict must cite predicate fields satisfying the indicator's core test; country-context rules in jurisdiction packs |
| Missing act/regulation (LLM missed Treasury directives) | **G7 Coverage sweep:** per-indicator source checklist (from query packs + inventory) must be visited; "no finding" rows still cite the governing law (their checklist item #5) |
| Sectoral/controlling confusion (MAS notice scored instead of Cybersecurity Act) | **G8 Controlling evidence:** when horizontal + sectoral both exist, mark sectoral rows `controlling=false`; Zone 3 scores only on controlling rows |
| AI-reviews-AI blindness ("teams used AI to review AI output and could not point out where it was wrong") | Gates G1–G5 are **deterministic code, not LLM judgment** (TH2OECD boundary lesson) — and the four hands-on traps above become **regression tests** in CI |

---

# PART 8 — DELIVERABLES & SUBMISSION CONTRACT (the checklist)

1. **Functional prototype** — `python run.py --economy Singapore --pillar 6` end-to-end (crawl→…→CSV/JSON) with README Quick Start matching the template's contract (clone → venv → `.env` → one command). CLI mandatory. Apache 2.0.
2. **Structured output** — CSV (template-exact) + JSON (extended) for SG/AU/MY × P6/P7.
3. **Technical pitch deck** — use their `Pitch Deck_REGTECH_rev1.pptx` skeleton; non-technical judges included; show: the manual-SOP mapping table (Part 3), gates demo, NEW-evidence table, measured cost/document, responsible-AI + observability slide (TH2OECD framing).
4. **≤10-min screen recording** — the scanned-PDF path is the star: Pakistan PECA or India Procurement (image-only) → OCR → CER printed → provision found → gates pass → row in CSV with page-level Location Reference. Also flash the live-crawl (portal → law) and a `.env` LLM swap mid-video.
5. **Live demo 3 Aug** — hold-out economy drill: our rehearsal = pick an economy we haven't touched (e.g., New Zealand or Brunei), write only a jurisdiction YAML, run. Must produce rows in minutes, gracefully degrade (if portal blocks: archived/web-archive fallback path shows resilience rather than failure).

**Operational now:** technical workshops run 11–15 June (RAG/OCR/responsible-AI — attend all); **email questions before 15 June** for the Q&A. Suggested questions: (a) for the hold-out economy, will a seed portal URL be provided or must discovery be cold? (b) is Zone 3 scoring output judged for accuracy or only as bonus functionality? (c) any constraints on commercial API usage during the live demo (network, keys)?

---

# PART 9 — CHAMPION DIFFERENTIATORS (ranked)

What separates first place from a competent submission — each item traceable to a judge statement or named pain:

1. **NEW evidence at scale, gate-verified** (Part 6) — the 20-point lever, and the demo moment: "here are N provisions not in your database; click any snippet to see it in the archived source."
2. **The legal parser + deterministic gates** — nobody else will kill hallucinated sections *structurally*. We demo by feeding the engine the exact India IT Act trap and showing the gate catch it.
3. **Their SOP, literally encoded** — checklist→gates, format rules→writer validators, methodology definitions→rubric YAML. The judges are the people who wrote the SOP.
4. **HTML + PDF + scanned + anti-bot** — all four source classes in one run report (they said HTML is harder and SG has bot protection; we make resilience visible: per-document `retrieval_method`, `pdf_is_scanned`, CER).
5. **Generalization by config** — hold-out economy = one YAML; the 3 Aug demo is our scalability proof, rehearsed.
6. **Zone 3 + treaty auto-checks** — full pipeline through scores with official 0/0.5/1 rules and controlling-evidence logic; "every optional is our mandatory."
7. **Archive-first provenance** — content hash + access date + archived copy per row (DTI's wishlist verbatim; solves their broken-link rule by construction).
8. **Measured economics** — run report prints real $/document and time/economy vs "weeks of work, 10+ researchers" — the sustainability slide writes itself.
9. **Review UI as the human-in-the-loop story** — we don't claim to replace Steps 2–3; we accelerate Step 1 ~100× and make review instant (verbatim snippet + side-by-side source). This is the responsible-AI posture they asked for.
10. **Observability** — per-stage telemetry and eval-vs-master (F1/field-accuracy/IAA — their own canvas metrics), proving we measure ourselves the way they measure us.

---

# PART 10 — BUILD PLAN TO 20 JULY

```
Week 1  (11–15 Jun)  Contracts + Zone 1 spine.
  Lock schemas (CSV/JSON writers + validators from the template file itself),
  evidence store, orchestrator skeleton, SG/AU/MY connectors fetching + archiving,
  doc processor (HTML+PDF), parser v1 (sections + IDs). Attend tech workshops;
  email Q&A questions before 15 Jun. Stubbed end-to-end run green by 15 Jun.
Week 2  (16–22 Jun)  Zone 2 core.
  Query packs per indicator, hybrid retrieval, predicate extractor, rubric mapper
  v1, gates G1–G4. Eval harness vs master DB (recall of KNOWN provisions = our
  F1 score). OCR fallback + CER on the scanned sample PDFs.
Week 3  (23–29 Jun)  Accuracy war + NEW discovery.
  Gates G5–G8, controlling-evidence logic, NEW/KNOWN classifier, targeted NEW
  sweeps (P7-I5, P7-I3, subsidiary legislation). Iterate mapper until KNOWN
  recall is near-total for SG/AU/MY and false-positive rate ~0 on regression traps.
Week 4  (30 Jun–6 Jul)  Zone 3 + UI + CORE FREEZE 5 Jul.
  Scoring engine + treaty checks, review UI wired to evidence store, cost
  telemetry, README + .env swap polished. After 5 Jul: additive only.
Week 5  (7–13 Jul)  Proof of scale + collateral.
  Hold-out drill (1 unseen economy via YAML only), optional bonus pillar (P8) /
  +2 economies if green, screen recording recorded, deck drafted.
Week 6  (14–20 Jul)  Hardening + submission.
  Fresh-machine quick-start test (someone else's laptop, stopwatch), final eval
  report, package, submit ≥48h early. Buffer for portal surprises.
```

**Risk register (top 5):** portal anti-bot breaks crawl near deadline → archive-first caching + web-archive fallback path from week 1 · LLM cost/latency in live demo → small-model fallback chain in `models.yaml`, rehearsed · over-fitting to SG/AU/MY → weekly hold-out drill from week 4 · NEW-evidence false positives → gates apply equally, Legal reviews every NEW row before submission · scope creep on UI → core freeze 5 Jul, UI is additive.

---

# APPENDIX — source map (where each claim lives)

- Scoring weights, judge quotes, zones, deliverables: `[1 June] Hackathon Overview` + 1 June transcript.
- Manual SOP, hierarchy/validity/source rules, indicator logic + traps, checklist: `[5 June] RDTII extraction & hands-on` slides + transcript + internal guide.
- Statute anatomy/modal verbs/schedules: `[4 June] Henry Gao` deck (worked example: SG PDPA 2012 — our first test document).
- DTI finding-fields, link-rot/archive practice: `[4 June] Simon & Tomás` deck.
- Deterministic-vs-LLM boundary, GraphRAG, 5 lessons: `[4 June] Saruj TH2OECD` deck.
- End-user wishlist (working links, terminology, comparability, traceability): `[4 June] Astghik` deck.
- Master-vs-inventory + NEW ruling: `Mail Content 10 June` email PDF; provision-level NEW: 5 June Q&A.
- Output contract: `OUTPUT_TEMPLATE_31MAY.xlsx` (headers authoritative; its Indicator-Reference tab definitions superseded by methodology), `README_template.md`, `Format requirements` PDF (identical copy in both folders).
- Scoring rules 0/0.5/1 + weights + government-data exclusion: `ESCAP-RDTII-2.1-guide.pdf`; non-regulatory list + treaty URLs: `Non-regulatory indicators.pdf`.
- Failure taxonomy: `Take home assignment 1.docx`; eval vocabulary (F1, field accuracy, IAA): `tool_design_canvas_template_Assignment 2.docx`.
