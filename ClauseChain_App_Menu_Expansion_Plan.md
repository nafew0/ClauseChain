# ClauseChain App Menu Expansion Plan — every remaining screen, tiered

**Decision (19 Jul, user):** keep ALL existing screens/menus — nothing is deleted. Screens whose actions aren't safe yet ship **read-only with actions blocked** and a chip: **“Editing available soon.”** These screens raise presentation value; blocked-but-designed beats absent.

**Honesty adaptation of G2 (replaces the “hide by 02:30” rule):** a screen may stay visible in one of exactly three states — (a) **LIVE** (bound to real engine data), (b) **READ-ONLY** (real data, actions disabled with the “available soon” chip), or (c) **PROTOTYPE** (still mock-bound, but carrying a permanent, unmissable `PROTOTYPE — SAMPLE DATA` badge on the page header and every data card). No mock screen may render without the badge. Judges may see (c) only as a labeled design preview, never as a claim.

## Tier legend
- **T0** tonight (pre-11:00 session) · **T1** time-permitting before submission · **T2** post-submission, pre-finals (3 Aug) · **T3** future/product

## Menu-by-menu

| Menu | Target state | Data source | Tier | Notes |
|---|---|---|---|---|
| Dashboard | LIVE | `/summary/` (decision progress, champion gate, snapshot, runs) | **T0** | Replace mock KPIs; this is the landing page at 11:00 |
| Review (new) | LIVE | done (D3) | ✅ | — |
| Source Match (new) | LIVE | proof assets + C4 (D4) | **T0** | in flight |
| Runs (new, replaces Mapping Run) | LIVE | envelopes + cost (D5) | **T0/T1** | Mapping Run menu item points here; old streaming view retired |
| Submission (new, replaces Export Output) | LIVE | consolidated + release states (D5) | **T1** | Export Output menu points here |
| Crawl Console → “Source Acquisition” | LIVE | `ops_stats.json .acquisition` (W4) | **T1** | keep layout; real 45 artifacts; null-economy rows under “Cross-economy” |
| Harvest Review → “Corpus Eligibility” | LIVE | `ops_stats.json .eligibility` | **T1** | quarantine reasons = the MY status-facts story |
| Extraction | LIVE | `ops_stats.json .extraction` | **T1** | methods/alignment/OCR-confidence per act |
| Ledger | LIVE | Django decision history + writer receipts + bundle manifests | **T1** | the real ledger beats the mock; hash chain = receipts |
| Evidence Audit | READ-ONLY → LIVE | consolidated row + hierarchy metadata + gates (three-pane) | **T2** | until rebound: PROTOTYPE badge |
| Source Status (graph) | READ-ONLY | source artifacts + status facts + amendment edges | **T2** | force layout from real nodes; until then PROTOTYPE badge |
| Benchmark | LIVE | champion_validation + cost_report + recall stats | **T1/T2** | real bars; targets from Dev Plan |
| RDTII Matrix | LIVE | zone-3 + review states + coverage per indicator | **T2** | cell → drilldown to Review rows |
| Source Library / Jurisdictions | READ-ONLY | jurisdiction YAMLs + corpus stats | **T1** | becomes the config-viewer entry point (below) |

## Config screens (the “form-for-YAML” request)

**Pattern (all config screens):** schema-driven form rendered FROM the file; every field editable-looking but **save disabled** with “Editing available soon”; a read-only *“YAML this form represents”* panel underneath (proves the config-driven architecture to judges). Mission-critical files are hard-blocked server-side too — there is no write endpoint at all until D7.

| Screen | File(s) | Tier |
|---|---|---|
| Jurisdiction packs (per economy) | `configs/jurisdictions/{sg,my,au}.yaml` — portals, corpus acts, status facts, gold aliases, governing instruments | **T1 read-only**, T2 editable |
| Seeds | `data/seeds.json` per economy | **T1 read-only**, T2 editable |
| Indicator rubric | `configs/rdtii/pillar_{6,7}.yaml` | T2 read-only, T3 editable (rubric edits = legal authority question) |
| Models/profiles | `configs/models.yaml` (Path A/B swap shown as a form) | T2 read-only |

**D7 (editable, post-submission):** every write goes through an engine-owned validating CLI (same pattern as `apply_decisions.py`): JSON-schema validation → atomic write → corpus-fingerprint invalidation surfaced in the UI (“engine outputs are now stale — resweep required”) → git commit of the config change. “Add a jurisdiction” wizard = the finals Scalability demo.

## Engine database decision (19 Jul, user): PostgreSQL

Accepted with one **non-negotiable boundary**: the **clone-default stays SQLite forever**, because the judges’ eval sandbox is offline/no-services and Path A (`clone → run`, zero infra) is a scored submission requirement. Postgres is not a replacement; it is a **second GraphStore backend** for the server, where the engine and app share one database server.

- **D8 (T2):** implement `PostgresGraphStore` behind the existing `GraphStore` protocol; select via `GRAPH_BACKEND=postgres` + `DATABASE_URL`; migration command copies nodes/edges/FTS (→ tsvector) + source_artifacts from the SQLite files; engine tests run against both backends in CI. App tables and engine tables live in separate schemas (`app.*`, `engine.*`); decisions remain **file-authoritative** regardless of backend (G1 unchanged — Postgres holds mirrors and audit history, files hold truth).
- Until D8 lands, the server runs the engine on its SQLite files exactly as today. Nothing about tonight changes.

## Submission engine: NO folder copy

Do **not** copy/rename the engine folder for a “CLI-only” submission. A fork means every fix tonight must be applied twice and the copies WILL drift in the worst 48 hours to drift. The engine already IS CLI-first; the app consumes it via subprocess without modifying it (G5 held all sprint). The submission artifact is a **git tag** (`round1-submission`) + `git archive` export — reproducible, secret-free, and identical to what runs on the server. If judges must see a lean tree, the archive can exclude `frontend/ backend/ deploy/` via `.gitattributes export-ignore` — same repo, zero drift.
