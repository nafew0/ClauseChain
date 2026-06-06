# ClauseChain — Legal Matching Do & Don't Playbook

**The "100% rubric" for substantive accuracy (40% of the score). This is the legal-reasoning knowledge layer that grounds our prompts, rubric-as-code, verification gates, and eval.**

| Field | Value |
|---|---|
| Companion to | `ClauseChain_Round1_Build_Guide.md` (architecture), `ClauseChain_PRD_Application.md` |
| Source of truth | RDTII 2.1 Guide + internal guide + the 1/4/5 June workshop worked examples (Juntong, Nikita) |
| Scope | Pillars 6 & 7 (P6-I1…I4 + P7-I1…I5). `P6-I5`=6.5 is non-regulatory — not extracted. |
| How to use | §13 example bank → few-shot prompt examples · §3–§9 rules → system-prompt rules + `pillar_*.yaml` exclusions · §12 checklist → verification gates + eval |

> **Mental model.** Every output row answers one question: *"Does this exact, current, official, domestic legal provision satisfy this RDTII indicator's legal test — and can a lawyer verify it from the citation in seconds?"* Each DO/DON'T below removes one way that answer goes wrong.

---

## 1. The seven golden rules (memorize these)

1. **DO map on legal *function*, not keywords.** A clause about "transfer" may be a conditional regime (6.4), not a ban (6.1). Keyword overlap ≠ correct mapping.
2. **DO cite current, in-force law only.** Drafts, bills, consultations, repealed/canceled/superseded text → never as current evidence.
3. **DO quote verbatim from a source that actually contains the quote.** If the span isn't in the document, it's a hallucination — reject.
4. **DO use official, domestic, primary sources.** International agreements and secondary sources (news, law-firm notes, Wikipedia) are not the legal basis for P6/P7.
5. **DO record sectoral instruments too** — even when a horizontal law exists. "Recorded" ≠ "controlling evidence."
6. **DO output one row per (provision × indicator)** — a single clause can satisfy several indicators; they are not mutually exclusive.
7. **DO handle the NO.** Proving *absence* of a measure (score 0) requires searching the whole universe; then cite the general governing law as the reference basis — never leave an indicator silently blank.

---

## 2. The indicator legal tests (what each one actually asks)

`P6-I1…P7-I5` **are** the RDTII methodology indicators 1:1. Map to the **legal test**, not the label.

| Code | Indicator | The legal test (does the provision…) |
|---|---|---|
| P6-I1 | 6.1 Ban & local processing | …**ban** cross-border transfer, **or** mandate **local processing**? |
| P6-I2 | 6.2 Local storage | …require a **copy stored domestically**? (transfer may still be allowed) |
| P6-I3 | 6.3 Infrastructure | …require **local servers / data centres / infrastructure** to provide the service? |
| P6-I4 | 6.4 Conditional flow | …**allow transfer if conditions are met** (consent / adequacy / safeguards / approval)? |
| P7-I1 | 7.1 Comprehensive DP framework | …establish a **horizontal personal-data-protection** regime? (sectoral DP laws recorded too) |
| P7-I2 | 7.2 Dedicated cybersecurity framework | …form a law **specifically for cybersecurity** (not scattered security clauses)? |
| P7-I3 | 7.3 Minimum retention | …require keeping data **for at least a set period**? |
| P7-I4 | 7.4 DPIA / DPO | …require **appointing a DPO and/or running a DPIA**? |
| P7-I5 | 7.5 Government access | …**enable/require government access** to personal data? |

---

## 3. Source selection & authority

**DO**
- Use **primary official instruments** with legal effect: Acts/Statutes/Codes, regulations, decrees, orders, notifications, and codes/guidelines *that are mandated by law*. These are recorded **and** scored.
- Use the **official government portal** as the `Source URL` (e.g. `sso.agc.gov.sg`, `legislation.gov.au`, `lom.agc.gov.my`, `pdp.gov.my`).
- **Record sectoral instruments** (e.g. a financial-sector cyber notice) even when a horizontal law exists — tag whether it is *controlling evidence* or *context*.
- Treat the legal **hierarchy** by instrument type/authority (Constitution > Act > subsidiary regulation > administrative instrument; case law where the system is common-law/mixed).

