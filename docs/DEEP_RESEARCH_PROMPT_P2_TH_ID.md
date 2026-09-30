# Deep-Research Prompt — Pillar 2 (Public Procurement): Thailand & Indonesia

Run this as its own deep-research session. Paste everything from **PROMPT 3** to the end of this file, including **Appendix A**, which holds the rows we already have from the ESCAP RDTII 2.1 Round 2 database. It should return two files: `deepresearch_Thailand_pillar2.md` and `deepresearch_indonesia_pillar2.md`.

---

## PROMPT 3 — Pillar 2 (public procurement), TH / ID

You are a legal researcher preparing evidence for UN ESCAP's RDTII 2.1 index, Pillar 2 (public procurement of ICT goods and digital services). Using deep research, identify every statute, regulation, ministerial or presidential instrument, circular, standard contract, registry rule, or binding international commitment of **Thailand and Indonesia** that answers the indicator questions in the rubric table below (P2-I1 through P2-I4). Follow these rules strictly.

**What we already hold.** Appendix A reproduces the rows ESCAP's RDTII 2.1 Round 2 database already holds for both economies, with their scores. Treat them as the baseline you are extending and checking, not as sources. Your value is (a) the delta, meaning new instruments, new sections and 2024–2026 changes, and (b) corrections to the held rows.

### Deliverables — two Markdown files

Produce exactly two files:

1. **`deepresearch_Thailand_pillar2.md`**: Thailand only.
2. **`deepresearch_indonesia_pillar2.md`**: Indonesia only.

If you cannot attach files, output each file's full content in its own fenced `markdown` block headed by the filename. Each file must contain, in this order:

1. **Header**: economy, "RDTII 2.1 Pillar 2 — Public procurement", "in force as at August 2026", compilation date.
2. **Headline table**: indicator | proposed score | one-line basis | supporting row IDs | held score (Appendix A) | changed? why.
3. **Evidence table** in the output format below (one row per finding).
4. **Corrections to held rows**: held row ID (Appendix A) | problem | corrected fact with pinpoint | official URL | effect on score.
5. **Institutional transparency row** (see below).
6. **Negative findings**: each one cites the general procurement law section used as the reference row.
7. **Could not verify on official portal.**
8. **2.4 GPA status table**: economy | agreement | coverage of CPC 752/754/84 | binding? | in force since / observer since.
9. **[PREFERENTIAL-CONTEXT] FTA procurement chapters**: agreement | chapter | in force? | not scored.

### Polarity

P2-I1 to P2-I3 score the PRESENCE of restrictions on foreign participation or of costly conditions in government procurement: a measure found is evidence for a positive score. P2-I4 is inverse-style: it scores 1 if the economy is NOT a party to the WTO Agreement on Government Procurement (GPA), or if its schedule doesn't cover CPC 752/754/84. So record the actual GPA status (party / observer / applicant) from WTO sources.

### Scope for the whole pillar

