# Deep-Research Brief — Round-2 Jurisdiction Packs (Thailand, India, Indonesia)

**Paste one economy-section at a time into GPT 5.6 Pro deep research.**
Goal: everything ClauseChain needs to author `configs/jurisdictions/<economy>.yaml`
and seed the corpus — same shape as our sg/my/au packs. Focus ONLY on RDTII
Pillar 6 (cross-border data flows) and Pillar 7 (domestic data protection).

---

## The questions (identical for every economy)

### A. Official sources (the pack's `portals` + `whitelist`)
1. What is the single most authoritative ONLINE repository of consolidated,
   in-force national legislation? (exact URL, operator, coverage, update lag)
2. Where are official gazettes published (new acts + amendments)? Exact URL,
   file format (HTML/native-PDF/scanned-PDF), and whether old gazettes are scanned images.
3. Which government bodies regulate data protection / cybersecurity /
   telecom / e-transactions, and what do their sites publish (subsidiary
   legislation, codes of practice, notifications)? Exact URLs.
4. Is there an official ENGLISH translation source? Who operates it, how much
   update-lag versus the native-language consolidated text, and what disclaimer
   does the government attach to translations?
5. Anti-bot behaviour: do these portals block simple HTTP GETs, need JS
   rendering, rate-limit, or geo-block? Anything known about robots.txt or
   published API endpoints?

### B. The laws themselves (the pack's `seed_acts`)
6. List every statute + subsidiary instrument relevant to P6/P7, each with:
   official name (native + English), act/law number, year, last-amendment year,
   consolidated-text URL, and which pillar/indicators it likely feeds.
   Expected families: data protection act; cybersecurity act; computer-crime /
   misuse act; e-transactions act; telecom act; consumer-protection (data
   clauses); sectoral retention rules (banking/health/telecom); any
   data-localisation rules; cross-border transfer rules (adequacy lists,
   SCC-equivalents, consent routes); treaty commitments (CPTPP/DEPA/RCEP
   e-commerce chapters, bilateral DEAs) in force for this economy.
7. Which of these exist ONLY in the native language? Which have official
   English versions, and are those versions current?
8. Are amendments published as consolidated re-issues or as stand-alone
   amendment acts the reader must merge mentally? (This decides our
   amendment-fallback behaviour.)

### C. Citation grammar (the pack's `citation` block)
9. How are provisions formally cited? (e.g. "Section 26(2)" vs "Article 26
   paragraph two" vs "มาตรา ๒๖"). Give the native-script pattern AND the
   romanised/English pattern, including subsection, paragraph, and schedule
   conventions, and numbering quirks (Thai numerals? bis/ter insertions?
   Indonesian "Pasal 26 ayat (2)"? Indian "Section 43A read with Rule 8"?).
10. How do official documents refer to the act itself in running text
    (short title conventions, B.E./A.D. years, "No. X of YYYY")?

### D. Legal-status verification (the pack's `status` assertions)
11. For each seed act: is it in force today? Cite the official page that proves
    current status (commencement notifications, repeal history). Flag anything
    repealed, replaced, or only partially commenced — with dates.
12. Any pending bills likely to change P6/P7 answers in 2026? (We must not cite
    bills as law — we need them on a warn-list.)

### E. Ground-truth spot checks (for our eval)
13. For 5 indicators of each pillar, name the ONE provision a careful lawyer
    would cite first, with exact article/section number and a 1-2 sentence
    verbatim quote in English (translated is fine, say so). This seeds our
    expected-anchor ledger — do not skip.

### Output format
Markdown. One section per question. Every claim carries its source URL.
Mark every URL as [OFFICIAL] / [SEMI-OFFICIAL] / [SECONDARY]. Never cite a
law-firm blog as the location of legal text — secondary sources are discovery
hints only.

---

## Economy-specific notes to include in the prompt

### Thailand
- Anchor sources to check first: laws.go.th (Office of the Council of State),
  ratchakitcha.soc.go.th (Royal Gazette), pdpc.or.th (PDPC), etda.or.th,
  onde.go.th, nbtc.go.th. Confirm which are current in mid-2026.
- PDPA B.E. 2562 (2019) + its subordinate notifications (cross-border rules
  came in waves 2023-2025 — enumerate every notification with dates).
- Computer Crime Act, Cybersecurity Act B.E. 2562, e-Transactions Act.
- Note Thai numerals + Buddhist-era years in citations; official English
  translations exist for some acts on laws.go.th — confirm currency.

### India
- Anchor sources: indiacode.nic.in, egazette.gov.in / egazette.nic.in,
  meity.gov.in, rbi.org.in (payment-data localisation directives!),
  trai.gov.in, cert-in.gov.in (2022 directions on logs/retention).
- DPDP Act 2023 — confirm which sections are IN FORCE in mid-2026 (the
  commencement schedule matters; rules were pending). IT Act 2000 + SPDI
  Rules 2011 status alongside DPDP. Telecommunications Act 2023 status.
- RBI payment-data localisation circular (2018) is a P6 mainstay — exact ref.
- Watch: many gazette PDFs are scanned; Hindi+English bilingual layout.

### Indonesia
- Anchor sources: peraturan.go.id, jdih networks (jdih.setneg.go.id and
  ministry JDIHs), kominfo.go.id / komdigi.go.id (confirm the ministry's
  2026 name), bssn.go.id, ojk.go.id (financial-sector data rules).
- PDP Law No. 27/2022 (grace period ended Oct 2024 — implementing regulation
  status in 2026?), GR 71/2019 (PSTE), MoCI Reg 5/2020 (private-scope ESOs),
  OJK/BI data rules, Law 11/2008 (ITE) as amended 2016/2024.
- Citation grammar: "Pasal X ayat (Y)"; official texts in Bahasa only —
  no official English; note which unofficial translations are tolerable
  as discovery hints.

---

## What Claude builds from the answers (so the researcher knows the bar)
- `configs/jurisdictions/th.yaml / in.yaml / id.yaml` — portals, whitelist,
  seed act list w/ URLs, citation regexes, status assertions, language +
  translation policy.
- Corpus build: fetch + archive every seed act (hash + access date), extract
  (native-text or OCR route), RuleUnits, graph load.
- KNOWN baseline from `ESCAP-RDTII-2.1_ Round 2 Database.xlsx` per-economy
  sheets; eval vs its gold rows.
- Answers must be precise enough that a wrong URL or a repealed act would be
  the researcher's error, not an ambiguity.