**DON'T**
- ❌ Use **secondary sources** (news, law-firm articles, Wikipedia, commentary) as the legal basis. They are *leads only* → use them to find the primary source; if kept, put them in `Notes`. *(Exception: indicators 3.4/5.3/9.1 permit de-facto/secondary evidence — out of P6/P7 scope.)*
- ❌ Record an **international agreement** (CPTPP, RCEP, FTAs) as a domestic measure. *(Only the non-regulatory 6.5 concerns treaty membership, and we don't extract it.)*
- ❌ Cite Google, a search page, or a third-party database as the `Source URL`. *(A third-party host is acceptable only as an archived-copy fallback when the official link is dead — still name the official instrument.)*
- ❌ Assume "Act > regulation" decides relevance, or that **horizontal > sectoral**. Coverage ≠ rank; controlling-evidence is decided case-by-case.

---

## 4. Currentness & in-force status (the #1 scored failure)

**DO**
- Verify in-force in three steps: **(a)** adopted, signed, **published**; **(b)** **effective date** reached ("enters into force on…", "effective from…"); **(c)** still current — **not repealed / amended-away / superseded**.
- Find and cite the **latest** version/amendment. Fill `Timeframe` as *"Since [Mon Year] → Last amended [Mon Year]."*
- Confirm the **URL resolves live** before shipping the row.

**DON'T**
- ❌ Cite a **draft / bill / consultation paper** as current law (e.g. *India draft Digital Personal Data Protection Rules 2025*, in public consultation).
- ❌ Cite a **repealed** instrument (e.g. *Directive 95/46/EC*, repealed by GDPR 2018).
- ❌ Cite a **canceled/superseded** notice (the Assignment-1 trap: *MAS Notice on Cyber Hygiene 2019* was canceled 1 Jul 2022 → replaced by **FSM-N16**; record the current one).
- ❌ Ship a row with a **broken URL** — that alone makes the output incorrect.

---

## 5. Reading & extracting the provision

**DO**
- Extract the **operative clause** — the actual rule text — plus the surrounding section (text before/after) for context.
- Capture the **predicate tuple**: *who* is regulated · *what* is required/prohibited · to *what* data/service/sector · under *what* conditions · with *what* exceptions.
- Read **modality precisely**: `must / shall` (mandatory) vs `may / can` (permissive) vs `should` (recommended), and their negations.
- Follow **definitions, thresholds, exemptions, implementing rules, and Schedules** — exceptions and carve-outs frequently live in a Schedule, not inline.
- Watch the connectors that change legal effect: *unless · except that · provided that · subject to · notwithstanding · only if · to the extent · no later than*.

**DON'T**
- ❌ Record only the **law title** or a **summary/paraphrase** as the finding.
- ❌ Ignore an **exception** that converts a "ban" into a "conditional regime" (rule-and-exception is one composite rule).
- ❌ Treat a permissive `may` as a mandatory `shall`, or miss a negation ("shall **not**").
- ❌ Misread a non-Gregorian date (e.g. Thai Buddhist year **B.E. 2562 = 2019**).

---

## 6. Indicator mapping — disambiguation pairs (this is where points are won)

These are the exact confusions the RDTII team flagged. Encode each as a `pillar_*.yaml` exclusion + a few-shot pair.

| Confusion | DO | DON'T |
|---|---|---|
| **6.1 ban vs 6.4 conditional flow** | If transfer is **allowed when conditions are met** (consent/adequacy/safeguards/approval) → **6.4**. Only call it **6.1** for an outright ban or mandatory local processing with no transfer path. | ❌ Mis-code a transfer *limitation/condition* as a total **ban**. (SG PDPA s.26 "shall not transfer … unless …" = **6.4**, not 6.1.) |
| **6.2 local storage vs 6.3 infrastructure** | A **copy must be stored** in-country → **6.2**. **Local servers/data-centres/infrastructure** required to operate → **6.3**. | ❌ Call a storage rule an infrastructure rule. (Kazakhstan "database located in the territory" = **6.2**; China ride-hailing "servers within Mainland China" = **6.3**.) |
| **6.2 local storage vs 6.1 ban** | 6.2 **does not** forbid transfer — data may still move if a local copy remains. | ❌ Treat a local-storage rule as a transfer ban. |
| **6.x (Pillar 6) vs 7.2 cybersecurity** | Encryption, access control, network segmentation, crypto-key management → **7.2 cybersecurity**. | ❌ Map cybersecurity/network rules to data-localization (6.3) or storage (6.2). (Bhutan Code of Practice ss.9.8–9.16 = **7.2**.) |
| **7.1 comprehensive vs 7.2 cybersecurity** | 7.1 = personal-data-protection regime; 7.2 = cybersecurity regime. They are different pillars-of-concern. | ❌ Use a cybersecurity notice to answer "is there a data-protection framework?" |
| **7.3 minimum retention (direction matters)** | Only a **"keep ≥ X period"** rule is **7.3**. | ❌ Map **"do not keep longer than necessary"** to 7.3 — that's data-minimisation, the opposite. |
| **7.5 government access (look wide)** | Search **beyond privacy law**: criminal procedure, surveillance, lawful-access, national-security, telecom. | ❌ Limit the 7.5 search to the data-protection act. (SG Criminal Procedure Code s.39 = **7.5**.) |

**Also DO / DON'T for mapping:**
- **DO** emit **multiple rows** when one provision satisfies multiple indicators (not mutually exclusive).
- **DO** output `not_applicable` / abstain when the legal test isn't met, rather than forcing a mapping.
- **DON'T** invent indicator codes outside the framework (no `P6-I6`, no renamed codes) — a flagged hallucination mode.
- **DON'T** let a high semantic-relevance score substitute for the legal test (a Banking Act **confidentiality** duty is **not** a localization/transfer ban — it's a general duty of confidentiality).

