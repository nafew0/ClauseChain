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
