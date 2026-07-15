# ClauseChain Frontend Plan — Judge-Facing Web Application

**Status:** Planning doc (11 Jul). Supersedes the `Cancelled/frontend` prototype as the UI plan of record; inherits its design language, discards its SaaS scaffolding. The engine (`engine/`) is the frozen core — **the UI is additive-only: it never modifies engine code paths; it reads artifacts and drives `run.py` as a subprocess.**

---

## 1. Why this exists (and what it must NOT be)

| Driver | Implication |
|---|---|
| Judges primarily grade the **output file**; running code is selective (15-Jun ruling) | The UI's first job is making every output row **verifiable in seconds** — not decoration |
| **Finals REQUIRE a polished UI**; Round 1 doesn't | Build it as a real deliverable now, demo-ready for 3 Aug (live run on a hold-out economy) |
| Runs take minutes; a silent terminal looks **stuck** | Live, honest progress: percentage from counted work units, never a fake bar |
| The human-approval queue (L4, zone-3, adjudication) is on the freeze critical path | The Review screens serve **us this week**, then become the judges' human-in-the-loop story |
| Eval sandbox: CPU-only, **no internet**, no keys | Everything local: no CDN fonts/scripts, no auth, no external calls; works under Path A |

**Not building:** login/registration, billing, admin, multi-tenancy, marketing pages — all of the cancelled app's SaaS shell. Judges run one command and land in the workspace.

---

## 2. Architecture

```
engine/run.py ──emits──> <out>/events.jsonl  (structured progress events, additive flag)
        ▲                        │
        │ subprocess             │ tail
┌───────┴─────────────────────────▼──────────┐      ┌──────────────────────────┐
│  apps/api  (FastAPI, :8000)                │ SSE  │  apps/web (Next.js, :3000)│
│  POST /runs {economy,pillar,profile}       │────▶ │  App Router, no auth      │
│  GET  /runs/{id}/events   (SSE tail)       │      │  React Query + SSE hook   │
│  GET  /runs/{id}/artifacts (csv/json/md)   │      │  reuses --cc-* design kit │
│  GET  /submission /review /reports /graph  │      └──────────────────────────┘
│  POST /review/decisions  (named verdicts)  │
└─────────────────────────────────────────────┘
```

- **Events**: one small addition to the engine — an `emit(event)` helper appending JSONL to the run's out dir (`{"t": ..., "type": "screen_batch", "indicator": "P7-I2", "done": 3, "total": 7}`). The orchestrator already computes every number we need (candidate counts, screen caps, mapped counts, gate results, L2 stats); this just externalizes them. ~30 lines, zero behavior change, works identically under Path A/B.
- **API is a thin file-server + process manager.** No business logic. All legal logic stays in the engine. Review decisions POST → append to `data/review/decisions.csv` (the exact file `approve_rows.py` / `submission_replay.py` already consume) with reviewer name + timestamp.
- **Web** reads everything through the API. Static-friendly: with the API down, all non-live screens still render from the last snapshot (the demo video survives a crash).

---

## 3. The honest progress model (the "don't look stuck" ask, done right)

A time-based bar would lie (LLM latency varies). Our pipeline is **countable**, so percentage = completed work units / known work units:

- A pillar has a **known indicator list** (4 for P6, 5 for P7) → the top-level denominator exists before anything runs.
- Per indicator, weights: retrieval 10% · screen 35% · mapping 45% · gates+export 10%.
  - Retrieval finishes → we know `candidates` → screen batches become countable (`batch k/K of 12`).
  - Screen finishes → we know `survivors` → mapping items countable (`j/J`, each with the provision cite on screen).
  - Gates are instant; export closes the indicator.
- The bar **only advances on completed units and never moves backwards**. Before counts exist it shows the stage label + spinner, not an invented number.
- **Show why it's slow, live:** the current LLM call as a status line — `gpt-5.4-mini · mapping s. 187B(1) → P7-I3 · 14.2s · $0.0031` — plus a running cost ticker from the cost meter. A judge watching tokens stream against a named provision never thinks "stuck"; they think "working." That line is also our anti-hallucination story made visible.

**Event vocabulary** (drives everything): `run_started, corpus_ready{units}, indicator_started{id, n_of, total}, retrieval_done{candidates, injected, anchors_organic, anchors_saved}, screen_batch{k, K}, screen_done{survivors, capped}, map_item{j, J, cite, applies, confidence}, gate_result{row, gate, status}, absence_row{indicator}, diff_done{new, known}, warning{text}, llm_call{model, tokens_in, tokens_out, usd, ms}, log{line}, run_done{rows, out_dir}`.