---

## 7. Coverage (Horizontal vs Sectoral)

**DO** classify every row: **Horizontal** (applies across all sectors) or **Sectoral** (name the sector/data category — e.g. "Financial sector", "Telecom", "Health", "Accounting records"). Coverage drives indicator **scope and scoring**.
**DON'T** equate coverage with hierarchy — a sectoral Act and a horizontal Act can sit at the same legal rank and score the same.

---

## 8. Citation fidelity (the audit-trail rules)

**DO**
- Copy the quote **verbatim** (no edits, no summarising).
- Give the **exact article + paragraph**: `s. 26(1)`, `Art. 26(2)`, `s. 16(1)(a)`.
- Give the **location**: PDF page number / HTML anchor; plus the official `Source URL`, source hash, and an **archived copy + access date**.
- Write the `Mapping Rationale` on legal **function**: *"This [section] [prohibits/requires/permits/establishes] [what]. Maps to [indicator] because [1-sentence legal logic]."* (≤300 chars).

**DON'T**
- ❌ **Paraphrase** the snippet (un-auditable → point deduction).
- ❌ Cite a section/subsection that **doesn't exist** in the source (e.g. claiming "IT Act 2000 s.70B(1)/(4)" when those subsections aren't there).
- ❌ Write a **bare** `Art. 26` without the paragraph.
- ❌ Put the rationale's job onto the snippet, or restate the snippet as the rationale.

---

## 9. Scoring (Zone 3) & "fighting the NO"

