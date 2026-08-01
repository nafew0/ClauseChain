# ClauseChain Round 2 — Live Pitch Plan

**Pitch slot:** 3 August 2026, 14:30 Bangkok / 13:30 Dhaka  
**Format:** 8-minute presentation + 7-minute Q&A  
**Target delivery:** 7 minutes 30 seconds, leaving 30 seconds of safety margin  
**Presenter and prototype operator:** Abu Naser Md. Nafew  
**Legal Q&A:** Md. Insaful Rahman Tusar

## Pitch strategy

ClauseChain will be presented as a working evidence engine, not as a slide-heavy software proposal. The audience already understands ESCAP's research problem. The pitch therefore spends only 30 seconds on framing and most of its time proving that the application can run the engine, surface exact legal evidence, block unsafe output, and preserve a reproducible audit trail.

### Opening — no more than 30 seconds

> ESCAP's challenge is not finding plausible law. It is producing an exact, current and reviewable RDTII row from fragmented official sources. ClauseChain turns that workflow into a reproducible proof chain. Let me show you the engine working.

Do not separately explain the size of the RDTII programme, portal fragmentation, OCR problems or the manual research lifecycle here. Those become answers or appendix material.

## Timed run of show

| Time | Surface | Presenter action | Judge takeaway |
|---|---|---|---|
| 0:00–0:30 | Opening slide | Deliver the combined problem and thesis | This is an evidence-assurance product, not a chatbot |
| 0:30–0:45 | Opening slide → hosted app | Explain that a real engine run will continue while the proof chain is demonstrated | The product is live and end-to-end |
| 0:45–1:05 | Runs | Queue a cached-corpus Singapore Pillar 6 run | The web app controls a real allowlisted engine worker |
| 1:05–1:35 | Source Acquisition / Extraction | Show immutable source metadata, extraction route and alignment facts | Official sources and document complexity are handled mechanically |
| 1:35–2:10 | Review queue | Open a preselected evidence row and identify its indicator, citation and review state | Findings are review subjects, not unqualified model answers |
| 2:10–4:05 | Source Match | Show official URL, archive hash, exact quotation, source context, hierarchy, status and alignment | Every exported row can be reproduced from its source |
| 4:05–4:45 | Blocked or rejected example | Show why incomplete proof/currentness/eligibility blocks approval | ClauseChain's value includes what it refuses to export |
| 4:45–5:35 | Review / Ledger | Show role-separated review and immutable receipt | Human accountability remains explicit |
| 5:35–6:20 | Runs | Return to the live action; show success, elapsed time, measured model cost and output hash | Execution is observable and auditable |
| 6:20–7:00 | RDTII Dataset | Show the frozen Round 1 artifact and one final row | The proof chain produces the required CSV/JSON contract |
| 7:00–7:30 | Closing slide | Explain configuration-driven expansion and deliver the close | ESCAP can adopt and extend it without trusting an opaque model |

If the live run has not completed by 5:35, show its real `running` state and switch to the already-imported completed envelope. Never wait silently for it.

## Three-slide core deck

### Slide 1 — Thesis

**A reproducible proof for every exported legal row.**

One visual chain only:

`Official source → structured provision → indicator mapping → mechanical gates → named approval → CSV/JSON`

### Slide 2 — What the demo proved

- Exact source characters, page or anchor and SHA-256.
- Evidence-backed legal currentness and corpus eligibility.
- Fail-closed verification before export.
- Role-separated human decisions and immutable receipts.
- Measured execution time and model cost.

This slide is shown only if a transition or live page load needs cover. It is not a lecture slide.

### Slide 3 — Closing

**Faster research without weaker legal accountability.**

> ClauseChain automates ESCAP's desk-research procedure, while keeping legal approval human and every output independently verifiable.

## Primary demo route

Use the hosted application at `https://clausechain.zai.bd/` with the presenter's superuser account.

Prepare these pages before joining Zoom:

1. Runs — Singapore, Pillar 6 selected.
2. Review — the chosen exact-proof row selected.
3. Source Match — the chosen row's proof already loaded.
4. Review — a known blocked/rejected row selected.
5. Ledger — the corresponding review receipt filtered.
6. RDTII Dataset — filtered to the chosen economy/indicator.
7. Backup completed run envelope.