---

## 4. Screens

### 4.1 Run Console — `/runs`, `/runs/[id]` *(the centerpiece)*
- Launch panel: economy × pillar × profile (Path A `local_fallback` / Path B `hybrid_accuracy`) — the model-swap demo IS this dropdown.
- **Stage stepper** (reuse `PipelineStepper` pattern): Corpus → Retrieve → Screen → Map → Gates → Diff → Export.
- **Overall progress bar with %** (model above) + per-indicator funnel table: `retrieved → +injected → screened-in → mapped → gate-passed → NEW/KNOWN` — live counts, gate-dot colors.
- **Live log terminal** (`.cc-live-log` dark panel, mono): two lanes — *narrative* (one line per event, human-readable) and *raw* (engine stdout tail). Toggle. Auto-scroll with pause-on-hover.
- Right rail: current LLM call card, cost ticker ($ so far vs ~$0.23 typical), warnings feed (recall holes, caps — shown, never hidden), elapsed time.
- Run history list with envelope summaries; every past run replayable from its `events.jsonl` (demo insurance: replay a recorded run if live Wi-Fi/API dies).

### 4.2 Review & Approve — `/review` *(dual-purpose: our freeze workflow now, the human-in-the-loop story on 3 Aug)*
Tabbed queue, each tab backed by an existing artifact:
- **Candidate rows** (per-run `output.csv` rows pending decision): row card with snippet, provenance, gate chain → Approve / Reject / Needs-edit buttons, reviewer name required.
- **NEW findings** (`refutation_*.json`): refuter verdict chip (KEEP / SPLIT-REVIEW / REJECT + the named failure mode), sorted SPLIT-first.
- **Zone-3 scores** (`data/zone3/*.json`): suggested 0/0.5/1 + **uncertainty band** + Krippendorff's α + persona disagreement — approve/override per indicator.
- **Recall adjudication** (`recall_adjudication.json`): the 55 misses with failure class + proposed verdict, editable verdict + note per row.
- All decisions POST to `decisions.csv` → `submission_replay.py` remains the only path to final artifacts. The UI cannot bypass the gate — worth saying to judges out loud.

### 4.3 Submission Explorer — `/submission` *(every row verifiable in seconds)*
- The consolidated table; filter by economy/pillar/indicator/tag/status; NEW rows badged.
- **Column spec** (dense, horizontally scrollable; template columns exact, verification columns appended):
  1–13. The template columns byte-exact (Economy, Indicator ID, Law Name, Article/Section, Discovery Tag, Location Reference, Verbatim Snippet, Mapping Rationale, Source URL, Confidence, Notes, …) — what judges compare against their sheet.
  Then the verification columns: **Source** (domain chip + citation-tier `[settled]/[verify]/[verify-pinpoint]`), **Match** (verbatim-match badge — `exact` / OCR-confidence % / `unaligned-review`), **Page/Anchor** (mono, click = open Source Match view), **SHA-256** (`HashBadge`, truncated, click-to-copy), **Access date**, **Status** (+ hover = status evidence fact), **Gates** (eight mini dots G1–G8), **Review** (pending/approved/rejected + reviewer name).
- Row click → **provenance drawer** (summary) → "Open in Source Match" (the Turnitin view below) and "Open in Evidence Audit".

### 4.3b Source Match view — *the Turnitin moment* (`/match/[rowId]`)
The single most persuasive screen for a skeptical judge: **our claim on the left, the actual source on the right, with the quoted span highlighted in the source itself.**
- **Left pane:** the submission row — verbatim snippet with per-sentence highlight colors, citation, rationale, indicator.
- **Right pane, by source type:**
  - **PDF sources (AU, MY):** the archived authorised PDF **page rendered as an image** (API endpoint `GET /match/{row}/page.png` renders via PyMuPDF) with the unit's stored **`pdf_span_boxes` drawn as translucent teal highlight rectangles** — the quote literally glows on the government's own page. Cross-page provisions render both pages stacked (alignment_start/end_page).
  - **HTML sources (SG SSO):** the archived HTML rendered read-only, auto-scrolled to the section anchor (`#pr26-`), the snippet's character range wrapped in a highlight mark.
  - **OCR sources:** page image + token bboxes, colored by per-token confidence (the OCR-honesty demo).
- **Header strip:** match verdict (`VERBATIM · exact` — this is the 100%-citation guarantee as a UI element), source URL (live) vs archived copy (local), SHA-256 of the immutable artifact, access date, compilation/current-as-at, authority rank of the domain.
- Every element is served from the **immutable source artifacts** already in the store — the UI proves the chain: submitted cell → snippet → span boxes → archived bytes → hash → official URL. Nothing is re-fetched, nothing re-generated.
- Fail-closed rows (`unaligned-review`, OCR disagreement) show the block reason instead of a fake highlight — the honesty posture is itself demo material.