**DO**
- Read the **score as regulatory complexity / compliance cost**, *not* a value judgment. Higher (→1) = more restrictive/costly; 0 = low cost / absence of the measure.
- Apply each indicator's **specific 1 / 0.5 / 0 criteria** from the Guide.
- For **score 0 / "no measure"**: search the whole universe to be sure, then **cite the general governing law as the reference basis** and explain the absence in `Impact`.
- Read the **discrimination type** precisely: a preference for a *domestic subgroup* (e.g. Bumiputera) that also excludes *other domestic* firms is not solely a *foreign* exclusion.

**DON'T**
- ❌ Leave a score-0 entry **blank** (record the general law instead).
- ❌ Let the **score contradict the explanation** (e.g. score 0 while the text clearly imposes a restriction → should be ≥ 0.5/1).
- ❌ Treat "fighting the NO" as easy — absence is *harder* to prove than presence; budget search effort accordingly.

---

## 10. NEW vs KNOWN discovery (the 20-point lever)

**DO**
- Tag at **(instrument + article)** granularity. A **new provision inside an already-recorded law** counts as **NEW** (the RDTII DB often recorded only the law name or the first relevant clause).
- Maximise **recall** — surface relevant provisions, exceptions, and sectoral instruments humans missed.
- Run every NEW candidate through the **full gate stack** before tagging it.

**DON'T**
- ❌ Tag a row **NEW** unless it passes verification — a false NEW costs more than a miss.
- ❌ Restrict discovery to the seed URLs we were given — autonomous discovery beyond them is explicitly rewarded.

---

## 11. Country-specific context

**DO** apply the economy's legal system and context: civil vs common vs mixed (where case law counts), local calendar/date formats, and whether the conduct is even in scope.
**DON'T** record something the indicator excludes by context — e.g. SG blocks unauthorised **remote gambling**, but gambling is **already illegal** there, so it isn't "commercial web content" and creates no digital-trade burden (indicator 9.1). Right fact, wrong scope.

---

## 12. Per-row quality-control checklist (gate-able before export)

Encode these as automated gates; a row ships only when all pass (else → review/reject):

1. **Indicator & scope** correct under the Guide? *(maps to G7)*
2. **Source official, current, in force?** (not draft/repealed/superseded; URL resolves) *(G3, G4)*
3. **Exact operative provision** captured (not just the title)? *(G5)*
4. **Verbatim quote exists** in the extracted source? *(G1)*
5. **Article + paragraph + page/anchor** resolve to the quote? *(G2)*
6. **Main rule separated** from its exceptions / approvals / thresholds? *(G5/G6)*
7. **Coverage** (Horizontal/Sectoral) set; **domestic primary** source?
8. **Counter-evidence** checked (amendment/repeal/superseding text)? *(G8)*
9. If **no restriction** found, general governing law cited as reference basis (score 0)?
10. **NEW/KNOWN** tag correct at (instrument+article) level?

---

## 13. Worked example bank (few-shot ground truth)

Drop these into prompts as labeled examples. ✅ = correct mapping; ❌ = the error and why.