The safest current proof example is the Singapore Personal Data Protection Regulations 2021, s. 12(1), mapped to P6-I4. It visibly carries an official SSO anchor, archived HTML hash, exact source characters, legal status and 100% anchor alignment.

Before rehearsal, evaluate whether a more distinctive approved NEW row has equally complete proof. Use it only if its final decision and frozen-artifact membership are visible in the hosted snapshot.

## Application remediation before demo freeze

### P0 — must fix

1. **Import the frozen Round 1 artifact.** The hosted application currently says no replayed final artifact is available, while the repository contains a 144-row replay artifact. Import the exact final CSV/JSON and their hashes into the immutable snapshot rather than reading unbundled production filesystem state.
2. **Separate submitted state from a fresh hosted review session.** The hosted Dashboard currently shows every queue at 0% and says sign-offs are pending. Display the frozen Round 1 submission status independently from any new review-session decisions. Never imply that the submitted file is unfinished merely because its historical decision rows were not loaded into the web database.
3. **Fix local auth bootstrap.** Local Next.js must proxy to `127.0.0.1:8000`, and the auth bootstrap must settle after its bounded timeout even when the proxy/backend is unavailable.
4. **Verify the production engine worker.** Run one supervised SG P6 smoke test before pitch day. Confirm queued → running → succeeded states, output hash capture, snapshot refresh and spend cap.
5. **Do not demo Knowledge Graph while parity is red.** Either repair and reimport a verified graph snapshot or omit the route from the live narrative.

### P1 — high-value pitch improvements

1. Add a persistent engine-action strip to the workspace shell: economy, pillar, status, elapsed time and a link back to Runs. It remains visible while the presenter navigates the proof chain.
2. Add a presenter-safe deep link or saved filter for the selected proof row and blocked example. This avoids searching while speaking without creating sample data.
3. Rename aggregate `warnings` in the run summary to `review signals`, with a split between blocking failures and advisory signals. A judge should not interpret 100 warnings as 100 corrupt rows.
4. Add a frozen-submission summary: final row count, NEW/KNOWN breakdown, artifact hashes and replay timestamp.
5. Keep pipeline routes available to authenticated non-superusers as promised by the D6-R acceptance contract.

### P2 — after the rehearsal is safe

1. Expose Thailand, India and Indonesia through the same allowlisted run UI only after their output contracts and runtime have been smoke-tested.
2. Rebind Source Library to the Round 2 jurisdiction packs.
3. Repair Neo4j parity and make the canned judge lens the default graph view; never open the 500-node overview during a timed pitch.

## Demo failure protocol

The live run is evidence of execution, not a dependency for completing the pitch.

- If queueing fails: state the visible failure and show the last immutable completed run envelope.
- If the worker remains running: continue the proof journey and show the running state at the return point.
- If the hosted application fails: switch to the local application.
- If both applications fail: play the short backup recording, then show the submitted CSV/JSON and repository.
- If screen sharing fails: place the exact submitted CSV/JSON in Zoom chat, as permitted by the pitching rules.
- Never rerun repeatedly or wait for a loading screen.

## Speaking and operating discipline

- Share the whole desktop so slide-to-browser switching remains visible.
- Disable notifications, updates and password-manager overlays.
- Use one browser window with ordered tabs and 100% zoom.
- Keep the mouse still while explaining legal text; highlight only the exact evidence being discussed.
- Narrate the judge's verification action: “You can click the official source, compare these characters, and verify the hash.”
- Do not read dense fields aloud. Explain why each field exists.
- Tusar answers legal interpretation, indicator scope and source-authority questions. Nafew answers system design, runtime, model/OCR routing, cost and failure behavior.

## Rehearsal gates

1. Full pitch finishes within 7:30 twice consecutively.
2. The live run is queued in under 20 seconds.
3. The chosen proof row opens directly with no search.
4. A blocked/rejected example is available without changing data.
5. The frozen final artifact is visible and truthfully labelled.
6. Hosted and local fallback flows have been tested from a logged-out browser.
7. Backup recording, submitted CSV/JSON, GitHub repository and deck are open before joining Zoom.
8. Tusar has the legal Q&A sheet and knows the exact showcased provision.

## Closing line

> ClauseChain does not ask ESCAP to trust an AI answer. It gives ESCAP a faster research workflow and a reproducible proof for every row it chooses to publish.
