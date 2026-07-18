# ClauseChain Application Dev Plan — Detailed, Phase-by-Phase

**Scope:** the hosted web application only (clausechain.zai.bd). No video/demo material here.
**Division of labor:** **GPT-5.6 Sol executes most phases** (Django + Next.js). **Fable (Claude)** owns the engine-side integration surface, the data contracts, and the per-phase review; the user reviews every Sol execution against the acceptance checklists below.
**Base facts (surveyed 18 Jul):** frontend = Next 16.2.4 / React 19 / Tailwind 3.4 / shadcn / react-query 5 / axios with JWT-refresh interceptor; all 16 workspace views are 100% mock-driven from `src/lib/clausechain/data.ts` (1,527 lines). Backend = Django 5.2 + DRF + SimpleJWT (HttpOnly refresh cookie) + Postgres + Channels/Celery; local apps are only `accounts` and `subscriptions`; root `urls.py` reserves an `# path("api/", include("myapp.urls"))` slot; admin gate = `IsSuperuserPermission` via `/api/admin/_gate/`. No gunicorn/daphne config is committed — deployment config must be added.

## Ground rules (apply to every phase)

- **G1 — Engine files are the source of truth; the DB is a mirror.** The only path to final artifacts is `engine/scripts/submission_replay.py` reading `data/review/decisions.json`. Every decision write regenerates that file (D1.4). If DB and file ever disagree, the file wins and the bug is P0.
- **G2 — No invented data.** New screens bind only to imported engine artifacts. Missing field → render "—". The existing mock `data.ts` must never feed a judge-visible screen after D6.
- **G3 — Honesty states.** Blocked/fail-closed rows show their block reason; REPLAY is labeled REPLAY; warnings/caps are displayed, not smoothed. Every screen implements loading / empty / error / stale / blocked states.
- **G4 — Run-launching is superuser-only** (user decision, 18 Jul) and the engine-side provider spend cap stays set on the server regardless.
- **G5 — Additive to the engine.** Sol never edits files under `engine/` — engine changes go through Fable. Frontend/backend changes never rename existing auth/billing routes (cleanup is post-20th).
- **G6 — Secrets.** Server `.env` files are 600-perm, never committed. The submitted repo contains no secrets.

## Contracts (Fable-owned; Sol codes against these, never reshapes)

| # | Contract | Shape source |
|---|---|---|
| C1 | **Review payload** — all queues | `engine.scripts.export_legal_review_payload.build_payload()` → `{counts, refuter_status, sheets: {"NEW Findings"|"Absence Review"|"Recall Misses"|"Zone-3 Scores"|"KNOWN Findings"|"Indicator Criteria"|"Master Known": {headers: [...], rows: [[...]]}}}`. Headers arrays ARE the column contract; NEW rows include `Refuter verdict` + `Refuter panel reasoning` when a full-indicator-v2 run exists. |
| C2 | **Decisions file** — `engine/data/review/decisions.json` | List of `{"finding_key": "<sha256>", "review": {"decision": "approved"|"rejected"|"needs-correction", "reviewer_name", "reviewer_role", "reviewed_at", "citation_checked", "mapping_checked", "status_checked", "citation_reviewer_name", "mapping_reviewer_name", "status_reviewer_name", "correction_note"}}`. Must remain **template-complete**: every key from `decisions.template.json` present; undecided rows keep the unsigned template values. |
| C3 | **finding_key join** | `finding_key` sha256 comes from `decisions.template.json` / `submission/review` bundle rows. UI rows join to it via the proof bundle's row index (Fable ships `finding_key_map.json` in D0: `{(economy, indicator, law, article) → finding_key, proof_asset, blocked}`). |
| C4 | **Evidence rows** | `engine/submission/consolidated.json` (`rows[]`, template columns + provenance fields: `status_evidence`, `citation_tier`, `source_artifact_id`, `archived_copy`, `access_date`, `reviewer_decision`, `mean_ocr_confidence`). |
| C5 | **Run envelopes** | `engine/outputs/final_{si,ma,au}_p{6,7}/output.json` (`findings`, `gates`, `warnings`, `metadata`), `engine/logs/cost_report.json`, `engine/reports/champion_validation.json`. |
| C6 | **Proof assets** | `engine/submission/review/assets/*.png` (pre-rendered highlighted source pages) + `index.html` row semantics. Served as static files; never re-rendered. |