### ✅ Correct mappings
| # | Provision | Maps to | Why |
|---|---|---|---|
| C1 | SG PDPA 2012 **s.26(1)** — "shall not transfer … **unless** … comparable-protection requirements" | **P6-I4** (6.4 conditional flow) | Transfer stays possible once conditions are met → conditional regime, **not** a ban. |
| C2 | Korea — financial cloud must **process** credit/ID data **locally** | **P6-I1** (6.1 local processing) | Mandatory local processing. |
| C3 | Türkiye — large social networks **store** user data **in-country** | **P6-I2** (6.2 local storage) | A domestic copy is required; transfer not necessarily banned. |
| C4 | China online ride-hailing Art.5 — **servers within Mainland China** + data | **P6-I3** (6.3 infrastructure) | Local physical infrastructure as a condition of service. |
| C5 | Armenia DP Law 2015 Art.27 — transfer by **consent**, or to **adequate** states | **P6-I4** (6.4 conditional flow) | Permitted subject to consent/adequacy. |
| C6 | Kazakhstan Law 94-V Art.12(2) — data **stored in a database located in** Kazakhstan | **P6-I2** (6.2 local storage) | Domestic storage obligation. |
| C7 | SG Cybersecurity Act 2018 (horizontal) | **P7-I2** (7.2 dedicated cybersecurity) | A dedicated cybersecurity framework exists → low score; this is the controlling evidence. |
| C8 | Bhutan Code of Practice 2024 ss.9.12/9.16 — **encryption, crypto-key** lifecycle, remote-access controls | **P7-I2** (7.2 cybersecurity) | Cybersecurity obligations — **not** 6.3 infrastructure / 6.2 storage. |
| C9 | India DPDP Act 2023 **s.10** — Significant Data Fiduciary must appoint **DPO** + run **DPIA** + audit | **P7-I4** (7.4 DPIA/DPO) | DPO + DPIA obligations. |
| C10 | SG Criminal Procedure Code 2010 **s.39** — police may access/search/**copy** computer data | **P7-I5** (7.5 government access) | Law-enforcement access power — found *outside* the privacy act. |
| C11 | Bangladesh — e-commerce transaction data **retained 6 years** | **P7-I3** (7.3 minimum retention) | Keep-for-≥-period rule. |

### ❌ Incorrect outputs (and the reason)
| # | Output | Why it's wrong |
|---|---|---|
| W1 | "Indicator 7.2: MAS Notice on Cyber Hygiene (2019)" | **Outdated + broken URL**: the notice was canceled 1 Jul 2022 (→ FSM-N16) and the URL 404s. (Sectoral notices *are* recordable — that's **not** the error; record the current FSM-N16; the controlling evidence for 7.2 is the Cybersecurity Act 2018.) |
| W2 | "IT Act 2000 s.70B(1) and (4) provides…" | **Hallucination / wrong retrieval** — those subsections do not appear in the cited act. Fails G1. |
| W3 | Indicator 9.1: SG blocks remote-gambling sites (Gambling Control Act 2022) | **Out of scope by context** — gambling is already illegal in SG, so it's not commercial web content and creates no digital-trade burden. |
| W4 | Malaysia 2.1: record **CPTPP Annex 15-A** as the measure; score **Financial Procedure Act 1957 = 0** | (a) **International agreement**, not a domestic law; (b) the **score is wrong** — FPA allows international tenders only when local capability is absent, a preference → should be **1**; (c) Bumiputera preference is **not solely** anti-foreign (also excludes other domestic firms). |
| W5 | Banking Act confidentiality clause → "data localization / transfer ban" | **Misinterpretation** — a general duty of confidentiality is neither a localization nor a transfer ban. |
| W6 | "Transfer prohibited" for SG PDPA s.26 (ignoring the "unless") | **Lost exception** — dropping the exception turns a 6.4 conditional regime into a false 6.1 ban. |

### Sources that are NOT RDTII evidence (reject as primary basis)
Repealed text (Directive 95/46/EC) · drafts in consultation (India DPDP Rules 2025) · a company privacy policy (Meta) · Wikipedia · a law-firm explainer · a search-engine result page.

---

## 14. How this feeds the system

- **System prompt** ← §1 golden rules + §2 legal tests + §6 disambiguation pairs (as hard rules).
- **Few-shot examples** ← §13 ✅/❌ bank (rotate by indicator).
- **`pillar_6/7.yaml` `exclusions:`** ← every §6 "DON'T" and the §13 ❌ reasons.
- **Verification gates (G1–G8)** ← §12 checklist, one gate per item.
- **Eval / golden set** ← §13 examples become regression tests; every reviewer correction adds a new row here.

> Keep this file the single source of truth for legal judgment. When a new worked example or correction appears (workshops, Q&A, our own review), add it here first — then propagate to prompts, rubric, and gates. A Bangla mirror can be produced on request.
