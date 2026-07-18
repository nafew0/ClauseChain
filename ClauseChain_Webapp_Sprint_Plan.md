# ClauseChain Web-App Sprint Plan — Reuse the Hosted SaaS (T-minus: 19 Jul 11:00)

**Decisions locked (18 Jul, user):** reuse the already-hosted `frontend/` (Next.js) + `backend/` (Django) with the demo workspace; frontend-only cleanup for judges now, code cleanup after the 20th; priority screens = **Review & Approve (with act references)** and **Source Match**, Run Console lighter; decisions stored in **Django DB + synced to the engine's decisions file**; the ≤10-min video is a screen recording of this app in the final hour.

**Supersedes** the "fresh local app" build path in `ClauseChain_Frontend_Plan.md` for Round 1 — that doc's screen specs, design language, and honesty rules still apply verbatim; only §2 architecture and §6 phases are replaced by this sprint. The fresh-local/offline path returns post-20th as the repo's judge-runnable UI.

---

## 0. The one rule that cannot break

**The engine's files are the single source of truth. The DB is a mirror.**
The final export is produced ONLY by `engine/scripts/submission_replay.py`, which reads `data/review/decisions.json`. A reviewer click that never reaches that file does not exist. Therefore the Django export (§3.4) is a **release gate**, not a nice-to-have — the video must show the export step or the human-in-the-loop story is theater.

Corollaries:
- No screen renders invented data. Every screen binds to an imported engine artifact (§2). If an artifact lacks a field, the screen shows "—", never a made-up value.
- Blocked/fail-closed rows render their block reason. Never as clean rows.
- The replayed Run Console is labeled **REPLAY**. Never passed off as live.

---

## 1. Architecture: SAME-HOST (decided 18 Jul — engine deploys to clausechain.zai.bd)

The full engine moves to the Ubuntu server; the Mac is dev-only afterwards. No data
loop, no bundle uploads — Django and the engine share one filesystem.

```
[clausechain.zai.bd]
  /srv/clausechain/engine/        ← full engine checkout + data/ (rsync'd once)
        ▲ subprocess                    │ direct file reads
  Django (existing backend)  ───────────┘
    ├ reads: review_payload (via build_payload), consolidated.json,
    │        proof assets, run envelopes, cost/gate reports
    ├ writes: data/review/decisions.json  (THE decisions contract, §2)
    ├ mgmt cmds: engine_refresh (rebuild payload/bundle), engine_replay
    │        (runs submission_replay.py after decisions), engine_run
    │        (admin-only: launch run.py — spends API money, never public)
    └ ENGINE_ROOT env setting points at the checkout
```

**Deployment checklist (backend dev, ~1h):**
1. `git clone` the repo on the server + `rsync -az engine/data engine/outputs engine/logs engine/submission engine/reports` from the Mac (graph.db, raw archives, embeddings cache — several hundred MB; rebuild-from-scratch also works but costs embedding time/money).
2. Python 3.12 venv, `uv sync --all-groups` (or pip from pyproject), then `.env` on the server: `OPENAI_API_KEY`, `OCR_PROVIDER/OCR_ENDPOINT/OCR_API_KEY` (the OCR VM is already remote — reachable from the server), `GRAPH_BACKEND=sqlite`. File perms 600; never committed.
3. Prove it: `pytest tests/ -q` (112 green) → `python scripts/champion_validate.py` → one admin-triggered SG P6 run end-to-end.
4. Keep the provider **spend cap** env set — a public server must not be able to burn the API budget even if the admin gate fails.
- `export_ui_bundle.py` (already built) is now the frontend team's **local fixtures generator** + a fallback if server setup stalls tonight — not the production path.
- Judges' reproducibility path is still the cloned repo under Path A (offline); the hosted app is the bonus/demo surface with read access + admin-gated runs.

## 2. Canonical contracts (already exist — do NOT invent shapes)

| Artifact | Feeds | Notes |
|---|---|---|
| `review_payload.json` (from `export_legal_review_payload.build_payload()`) | ALL review tabs | `sheets` = NEW Findings (24, **with Refuter verdict/reasoning cols**), Absence Review (12), Recall Misses (17), Zone-3 Scores (27), KNOWN Findings (66), Indicator Criteria, Master Known. Headers arrays are the column contract. |
| `submission/review/decisions.template.json` | ReviewDecision model | 102 rows: `{finding_key: sha256, review: {decision, reviewer_name, reviewer_role, reviewed_at, citation_checked, mapping_checked, status_checked, correction_note, …}}` — **the export must reproduce this exact shape**, template-complete (unreviewed rows stay `rejected`/unsigned as in the template). |
| `submission/review/assets/*.png` + `index.html` row data | Source Match | Page images with highlights are ALREADY RENDERED by the engine. The screen recomposes them; it never re-renders PDFs. |
| `submission/consolidated.json` | Submission table + act-reference panel | Full provenance fields (`status_evidence`, `citation_tier`, `source_artifact_id`, …). |
| `outputs/final_*_p*/output.json` + `logs/cost_report.json` | Run Console lite | Envelope: findings, warnings, per-indicator stats, measured $. |
| `reports/champion_validation.json` | Global banner | If `status: FAIL` with stale-fingerprint items → amber "outputs predate corpus" banner. |