---

## Phase D0 — Server deployment + engine surface — **Owner: Sol (deploy) + Fable (engine)**

**Deployment decision (18 Jul, user):** the old Docker deploy was painful — the fresh server uses **NO Docker**: plain systemd + nginx + venvs. Simplifications locked for this sprint: **Django on SQLite** (`DB_ENGINE=django.db.backends.sqlite3` — supported by settings; a handful of reviewers doesn't need Postgres provisioning), **no Redis/Celery/Channels** (`USE_REDIS=0`; long actions run in a background thread with a status row; screens poll — no websockets in D1–D6), plain **WSGI gunicorn** (no daphne). Fresh DB — recreate the superuser + reviewer accounts; billing/OAuth env keys stay unset (those flows are hidden anyway).

**Sol — fresh-server bootstrap (in this order):**
0. **Point DNS for clausechain.zai.bd at the new IP FIRST** (propagation runs while you work); Ubuntu 22.04/24.04, non-root sudo user, `ufw allow 22,80,443`.
1. `apt install nginx python3.12-venv rsync` + **Node 24** (nodesource/nvm — Next 16 requires it, see frontend `.nvmrc`); `certbot --nginx` once DNS resolves.
2. Clone repo to `/srv/clausechain/`; from the Mac `rsync -az engine/data engine/outputs engine/logs engine/submission engine/reports` (~hundreds of MB — start this in parallel at step 0).
3. Engine venv (`/srv/clausechain/engine/.venv`): install from `engine/pyproject.toml` (all groups). Engine `.env`: `OPENAI_API_KEY`, `OCR_PROVIDER/OCR_ENDPOINT/OCR_API_KEY`, `GRAPH_BACKEND=sqlite`, spend-cap env. Perms 600.
4. Backend venv: `pip install -r backend/requirements.txt`; backend `.env`: strong `DJANGO_SECRET_KEY`/`JWT_SIGNING_KEY`, `DEBUG=False`, `ENVIRONMENT=production`, `DB_ENGINE=django.db.backends.sqlite3`, `USE_REDIS=0`, `APP_ORIGIN=https://clausechain.zai.bd`, `ENGINE_ROOT=/srv/clausechain/engine`; `migrate` + `createsuperuser` + `collectstatic`.
5. Frontend: `.env` `BACKEND_URL=http://127.0.0.1:8001`, `npm ci && npm run build`.
6. **systemd units** (committed to repo under `deploy/`): `clausechain-api.service` (gunicorn WSGI :8001, 2 workers × 4 threads), `clausechain-web.service` (`next start` :3000). `deploy/nginx.conf`: `/` → :3000, `/api/` + `/media/` + `/static/` → :8001, `/proof/` → `alias /srv/clausechain/engine/submission/review/assets/`.
7. Prove: `pytest engine/tests -q` → **112 passed on the server**; `python engine/scripts/champion_validate.py` runs; login works over https; document every step in `deploy/DEPLOY.md` as you go (the doc IS the acceptance artifact).

**Fable (delivered / to deliver):**
- `export_ui_bundle.py` ✅ (fixtures for frontend devs working locally).
- `finding_key_map.json` generator (C3) — added to the bundle and to a small `engine/scripts/export_finding_key_map.py`.
- Review of Sol's `.env`/deploy PR.

**Acceptance (user reviews):** engine tests green **on the server**; `ENGINE_ROOT` env documented; one manual `run.py --economy Singapore --pillar 6` completes on the server (admin terminal, not the app); nginx serves the existing app unchanged.

---

## Phase D1 — Django `workspace` app — **Owner: Sol**

New app `workspace` mounted at the reserved `api/` slot → prefix **`/api/workspace/`**.

**D1.1 Models** (thin mirrors, all with `source_hash` for idempotent refresh):
- `EngineSnapshot(id, generated_at, counts_json, refuter_status, champion_status, stale)` — one row per refresh.
- `ReviewItem(snapshot FK, queue ∈ {new, absence, recall, zone3, known}, position, row_json, finding_key nullable, blocked bool, block_reason)` — row_json = the exact payload row (C1); no per-column normalization (headers live on the snapshot).
- `EvidenceRow(snapshot FK, row_json, finding_key, proof_asset)` — from C4+C3.
- `RunRecord(snapshot FK, run_name, envelope_json, cost_json)` — from C5.
- `Decision(finding_key, queue, decision, reviewer_name, reviewer_role, reviewed_at, citation_checked, mapping_checked, status_checked, correction_note, verdict nullable, created_by FK accounts.User, created_at)` — **append-only** (history preserved; latest per finding_key wins).

**D1.2 `engine_refresh` management command:** subprocess `ENGINE_ROOT/.venv/bin/python -c "…build_payload…"` → JSON to stdout; load C1/C3/C4/C5 files; create a new `EngineSnapshot` atomically; delete snapshots older than the last 5. Never partial: any file missing → abort with a clear error, previous snapshot stays live.

**D1.3 Read endpoints** (DRF, `IsAuthenticated`; serializers pass `row_json` through untouched):
- `GET /api/workspace/summary/` → counts, refuter_status, champion gate status + failures, snapshot time, decision progress (decided/total per queue).
- `GET /api/workspace/review/<queue>/` → headers + rows (paginated 50; `?undecided=1` filter; NEW queue default-sorted SPLIT-first).
- `GET /api/workspace/evidence/` → consolidated rows (filters: economy, pillar, indicator, tag, status).
- `GET /api/workspace/evidence/<finding_key>/` → row + proof asset URL + latest decision.
- `GET /api/workspace/runs/` → run cards data.
- Proof assets: nginx `location /proof/ { alias ENGINE_ROOT/submission/review/assets/; }` (read-only, authenticated via Django `X-Accel-Redirect` if easy, else public-read is acceptable for Round 1 — they are public statutes).

**D1.4 Decision write** — the critical path:
- `POST /api/workspace/decisions/` `{finding_key, queue, decision|verdict, checks…, correction_note}` — validates vocabulary per queue (findings: approved/rejected/needs-correction; recall: REAL_MISS/GOLD_WRONG/GOLD_AMBIGUOUS/CORRECT_ABSTENTION/NEEDS_CORRECTION; zone3: score approve/override+value); requires `reviewer_name`+`reviewer_role` non-empty; stamps `reviewed_at` + `created_by`.
- After EVERY write (post-commit hook): regenerate `ENGINE_ROOT/data/review/decisions.json` = template ∪ latest decisions (C2, template-complete), then write `decisions.sha256` alongside. File write is atomic (tmp+rename) under a file lock.
- `POST /api/workspace/decisions/bulk/` — same body + `finding_keys[]` (KNOWN-queue bulk approve; refuses blocked rows).

**D1.5 Privileged actions** (superuser only, `IsSuperuserPermission`):
- `POST /api/workspace/engine/refresh/` → runs D1.2 in a background thread (no Celery — D0 decision) with an `EngineAction` status row the UI polls.
- `POST /api/workspace/engine/replay/` → runs `submission_replay.py` (subprocess, captured stdout stored on the snapshot; then auto `engine_refresh`).
- `POST /api/workspace/engine/run/` `{economy, pillar}` → `run.py` subprocess, **one at a time** (lock), output streamed to a `RunLaunch` record. Spend cap remains the hard backstop.

**Acceptance (user + Fable review):** with a seeded snapshot — all five queues return real rows with correct counts (24/12/17/27/66); a POSTed decision appears in `decisions.json` on disk with the template shape (Fable diff-checks against C2); bulk approve refuses the TECHNICAL BLOCK row; non-superuser gets 403 on all D1.5 routes; two rapid concurrent decisions don't corrupt the file (lock test).

---

## Phase D2 — Frontend data layer — **Owner: Sol**

- `src/services/workspace.ts`: typed functions for every D1 endpoint (existing axios instance → auth/refresh comes free).
- `src/hooks/workspace.ts`: react-query hooks (`useSummary`, `useReviewQueue(queue)`, `useEvidence`, `useEvidenceRow`, `useRuns`, `useDecide` mutation with optimistic update + toast + invalidation of summary/queue).
- Types generated from the REAL payload (import `ui_export.zip` fixtures into `src/lib/workspace/fixtures/` for dev/storybook; **do not extend `clausechain/data.ts`**).
- Global **snapshot banner** component: "Data as of <time> · bundle <hash8>" + amber stale/champion-FAIL banner (C5).

**Acceptance:** hooks render against fixtures with the API off (dev mode), and against the live API on the server; no new imports from the mock `data.ts` anywhere under the new routes.

---

## Phase D3 — Review & Approve — **Owner: Sol** *(the centerpiece)*

Route `/review` inside `WorkspaceShell` (add to `NAV_ITEMS`). Tabs: **NEW (24) → Absence (12) → Recall (17) → Zone-3 (27) → KNOWN (66)** with decided/total chips.

- **Row card:** verbatim snippet (`.cc-verbatim`), citation + law, mapping rationale, status evidence, gate warnings (expandable), **refuter chip** — KEEP (teal) / SPLIT (amber) / REJECT (red) — with the panel reasoning in an expander. Blocked rows: red left border + block reason, decision buttons disabled except `needs-correction`.
- **Act-reference panel** (right drawer, opens per focused row — the user's must-have):
  1. Surrounding source context + hierarchy path (Part/Division) from the payload row;
  2. same law's other rows from C4 grouped by section (click → Source Match);
  3. **Master Known** entries for that economy+indicator (what ESCAP already records — the NEW-vs-KNOWN contrast that makes the call obvious);
  4. Indicator Criteria card (legal question, test, scoring, exclusions).
- **Decision bar:** approve / reject / needs-correction (queue-correct vocabulary), three check toggles, correction note (required for needs-correction), reviewer name+role persisted in localStorage after first entry; keyboard: `a`/`r`/`n`, `j`/`k` next/prev.
- **Zone-3 tab:** deterministic score + judge scores + α + band; Approve score / Override (0/0.5/1 picker + reason).
- **Recall tab:** proposed verdict pre-selected, 5-verdict radio, evidence JSON expander.
- **KNOWN tab:** dense table + bulk approve of filtered selection (excludes blocked), single-row drill available.

**Acceptance:** decide 3 rows across 3 queues → summary progress updates, `decisions.json` on server reflects all 3 (Fable verifies shape), refresh-safe (decisions survive reload), all five states per G3 demonstrable.

---

## Phase D4 — Source Match — **Owner: Sol**

Route `/match/[findingKey]`, linked from review rows, evidence table, act-reference panel.
- Left: claim card (snippet with highlight color, citation, indicator, rationale).
- Right: proof PNG from C6 (zoomable, `max-width` contained); HTML-anchor rows (SG) show archived-context text block with the snippet marked; blocked rows show the block-reason panel.
- Header strip: match badge (`VERBATIM · exact` / `anchor` / `blocked`), SHA-256 with click-copy (`HashBadge`), official URL (external link) vs archived copy, access date, status + status-evidence fact, citation tier chip.
- Prev/next within the current filter set; deep-linkable.

**Acceptance:** an SG anchor row, an AU exact row, and a blocked row all render correctly; every element traces to C4/C6 fields (Fable spot-checks 5 rows against engine files).

---

## Phase D5 — Runs + Submission Explorer — **Owner: Sol**

- `/runs`: 6 envelope cards (rows, NEW/KNOWN, warnings count with expandable full list, measured $, model_version, elapsed); champion-gate banner. **No fake live progress** — launch UI (superuser) shows queued/running/done from D1.5 polling, plus captured stdout tail. Live event streaming is post-20th (engine `emit()` — Fable).
- `/submission`: C4 table — 13 template columns byte-labeled + verification columns (source domain + tier, match badge, page/anchor, SHA-256, access date, status, gates mini-dots, review state). Filters + NEW badges; row → drawer → Source Match link. Export-view note: "final artifacts are produced by the engine replay, not by this table" (G1).

**Acceptance:** counts match the engine's files exactly (Fable script-checks); a superuser can trigger replay and the review state column updates after auto-refresh.

---

## Phase D6 — Judge-facing IA cleanup (frontend only) — **Owner: Sol**

- Sidebar becomes: **Dashboard · Review · Submission · Source Match (via rows) · Runs · Benchmark(existing, re-pointed later)** — the six mock pipeline screens and mock-driven views (`CrawlConsole`, `HarvestReview`, `ExtractionWorkspace`, `MappingRun`, `SourceTrace`, `ExportOutput`, `SourceStatusGraph`, `PipelineLedger`, mock `DocumentWorkspace`) are **removed from nav** (routes stay, unreachable) — G2.
- `WorkspaceDashboard` re-bound to `/summary/`: decision progress, run stats, champion gate, snapshot banner. Remove mock KPI/activity feeds.
- Billing/pricing/admin links hidden for non-superusers (already largely done — verify). Auth flows untouched.
- A `/review`-first redirect after login for reviewer accounts.

**Acceptance:** a fresh non-superuser account sees ONLY real-data screens; no route reachable from the UI renders mock data; `npm run build` clean.

---

## Review protocol (every phase)

1. Sol works on a branch per phase (`feat/d1-workspace-app` …), opens a PR with the acceptance checklist filled in.
2. **Fable reviews the diff** — contract fidelity (C1–C6), G1–G6, and the phase's acceptance list; posts findings; Sol fixes.
3. **User does the hands-on pass** on the server (each acceptance section is written to be executable by clicking, not by reading code).
4. Merge → deploy → next phase. D1 cannot merge without the decisions-file round-trip proven; D6 cannot merge with any mock-data screen reachable.

## Risk register

| Risk | Mitigation |
|---|---|
| Decisions file drift vs DB (G1) | Regenerate-on-every-write + atomic rename + lock; Fable's round-trip check in D1 acceptance; `decisions.sha256` displayed in the app footer |
| Payload shape drift after an engine re-sweep | `engine_refresh` is all-or-nothing snapshots; UI binds to headers arrays, not hardcoded column indexes |
| Next 16 breaking changes | `frontend/AGENTS.md` warning stands — Sol reads `node_modules/next/dist/docs/` before App-Router work |
| Server run abuse / spend | G4 superuser gate + single-run lock + engine spend cap |
| Proof assets for MY blocked rows missing | By design — blocked rows render the reason, never an image (G3) |
| Postgres vs engine SQLite confusion | They never touch: Postgres = app mirror; engine keeps its own SQLite store |


---

# REV B — Sol's architecture review incorporated (18 Jul, accepted in full)

**User decisions recorded:** (1) reviewers: "might be two or more" → build the staged two-reviewer flow (citation reviewer ≠ mapping reviewer, per `finalization.py`); (2) the server **remains the authoritative review system after submission freeze** unless blocked → decisions/artifacts live on the server permanently; nightly backup (tar of `engine/data/review`, `engine/submission`, Django DB) to off-server storage is added to D0. **Hard deadline: the review UI must be usable for the legal session tomorrow 11:00.**

## Accepted contract changes (supersede conflicting D1 text)

1. **Three decision domains, three models/endpoints** — findings (`finding_key` → `decisions.json`), recall adjudication (key = sha256 of economy|indicator|act|ref → `recall_decisions.json`), zone-3 (key = economy|indicator → `zone3_decisions.json`). No generic decision endpoint.
2. **`needs-correction` is app-only.** Engine `ReviewDecision` accepts approved/rejected only. `CorrectionRequest` model captures the reviewer's explanation; corrected findings are regenerated by the engine, re-reviewed, and get a NEW finding_key if identity fields change. Reviewers can never edit evidence in the app.
3. **Staged review:** citation reviewer (source/article/page/quote/currentness) and mapping reviewer (indicator fit/scoring) are separate recorded identities with separate timestamps; names must differ; submission-eligible only after both approve. Status check assignable to either, identity recorded.
4. **Dedicated engine worker** — no engine subprocesses in gunicorn. `EngineAction` DB row → single-worker systemd service (`clausechain-engine.service`, separate OS user `clausechain-engine`) claims jobs via DB lease, runs **allowlisted** commands `shell=False`, records stdout+hashes, survives API restarts.
5. **File-authoritative decision write:** cross-process flock → validate full file → tmp write → flush+atomic rename → SHA-256 verify → THEN DB audit mirror → return file hash to the frontend. Optimistic concurrency via `expected_latest_decision_id`. UI shows "Saving decision…" until the authoritative hash returns — no optimistic "Approved".
6. **Payload v2:** `schema_version`, real UTC `generated_at` (the current hardcoded date is a bug), engine git SHA, bundle/candidates/template hashes, stable column ids+types, `finding_key` embedded in every applicable row; `finding_key_map.json` included in `ui_export.zip`.
7. **Frontend:** score-context block on every NEW row (proposed indicator score, polarity, current zone-3 value, could-approval-change-score); bulk approve excludes blocked/warning/incomplete-proof/stale rows; fixture mode is a dev-only flag that fails production builds; mock dashboard/nav hidden as soon as `/review` is usable.
8. **Deployment:** `TRUST_X_FORWARDED_PROTO=1`; bootstrap fails on dependency-install failure (no `|| true`); code read-only — write access only for DB/logs/review artifacts/output dirs; engine data (3.1 GB) ships with a hash manifest + free-space check.

## Parallel ownership (Fable ∥ Sol — user directive)

| Track | Owner | Content | Target |
|---|---|---|---|
| **W1 Payload v2 + bundle fix** | **Fable** | Amendment #6 in the engine (payload versioning, real timestamps, git SHA, hashes, finding_key in rows, map into bundle) | tonight |
| **W2 Decision-file writers** | **Fable** | `engine/scripts/apply_decisions.py` (+ recall/zone3 writers): stdin batch → flock/validate/atomic-write/sha protocol of #5; the CLI Django calls — the engine owns its own file formats | tonight |
| **W3 Deploy hardening + worker unit** | **Fable** | Amendment #8 fixes; `clausechain-engine.service` + worker exec contract (allowlist file) | tonight |
| **D1 (revised)** | **Sol** | Three decision domains + `CorrectionRequest` + staged-review fields; snapshot ingestion; read APIs; decision endpoints that shell out to W2 CLIs; `run_engine_worker` management command consuming W3's contract | tonight |
| **D2–D3** | **Sol** | Data layer + Review & Approve with staged review + score context | **before 11:00 tomorrow** |
| **D4–D6** | **Sol** | Source Match, Runs/Submission, mock-nav removal | tomorrow |
| **PR review** | **Fable + user** | Every Sol PR against contracts; user hands-on per acceptance lists | continuous |

Cut order for the 11:00 session if time runs short: D4/D5 slip; the NEW+Recall+Zone-3 tabs with staged decisions and W2-backed writes cannot slip.