### 4.4 Evidence Audit — `/evidence/[unitId]` *(the marquee three-pane from the prototype, on real data)*
- Left: act outline from real hierarchy metadata (Part / Division / Schedule path).
- Center: **serif paper view** of the provision, verbatim span highlighted; for OCR pages, bbox overlay on the page image; for AU, the "XHTML structure + authorised-PDF page N" authority-split callout.
- Right: mapping card — indicator, rationale, modality, gates, counter-evidence (G8), and the KNOWN/NEW diff context.

### 4.5 RDTII Matrix — `/matrix`
- Economies × P6/P7 indicators heatmap (reuse cell-state vocabulary: verified / partial / pending / conflict with striped fills).
- Cell = evidence count + suggested zone-3 score **with uncertainty band** + review state → drilldown to the rows behind it.

### 4.6 Provenance Graph — `/graph`
- Read-only force-layout of an exported Neo4j subgraph (JSON snapshot via `enrich_graph.py` route): Document → Provision, `MAPS_TO`, `EVIDENCED_BY`, `CROSS_REFERENCES`, `KNOWN_AS`, amendment edges. Framed as the **provenance/audit graph** (per the 10-Jul ruling — no retrieval-lift claims). Canned demo queries as buttons ("show everything supporting MY P7-I1", "which provisions cross-reference s. 187A?").

### 4.7 Benchmark & Cost — `/benchmark`
- L2 retrieval funnels per run (organic vs injection-saved anchors), recall vs gold with the adjudication link, extraction metrics vs the 30-page gold (once human-signed), **measured $/run table** from `logs/cost_report.json` incl. Path A (open-weight) comparison row — judges verify cost claims, so show the raw numbers.

### 4.8 Home — `/`
- One screen: what ClauseChain is, the pipeline diagram (reuse `ArchitectureDiagram` taste), three buttons — *Watch a run* / *Explore the submission* / *Review queue*. Light echo of the animated hero, no marketing copy.

---

## 5. Design language (inherited from the prototype, deliberately)

- **Tokens:** keep the `--cc-*` system — teal `#0FB5A7` accent ramp, ink zinc neutrals, semantic green/amber/red/blue with soft tints. Light-first.
- **Type:** system display stack for UI; **mono** (SF Mono/JetBrains) for hashes, section refs, log lines, counts (tabular-nums); **Times serif** exclusively inside the statute "paper" views. All system fonts — nothing fetched (offline rule).
- **Frame:** 240px sidebar (icon rail < 1180px) — *Workspace:* Dashboard/Home, Submission, Matrix, Review · *Pipeline:* Runs, Benchmark, Graph — + sticky glass topbar with breadcrumbs, live run status pill, ⌘K palette (jump to economy / indicator / row / provision).
- **Vocabulary:** `StatusChip`, `HashBadge`, `ConfidenceBar`, gate dots, `VerificationChain`, striped partial/conflict fills — reuse `clausechain/ui.tsx` widgets as-is where possible.
- **Density:** information-dense tables with horizontal-scroll min-widths; skeletons + `prefers-reduced-motion` respected; toasts for decision writes.

