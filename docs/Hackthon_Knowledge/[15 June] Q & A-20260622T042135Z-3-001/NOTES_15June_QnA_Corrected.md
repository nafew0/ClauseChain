# 15 June — Final Q&A Session (Corrected Notes)

**Sources:** (1) `Subtitle 15 june.srt` — full session, low-quality auto-transcription, corrected against context; (2) `meeting_saved_closed_caption.txt` — **high-accuracy, speaker-labelled captions, but only the LAST ~44 min (18:48–19:32)**. No slides. This was a live Q&A on emailed + live questions.

> **⚠️ Source-quality caveat (read this).** The accurate caption confirms only the **last ~44 minutes** (the technical/evaluation/submission Q&A). Everything BEFORE 18:48 — including the **runtime-environment answer (CPU / no-GPU / no-API-key)**, the additional-columns-for-Coverage discussion, Location-Reference-optional, NEW=provision-level, extra-countries-not-scored, the indicator crosswalk, and 6.5/7.5 — exists **only in the lower-quality SRT** and is NOT independently confirmed by the caption. Items below are tagged **[caption-confirmed]** or **[SRT-only — verify]** accordingly.

**Why this file matters:** the single most decision-relevant session — the organizers answered the exact rule/scope/evaluation questions we had open. Some answers **confirm** our design; a few **contradict** current ClauseChain choices — flagged **⚠️ PLANNING IMPACT**.

