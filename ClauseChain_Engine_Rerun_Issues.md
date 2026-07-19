# Engine Rerun Tonight — Issues & Missing Evidence (LIVE DOC, 19 Jul review session)

Updated as the joint review proceeds. Owner: Fable executes the fixes + rerun; user adds
findings (incl. ChatGPT deep-research results) as they arrive.

## Fixes required before the rerun

1. **No broken snippets** (user, N012). The mapper's chosen quote span can stop before the
   operative object phrase (`s. 34(1)` snippet ended at "…search to be made", dropping
   "for a document or other thing"). Fix: extend the snippet span to the complete operative
   clause (empowerment verb + object NP + condition marker); keep it source-exact (E3).
   Decision context was never chunked (full subsection + 1,400-char context) — this is an
   EXPORT-QUALITY bug, not a decision bug.
2. **SG anchor-context rendering** (user). The Singapore official-HTML anchor context in the
   app/workbook shows as one flat text run — no line breaks/subsection structure. Repair:
   preserve paragraph/subsection breaks when slicing SSO context (extractor keeps structure;
   the flattening happens at context assembly — `raw_context` join).
3. **Missing NEW candidates** (user, from source reading during review):
   - **P7-I3**: Companies Act — **s. 320(1), s. 320(2)** not captured (noted on N004 too).
   - **P7-I5**: **s. 39 and s. 40** flagged as missing from the NEW set — verify: CPC s. 39 is
     KNOWN-tagged (master); confirm whether the user means Telecommunications Act ss. 39–40 or
     that CPC s. 40 lacks a row; check both during the rerun sweep.
4. *(Fable, from N012 analysis)* Snippet-span regression test to lock #1 once fixed.

5. **Recall levers for the rerun** (from the 91% approval-rate signal — gates proved
   over-conservative; the refuter+human net absorbs noise safely):
   - Raise/remove `SCREEN_CAP_PER_INDICATOR` (60 of ~120–180 candidates screened today)
   - Re-adjudicate the old 78-row NEW set through the CURRENT gates (recover G7-bug-era kills)
   - Instrument hunt (Fable web-hunt + user ChatGPT deep research) -> new seeds
   - Post-mortem the gate-rejection log for salvageable rows

## Awaiting user input
- ChatGPT deep-research instrument/section list (per indicator × economy) → will be triaged
  into seeds/hunt lists here before the rerun.

## Rerun checklist (when fixes land)
- [ ] Fix #1 + #2 with tests → engine suite green
- [ ] Add #3 sections to hunt/verify lists; confirm corpus contains them
- [ ] Full 6-run sweep → refuter v2 → regenerate payload/workbook → engine_refresh on server
- [ ] Preserve today's decisions (decisions.json is append-only supersession — re-approved rows
      keep their receipts; NEW rows from the rerun enter as pending)
- [ ] Re-upload window: 20 Jul Bangkok — final artifacts regenerate via submission_replay

6. **Multilingual handling** (user, Act 709 check): MY amendment A1727 is Malay-primary — anchor parse must handle "Seksyen 12A" patterns; snippet policy for non-English sources = original-language verbatim + unofficial English in the appended column. D9 economies (CN/RU/TH/LA/MN/ID) inherit: BGE-M3 cross-lingual retrieval, native-text mapping, per-language section grammars via extra_section_patterns.

