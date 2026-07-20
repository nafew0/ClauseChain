# ClauseChain — Judge-Style Demo Runbook (≤10-min recording)

The 10-minute limit counts **runtime, not setup** (15-Jun ruling). Do Scene 0 before
recording; start the clock at Scene 1. Timings measured on the 20 Jul corpus.

---

## Scene 0 — Setup (BEFORE recording)

```bash
git clone https://github.com/nafew0/clausechain-escap.git
cd clausechain-escap/engine
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Corpus: download clausechain_corpus_sqlite.zip from the repo's Releases page
unzip ~/Downloads/clausechain_corpus_sqlite.zip -d data/

cp .env.example .env       # put your OPENAI_API_KEY (or use --provider-profile local_fallback)
```

Also pre-open in browser tabs: the GitHub repo page, the web console login, and
`sso.agc.gov.sg` (to show a citation resolving on the official portal at the end).

---

## Scene 1 (0:00–0:45) — “This is what a judge clones”

```bash
ls            # engine layout: run.py, packages/, configs/, scripts/, tests/
cat configs/rdtii/pillar_6.yaml | head -40    # rubric-as-code: the indicator IS data
```

Say: *“No statute, no section, no answer is hard-coded — indicators, grammars and
targets are all data. Watch it run.”*

## Scene 2 (0:45–1:45) — Scanned-PDF processing (deliverable requirement)

```bash
python - <<'PY'
from packages.core.envfile import load_env_file; load_env_file()
from packages.extractors.pdf import extract_pdf
pages = extract_pdf("data/raw/my/seed_9da036eb7b5f.pdf")   # P.U.(B) 522/2024 gazette
for p in pages[:2]:
    print(f"page {p.page_number} | extraction={p.metadata.get('extraction')} "
          f"| confidence={p.confidence}")
    print(p.text[:300], "…\n")
PY
```

Say: *“The router detects a missing text layer, sends the page through OCR, and
keeps per-page confidence — which travels into review as a risk flag.”*
(Any scanned gazette in `data/raw/my/` works; pick one showing `extraction=ocr_*`.)

## Scene 3 (1:45–8:00) — One full live run

```bash
python run.py --economy Malaysia --pillar 6 --out outputs/judge_demo
```

~6.3 minutes live. While it runs, narrate the stages as they print:
retrieval → screen → mapping → gates → NEW/KNOWN. When it finishes:

```bash
head -3 outputs/judge_demo/output.csv        # template-exact columns
python - <<'PY'
import json; env = json.load(open("outputs/judge_demo/output.json"))
row = next(f for f in env["findings"] if f["discovery_tag"] == "NEW")
print(row["law_name"], "|", row["article_section"])
print("snippet:", row["verbatim_snippet"][:160])
print("proof sha256:", (row.get("citation_proof") or {}).get("source_sha256", "")[:16])
print("gates:", [g["gate_id"] + ":" + g["status"] for g in (row.get("citation_proof") or {}).get("gate_results", [])])
PY
```

Open the row's `source_url` in the browser and Ctrl-F the snippet on the official
portal — *“byte-exact, verifiable in seconds.”*

## Scene 4 (8:00–9:00) — Integrity checks a judge can run

```bash
python scripts/validate_graph.py          # 53,969 provisions, artifact hashes: PASS
python scripts/champion_validate.py       # readiness contract (names every failure)
python -m pytest tests/ -q | tail -1      # full suite
```

## Scene 5 (9:00–10:00) — Web console + reproducibility

Browser: log in to the console →
1. **Runs** — trigger a run from the UI (same engine, admin-gated allowlist)
2. **Review** — a NEW finding with source context, gate results, refuter verdict;
   named role-separated sign-off
3. **Submission** — the consolidated file + content-hashed decision bundles
4. Close on the terminal:

```bash
python scripts/submission_replay.py       # approvals -> identical final CSV/JSON
```

Say: *“Run it twice — identical bytes. The submission is a replayable proof, not a
one-off generation.”*

---

## Fallbacks during recording

- Network blip mid-run → runs are per-indicator resilient; re-running reuses the
  embedding cache (a rerun costs ≈$0.10 and picks up almost instantly).
- Keep `outputs/final_*` from a prior sweep as a safety net: you can walk Scene 3's
  output inspection on those files if the live run misbehaves.
- Cost meter after the run: `cat logs/cost_report.json | python -m json.tool | head -20`
