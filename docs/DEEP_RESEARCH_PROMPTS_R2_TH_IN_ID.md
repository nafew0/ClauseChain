# Deep-Research Prompts — Round 2: Thailand, India, Indonesia

Two prompts, same structure as the SG/MY/AU one that worked. Run **Prompt 1 (P7)**
first, then **Prompt 2 (P6)** as a separate deep-research session. Paste each
whole block into GPT 5.6 Pro.

---

## PROMPT 1 — Pillar 7 (domestic data governance), TH / IN / ID

You are a legal researcher preparing evidence for UN ESCAP's RDTII 2.1 index, Pillar 7 (domestic data governance). Using deep research, identify every statute, regulation, subsidiary instrument, code, notification, ministerial regulation, or license condition in **Thailand, India, and Indonesia** that answers the indicator questions in the rubric table pasted below (P7-I1 through P7-I5). Follow these rules strictly.

**Understand the polarity before you search.** P7-I1 and P7-I2 are absence-scored: the question is whether the economy LACKS a framework — so evidence that a framework EXISTS is what I need (it supports score 0). For P7-I3/I4/I5 the presence of the requirement drives the score. Never confuse the two directions.

**Provision-level precision.** Every finding = exact instrument title (official name + number + year, native AND English) AND pinpoint section/article (e.g., "s. 26(2)", "Article 40(2)", "มาตรา 26", "Pasal 21 ayat (1)", "Rule 3(1)(b)"). No instrument-level hand-waving.

**Official sources only for the final citation:**
- Thailand — laws.go.th (Office of the Council of State), ratchakitcha.soc.go.th (Royal Gazette), pdpc.or.th, ncsa.or.th, nbtc.go.th, etda.or.th.
- India — indiacode.nic.in, egazette.gov.in / egazette.nic.in, meity.gov.in, rbi.org.in, trai.gov.in / dot.gov.in, cert-in.org.in, sebi.gov.in, irdai.gov.in, fiuindia.gov.in, mca.gov.in.
- Indonesia — peraturan.go.id, peraturan.bpk.go.id, the JDIH network (jdih.setneg.go.id and ministry JDIHs), komdigi.go.id (formerly kominfo.go.id — confirm current name/domain), bssn.go.id, ojk.go.id, bi.go.id.
Secondary sources (law-firm alerts, IAPP, DLA piper handbook) may guide you but cannot be the cited link. Flag anything you couldn't confirm on an official portal.