7. **Deep-research P6 candidates (user ChatGPT report, triaged by Fable):**
   - ACQUIRE: SG PDP Regulations 2021 (S 63/2021) regs 10-12 -> P6-I4 (subsidiary machinery under s. 26); SSO /SL/ route
   - ACQUIRE: NSW HRIP Act 2002 Sch 1 cl 14 (HPP 14) + Vic Health Records Act 2001 HPP 9 -> AU P6-I4 state conditional-transfer (also explains AU P6-I1/I2 gold=0.5); needs whitelist + connectors for legislation.nsw.gov.au / legislation.vic.gov.au (state-level, mark in Notes)
   - ANCHOR: MY A1727 s. 12 (deletes s. 129(1)/(3)(h)/(4) whitelist gate; commenced 1 Apr 2025, P.U.(B) 522/2024) -> P6-I4 regime-change evidence + status fact
   - **P6-I5 via SEEDS, not manual rows (user ruling — automation claim intact):**
     add treaty PDFs to seeds.json + whitelist (DFAT/MTI/EnterpriseSG/MITI domains),
     REMOVE the orchestrator's P6-I5 skip, extract with Article-grammar
     (extra_section_patterns r"Article N.N" + citation_template "Art. {label}"),
     normal pipeline -> review. Treaties: CPTPP 14.11, RCEP 12.15, DEPA 4.3,
     SADEA 23, KSDPA 14.14, UKSDEA 8.61-F, AUKFTA 14.10
   - CONFIRMS: our 4 approved absences (SG/MY/AU I1-I3 negatives) + A002 resolution = Companies Act s. 199 under P6-I2 (already in corpus)

8. **Deep-research P7 candidates (triaged, tiered for tonight vs finals):**
   TONIGHT (easy official routes — SSO /SL/, legislation.gov.au, direct PDP/NACSA PDFs):
   - SG new anchors in held acts: PDPA ss. 22/26B/26D (breach regime, P7-I1), s. 11(5) (P7-I4); GST Act s. 84 + ITA s. 65B + PDPA Ninth Sch + Customs Act ss. 103/110A (P7-I5 warrantless); CPC s. 25 court-gated safeguard row
   - SG acquire (SL): S 63/2021 (also P7-I1/I4), S 64/2021 breach regs; Cybersecurity SL S 519/2018, S 680/2025, S 490/2026 (P7-I2)
   - SG P7-I3 sectoral SL sweep (10): S 328/2023, S 307/2015, S 555/2021, S 53/2010, S 148/2016, S 1009/2024, S 845/2024, S 329/2016, S 332/2016, S 151/2017, S 848/2015
   - MY acquire: PDP Commissioner Circulars 1/2025 (DPO -> P7-I4) + 2/2025 (breach + 2yr retention), DPIA Guideline 2026, P.U.(B) 522/2024 (status facts); Act 854 regs P.U.(A) 219-221/2024 (NACSA PDFs); AMLA Act 613 (ss. 17/25/31/37), ITA Act 53 2025 text (ss. 80/82), Companies Act 777 (ss. 245/341/531); PDPA ss. 113-115/121 anchors (warrantless vs court-gated pair)
   - AU acquire: **Cyber Security Act 2024 (No. 98) + 3 Rules (F2025L00276-278)** (P7-I2 — postdates master gold 0.5: record + currentness note); Privacy Amendment Act 2024; APP Code 2017 (agency Privacy Officer, P7-I4); AML/CTF Act (ss. 107/108/111/167), Corporations Act (s. 286), TAA 1953 (Sch 1 353-10/15, 382-5), Fair Work Act s. 535, NACC Act (ss. 58/63), Crimes Act 1914 (3ZQN warrantless vs 3ZQO court-gated), Surveillance Devices Act 2004 (ss. 28-33), ASIO s. 25 (AG-issued = executive, drives 1), TIA ss. 175-180 (internal authorisations)
   - NSW/Vic (portals already being added for P6): NSW HRIP s. 25 + SD Act 2007 ss. 31-33; Vic HR Act HPP 4.2 + SD Act 1999 ss. 26-28
   FINALS (T2 — 4 new state portals): Qld PPRA ss. 343-344, Tas PPSD ss. 23-25, WA SDA ss. 20-21, NT SDA ss. 33-39, ACT/SA (unverified by report)
   VERIFY-ON-PORTAL ourselves (report could not): MY Employment Act 265 s. 61(2), EPF Act 452 s. 42(2), CMA Act 588 ss. 247-252, MACC Act 694 ss. 30/31/36
   ZONE-3 NOTES: AU P7-I2 gold 0.5 predates Cyber Security Act 2024 (Nov 2024) — record evidence + currentness note; MY P7-I4 circulars (Jun 2025) postdate gold; P7-I4 thresholds -> 0.5 tier per rubric