**Stack:** Next.js App Router + Tailwind + shadcn/radix + Recharts + React Query (all already in the prototype's `package.json`); FastAPI + `sse-starlette` on the API side. New repo dirs: `apps/web` (fresh app, copied tokens/components) and `apps/api`. Do NOT fork the Cancelled folder itself — copy `globals.css` tokens, `clausechain/ui.tsx`, `WorkspaceShell.tsx`, chart wrappers, and rebuild pages clean.

---

## 6. Build phases (each independently demo-able)

| Phase | Scope | Value |
|---|---|---|
| **F0** | FastAPI skeleton + `emit()` events in orchestrator + SSE tail | Everything else depends on it (~½ day) |
| **F1** | **Run Console** (launch, stepper, %, funnel, live log, cost ticker, replay) | Kills "is it stuck", carries the video + 3 Aug live demo |
| **F2** | **Review & Approve** (4 queues → decisions.csv) | Unblocks OUR freeze approvals this week; human-in-the-loop proof |
| **F3** | **Submission Explorer + Matrix** | The judged artifact, verifiable in seconds |
| **F4** | **Evidence Audit + Graph + Benchmark + Home** | Depth, provenance story, cost proof |

Cut order if time runs short: F4 → Matrix → (never F1/F2). A stale-but-honest smaller UI beats a broad broken one — same rule as the engine.

## 7. Handoff notes for the design/build session (read before writing any code)

**H1 — Build against REAL artifacts, never invented mocks.** The cancelled prototype died because its 1,528-line mock file drifted from the engine. The repo contains real data for every screen — copy a snapshot into `apps/web/fixtures/` and type against it:
| Screen | Real source of truth (field names live here, not in this doc) |
|---|---|
| Run Console (replay) | `engine/outputs/final_*_p*/output.json` (RunEnvelope: `findings`, `gates`, `warnings`, `metadata.stats`) + `engine/logs/cost_report.json` |
| Review — NEW findings | `engine/data/review/refutation_final_*.json` (verdicts: `RECOMMEND-KEEP` / `SPLIT-REVIEW` / `RECOMMEND-REJECT` + named failure modes) |
| Review — zone-3 | `engine/data/zone3/*_scores.json` (score, uncertainty band, `alpha`, flagged) |
| Review — adjudication | `engine/data/review/recall_adjudication.json` (`stats`, `misses[]` with `class`, `proposed_verdict`, `evidence`) |
| Submission table | `engine/submission/consolidated.csv` + `consolidated.json` (JSON carries the provenance-only fields: `archived_copy`, `access_date`, `status_evidence`, `citation_tier`, `reviewer_decision`, `mean_ocr_confidence`) |
| Source Match | provision `metadata` in the graph store: `pdf_span_boxes`, `alignment_start_page`/`end_page`, `pdf_alignment`, `xhtml_anchor`, `hierarchy_path`; archived files under `engine/data/raw/{sg,my,au}/` |
| Gate report banner | `engine/reports/champion_validation.json` (`status`, `failures[]` — incl. the stale-fingerprint failures) |
| Existing static reference | `engine/submission/review/index.html` (Sol's static review bundle — the webapp supersedes it; mine it for row semantics) |
Field names in the table above are indicative — **verify against the actual files before typing interfaces.** Where a MappedFinding field exists in JSON but not CSV, the JSON is authoritative.

**H2 — Handoff boundary.** The engine-side event emitter (F0) and FastAPI service are built on the engine side, NOT by the design session. Design builds `apps/web` against a **typed API client with a fixture adapter** (same interface, reads the files above + a recorded `events.jsonl`). A hand-written sample `events.jsonl` matching §3's vocabulary belongs in fixtures so the Run Console is fully buildable before F0 lands. Do not touch anything under `engine/` — additive-only is absolute.

**H3 — Location & reuse.** New code goes in `engine/apps/web` (+ `engine/apps/api` reserved). Do **not** fork `Cancelled/frontend`; copy only: the `--cc-*` token blocks from its `globals.css`, `components/clausechain/ui.tsx`, `WorkspaceShell.tsx`, `PipelineStepper.tsx`, the chart wrappers, and the shadcn `ui/` set. Leave auth/admin/billing/marketing behind.

**H4 — Every screen needs five states designed, not just the happy path:** loading (skeletons), empty (no runs yet — first-run guidance), error (API down → render last snapshot, banner), **stale** (corpus fingerprint mismatch from the champion gate → amber banner on Runs/Submission: "outputs predate current corpus — re-run required"), and **fail-closed** (unaligned/blocked/pending rows show the block reason prominently; never render a blocked row as if it were clean). The honesty states are demo material, not embarrassments.

**H5 — Demo-surface realities.** Screens will be captured in a ≤10-min 1080p recording and driven live on 3 Aug: readable at recording scale (no 10px mono walls), pause-on-hover for auto-scrolling logs, and a `?demo=1` replay mode that runs a recorded event stream at ~2× so the Run Console can be shown without waiting on live LLM latency (labeled "REPLAY" — never pass a replay off as live).

**H6 — Volume assumptions.** Submission ≈ 100–200 rows (no virtualization needed); events streams can reach thousands of lines (cap the DOM at the last ~500 with "show earlier"); PDF page images render on demand, one page at a time.

## 8. Risks / rules

- **Additive-only**: no engine file changes beyond the `emit()` hook; the UI cannot create final artifacts except through `submission_replay.py`'s approval gate.
- **Offline-complete**: no CDN, no webfonts, no analytics, no external images; `npm run build` must succeed and run air-gapped.
- **Replay everything**: every live view renders equally from recorded `events.jsonl` — demo insurance.
- **Honest numbers only**: warnings, caps, and unaligned/blocked counts are displayed, never smoothed over. Judges reward the audit posture.