**Language rule (new for these economies).** The controlling text is the native-language official version (Thai; Hindi/English — India's English versions on India Code ARE official; Bahasa Indonesia). For every finding give: (a) the official native-text URL, (b) the pinpoint cite in native convention AND romanised form, (c) a ≤25-word quote in English — if you translated it yourself, mark it [OWN-TRANSLATION]; if an official/government English version exists, quote that and mark [OFFICIAL-EN]. Never silently substitute an unofficial translation's numbering (Indonesian "Pasal 26 ayat (2)" = Article 26 paragraph (2); Thai sections use Thai numerals in the Gazette — give the Arabic-numeral equivalent).

**The three traps — apply my rubric's exclusions aggressively:**
- P7-I3: "do not keep longer than necessary" is a retention LIMIT (the opposite of a minimum) — NEVER report it as 7.3. I need floors: "keep for at least / not less than X days/months/years". Hunt in sectoral law: anti-money-laundering, tax, companies/accounting, telecom/ISP license conditions, health, employment, securities.
- P7-I5: apply the court-order test. Report BOTH kinds of powers but label each: (a) access WITHOUT independent judicial authorization (ministerial/administrative/police/regulator own-authority — this drives score 1), vs (b) access gated on a court warrant (supports score 0). Look BEYOND privacy statutes: criminal procedure codes, computer-crime acts, cybersecurity acts, telecom acts and license conditions, tax/customs acts, intelligence and national-security law. Follow the exception clauses inside the privacy acts (Thai PDPA s. 4 state-agency carve-outs; India DPDP s. 17(2) government exemption; Indonesia PDP Law Art. 15) to the REAL access powers defined elsewhere.
- P7-I2: scattered security clauses inside privacy/sectoral laws do NOT make a dedicated cybersecurity framework; sectoral instruments (RBI cyber directions, OJK/BI regulations, POJK circulars) are recorded but not controlling when a horizontal act exists.

**Subsidiary and recent instruments are the priority — the parent acts are already held (see skip-list):**
- Thailand — the PDPC subordinate notification wave 2022–2025 (security measures notification with retention/DPO detail; DPO notifications; breach notification; cross-border criteria); NCSA/NCSC notifications under the Cybersecurity Act; the MDES successor of the 2007 MICT traffic-data retention notification (Computer Crime Act s. 26 — was the 90-day floor amended?); NBTC subscriber-data rules; AMLA B.E. 2542 record-keeping (ss. 21–22, 5-year floors); Revenue Code account retention; Credit Information Act subordinate notifications; Criminal Procedure Code search/seizure powers; Special Case Investigation Act B.E. 2547 (DSI powers — s. 25 court-gated vs s. 24 own-authority?); Anti-Money Laundering Office access powers.
- India — DPDP Act 2023: exactly WHICH sections are in force by mid-2026 and the status/text of the draft DPDP Rules (consent managers, Data Protection Board, significant-data-fiduciary DPO duty s. 10); CERT-In Directions of 28 Apr 2022 (180-day log retention floor; 5-year subscriber-record floor for VPN/VPS/crypto — pinpoint the direction paragraph numbers); Telecommunications Act 2023 (s. 20 interception — commenced? court-gated or executive?); IT (Interception) Rules 2009 (Rule 3 — Home-Secretary authorization = NON-judicial: label it so); Telegraph Act s. 5(2) + Rule 419A; Income-tax Act s. 132; PMLA + PML (Maintenance of Records) Rules 2005 (Rule 6, 5-year floor); Companies Act 2013 (s. 128(5) 8-year books floor); Aadhaar Act ss. 28A/33 (court-gated vs district-judge order); UL/ISP license retention & interception clauses (exact clause numbers, 2021/2024 amendments); SPDI Rules 2011 status after DPDP commencement.
- Indonesia — the PDP Law implementing Government Regulation: adopted or still draft by mid-2026? (If adopted: number, date, DPO/DPIA and transfer articles); Permenkominfo 5/2020 (private-scope ESO registration; Art. 21 lawful-access to electronic data for supervision, Art. 36 law-enforcement access — court-gated?); GR 71/2019 Arts. 2, 20–21 (public-scope local processing), 95–99; ITE Law as amended by Law 1/2024 (second amendment — new interception article?); KUHAP search/seizure + the NEW Criminal Code (Law 1/2023, in force Jan 2026) any data-access provisions; AML Law 8/2010 (5-year retention, PPATK access powers — own authority?); OJK 11/POJK.03/2022 + successor SEOJK; BI PBI 22/23/PBI/2020 (payment-data); Law 17/2011 State Intelligence (Art. 31–32 interception — court order needed?); Tax law KUP Art. 35A data access.

**Currentness:** in force as of August 2026? Note 2024–2026 commencements, amendments and repeals explicitly (India DPDP commencement schedule; Indonesia Law 1/2024 ITE amendment and Criminal Code 2026 entry into force; Thailand PDPC notifications' phase-in dates).

**Negative findings matter:** where nothing exists for an economy × indicator, say so and list what you checked.

**Skip what we already hold — your value is the delta.** Do not re-report (unless a different section or a subordinate instrument adding detail):
- **TH** — PDPA B.E. 2562 (ss. 19, 28, 41, 42); Cybersecurity Act B.E. 2562 (ss. 5, 9, 12–13, 64, 66, 68); Computer Crime Act B.E. 2550 (ss. 13, 15–18, 26); Telecommunications Business Act B.E. 2544 (ss. 50, 64, 66, 74, 77); NBTC Organization Act s. 32; National Health Act B.E. 2550 (s. 7); Credit Information Business Act B.E. 2545 (ss. 3, 12, 13, 20); 2007 MICT traffic-retention notification; the five NCSC standards notifications; NTC telecom user-rights notification; National Intelligence Act B.E. 2562 (ss. 5–6).
- **IN** — DPDP Act 2023 (ss. 4, 10, 12, 16, 17); IT Act 2000 (ss. 65, 69, 69A, 69B); IT Interception Rules 2009 (as a whole — but pinpoint rule numbers ARE wanted); SPDI Rules 2011; Intermediary Guidelines Rules 2021; Cyber Café Rules 2011; CERT-In Direction 2022 (as instrument — paragraph pinpoints wanted); Telecommunications Act 2023 s. 20(2); RBI 2018 payment-localisation directive; RBI KYC Directions 2016; RBI PPI Master Direction; RBI IT-Governance Master Direction 2023; National Cyber Security Policy 2013; Companies Act 2013 (ss. 128); Companies (Mgmt & Admin) Rules 2014; PML Records Rules; SEBI LODR 2015; the IFSCA regulation family; ISP/UL License (cl. 2, 7.3, 7.6, 8); NDSAP 2012.
- **ID** — PDP Law 27/2022 (Arts. 21, 34, 42, 44, 53, 55–56, 59, 65–66, 74); GR 71/2019 (Arts. 2, 4–6, 12, 20–21, 24); Permenkominfo 20/2016 (Arts. 6–11, 15, 34–35); GR 80/2019 (Arts. 5, 25, 59); GR 46/2014 (Art. 21); ITE Law 11/2008 + 19/2016 (Arts. 5, 15, 27, 30–31, 40, 43, 45A); Perpres 53/2021 (BSSN); POJK 11/POJK.03/2022 (Arts. 35–36, 42, 63, 72); POJK 6/POJK.07/2022; POJK 27/2024; PBI 22/23/PBI/2020 (Arts. 63, 109); Law 8/1997 Company Documents; Law 7/1992 Banking; Law 17/2011 State Intelligence (Art. 6).

**Output format — one table, one row per finding:**
Economy | Indicator | Instrument (official title, number, year — native + English) | Provision (native + romanised) | ≤25-word English quote [OFFICIAL-EN / OWN-TRANSLATION] | Maps how (tie to scoring criteria + polarity; for I5: warrantless vs court-gated) | Official URL | In force? (date/version, 2024–26 changes) | Confidence
Then: "Negative findings" list + "Could not verify on official portal" list.

[PASTE THE SAME P7 RUBRIC TABLE USED LAST TIME — P7-I1 … P7-I5 rows, unchanged: the rubric is economy-independent.]

---

## PROMPT 2 — Pillar 6 (cross-border data policies), TH / IN / ID

You are a legal researcher preparing evidence for UN ESCAP's RDTII 2.1 index, Pillar 6 (cross-border data policies). Using deep research, identify every statute, regulation, subsidiary instrument, notification, license condition, or binding international commitment of **Thailand, India, and Indonesia** that answers the indicator questions in the rubric table below (P6-I1 through P6-I5). Follow these rules strictly.

**Polarity.** P6-I1 to P6-I4 score the PRESENCE of restrictions on cross-border data movement (a restriction found = evidence for a positive score). P6-I5 is the inverse-style exception: the question is whether the economy has joined NO binding data-transfer agreement — so what I need is evidence of the agreements that EXIST (they support score 0). Scope exclusion for the whole pillar: measures applying ONLY to government data are NOT scored — record them flagged [GOV-ONLY].

**Provision-level precision, official sources, language rule, currentness, negative findings** — same rules as my Pillar-7 request: pinpoint articles with native + romanised cites, official portals only (laws.go.th / ratchakitcha; indiacode / egazette / rbi / meity / trai; peraturan.go.id / JDIH / komdigi / ojk / bi), ≤25-word English quotes labeled [OFFICIAL-EN] or [OWN-TRANSLATION], in-force status as of August 2026 with 2024–2026 changes, and explicit negative findings.

**The four traps — apply aggressively:**
- **6.1 vs 6.4:** if a transfer path exists once conditions are met (consent, adequacy, safeguards, approval), that is a CONDITIONAL FLOW regime (6.4), NEVER a ban (6.1). Only report 6.1 where transfer is prohibited outright or processing is mandatorily domestic with no transfer path.
- **6.2 vs 6.1 vs 6.3:** a copy-stored-domestically rule without a transfer ban is 6.2. A local server/data-centre required AS A PRECONDITION of providing the service is 6.3. Security rulebooks ("must establish access-control policies"), encryption or network-segmentation duties are NOT infrastructure (that's P7-I2 territory). Rules governing already-established data centres are recorded but score 0; data-centre LICENSING regimes belong to another indicator — record as [OUT-OF-SCOPE-9.4].
- **Business-transfer trap:** transfer/amalgamation of a BUSINESS, undertaking, assets or shares (banking business-transfer schemes, company amalgamations) is NOT a data transfer. Disclosure to a DOMESTIC authority is not a cross-border flow.
- **6.5 evidence direction:** report the binding commitments that exist — with the exact treaty article stating the data-flow discipline (e.g. "shall not prohibit or restrict the cross-border transfer of information by electronic means") and that economy's ratification/entry-into-force status. RCEP e-commerce chapter (Art. 12.15) is soft — check the binding force question honestly for each economy.

**Where to hunt (beyond the skip-list parents):**
- Thailand — PDPA s. 28–29 subordinate PDPC notifications (2023–2025 cross-border criteria: adequacy list? BCR mechanism? — pinpoint the notification clauses); sectoral localisation: BOT rules on payment/financial data, insurance (OIC), telecom subscriber data (NBTC); e-Government/Cloud-first policies with data-residency requirements [GOV-ONLY flag]; treaty side: RCEP status, Thailand–Australia/other FTAs' e-commerce chapters, CoE Convention 108 status (not a member?), any DEPA accession moves by 2026.
- India — the DPDP Act 2023 s. 16 negative-list transfer regime: has the negative list been notified by mid-2026? (exact notification if so); RBI 6 Apr 2018 payment-data localisation (data "stored in a system ONLY in India" — 6.2 core row, already held, but hunt the FAQ/clarifications with processing-abroad-then-repatriate rules); RBI outsourcing directions; SEBI cloud framework 2023 (localisation clauses); IRDAI Maintenance of Insurance Records Regs (Indian-territory storage); MeitY cloud empanelment [GOV-ONLY]; GST/e-invoice data rules; Unified/ISP License data-localisation and remote-access clauses (subscriber data must remain in India — exact clause); UPI/NPCI circulars; treaty side: India has NO FTA data-flow commitments? — verify (UAE/Australia ECTA e-commerce chapters' data articles, WTO moratorium position), CoE 108 status.
- Indonesia — GR 71/2019 the public/private scope split (Arts. 20–21 public-scope domestic processing [GOV-ONLY?] — analyse whether it reaches private ESOs); financial sector: the 2022–2025 OJK/BI data-residency posture after POJK 11/2022 (offshore data centres allowed WITH approval = 6.4 conditional, pinpoint the approval articles); PDP Law Arts. 55–56 transfer conditions + the implementing regulation's transfer chapter (if adopted); Permenkominfo 5/2020 (registration + access ≠ localisation — but check Art. 21 data-and-system access duty); e-commerce GR 80/2019 Art. 59 (offshore storage conditional on approval); tax data rules; treaty side: RCEP Art. 12.15, ASEAN e-Commerce Agreement (Art. 7.4 — binding?), DEPA accession status 2025–26, CEPA e-commerce chapters (Indonesia–Australia IA-CEPA data articles), CoE 108 status.

**Skip what we already hold — do not re-report (unless a different section or a subordinate instrument adding detail):**
- **TH** — Credit Information Business Act B.E. 2545 (ss. 3, 12, 20); PDPA B.E. 2562 s. 28 + the PDPC cross-border notification pair already recorded; BOT-related credit-data rules recorded at 6.1.
- **IN** — NDSAP 2012; DPDP Act 2023 s. 16; MeitY government-department guidelines [GOV-ONLY]; RBI Directive 2018 (the directive itself); CERT-In Direction 2022; Companies Act 2013 s. 128 (books at registered office); IRDAI Records Regulations 2015; SPDI Rules 2011 transfer rule.
- **ID** — POJK 11/POJK.03/2022 (Arts. 35, 42, 72); GR 71/2019 (Arts. 20–21); PDP Law 27/2022 (Arts. 55–56, 65–66, 74); GR 46/2014 Art. 21; Permenkominfo 20/2016 Art. 15; GR 80/2019 Art. 59; POJK 6/POJK.07/2022; PBI 22/23/PBI/2020 (Arts. 63, 109).

**Output format — one table, one row per finding:**
Economy | Indicator | Instrument (native + English title, number, year) | Provision | ≤25-word English quote [label] | Maps how (which scoring tier and why; note [GOV-ONLY]/[OUT-OF-SCOPE] flags) | Official URL | In force? | Confidence
Then: "Negative findings" + "Could not verify on official portal" + a short "6.5 treaty status table" (economy | agreement | data-flow article | binding? | in force since).

[PASTE THE P6 RUBRIC TABLE BELOW — build rows from: P6-I1 Ban & local processing (1 = personal data or horizontal, or ≥2 non-personal; 0.5 = single non-personal/sectoral; 0 = none); P6-I2 Local storage copy (same tiers); P6-I3 Infrastructure precondition (1 = any; 0 = none — already-established-DC rules recorded at 0); P6-I4 Conditional flow (1 = personal/horizontal; 0.5 = sectoral/non-personal; 0 = none); P6-I5 No binding transfer agreement (1 = none; 0 = at least one). Include the exclusion bullets from the four traps above as each indicator's Exclusions column.]

---

## Notes for me (Nafew) — not part of the prompts
- Run P7 first: it feeds the richer NEW-evidence vein (I3/I5 sectoral hunts).
- One economy's report ≈ one jurisdiction pack. When reports arrive, Claude
  builds `th.yaml / in.yaml / id.yaml` + seeds + corpus and evals against the
  Round-2 gold sheets.
- Timor-Leste (bonus, 20 pts) gets its own brief later — sources are thin
  (jornal.gov.tl Jornal da República, mj.gov.tl; Portuguese/Tetum) and needs a
  different research strategy (UNCTAD/ITU secondary mapping first).
- Remaining 4 (CN/RU/LA/MN) — reuse these prompt skeletons, swap portals +
  skip-lists from their gold sheets when we get there.