## Who answered (full names now confirmed from the accurate caption)
- **Nikita Shahu** — moderator, read the questions.
- **Juntong Hou** — ESCAP RDTII legal researcher; legal/research-process answers.
- **Witada Anukoonwattaka** — ESCAP, hackathon lead; scope, scoring, strategy. (The SRT's "Koonvitada / Dr. Vithada / Kunmitada / Datpong" all = her.)
- **Thanavit Anuwongpinit** & **Rattapoohm Parichatpreecha** — King Mongkut's Institute of Technology Ladkrabang (KMITL); the **technical judges** (evaluation environment, repo, interfaces).
  - ⚠️ **Correction:** **Rattapoohm Parichatpreecha ≠ Rathachai Chawuthai.** Earlier notes guessed they were the same person — they are NOT. Rathachai Chawuthai gave the 12-June "RAG and LLMs" talk; Rattapoohm Parichatpreecha is a separate KMITL judge here.
- **"Gunnuttara" / "Gunmita"** — answered indicator-crosswalk / scope questions in the EARLIER (un-captioned) part; this name is from the low-quality SRT and is **unconfirmed**.

---

## ⚠️ PLANNING IMPACT — the answers that CHANGE our plan

### 1. Cost-efficiency is scored; local/self-hosted preferred  ·  (CPU/no-API-key = SRT-only, verify)
> **[caption-confirmed] Witada Anukoonwattaka:** "we don't prohibit you from using third parties. But note that one of the evaluation criteria is **cost efficiencies**. If the third-party application [adds] to the cost, then that would affect … the evaluations." Later: "efficiencies, I mean, **productivity and cost efficiencies**."
> **[caption-confirmed] Thanavit Anuwongpinit:** "if you can … install [it] in your local repository or your server, and … save your cost, and the output [has good efficiency] … [that's] better for your [solution]."
> **[SRT-only — verify] Thanavit (early, un-captioned):** "…the standard CPU-based environment … should **not assume GPU or unrestricted internet** … **will not provide private API key** … must not include secret credentials in the repository." *(This passage is garbled and contradictory in the SRT and is NOT in the accurate caption — treat as a strong hint, not a confirmed rule.)*

**What this means for ClauseChain:**
- **Confirmed:** cost-efficiency *and* speed are scored criteria; running things locally/self-hosted "to save cost" is explicitly viewed as better. This alone is a strong reason to make the **default profile local/cheap**, not cloud `gpt-5.4-nano/mini`.
- **Still the right move, on cost grounds:** offer a **local/open, CPU-runnable default** (small Llama/Qwen via Ollama/llama.cpp + local embeddings), with cloud as an **opt-in** profile using the operator's *own* key. The original PRD's local-first stance holds.
- **Not yet confirmed:** the hard "CPU-only / no GPU / judges supply no API keys / no internet" constraints come **only from the garbled SRT**. ➡️ **Action: confirm these in the Q&A email before hard-committing the architecture to them.** (Cost-efficiency already justifies the local default regardless of the answer.)
- **No secrets in the repo** (SRT-only but low-risk and standard): ship `.env.example`, document setup. We already gitignore `.env`.

### 2. Extra COUNTRIES are NOT scored in Round 1 — extra PILLARS are
> **Dr. Witada:** "For round one … we score **additional pillar of the three designated countries**. If you got to round one and go to the next round, then **additional countries will come into the matrix** … I am not going to stop you from adding countries, but **we will not score them for now**. We will … look at your products with additional country in the next round."

**What this means (reprioritize our stretch ladder):**
- Round-1 scored bonus = **additional pillars (beyond 6 & 7) for SG/AU/MY**. So our **bonus pillar (P2 or P8) is the correct Round-1 stretch** — it earns points now.
- **Extra economies (the "2–3 Tier-A countries as proof") earn ZERO Round-1 points.** They only matter in the *next* round, and only if we advance. → Demote extra economies below the bonus pillar in Ring 1/2. Build the connector pattern (cheap proof of scale for the pitch), but don't spend scarce pre-20-July hours *scoring* extra countries.

### 3. CLI is NOT mandatory; UI is NOT required for Round 1 but IS required in the Final [caption-confirmed]
> **Thanavit Anuwongpinit:** "a command line interface, or CLI, is **not [mandatory]** … you may [provide] a CLI … live API, or notebook-based interface … it's up to your solution. But … you must combine everything into a single repository [GitHub] … that can read your README … and run your solution."
> **Witada Anukoonwattaka:** "the beautiful … user interface is **not required in this route, but it will be required in the final round**. So until then, you are free to do [whatever], documented in a structured way that **we can clone and replicate what you did to test**."

**What this means:**
- Our **CLI-first plan is still valid** (CLI is an accepted interface) — but it is *a choice, not a requirement*. This **supersedes our earlier "CLI mandatory" note (from 5 June).** Don't over-index on "must be CLI."
- **Don't over-invest in UI for Round 1** (not scored as a requirement) — but **plan the UI for the Final** (it becomes required). Our Next.js audit UI is the right finals investment; keep it out of the Round-1 critical path.
- The real bar: **clone → README → run end-to-end → produces output.** Reproducibility on a clean machine is the gate.

### 4. Additional columns ARE allowed (append after the 13) — resolves our open question
> **Gunnuttara:** "you can add **additional column append to the end of the matrix** … as long as the data is relevant." **Dr. Witada:** "you can add other columns for parameters important to the data collection process, e.g. **the translated text or coverage**."

**What this means:** our open §14 question ("can we add a Coverage column?") is answered **YES**. Append after the 13 template columns:
- `Coverage` (Horizontal/Sectoral) — we wanted this.
- `Verbatim Snippet (English)` — required when the source is non-English (see §Multilingual below).
- `Status` (in force / amended / repealed) — useful for the currentness story.
- Optional `HSN code` (only relevant to ICT-product pillars; not P6/P7).
- Keep the **13 required columns first, in exact order**; appended extras go after.

### 5. Smaller format corrections
- **`Location Reference` is OPTIONAL.** The xlsx mislabels it "REQUIRED"; Dr. Witada confirmed live: "location reference is always optional … I confirm that it is optional." (Our writer treats it as effectively required for quality — fine to keep filling it, but it's not a hard requirement.)
- **`Last Amended` granularity:** month + year preferred when available, else year alone. Juntong's preferred timeframe phrasing: *"Since [Month Year]; last amended [Month Year]."*
- **Final submission = ONE consolidated CSV/JSON**, not per-pillar files. Per-pillar (`P6.csv`, `P7.csv`) is fine *during development*; for submission, merge into one file "with the user in mind" (reviewers prefer a single file). Output usability is rewarded.
- **No resubmission after the deadline.** "Once they submit, we start reviewing … if they change, we will never end the process." Submit the final version; no updates after 20 July.

---

## ✅ CONFIRMATIONS — answers that DE-RISK our existing design (no change needed)

### NEW vs KNOWN is provision-level — even inside a known law (the 20-point lever, now official)
> **Q:** "If a statute appears in the sample kit, but a newly identified clause does not, should that row be classified as known or new?" **Gunnuttara: "New."** … "even if that particular law has been recorded by us, but the tool managed to record a new provision, we will still give it a **new** classification." **(Yes, confirmed.)**

This is the authoritative confirmation of our whole NEW-evidence strategy. Tag at **(instrument + article)** granularity; a new provision in a known law = NEW. Our KNOWN index (parsed from the master DB's Impact column) is built for exactly this.

### Evaluated against the FULL known evidence — find MORE, not less
> **Dr. Witada:** "We will test against the **full known evidence** … the object is you found **more than what we found, not less**."

→ Our eval harness must target **recall against the full master DB** for SG/AU/MY (not a subset). We already grade against `data/known_index.json`; make sure it covers every master P6/P7 row, and treat near-total KNOWN recall as the floor before chasing NEW.

### Indicator codes: P6-I1 = 6.1 (1:1); prefer RDTII framework naming, template codes also accepted
> **Gunnuttara:** "P6 means Pillar 6 and i1 means indicator 1 … refer to P6-I1 as 6.1 … Our preference would be follow the official RDTII 2.1 framework documentation. But if you use P6-I1 as per the template … and call the indicator description correctly, you will **not be penalised**."

Confirms our mapping. Emit `P6-I1…P7-I5` with correct descriptions; no crosswalk needed.

### 7.5 is mandatory & regulatory; 6.5 is out of scope
> **Gunnuttara:** "Indicator **7.5 is not optional. It's mandatory** … For **6.5 we deliberately took it out** from the data template because 6.5 is about being members of agreements that have binding data flow … not advised … to include 6.5."

Exactly our design: extract 9 regulatory indicators (P6-I1…I4 + P7-I1…I5); skip 6.5 (treaty-sourced, non-regulatory).

### 7.5 search must go BEYOND the privacy law
> **Juntong:** "you need to extend because we want our database to be as comprehensive as possible … government access [to] personal data … also refers to the criminal law or criminal procedure law … as long as you can find the provisions … that is related with 7.5 … you should record it."

Confirms our P7-I5 hunting strategy (criminal procedure, surveillance, telecom, national security) — and this is our richest NEW-evidence vein.

### "No evidence found" → record it explicitly, never leave blank
> **Dr. Witada:** "put a mark of **no evidence, no provision found** … if you leave it empty, we don't know what it means." **Nikita:** record "the absence of a law … it shows that you have looked over, [rather than] just leaving it empty."

Confirms our score-0 / "cite the general governing law + mark no-provision" path.

### Repealed laws: don't record; if you do, you MUST mark them repealed
> **Dr. Witada:** "we record only **active laws** … if they record a repealed law and **don't say it is repealed, it … becomes wrong evidence — you will be penalised** … if you keep it, put it clear in the notes or as an additional status column."

→ Our G5 currentness gate + a `Status` column. A repealed law cited as current = scored wrong. This is a penalty trap; the gate matters.

### Document-by-document testing + a human-verification stage
> **Dr. Witada:** "we will have to do the **document-by-document testing** because we will test whether your specified URL really exists and is active, whether the referred document really exists, and whether your interpretation is correct based on the indicator criteria … document mode … to facilitate human-in-loop is **preferred** … [but] your tool has to prove it is **end-to-end automation** after you have passed through the process of human verification."

→ Every row must be **independently verifiable**: live URL + the document actually contains the snippet + the mapping is defensible. This is precisely our gate stack (G1 existence, G2 verbatim, G4 URL-alive) + the audit trail. Support both a clean automated batch run **and** a per-document human-review view. (Our Review UI is the finals answer; for Round 1, the JSON audit fields + verbatim snippets carry it.)

### Multilingual handling (matters in later rounds, not SG/AU/MY)
> **Juntong:** "prioritise the **native-language version** because it's the most updated … take the English version as a reference … record both." **Verbatim snippet** = exact quote from the official document. If no official English exists, **quote the original language** and **add a `Verbatim English` column** after the 13. If the country has an official English version, the verbatim may come from that.

→ For Round 1 (all English) this is moot, but bake it in now: store original + translation, flag translation/bilingual source in `Notes`. Finals economies (Thailand, China, Lao, etc.) need it.

### Nested laws (act + sub-regulation) — refinement of "one row per provision" [caption-confirmed]
A team asked about a provision at the **Act level** plus a more detailed provision in a **regulation under it** (their example: an Indonesian health law + its implementing regulation). **Juntong Hou:** the manual RDTII DB records both the upper and lower hierarchy *in the same entry*, but **for the output template, keep it clean — one entry per provision**, and **use the Notes column to explain the cross-reference and the hierarchy** between the two. **Witada:** document them in separate rows **next to each other**, with Notes explaining they work together. → For us: one (provision × indicator) row each, linked via Notes / a cross-reference field; our graph's `cross-references` edge captures the relationship.

### Web search: official API vs third-party vs direct scraping [caption-confirmed]
**Witada:** no prohibition on third-party search/APIs, **but cost-efficiency is a scored criterion** — paid third-party services that add cost hurt the score. **Thanavit:** prefer something you can **install/run locally to save cost** with good output. → Reinforces §1: lean on direct official-portal crawling + local processing; treat paid search/APIs as opt-in, cost-aware.

### Other confirmations
- **Blocked government sites** are rare for SG/AU/MY ("pretty well organised"). Fallback chain: ministerial sites → secondary sources (law-firm/academic) recorded **in the Notes column only**, never as primary evidence. (We archive-first anyway.)
- **Ingesting PDFs into a vector DB** for retrieval is expected (refers to the 12 June RAG talk). **Plus:** build a way to **track/monitor new documents** released after initial ingest (laws get amended/repealed). Dr. Witada: "have a system that can track, monitor any new documents … there might be additional evidence released." → ongoing-update capability is valued (a finals differentiator).
- **Any framework/tool is allowed** (even an "Anthropic legal plugin") "as long as you build it in [an architecture] … flexible to be swapped between modules." → confirms modular/swappable is rewarded.
- **OCR CER without ground truth:** judges trace your provided URL → original document and compare against your extracted text; you flag OCR issues in Notes. So we don't need a separate ground-truth set to *report* CER, but we must keep the scanned input + extracted text so it's checkable.
- **One provision → multiple indicators** = one row **per indicator** (provision×indicator rows). **One indicator ← multiple provisions** that form "one measure": keep the *output* clean (one provision per row); use Notes for cross-references. (Semicolon-packing was only for the manual DB, not our output.)
- **Speed is scored** ("as fast as you can … we'll see who is fastest and more accurate, more evidence").

---

## Logistics (lock these into the plan)
- **Deadline: 20 July 2026, Bangkok time.** 4 deliverables uploaded by then (functional prototype repo, structured output file, technical pitch deck, ≤10-min screen-recording video). 5th deliverable = live demo on **3 Aug** for the 20 shortlisted.
- **Submission = a single online form** (the same form used to register/apply). [caption-confirmed] The **submission-portal link is emailed to each team's head ~28 June** ("next week" from the 15-June session) — **not** at the deadline. Watch that inbox around 28 June.
- **31 July** → 20 shortlisted announced. **3 Aug** → live pitch + interview (working prototype shown live). **5 Aug** → 5 finalists → **Bangkok finale**.
- **Resubmission allowed up to the deadline, NOT after** [caption-confirmed]: "once they submit, we start reviewing it; if they change, we never end the process." So you may re-upload until 20 July; after that it's frozen.
- Final closing advice repeated by all judges: **"design with the target user (reviewer/researcher) in mind"** — output usability and reviewability directly affect the score, especially in the final round.

---

## One-line corrections of the worst transcription garbles
"RDTIF/IDTR/RDTI" → **RDTII** · "Koonvitada / Kunvitada / Dr. Vithada / Koonmata" → **Dr. Witada** · "Gunmita" → **Gunnuttara** · "Ajahn Thanavit / Thanavik / Tanavit" → **Ajahn Thanavit (KMITL)** · "Ajahn Ratapoom / Ratpum / Ratashai / Dattakum" → **Ajahn Ratapoom / Rathachai (KMITL)** · "Juntung / Jungdong / Junta" → **Juntong** · "PLA6" → **Pillar 6** · "node column" → **notes column** · "sexual law" → **sectoral law** · "tab line column" → **timeframe column** · "MDFI / MD five / doctor email file" → **README / .md file** · "the SCAN" → **ESCAP** · "Liza video" → **the [submitted] video** · "straight case" → **stress test/test case** · "20 June" (closing slip) → speaker corrected to **20 July**.