- Pillar 2 covers procurement of ICT goods and digital/online services. Horizontal procurement rules count because they reach ICT purchases.
- Record measures that cover only a non-ICT sector (construction, steel, electricity transmission, pharmaceuticals), but flag them `[NON-ICT-SECTOR]`.
- Only **non-preferential** measures that are **in force** count. Drafts, bills and repealed rules are excluded. FTA procurement chapters are preferential (see trap 5).
- If no measure exists for an indicator, still cite the general public procurement law and its governing section as the reference row (ESCAP's "lack of measures" rule).

### Precision, sources, language, currentness

- **Provision-level precision.** Every finding needs the exact instrument title (official name + number + year, native AND English) and a pinpoint, e.g. "มาตรา 73", "ข้อ 27/3 (3)", "Pasal 66 ayat (1)". No instrument-level hand-waving.
- **Official sources only for the cited link:**
  - Thailand: ratchakitcha.soc.go.th (Royal Gazette), krisdika.go.th / ocs.go.th (Office of the Council of State), gprocurement.go.th (Comptroller General's Department, CGD), bb.go.th (Budget Bureau / Thai Innovation List), depa.or.th, dga.or.th, mdes.go.th, ncsa.or.th.
  - Indonesia: peraturan.go.id, peraturan.bpk.go.id, jdih.lkpp.go.id / lkpp.go.id / inaproc.id, jdih.kemenperin.go.id / tkdn.kemenperin.go.id, jdih.komdigi.go.id, jdih.bssn.go.id, jdih.setkab.go.id / jdih.setneg.go.id, jdih.kemenkeu.go.id.
  - WTO: wto.org GPA pages and e-GPA.
  - Secondary sources may point you to primary text but can never be the cited link. This includes WTO Trade Policy Reviews, OECD/World Bank STRI, Global Trade Alert, law-firm alerts, global-regulation.com, and university or agency mirror PDFs.
- **Language rule.** The controlling text is the native-language official version (Thai; Bahasa Indonesia). For every finding give:
  - (a) the official native-text URL;
  - (b) the pinpoint in native convention AND romanised form;
  - (c) a ≤25-word English quote, labelled `[OFFICIAL-EN]` if a government English text exists or `[OWN-TRANSLATION]` if you translated it.

  Thai Gazette numerals must be converted to Arabic. "Pasal 66 ayat (1)" = Article 66 paragraph (1). A Presidential Instruction (Inpres) has **Diktum** (KESATU, KEDUA…), not articles, so cite the diktum.
- **Currentness.** Give in-force status as of August 2026. Flag every 2024–2026 enactment, amendment, repeal or replacement, including for the held instruments in Appendix A.
- **Negative findings matter.** Where nothing exists for an economy × indicator, say so and list what you checked.

### The five traps — apply aggressively

1. **2.1 vs 2.3 (exclusion vs limitation), two steps.**
   - Step 1: foreign firms barred outright, barred for a category, or admitted ONLY when no domestic supplier is available or qualified → EXCLUSION (2.1). ESCAP's FAQ scores the "foreign only if nationals can't meet demand" pattern as **1**, not 0.5.
   - A rule that still lets a foreign firm win (mandatory consortium or partnering with nationals, price margin, quota, local-content threshold) is a LIMITATION (2.3).
   - Step 2 (2.3 only): a limitation that discriminates by nationality or origin scores **1**. Examples: price preference for domestic goods; a "domestic company" test based on majority national ownership; a nationality requirement for consultants.
   - A limitation applied equally to all bidders scores **0.5**. Examples: a local-content/TKDN threshold any bidder can meet; an SME set-aside open to any SME; performance conditions. Two or more 0.5 measures together score 1.
2. **Legal-basis trap.** A clause that only EMPOWERS a minister or agency to exclude foreign firms or impose preferences scores 0 until an implementing instrument actually does it. Hunt that instrument down and record the enabling clause as context. Setting a target or reference price (focal price, ราคากลาง, HPS) is normal practice (0) unless domestic and foreign bidders are priced differently.
3. **2.2 condition trap.**
   - Surrender of source code, patents, trade secrets or exclusive IP (including source-code escrow) scores **1** only when it is a CONDITION of participating in or winning a tender or government supply contract.
   - A mandated specific encryption standard (national or government-certified crypto) that bidders' products must use to win scores **0.5**.
   - Optional or negotiated contract clauses ("depends on the agreement between agency and supplier") score 0.
   - Security rulebooks that bind only the agency's own systems score 0.
   - Source-code disclosure outside procurement → `[OUT-OF-SCOPE-4.9]`. General national encryption standards not tied to tenders → `[OUT-OF-SCOPE-11.4]`.
4. **Cross-pillar trap.**
   - Local-content rules for the COMMERCIAL market (e.g. TKDN for 4G/5G handsets as a certification or sale condition) → `[OUT-OF-SCOPE-10.3]`, not 2.3, unless applied to government purchasing.
   - Foreign equity caps, Foreign Business Act licensing and joint-venture rules → `[OUT-OF-SCOPE-3.x]`, unless the procurement rule itself uses ownership to define eligibility or preference (then 2.1/2.3).
   - A government-only ban on a foreign app, vendor or cloud may be recorded under 2.1 and flagged `[ALSO-10.1]` (ESCAP FAQ).
   - Government-data residency is Pillar 6 `[GOV-ONLY]`, not 2.x.
5. **2.4 evidence direction.** From WTO official pages, record: GPA party / observer (since when) / accession application lodged? If a party, record whether its Annex coverage includes CPC 752, 754 and 84. FTA procurement chapters (RCEP Ch. 16; Thailand–EFTA FTA; IA-CEPA; Indonesia–EU CEPA if in force) are preferential: record them as `[PREFERENTIAL-CONTEXT]`. They do NOT change the 2.4 score.

### Institutional transparency (2.3 limb)

2.3 also scores 1 if procurement laws, regulations, guidelines and bidding procedures are NOT publicly available and accessible. Give one transparency row per economy, with the official e-procurement and legal-database URLs you verified:

- Thailand: e-GP / CGD.
- Indonesia: INAPROC / SPSE / JDIH LKPP.

### Where to hunt (beyond the skip-list parents)

**Thailand**
- Public Procurement and Supplies Administration Act B.E. 2560 (PPSA): the section that enables "supplies the State wants to promote or support", and the international-bidding / foreign-loan rules.
- MoF Regulation B.E. 2560: clauses on international bidding, foreign goods, and the price-margin / preference mechanics, other than the held cl. 101 and 134.
- Every amendment to the "promoted supplies" Ministerial Regulation series OTHER than the main 2563, No. 2 and No. 4 (e.g. No. 3, No. 5 and later, 2021–2026). Look especially for:
  - SME preferences (budget share, price margin);
  - any change to Made-in-Thailand percentages;
  - any "Thai First" or Buy-Thai Cabinet resolution 2024–2026 (verify).
- CGD circulars (หนังสือเวียน ว…) 2024–2026 setting MIT, SME or Thai-innovation quotas and thresholds.
- DEPA's implementing announcements for Digital Promotion Goods and the "digital standard" certification under MR No. 4. Is certification or catalogue registration a condition to win (2.3 / 2.2)?
- CGD standard-form contracts (แบบสัญญา) for software development or computer systems: any clause transferring source code or IP, or requiring escrow (2.2).
- DGA / MDES government-cloud policy (GDCC, Cloud First): does it exclude foreign cloud providers from government procurement (2.1), or only set residency (`[GOV-ONLY]`, P6)?
- NCSA standards under the Cybersecurity Act B.E. 2562 that bind vendors supplying critical-information-infrastructure agencies (2.2 encryption?).

**Indonesia**
- Perpres 16/2018 as amended by Perpres 12/2021 and the 2025 second amendment (reported as Perpres 46/2025 — verify). Pinpoint:
  - **Art. 66 as amended** (mandatory domestic products where TKDN + BMP ≥ 40%). We hold only the original 2018 wording of Arts. 63/65/66;
  - the international-tender thresholds as amended;
  - e-Katalog mandates;
  - MSME set-asides.
- Parent statute UU 3/2014 on Industry: the domestic-product-use articles (Arts. 85–86 — verify).
- PP 7/2021 (MSMEs): the ≥40% procurement allocation for MSME products (pinpoint the article).
- Whether PP 28/2021 revoked or replaced the P3DN articles of PP 29/2018, and what PP 46/2023 changed. Give current article numbers.
- LKPP regulations 2021–2026 (Peraturan LKPP) on international tender, domestic preference margins and e-Katalog.
- The 2025 TKDN calculation / certification reform replacing Permenperin 16/M-IND/PER/2/2011 (verify number). Check whether the held Permenperin 02/2014 and 49/2009 → 102/2009 are still in force or superseded.
- Komdigi / Kominfo TKDN rules for telecom-infrastructure procurement (BAKTI / USO projects).
- SPBE / GovTech: Perpres 95/2018, Perpres 82/2023 and PANRB rules on government application development (source-code handover?).
- BSSN rules on persandian / certified crypto modules for government systems. Are vendors required to use them to win (2.2 at 0.5), or is this only an agency rule (→ 11.4 / 0)?

**2.4:** the WTO GPA parties/observers page and any accession documents for both economies, plus the status of the FTA GP chapters (context only).

### Skip what we already hold — do not re-report

Re-report a held instrument only if you are citing a different section, a subordinate instrument that adds detail, or a 2024–2026 amendment or repeal. Report currentness changes as their own rows. Full held text is in Appendix A.

- **TH**
  - PPSA Act B.E. 2560 (ss. 4, 8, 54–68 as referenced, 73)
  - MoF Regulation B.E. 2560 (cl. 21–91 as referenced, 101, 134)
  - Ministerial Regulation on Consultant Registration B.E. 2560 (cl. 4)
  - Ministerial Regulation on Eligibility for Business-Operator Registration B.E. 2560 (cl. 3(1), 3(3))
  - DIP Guidelines on Procurement of Computer Programs (2020)
  - Layout Designs of Integrated Circuits Act B.E. 2543 (s. 6)
  - MR on Promoted Supplies B.E. 2563 (cl. 3, 8, 9(8), 10, 11, 12, 13)
  - MR No. 2 B.E. 2563 (Ch. 7/1, cl. 27/1, 27/3)
  - MR No. 4 B.E. 2566 (cl. 27/7, 27/9)
  - 2015 Cabinet resolutions on Thai innovative products
- **ID**
  - Perpres 16/2018 (original Arts. 63, 65, 66)
  - Perpres 54/2010 Art. 104 (revoked, context)
  - Inpres 2/2022 (our gold mislabels it "No. 22/2022")
  - PP 29/2018 (Arts. 57, 58, 61, 63, 64) + PP 28/2021 + PP 46/2023
  - Permenkominfo 41/PER/M.KOMINFO/10/2009 (Arts. 1(4), 3–6)
  - Permenperin 15/M-IND/PER/3/2016 (Arts. 2, 4, 6–8)
  - Permenperin 02/M-IND/PER/1/2014 (Arts. 3, 4, 10, 15–17, 20)
  - Permenperin 49/2009 as amended by 102/M-IND/PER/10/2009 (Arts. 8, 10, 11)
  - PMK 115/PMK.06/2020
  - PP 71/2019 (Arts. 9, 15, public-scope storage)
  - PP 82/2012 (Arts. 8, 9, 17, revoked)

### Held rows to re-check (report the results in each file's "Corrections to held rows" section)

**Thailand**
- **TH-H1 / TH-H6: possible 2.1 under-score.**
  - Held 2.1 = 0, but MR No. 2 cl. 27/3(1) requires MIT supplies and allows foreign supplies only "if necessary" with higher-authority approval. That may be the "foreign only if domestic unavailable" pattern ESCAP's FAQ scores as 1.
  - The consultant rules (TH-H4: Thai nationality for registration; foreign consultants only "when necessary") raise the same question.
  - Assess against trap 1 and state your view with pinpoints.
- **TH-H5: conflicting figures.** The held text says ≥70% (cl. 3), while the verification feedback says ≥30% (cl. 13). Give the exact clause and figure from the Gazette text. Also verify the claim that the Thai Innovation List is open only to "Thai majority-owned companies" from the official Budget Bureau / NIA criteria; an ownership test would make it discriminatory, i.e. 2.3 = 1.
- **TH-H6:** confirm the 3% Thai-bidder price margin in cl. 27/3(3) and the "no less than 60%" non-construction threshold, and whether they reach ICT goods.
- **TH-H7:** confirm on depa.or.th whether catalogue registration requires a registered office in Thailand (establishment-based eligibility, 2.3).
- **TH-H1 note (cl. 134, business-operator registration):** construction only, so flag `[NON-ICT-SECTOR]`. Confirm both are still in force.
- **Mirror links:** replace every non-official mirror (finance.rmuti.ac.th, prakanedu.go.th, alro.go.th, infocenter.oic.go.th, mit.fti.or.th) with ratchakitcha, CGD or Budget Bureau URLs.

**Indonesia**
- **ID-H1:** the held text argues foreign firms are *not* excluded, yet the score is 1. Resolve under trap 1: below-threshold participation is allowed only if no qualified national exists. Give current Art. 63 thresholds as amended in 2021/2025.
- **ID-H2 / ID-H13:** the Inpres number is 2/2022, not 22/2022. The cited "Article 8" and "Article 15" cannot exist in an Inpres, so pinpoint the diktum. Confirm the 40% MSME spend and any preference-margin range.
- **ID-H3 / ID-H7:** determine whether PP 29/2018's P3DN articles survive or were moved into PP 28/2021 / PP 46/2023. Reconcile price preferences: the held rows give 25% goods / 7.5% construction (PP) against 15% goods / 7.5% services (Permenperin 02/2014).
- **ID-H4 / ID-H11:** ID-H11 is labelled Permenkominfo 41/2009 but describes Permenperin 49/2009 / 102/2009 (558 sub-sectors). Split them and pinpoint each separately.
- **ID-H5 / ID-H12:** the coverage says "Telecommunications", but the instrument concerns electricity transmission towers and conductors, so flag `[NON-ICT-SECTOR]`. ID-H12 also cites Arts. 57/58/61/64, which belong to PP 29/2018; correct the attribution.
- **ID-H9:** public-scope ESO data storage is a Pillar 6 `[GOV-ONLY]` measure, not 2.3. Reclassify it and explain why.
- **ID-H10:** is PMK 115/2020's "establish an Indonesian PT" rule a procurement eligibility condition (2.3) or an establishment / FDI rule (`[OUT-OF-SCOPE-3.x]`)? Is it still in force?
- **ID-H8:** is Permenperin 02/2014 still in force after the 2025 TKDN reform? Replace the bpbj.batam.go.id mirror with jdih.kemenperin.go.id.
- **Secondary citations:** replace every secondary citation (Global Trade Alert, EC DG Trade report, Lexology, global-regulation.com, infoasn.id) with official JDIH / BPK URLs.

### Output format — one table, one row per finding

Economy | Indicator | Instrument (native + English title, number, year) | Provision | ≤25-word English quote [label] | Maps how (which scoring tier and why; note [NON-ICT-SECTOR] / [OUT-OF-SCOPE-x] / [ALSO-10.1] / [GOV-ONLY] flags) | Official URL | In force? | Confidence

Then: "Negative findings" + "Could not verify on official portal" + a short "2.4 GPA status table" (economy | agreement | coverage of CPC 752/754/84 | binding? | in force since / observer since).

### Rubric (RDTII 2.1 methodology — weights 40 / 32 / 20 / 8)

| Indicator | Meth. no. | Name | Legal question | Scoring | Exclusions |
|---|---|---|---|---|---|
| P2-I1 | 2.1 | Foreign exclusions from public procurement (ICT goods & digital services) | Are foreign firms barred from tenders — outright, for a category, or admitted only when no domestic supplier is available? | **1** = any measure excluding foreign firms under any circumstances, OR ≥2 measures under the 0.5 category. **0.5** = a measure excluding a specific (group of) foreign firm(s). **0** = none, or only a legal basis empowering exclusion. | • Partnering / consortium / price-margin rules that still let foreigners win → 2.3.<br>• Enabling clause only → 0.<br>• Government-only ban on a foreign product/app → also flag [ALSO-10.1].<br>• FDI equity / licensing rules → [OUT-OF-SCOPE-3.x] unless they define bid eligibility. |
| P2-I2 | 2.2 | Specific requirements on source code, encryption and trade secrets | Must bidders surrender source code, patents, trade secrets or exclusive IP, or use a specific encryption, as a condition of participating in or winning? | **1** = requirement to surrender patents / source code / trade secrets (incl. escrow) as a tender condition. **0.5** = requirement to use a specific encryption to win. **0** = none. | • Optional / negotiated contract terms → 0.<br>• Agency-only security rules → 0.<br>• Disclosure outside procurement → [OUT-OF-SCOPE-4.9].<br>• General national encryption standards → [OUT-OF-SCOPE-11.4]. |
| P2-I3 | 2.3 | Limitations in procurement bidding | Are there quotas, preferences or price preferences triggered by nationality, SME/other status, or local-content percentage? | **1** = a measure directly discriminating against foreign bidders, OR absence of institutional transparency, OR ≥2 measures under the 0.5 category. **0.5** = a measure applied to all bidders (e.g. LCR, performance-based conditions). **0** = none, or only a legal basis empowering limitations. | • Exclusion (no path to win) → 2.1.<br>• Commercial-market LCRs → [OUT-OF-SCOPE-10.3].<br>• Neutral target / reference pricing → 0.<br>• Non-ICT-only measures → flag [NON-ICT-SECTOR]. |
| P2-I4 | 2.4 | Not in the WTO GPA (or not covering CPC 752, 754, 84) | Is the economy a GPA party, and does its schedule cover telecom (752), telecom-related (754) and computer services (84)? | **1** = not a GPA party, or party covering none of the three. **0.5** = party covering at least one but not all. **0** = party fully covering all three. | • FTA procurement chapters are preferential → [PREFERENTIAL-CONTEXT], not scored.<br>• Observer status ≠ party. |

---

## Appendix A — Rows already held (ESCAP RDTII 2.1 Round 2 database, Pillar 2)

Transcribed from the Round 2 database and lightly condensed. Every instrument, provision, figure, date, URL and verification note is kept. Thai titles have been normalised; the source PDF had broken vowel encoding. Row IDs (`TH-H1…`, `ID-H1…`) exist only for cross-reference in your "Corrections to held rows" section.

### A.1 Thailand — held scores: 2.1 = **0**, 2.2 = **0**, 2.3 = **1** (2.4 not in the database)

**TH-H1 · Indicator 2.1 · Score 0.00 · Coverage: Horizontal · Since August 2017**
- **Instrument:** Public Procurement and Supplies Administration Act B.E. 2560 (พระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560).
- **Held impact text:**
  - No legislative measure fully excludes foreign firms from public procurement in sectors relevant to digital trade.
  - Procurement must follow the value-for-money, transparency, efficiency/effectiveness and accountability principles.
  - Transparency requires open procurement, fair competition, equal treatment of all business operators, sufficient tender time, clear evidence and disclosure at all stages (**s. 8**).
- **References:**
  - Thai: http://www.gprocurement.go.th/wps/wcm/connect/f764eeef-c414-45cc-8e84-5cbf8eb398ca/%E0%B8%9E%E0%B8%A3%E0%B8%9A+%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%8B%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%87+%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A8%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B8%88%E0%B8%B2+24+%E0%B8%81%E0%B8%9E+2560.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-f764eeef-c414-45cc-8e84-5cbf8eb398ca-mLvSM52
  - English: http://www.gprocurement.go.th/wps/wcm/connect/cb6ae8e9-ddb3-4640-9393-04d9fc09b5af/PUBLIC%2BPROCUREMENT%2BAND%2BSUPPLIES%2BADMINISTRATION%2BACT%2C%2BB.E.%2B2560%2B%282017%29.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-cb6ae8e9-ddb3-4640-9393-04d9fc09b5af-mLvSLpp
- **Held note — measures applying to construction services:**
  - **MoF Regulation on Public Procurement and Supplies Administration B.E. 2560** (ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560), **cl. 134**. A design or construction-supervision provider who is a natural person must be a Thai citizen holding a Thai architecture/engineering licence. For a juristic person, the managing director or managing partner must be a Thai citizen and more than 50% of the capital must be Thai-held. Source (mirror): http://www.finance.rmuti.ac.th/pr/cgd-2560.PDF
  - **Ministerial Regulation Prescribing Criteria Concerning Persons Eligible for Registration of Business Operators B.E. 2560** (กฎกระทรวงกำหนดหลักเกณฑ์เกี่ยวกับผู้ที่มีสิทธิขอขึ้นทะเบียนผู้ประกอบการ พ.ศ. 2560). "Business operator" means a construction-services operator. Eligibility requires a juristic person registered with an office in Thailand (**cl. 3(1)**), with half of its directors Thai citizens (**cl. 3(3)**). Source: http://www.gprocurement.go.th/wps/wcm/connect/e85d3ff9-3055-4d56-945e-740fcdb06db8/กฎกระทรวงฉบับที่+2_หลักเกณฑ์ผู้มีสิทธิขอขึ้นทะเบียนผู้ประกอบการ.PDF?MOD=AJPERES&CACHEID=ROOTWORKSPACE-e85d3ff9-3055-4d56-945e-740fcdb06db8-lZtQ5UY
- **Verification:** Correct.

**TH-H2 · Indicator 2.2 · Score 0.00 · Coverage: Horizontal · Since October 2020; February 2017; August 2017**
- **Instruments:**
  - DIP Guidelines on Procurement of Computer Programs (Software) and Use of Licensed Software by Government Agencies (แนวทางการจัดซื้อจัดจ้างโปรแกรมคอมพิวเตอร์ (Software: ซอฟต์แวร์) และการใช้งานซอฟต์แวร์ที่มีลิขสิทธิ์สำหรับหน่วยงานภาครัฐ)
  - PPSA Act B.E. 2560
  - MoF Regulation B.E. 2560
- **Held impact text:**
  - There is no requirement to surrender patents, source code or software to win tenders. Source-code, encryption and trade-secret terms depend on the agency–supplier agreement specified in the requirements.
  - Focal price ("ราคากลาง") under **s. 4 PPSA** is set in this order: (1) Focal Prices Committee calculation; (2) CGD supplies index-price database; (3) Budget Bureau or other central-agency standard price. (1) applies first; otherwise (2) or (3), with prime regard to the agency's interest.
  - The DIP guideline requires software procurement to follow PPSA **ss. 54–68 (Ch. 6)** and MoF Regulation **cl. 21–91 (Part 2, Ch. 2)**.
  - "Computer programs" include source code, application and utility software, packages, open-source, freeware, shareware, operating systems, and subscription and commercial software.
  - MDES sets the focal price and qualifications for computer programs.
- **References:**
  - https://www.ipthailand.go.th/images/3534/2564/Copyright/software_program_20201027.pdf
  - https://www.prakanedu.go.th/wp-content/uploads/2018/06/พัสดุ60.pdf (mirror)
  - http://www.gprocurement.go.th/wps/wcm/connect/eda28405-bf05-4684-91db-3daa2c859b2f/1_Regulation+of+the+Ministry+of+Finance_on+Public+Procurement+and+Supplies+Administration+%281%29.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-eda28405-bf05-4684-91db-3daa2c859b2f-mvEFIoZ
  - Backup: https://www.ipthailand.go.th/th/copyright-011/item/software_program_20201027.html
  - Backup: https://www.mdes.go.th/procurement/70?page=1
- **Verification:** Correct — maintain score and update text.

**TH-H3 · Indicator 2.2 · Score 0.00 · Coverage: Integrated circuits · Since May 2000**
- **Instrument:** Protection of Layout Designs of Integrated Circuits Act B.E. 2543.
- **Held impact text:** There is no requirement to disclose source code, software or design logic to participate in procurement. **s. 6** protects only original layout designs not commonly known in the industry, and covers the physical configuration only.
- **References:**
  - https://www.ipthailand.go.th/images/781/id_032.pdf
  - https://www.ipthailand.go.th/th/dip-law-2/item/protection-of-layout-designs-of-integrated-circuits-act-b-e-2543-2000.html

**TH-H4 · Indicator 2.3 · Score 1.00 · Coverage: Consultants · Since August 2017**
- **Instruments:**
  - PPSA Act B.E. 2560
  - MoF Regulation B.E. 2560
  - Ministerial Regulation Prescribing Criteria, Procedures and Conditions for Registration as Consultants B.E. 2560 (กฎกระทรวงกำหนดหลักเกณฑ์ วิธีการ และเงื่อนไขการขึ้นทะเบียนที่ปรึกษา พ.ศ. 2560)
- **Held impact text:**
  - **PPSA s. 73:** foreign consultants may tender for consultancy but must register with the MoF Consultants Information Centre. Exceptions: the Centre certifies in writing that no consultant offers the service, or the work is consultancy for a foreign State agency.
  - **MR cl. 4:** independent and juristic consultants eligible for registration must have **Thai nationality**.
  - **MoF Regulation cl. 101 (Ch. 3):** a foreign consultant may be procured only when necessary, with reasons in the procurement report. Thai personnel must join the team to transfer knowledge and technology, unless the field has no Thai personnel.
- **References:**
  - The two PPSA gprocurement URLs above (Thai + English)
  - http://www.finance.rmuti.ac.th/pr/cgd-2560.PDF (mirror)
  - The MoF Regulation English gprocurement URL above
  - http://www.gprocurement.go.th/wps/wcm/connect/adbbb1f2-397b-474e-9372-72e873da7ff5/กฎกระทรวงฉบับที่+5_การขึ้นทะเบียนที่ปรึกษา.PDF?MOD=AJPERES&CACHEID=ROOTWORKSPACE-adbbb1f2-397b-474e-9372-72e873da7ff5-lZtQ2qF
- **Held notes:**
  - As of 13 Dec 2022 there was no update to the PPSA, the Consultant Registration MR or the MoF Regulation.
  - Related source: https://saraban-law.cgd.go.th/easinetimage/inetdoc?id=show_CGD.W.20803_1_BCS_1_pdf
  - CGD maintains a mandatory registration system for business operators.
  - Consolidated procurement law: https://nia.or.th/law_procurement.html
- **Verification:** Correct — maintain score and update text.

**TH-H5 · Indicator 2.3 · Score 1.00 · Coverage: Thai Innovation List · Since January 2020, last amended September 2023; last reviewed February 2024**
- **Instruments:**
  - Ministerial Regulation Prescribing Supplies and Procurement Methods for Supplies that the State Must Promote or Support B.E. 2563 (กฎกระทรวงกำหนดพัสดุและวิธีการจัดซื้อจัดจ้างพัสดุที่รัฐต้องการส่งเสริมหรือสนับสนุน พ.ศ. 2563)
  - Budget Bureau Thai Innovation List
- **Held impact text:**
  - **Ch. 4.** "Innovation promotion goods" are goods or services on the Budget Bureau's Thai Innovation Registry, excluding medicines not classified in Group 5 (**cl. 11**). They are goods the State must promote or support (**cl. 12**).
  - Agencies must procure them using **not less than 70%** of the budget allocated for listed goods (**cl. 3**, as held). Single seller → direct negotiation (เฉพาะเจาะจง); two or more → selection (คัดเลือก).
  - Verification feedback substitutes **"not less than 30%"** of that budget, under **cl. 13**.
  - Context:
    - 2015 Cabinet resolutions grant privilege to Thai innovative products.
    - A monthly list has been published since 2016.
    - The list grants procurement privilege **only to authorised Thai majority-owned companies** (held claim).
    - Sectors covered include electrical, electronics and telecommunications.
    - It is designated a national agenda.
  - Other clauses noted:
    - **cl. 8**: teaching/learning products.
    - **cl. 9(8)**: batteries and battery-related supplies, by-products, and military/industrial battery products.
    - **cl. 10**: specific-method procurement for cl. 9(8) supplies.
- **References:**
  - https://alro.go.th/uploads/org/int_audit/files/ระเบียบพัสดุ/กฎกระทรวงกำหนดพัสดุและวิธีการจัดซื้อจัดจ้างที่รัฐต้องการส่งเสริมหรือสนับสนุน%20พ_ศ_%202563.pdf (mirror)
  - https://infocenter.oic.go.th/FILEWEB/CABINFOCENTER20/DRAWER007/GENERAL/DATA0000/00000706.PDF (mirror)
  - https://www.bb.go.th/topic3.php?gid=527&mid=290
- **Verification:** Not correct — maintain score, replace with the cl. 13 "not less than 30%" text.

**TH-H6 · Indicator 2.3 · Score 1.00 · Coverage: products manufactured in Thailand incl. electronics and digital goods (FTI "Made in Thailand") · Since December 2020; last reviewed February 2024**
- **Instruments:**
  - Ministerial Regulation … that the State Must Promote or Support (No. 2) B.E. 2563 (… ฉบับที่ 2 พ.ศ. 2563)
  - FTI Made in Thailand (MIT) list
- **Held impact text:**
  - **Ch. 7/1; cl. 27/1:** "domestically promoted supplies" means supplies holding an MIT certificate and mark issued by the Federation of Thai Industries.
  - **cl. 27/3** sets four rules:
    - (1) Agencies must procure MIT supplies. Exceptions: insufficient supply, limited suppliers, or foreign supplies being necessary, with higher-authority approval.
    - (2) Construction: **no less than 60%** domestic materials; steel **no less than 90%** of domestically promoted materials. If this can't be met, use other domestic materials; otherwise higher-authority approval is needed.
    - (3) Non-construction: **no less than 60%** of materials or equipment must be domestic. Where a foreign bidder is cheaper but a Thai bidder is **within 3%**, the Thai bidder must be selected.
    - (4) Contractors must report the domestic content they use.
- **References:**
  - http://www.ratchakitcha.soc.go.th/DATA/PDF/2563/A/104/T_0001.PDF
  - https://mit.fti.or.th
- **Held note:** Cabinet Resolutions 2015: นร 0505/356; กค 0421/21657; นร 0913/228 (given as "NOR/ROR 0505/356, GOR/KOR 0421/21657, NOR/ROR 0913/228").
- **Verification:** Not correct — wording must be "no less than", not "at least"; maintain score.

**TH-H7 · Indicator 2.3 · Score 1.00 · Coverage: Digital Promotion Goods · Since September 2023; last reviewed February 2025**
- **Instruments:**
  - Ministerial Regulation … that the State Must Promote or Support (No. 4) B.E. 2566 (… ฉบับที่ 4 พ.ศ. 2566)
  - DEPA Thailand Digital Catalog
- **Held impact text:**
  - **cl. 27/7:** digital promotion goods are those registered in DEPA's Digital Service Account and promoted on its website. They cover computer programs, software, hardware, smart devices, digital services, digital content and SaaS, plus embedded or microcontroller hardware certified under DEPA's digital standard.
  - **cl. 27/9:** single seller → direct negotiation; two or more → selection; otherwise public invitation.
  - DEPA catalogue registration requires a **registered office in Thailand**, a VAT registration certificate, and certification of the software, SaaS, smart hardware or digital device by recognised bodies.
- **References:**
  - https://infocenter.oic.go.th/FILEWEB/CABINFOCENTER20/DRAWER007/GENERAL/DATA0000/00000706.PDF (mirror)
  - https://www.depa.or.th/th/thailanddigitalcatalog/about
- **Verification:** Not correct — phrasing fix only; maintain score.

### A.2 Indonesia — held scores: 2.1 = **1**, 2.2 = **1**, 2.3 = **1** (2.4 not in the database)

**ID-H1 · Indicator 2.1 · Score 1.00 · Coverage: Horizontal · Since March 2018**
- **Instrument:** Presidential Regulation (Perpres) No. 16 of 2018 on Government Procurement of Goods/Services, and amendments. It replaced Perpres 54/2010.
- **Held impact text:**
  - Principles: transparent, open, effective, competitive, accountable, value for money.
  - **Art. 63:** foreign firms may join international tenders above these thresholds:
    - Rp 1 trillion for construction;
    - Rp 50 billion for goods and other services;
    - Rp 25 billion for consulting.
  - Below the thresholds, foreign firms may take part only where **no qualified domestic firm** exists. International tenders are announced on ministry / local-government websites and an international website.
  - **Art. 66:** domestic products are to be used, with imports allowed where goods are not produced domestically or domestic volume is insufficient.
  - The held text concludes that procurement "does not exclude foreign business actors in general", yet the score is 1.
- **Held notes:**
  - EC DG Trade 11th Report on potentially trade-restrictive measures (2014); Global Trade Alert state-act 4690.
  - Old text: Perpres 54/2010 **Art. 104** limited foreign firms to bidding in cooperation with a national company (unless none could supply), with thresholds of Rp 20 bn for goods/services and Rp 10 bn for consulting. Perpres 16/2018 Art. 63 raised these to Rp 50 bn / Rp 25 bn.
  - Art. 66 prioritises domestic products, especially those of micro and small enterprises and cooperatives.
- **Reference:** https://peraturan.bpk.go.id/Home/Details/73586/perpres-no-16-tahun-2018

**ID-H2 · Indicator 2.1 · Score 1.00 · Coverage: Horizontal · Since 30 March 2022**
- **Instrument:** Presidential Instruction (Inpres) No. 2 of 2022 on Accelerating the Increase in Use of Domestic Products and Products of Micro and Small Enterprises and Cooperatives to support the "Bangga Buatan Indonesia" movement in government procurement. The gold mislabels it "No. 22/2022".
- **Held impact text:** all government agencies must spend **at least 40%** of their budget on local MSME products.
- **Reference:** https://peraturan.bpk.go.id/Details/204320/inpres-no-2-tahun-2022

**ID-H3 · Indicator 2.1 · Score 1.00 · Coverage: Horizontal · Since July 2018 (amended February 2021); February 2021; September 2023**
- **Instruments:**
  - PP No. 29 of 2018 on Industrial Empowerment
  - PP No. 28 of 2021 on the Implementation of the Industrial Sector
  - PP No. 46 of 2023 amending PP 28/2021
- **Held impact text:**
  - **Art. 57** sets who must use domestic products:
    - State institutions, ministries, non-ministerial and other government institutions, and regional work units, when procurement is financed by APBN/APBD or by domestic or foreign loans or grants.
    - SOEs, other state legal entities, regional SOEs and private enterprises, when the procurement is financed by state or regional budgets, carried out under a government–business cooperation scheme, or involves exploiting state-controlled resources (incl. **telecommunications frequencies**).
  - **Art. 58:** the obligation applies at the planning and implementation stages, with annual needs plans.
  - **Art. 61:** domestic products are mandatory where **TKDN + BMP ≥ 40%**, with **TKDN ≥ 25%**.
  - **Art. 64:** price preference up to **25%** for goods with TKDN ≥ 25%, and up to **7.5%** for construction services by domestic companies.
- **References:**
  - https://peraturan.bpk.go.id/Details/89213/pp-no-29-tahun-2018
  - https://peraturan.bpk.go.id/Details/161862/pp-no-28-tahun-2021
  - https://peraturan.bpk.go.id/Details/265189/pp-no-46-tahun-2023

**ID-H4 · Indicator 2.1 · Score 1.00 · Coverage: Telecommunications · Since October 2009**
- **Instrument:** Regulation of the Minister of Communication and Informatics No. 41/PER/M.KOMINFO/10/2009 on Procedures for Assessing Domestic Component Levels (TKDN) in Telecommunications.
- **Held impact text:**
  - **Art. 1(4):** TKDN is the domestic share of goods, services or combinations used in telecom. It requires local manufacturing, fabrication, assembly, work and services, local experts and software.
  - **Art. 3(1)–(2):** TKDN capex formulas that separate out the foreign component.
  - **Art. 4(1)–(2):** proof of domestic expenditure, with TKDN authenticated by an authorised agency or a government-assigned independent surveyor.
  - **Art. 5:** verification of domestic components.
  - **Art. 6:** equipment with ≥ 50% local content counts as 100%.
- **References:**
  - https://peraturan.bpk.go.id/Details/159035/permenkominfo-no-41permkominfo102009-tahun-20
  - https://peraturan.infoasn.id/peraturan-menteri-perindustrian-nomor-102-m-ind-per-10-2009/ (secondary)

**ID-H5 · Indicator 2.1 · Score 1.00 · Coverage (as held): "Telecommunications" · Since March 2016**
- **Instrument:** Regulation of the Minister of Industry No. 15/M-IND/PER/3/2016 on Specification and Price Standards for Domestic Transmission Towers and Conductors to Accelerate Electricity Infrastructure.
- **Held impact text:**
  - **Art. 2:** products must meet standard specifications and standard prices.
  - **Art. 4:** benchmark pricing for domestic towers and conductors.
  - **Art. 6:** minimum **TKDN 40%**; only compliant products are eligible, at prices per Lampiran I–II.
  - **Art. 7:** TKDN verification and certification.
  - **Art. 8:** compliance monitoring.
- **Reference:** https://peraturan.bpk.go.id/Details/167005/permenperin-no-15m-indper32016-tahun-2016

**ID-H6 · Indicator 2.2 · Score 1.00 · Coverage: public-scope electronic system operators · Since October 2019**
- **Instrument:** Government Regulation (PP) No. 71 of 2019 on the Provision of Electronic Systems and Transactions.
- **Held impact text:**
  - **Art. 9(1), (3):** developers of custom software for public-scope electronic systems must submit **source code and documentation** to the public institution. If internal storage isn't feasible, they go to a trusted third party (escrow).
  - **Art. 15:** confidentiality, integrity and availability.
  - Predecessor PP 82/2012 **Arts. 8–9** (same duty; inspection only for investigation) was revoked by PP 71/2019 **Art. 103(2)**.
  - The held text notes that PP 71/2019 does not explicitly link this to procurement.
- **References:**
  - https://peraturan.bpk.go.id/Home/Details/122030/pp-no-71-tahun-2019
  - https://jdih.kominfo.go.id/produk_hukum/view/id/6/t/peraturan+pemerintah+republik+indonesia+nomor+82+tahun+2012

**ID-H7 · Indicator 2.3 · Score 1.00 · Coverage: Horizontal · Since July 2018 (amended February 2021); February 2021**
- **Instruments:** PP 29/2018; PP 28/2021.
- **Held impact text:** **Art. 63:** domestic service companies must be involved in procuring services or combined goods and services. They must be an SOE, a regional SOE, or a private company **> 50% owned by Indonesian citizens or entities**, domiciled and operating in Indonesia.
- **References:** the BPK URLs for PP 29/2018 and PP 28/2021 above.

**ID-H8 · Indicator 2.3 · Score 1.00 (two held rows) · Coverage: Horizontal · Since January 2014**
- **Instrument:** Regulation of the Minister of Industry No. 02/M-IND/PER/1/2014 on Guidelines for Increasing Use of Domestic Products in Government Procurement.
- **Held impact text:**
  - **Art. 16(1):** restricts foreign suppliers.
  - **Arts. 17, 20:** TKDN and BMP (BMP is based on the supplier's investment in Indonesia).
  - **Art. 10:** domestic service companies get priority. These must be established under Indonesian law, **> 50% Indonesian-owned** and have **two-thirds Indonesian board members**.
  - If none participate, companies **50–90% foreign-owned** may be considered.
  - **Arts. 3–4:** mandatory use and TKDN verification.
  - **Arts. 15–16:** foreign service companies may take part only when domestic or national companies are unavailable.
  - Price preferences apply for bidders with TKDN > 25% (or striving for ≥ 30%): up to **15% for goods** and up to **7.5% for services**.
- **References:**
  - https://bpbj.batam.go.id/wp-content/uploads/2022/06/Permenperin_No.02_2014_1.pdf (mirror)
  - http://jdih.kemenperin.go.id/site/baca_peraturan/1658
  - Global-regulation.com translation (secondary)
  - Global Trade Alert state-act 7568 (secondary)

**ID-H9 · Indicator 2.3 · Score 1.00 · Coverage: public-scope electronic system operators · Since October 2019**
- **Instrument:** PP 71/2019.
- **Held impact text:**
  - Public-scope ESOs must store electronic transaction data in Indonesia unless the technology is unavailable.
  - Public ESOs are (a) public bodies and (b) entities appointed to operate systems on their behalf.
  - Predecessor PP 82/2012 **Art. 17** required public-service ESOs to use a data centre and disaster-recovery centre in Indonesia. MOCI read "public service" broadly, which in practice affected private firms.
- **References:**
  - https://peraturan.bpk.go.id/Home/Details/122030/pp-no-71-tahun-2019
  - Lexology (secondary)
  - JDIH Kominfo PP 82/2012 (URL above)

**ID-H10 · Indicator 2.3 · Score 1.00 · Coverage: Telecommunication infrastructure · Since August 2020**
- **Instrument:** Regulation of the Minister of Finance No. 115/PMK.06/2020 on Utilization of State-Owned Assets. It replaced PMK 65/PMK.06/2016.
- **Held impact text:**
  - Foreign entities must establish an **Indonesian limited-liability company (PT)** before using state property to deliver PPP infrastructure projects, including telecom infrastructure. This has applied since 2016.
  - The held text calls this a liberalisation relative to earlier domestic-supplier prioritisation.
- **References:**
  - https://peraturan.bpk.go.id/Home/Details/144664/pmk-no-115pmk062020
  - Global Trade Alert state-act 7568 (secondary)

**ID-H11 · Indicator 2.3 · Score 1.00 · Coverage: "558 sub-sectors" · Since October 2009**
- **Instrument (as held):** Permenkominfo 41/PER/M.KOMINFO/10/2009. The **text actually describes Permenperin 49/2009 as amended by Permenperin 102/M-IND/PER/10/2009.**
- **Held impact text:**
  - Domestic products and services are required in government procurement across **558 sub-sectors**.
  - A domestic product is one produced or processed by a company operating in Indonesia; imported inputs are allowed.
  - **Art. 10:** domestic service provider = > 50% Indonesian shares and two-thirds Indonesian board.
  - **Arts. 8, 11:** minimum local content is a condition of eligibility.
- **Held note:** the researcher could not locate the "15%–96%" TKDN range.
- **References:**
  - https://peraturan.bpk.go.id/Details/159035/permenkominfo-no-41permkominfo102009-tahun-20
  - https://peraturan.infoasn.id/peraturan-menteri-perindustrian-nomor-102-m-ind-per-10-2009/ (secondary)

**ID-H12 · Indicator 2.3 · Score 1.00 · Coverage: transmission towers and steel-reinforced conductors · Since March 2016**
- **Instrument:** Permenperin 15/M-IND/PER/3/2016.
- **Held impact text:**
  - **Art. 6:** minimum **40% TKDN** for towers and conductors in public procurement.
  - The row also cites **"Arts. 57, 58, 61, 64"**: budget-funded procurement must use domestic products; TKDN + BMP eligibility thresholds; price preference up to 25% for TKDN ≥ 25%. **These articles belong to PP 29/2018**, not to this regulation.
- **Reference:** https://peraturan.bpk.go.id/Details/167005/permenperin-no-15m-indper32016-tahun-2016

**ID-H13 · Indicator 2.3 · Score 1.00 · Coverage: Horizontal · Since March 2022**
- **Instrument:** Inpres 2/2022 (held as "No. 22/2022").
- **Held impact text:**
  - "**Article 8**": prioritise domestic products with minimum TKDN 25%.
  - "**Article 15**": price preferences for sufficiently local products.
- **Held note:** the "7.5%–25%" range was not found and is to be raised in government data verification.
- **Reference:** https://peraturan.bpk.go.id/Details/204320/inpres-no-2-tahun-2022

**ID-H14 · Indicator 2.3 · Score 1.00 · Coverage: Horizontal · Since March 2018**
- **Instrument:** Perpres 16/2018 and amendment.
- **Held impact text:**
  - **Art. 63(3):** foreign firms in international tenders must **partner with national businesses** (consortium, subcontract or other partnership), e.g. to secure after-sales support.
  - **Art. 65:** micro and small enterprise participation, except packages needing technical capability MSEs lack.
- **Reference:** https://peraturan.bpk.go.id/Details/73586/perpres-no-16-tahun-2018
