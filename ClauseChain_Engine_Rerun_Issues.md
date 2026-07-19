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