**Act-reference panel (the user's must-have):** for the focused row, show — (a) `Surrounding source context` + `hierarchy_path`/Part/Division from the payload row, (b) the same law's other rows in `consolidated.json` (same `Law Name`, grouped by section), (c) the `Master Known` entries for that economy+indicator (what ESCAP already records — the KNOWN/NEW contrast that makes approve/reject obvious), and (d) the Indicator Criteria card (legal question + test + scoring). All four exist in the bundle; zero new engine work.

## 3. Phases (parallel swarm; owners per team)

### P0 — Server deployment + contracts (Claude + 1 backend dev) — TONIGHT, first 2h
- **Backend dev:** deploy the engine per §1 checklist (clone + rsync data + venv + .env + pytest green). Then Django app `workspace`: models `Finding`, `ReviewDecision`, `RecallMiss`, `Zone3Score`, `RunEnvelope` hydrated by an `engine_refresh` management command that calls `build_payload()`/reads artifacts from `ENGINE_ROOT` (idempotent, keyed by `finding_key`/ids); DRF read endpoints mirroring §2 shapes 1:1 (no reshaping); `POST /decisions` writes the DB **and** regenerates `data/review/decisions.json` from the template + all stored decisions on every write (file is always current — no separate sync step to forget); `engine_replay` command wraps `submission_replay.py`.
- **Claude (already delivered):** `export_ui_bundle.py` → `ui_export.zip` for the frontend teams' local fixtures while the server is being set up; decisions round-trip contract verified.
- **Gate:** hosted API serves the real 102 rows + 24 NEW + 17 misses + 27 zone-3; one test decision POST visibly lands in `data/review/decisions.json` on the server.

### P1 — Review & Approve (frontend Team A) — the centerpiece
Route: `/review` (workspace shell, existing design system). Tabs = payload sheets, in this order: **NEW (24) → Absence (12) → Recall (17) → Zone-3 (27) → KNOWN (66, skim view)**.
- Row card: snippet (`.cc-verbatim` style), citation, mapping rationale, **refuter chip** (KEEP teal / SPLIT amber / REJECT red + reasoning expander), gate warnings, status evidence.
- **Act-reference side panel** (§2 spec) — opens per focused row.
- Decision bar: `approve / reject / needs-correction` (recall tab: the 5 verdict words), reviewer **name + role required** (persisted per session), auto `reviewed_at`; three check toggles (citation/mapping/currentness). POST `/api/workspace/decisions/`.
- Progress header: "N of 146 decided" + per-tab counts. SPLIT-first sort on the NEW tab.
- KNOWN tab: bulk-approve visible-page with confirm (66 rows must not take an hour) — but the one **TECHNICAL BLOCK** row renders blocked and is excluded from bulk.

### P2 — Source Match (frontend Team B) — the Turnitin shot
Route: `/match/[findingKey]`, linked from every review row.
- Left: our claim (snippet, citation, indicator, rationale). Right: the **pre-rendered proof PNG** (highlighted government page) from the bundle; HTML-source rows show archived-anchor context text.
- Header strip: `VERBATIM` badge, SHA-256 (click-copy), official URL vs archived copy, access date, status + evidence fact.
- Blocked rows: the block reason panel instead of an image.
- Prev/next navigation so the video can flow through 3–4 rows without leaving the screen.

### P3 — Run Console lite + Submission table (frontend Team C)
- `/runs`: 6 run cards from envelopes — rows produced, NEW/KNOWN split, warnings count (expandable, honest), measured $ per run, model_version, elapsed. **No fake live progress** — this sprint ships "run history", not the streaming console (that returns post-20th with the `emit()` events).
- `/submission`: consolidated table per Frontend Plan §4.3 column spec (13 template cols + verification cols), filters, NEW badges, row → provenance drawer → "Open Source Match".

### P4 — Assembly + demo workspace + VIDEO (all hands, 19 Jul 08:00–11:00)
- 08:00 fresh bundle from the engine (post any late legal decisions) → import → walkthrough against the checklist below.
- 09:00 dry run of the script; fix P0 bugs only (visual polish is post-20th).
- 10:00 **record** (1080p, ≤10 min):
  1. Home/workspace → the 3 economies (30s)
  2. Run history: 6 runs, cost ~$0.2/run, warnings shown honestly (60s)
  3. **Review & Approve**: approve a KEEP NEW row using the act-reference panel; override a SPLIT with a typed correction (2.5 min)
  4. **Source Match**: PDPA s. 26(1) anchor row + one AU PDF row with the highlighted page + SHA chain (2 min)
  5. **The gate**: click "Finalize" (admin) → the app runs `submission_replay.py` on the server → final CSV appears with only approved rows, count changes on screen (90s — *the human-in-the-loop proof, live on one host*)
  6. Submission table + MY planted-error catch row + scanned-PDF/OCR mention + `.env` model-swap flash (90s)
- 10:45 upload with the submission.

### Post-20th (backlog, no deadline pressure)
Auth/billing code removal from workspace routes; live Run Console (engine `emit()` + SSE); local no-auth build for the judge-runnable repo path; Neo4j graph screen; matrix; finals hardening for 3 Aug.

## 4. Cut order if the swarm slips
P3 `/submission` → P3 `/runs` → P1 KNOWN-tab polish (bulk stays) → **never** P1 NEW/Recall/Zone-3 tabs, P2, or the decisions export. A video showing only Review + Source Match + the sync loop still wins; a video of eight half-broken screens loses.

## 5. Answers to the open questions you'll hit
- **"Can judges use the hosted app?"** It's a bonus link in the README ("live demo workspace, demo credentials inside") — allowed (deployment optional per organizer QnA), but the repo must stay runnable without it. Never present the hosted app as the reproducibility path.
- **"Where do page images for MY unaligned rows come from?"** They don't — those rows are blocked and must render the block reason. That's the fail-closed story, on purpose.
- **"Multi-reviewer?"** DB supports it (decision rows keep reviewer identity); the export takes the LATEST decision per finding_key. Good enough for Round 1.
- **"What if legal's Excel comes back too?"** Excel wins for the rows he decided (import via a small management command mapping workbook rows → decisions), app fills the rest. finding_key join is by (indicator, law, article) → sha from the template.
