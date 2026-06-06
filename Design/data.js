// ===========================================================
// ClauseChain — Mock Data
// Demo workspace: Bangladesh, Thailand, Singapore
// ===========================================================

const RDTII_PILLARS = {
  "6": {
    name: "Cross-Border Data Policies",
    mandatory: true,
    sub: {
      "6.1": "Data localization requirement",
      "6.2": "Conditional cross-border transfer",
      "6.3": "Adequacy / whitelist mechanism",
      "6.4": "Data subject consent for transfer",
    },
  },
  "7": {
    name: "Personal Data Protection",
    mandatory: true,
    sub: {
      "7.1": "Lawful basis for processing",
      "7.2": "Purpose limitation",
      "7.3": "Data subject rights",
      "7.4": "Breach notification",
      "7.5": "DPO / accountability",
    },
  },
  "8": {
    name: "Cybersecurity Obligations",
    mandatory: false,
    sub: {
      "8.1": "Critical infrastructure designation",
      "8.2": "Incident reporting",
    },
  },
  "9": {
    name: "Digital Identity",
    mandatory: false,
    sub: {
      "9.1": "National e-ID framework",
      "9.2": "Authentication standards",
    },
  },
  "12": {
    name: "Online Content Governance",
    mandatory: false,
    sub: {
      "12.1": "Content removal regime",
      "12.2": "Intermediary liability",
    },
  },
};

const JURISDICTIONS = [
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    flagFallback: "BD",
    languages: ["English", "Bengali"],
    instruments: 4,
    clauses: 287,
    verified: 198,
    pending: 41,
    rejected: 36,
    conflicts: 3,
    lastSync: "2026-05-20T08:42:00Z",
    lastSyncRel: "12m ago",
    coverage: {
      "6": { verified: 18, pending: 4, rejected: 3, total: 28 },
      "7": { verified: 22, pending: 6, rejected: 5, total: 36 },
      "8": { verified: 4, pending: 1, rejected: 0, total: 8 },
    },
  },
  {
    code: "TH",
    name: "Thailand",
    flag: "🇹🇭",
    flagFallback: "TH",
    languages: ["Thai", "English"],
    instruments: 3,
    clauses: 312,
    verified: 241,
    pending: 38,
    rejected: 28,
    conflicts: 1,
    lastSync: "2026-05-20T06:18:00Z",
    lastSyncRel: "2h ago",
    coverage: {
      "6": { verified: 22, pending: 3, rejected: 2, total: 28 },
      "7": { verified: 30, pending: 4, rejected: 2, total: 36 },
      "8": { verified: 6, pending: 1, rejected: 0, total: 8 },
    },
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    flagFallback: "SG",
    languages: ["English"],
    instruments: 5,
    clauses: 418,
    verified: 387,
    pending: 18,
    rejected: 13,
    conflicts: 0,
    lastSync: "2026-05-19T22:05:00Z",
    lastSyncRel: "11h ago",
    coverage: {
      "6": { verified: 26, pending: 1, rejected: 1, total: 28 },
      "7": { verified: 34, pending: 1, rejected: 1, total: 36 },
      "8": { verified: 7, pending: 1, rejected: 0, total: 8 },
      "9": { verified: 3, pending: 0, rejected: 0, total: 5 },
    },
  },
];

const DOCUMENTS = {
  BD: [
    {
      id: "BD-DSA-2018",
      title: "Digital Security Act 2018",
      type: "Act",
      languages: ["English", "Bengali"],
      pages: 42,
      clauses: 96,
      verified: 78,
      pending: 12,
      rejected: 6,
      conflicts: 1,
      updated: "2026-05-20T08:42:00Z",
      updatedRel: "12m ago",
      sourceUrl: "https://bdlaws.minlaw.gov.bd/act-1261.html",
      sourceHash: "a3f57c2eb19d44e9b1c2f8a47b9e2c0d6f4d3a8e7c5b9a1f3e2d8c4b6a5f9c2",
      authority: "Primary",
    },
    {
      id: "BD-PDPA-2023D",
      title: "Personal Data Protection Act 2023 (Draft)",
      type: "Amendment",
      languages: ["Bengali", "English"],
      pages: 28,
      clauses: 74,
      verified: 51,
      pending: 16,
      rejected: 7,
      conflicts: 2,
      updated: "2026-05-19T14:22:00Z",
      updatedRel: "1d ago",
      sourceUrl: "https://dpdt.portal.gov.bd/draft-pdpa-2023.pdf",
      sourceHash: "b8e91f24c3da55fa7d8e9c1b3a6f5d2e0c4b7a8f1d3e5c7b9a2f4d6e8c0a3b5",
      authority: "Primary",
    },
    {
      id: "BD-ICTA-2006",
      title: "Information & Communication Technology Act 2006",
      type: "Act",
      languages: ["English", "Bengali"],
      pages: 58,
      clauses: 84,
      verified: 56,
      pending: 8,
      rejected: 20,
      conflicts: 0,
      updated: "2026-05-18T11:00:00Z",
      updatedRel: "2d ago",
      sourceUrl: "https://bdlaws.minlaw.gov.bd/act-950.html",
      sourceHash: "c2d8e5f1b7a3946c0e2f5a8b1d4c7e9f2a5b8d1c4e7f0a3b6c9d2e5f8a1b4c7",
      authority: "Primary",
    },
    {
      id: "BD-BTRA-GL-2024",
      title: "BTRC Guidelines on Data Storage (2024)",
      type: "Guideline",
      languages: ["English"],
      pages: 12,
      clauses: 33,
      verified: 13,
      pending: 5,
      rejected: 3,
      conflicts: 0,
      updated: "2026-05-15T09:32:00Z",
      updatedRel: "5d ago",
      sourceUrl: "https://btrc.gov.bd/guidelines/data-storage-2024.pdf",
      sourceHash: "d9e0a1b2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f80192a3b4c5d6",
      authority: "Subordinate",
      binding: false,
    },
  ],
  TH: [
    {
      id: "TH-PDPA-2019",
      title: "Personal Data Protection Act B.E. 2562 (2019)",
      type: "Act",
      languages: ["Thai", "English"],
      pages: 64,
      clauses: 112,
      verified: 96,
      pending: 11,
      rejected: 5,
      conflicts: 0,
      updated: "2026-05-20T06:18:00Z",
      updatedRel: "2h ago",
      sourceUrl: "https://pdpc.or.th/pdpa-2019-en.pdf",
      sourceHash: "e1f2a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f7081920a3b4c5d6e7",
      authority: "Primary",
    },
    {
      id: "TH-CCA-2017",
      title: "Computer Crime Act B.E. 2550 (2007, amended 2017)",
      type: "Amendment",
      languages: ["Thai"],
      pages: 38,
      clauses: 102,
      verified: 78,
      pending: 16,
      rejected: 8,
      conflicts: 1,
      updated: "2026-05-19T16:00:00Z",
      updatedRel: "1d ago",
      sourceUrl: "https://ratchakitcha.soc.go.th/cca-2017.pdf",
      sourceHash: "f2a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f7081920a3b4c5d6e7f8",
      authority: "Amending",
    },
    {
      id: "TH-ETDA-2020",
      title: "ETDA Royal Decrees on Electronic Transactions",
      type: "Regulation",
      languages: ["Thai", "English"],
      pages: 21,
      clauses: 98,
      verified: 67,
      pending: 11,
      rejected: 15,
      conflicts: 0,
      updated: "2026-05-18T20:00:00Z",
      updatedRel: "2d ago",
      sourceUrl: "https://etda.or.th/royal-decrees-2020.pdf",
      sourceHash: "a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f7081920",
      authority: "Subordinate",
    },
  ],
  SG: [
    {
      id: "SG-PDPA-2012",
      title: "Personal Data Protection Act 2012 (as amended)",
      type: "Act",
      languages: ["English"],
      pages: 88,
      clauses: 134,
      verified: 128,
      pending: 4,
      rejected: 2,
      conflicts: 0,
      updated: "2026-05-19T22:05:00Z",
      updatedRel: "11h ago",
      sourceUrl: "https://sso.agc.gov.sg/Act/PDPA2012",
      sourceHash: "b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3",
      authority: "Primary",
    },
    {
      id: "SG-CSA-2018",
      title: "Cybersecurity Act 2018",
      type: "Act",
      languages: ["English"],
      pages: 62,
      clauses: 88,
      verified: 81,
      pending: 4,
      rejected: 3,
      conflicts: 0,
      updated: "2026-05-19T18:30:00Z",
      updatedRel: "14h ago",
      sourceUrl: "https://sso.agc.gov.sg/Act/CSA2018",
      sourceHash: "c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4",
      authority: "Primary",
    },
    {
      id: "SG-MAS-2020",
      title: "MAS Notice on Cross-Border Data Transfers",
      type: "Regulation",
      languages: ["English"],
      pages: 18,
      clauses: 64,
      verified: 60,
      pending: 3,
      rejected: 1,
      conflicts: 0,
      updated: "2026-05-15T10:12:00Z",
      updatedRel: "5d ago",
      sourceUrl: "https://mas.gov.sg/notice-data-transfer-2020.pdf",
      sourceHash: "d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5",
      authority: "Subordinate",
    },
  ],
};

// Document outline + classifications for BD-DSA-2018 (the hero document)
const DOC_DETAIL_BDDSA = {
  id: "BD-DSA-2018",
  title: "Digital Security Act 2018",
  jurisdiction: "Bangladesh",
  jurisdictionCode: "BD",
  language: "English (with Bengali parallel text)",
  sourceUrl: "https://bdlaws.minlaw.gov.bd/act-1261.html",
  sourceHash: "a3f57c2eb19d44e9b1c2f8a47b9e2c0d6f4d3a8e7c5b9a1f3e2d8c4b6a5f9c2",
  lastProcessed: "2026-05-20T08:42:00Z",
  lastProcessedRel: "12m ago",
  pages: 42,
  outline: [
    {
      type: "part", number: "I", title: "Preliminary",
      children: [
        { id: "s1",  type: "section", number: "1",  title: "Short title and commencement", status: "verified", pillar: null },
        { id: "s2",  type: "section", number: "2",  title: "Definitions", status: "verified", pillar: null },
      ],
    },
    {
      type: "part", number: "II", title: "Digital Security Agency",
      children: [
        { id: "s5",  type: "section", number: "5",  title: "Establishment of Agency", status: "verified", pillar: "8.1" },
        { id: "s8",  type: "section", number: "8",  title: "Powers of the Director General", status: "verified", pillar: "8.1" },
      ],
    },
    {
      type: "part", number: "V", title: "Crimes and Punishments",
      children: [
        { id: "s24", type: "section", number: "24", title: "Identity fraud", status: "verified", pillar: "7.1" },
        { id: "s25", type: "section", number: "25", title: "Publishing offensive information", status: "pending", pillar: "12.1" },
        { id: "s26", type: "section", number: "26", title: "Punishment for publishing identity-related information",
          active: true, status: "verified", pillar: "6.1" },
        { id: "s27", type: "section", number: "27", title: "Cyber-terrorism", status: "verified", pillar: "8.2" },
        { id: "s28", type: "section", number: "28", title: "Hurting religious values", status: "rejected", pillar: null,
          rejectionGate: "Gate 2 (NLI Entailment)" },
        { id: "s29", type: "section", number: "29", title: "Defamation", status: "pending", pillar: "12.1" },
        { id: "s30", type: "section", number: "30", title: "Identity-related crimes with computer", status: "verified", pillar: "7.1" },
        { id: "s31", type: "section", number: "31", title: "Disturbing law and order", status: "verified", pillar: null },
        { id: "s32", type: "section", number: "32", title: "Breach of secrecy", status: "verified", pillar: "7.2" },
        { id: "s33", type: "section", number: "33", title: "Hacking offences", status: "verified", pillar: "8.2", conflict: true },
        { id: "s34", type: "section", number: "34", title: "Illegal entry into critical infrastructure", status: "verified", pillar: "8.1" },
      ],
    },
    {
      type: "part", number: "VI", title: "Investigation, Trial and Appeal",
      children: [
        { id: "s40", type: "section", number: "40", title: "Investigation procedure", status: "pending", pillar: null },
        { id: "s43", type: "section", number: "43", title: "Search, seizure and arrest", status: "rejected", pillar: null,
          rejectionGate: "Gate 3 (Structural Plausibility)" },
      ],
    },
  ],
  // Active classification — Section 26(1), the hero example
  classification: {
    clauseId: "s26",
    sectionNumber: "26(1)",
    title: "Punishment for publishing identity-related information",
    pillar: "6.1",
    pillarLabel: "Pillar 6.1 — Data Localization Requirement",
    status: "verified",
    confidence: 0.94,
    hash: "a3f57c2eb19d44e9b1c2f8a47b9e2c0d6f4d3a8e7c5b9a1f3e2d8c4b6a5f9c2",
    verbatimSpan:
      "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.",
    principalRule:
      "Identity-related personal data — including biometric, photographic, financial and registry data — must be stored within the geographic boundaries of Bangladesh.",
    exceptions: [
      "Lawful authority of a competent court or tribunal",
      "Express written consent of the data subject for a specified purpose",
    ],
    conditions: [
      "Storage facility must be physically located in Bangladesh",
      "Cross-border processing requires prior approval from the Digital Security Agency",
    ],
    gates: [
      { name: "Span Match",            kind: "lexical", status: "pass", value: "exact", detail: "0 edits · source matched character-for-character" },
      { name: "NLI Entailment",        kind: "semantic", status: "pass", value: "0.94",   detail: "DeBERTa-v3 entailment score, threshold 0.70" },
      { name: "Structural Plausibility", kind: "structural", status: "pass", value: "passed", detail: "§26(1) exists in instrument · predicates present" },
    ],
    provenance: {
      instrument: "BD-DSA-2018",
      section: "§26(1)",
      page: 14,
      charOffset: "[12453, 12527]",
      bbox: "[72, 248, 540, 286]",
      retrievedAt: "2026-05-20T08:42:11Z",
      sourceUrl: "https://bdlaws.minlaw.gov.bd/act-1261/section-46556.html",
      sha256: "a3f57c2eb19d44e9b1c2f8a47b9e2c0d6f4d3a8e7c5b9a1f3e2d8c4b6a5f9c2",
    },
  },
  rejected: {
    clauseId: "s28",
    sectionNumber: "28",
    title: "Hurting religious values",
    proposedPillar: "12.1",
    proposedPillarLabel: "Pillar 12.1 — Content removal regime",
    status: "rejected",
    failedGate: "Gate 2 (NLI Entailment)",
    verbatimSpan:
      "Whoever publishes or broadcasts any propaganda or campaign against any religion through any website or any electronic form which hurts the religious value or sentiment, shall be punished with imprisonment for a term not exceeding ten (10) years…",
    gates: [
      { name: "Span Match", status: "pass", value: "exact", detail: "0 edits · source matched" },
      { name: "NLI Entailment", status: "fail", value: "0.15", detail: "Below 0.70 threshold · span does not entail claim" },
      { name: "Structural Plausibility", status: "fail", value: "0 predicates", detail: "No content-removal operative predicates found" },
    ],
  },
};

// Activity feed
const ACTIVITY = [
  { id: "a1",  type: "verified", desc: "Section 26(1) of BD-DSA-2018 verified for Pillar 6.1",  hash: "a3f5…b9c2", ts: "2m ago",  href: { page: "doc", country: "BD", doc: "BD-DSA-2018" } },
  { id: "a2",  type: "rejected", desc: "Section 28 of BD-DSA-2018 rejected — NLI gate 0.15",   hash: "7e91…44fa", ts: "4m ago",  href: { page: "doc", country: "BD", doc: "BD-DSA-2018" } },
  { id: "a3",  type: "ingested", desc: "Crawled MAS Notice 626 (Singapore) · 18 pages",        hash: "d7e8…c4d5", ts: "12m ago", href: { page: "jurisdiction", country: "SG" } },
  { id: "a4",  type: "conflict", desc: "Conflict detected: BD-DSA §33 vs. BD-ICTA §54",         hash: "9bca…2c1f", ts: "28m ago", href: { page: "doc", country: "BD", doc: "BD-DSA-2018" } },
  { id: "a5",  type: "verified", desc: "Thai PDPA §28 verified for Pillar 6.2",                 hash: "e1f2…d6e7", ts: "41m ago", href: { page: "doc", country: "TH", doc: "TH-PDPA-2019" } },
  { id: "a6",  type: "rejected", desc: "BD-ICTA §57 rejected — Gate 1 Span Match (fuzzy 4 edits)", hash: "c2d8…b4c7", ts: "1h ago",  href: { page: "doc", country: "BD", doc: "BD-ICTA-2006" } },
  { id: "a7",  type: "ingested", desc: "OCR pass complete: TH-CCA-2017 (38 pages, Thai)",        hash: "f2a3…81f8", ts: "2h ago",  href: { page: "doc", country: "TH", doc: "TH-CCA-2017" } },
  { id: "a8",  type: "verified", desc: "SG-PDPA §26 verified for Pillar 6.2 (Adequacy)",         hash: "b5c6…2b3", ts: "3h ago",   href: { page: "doc", country: "SG", doc: "SG-PDPA-2012" } },
  { id: "a9",  type: "crawl",    desc: "Re-crawl started: bdlaws.minlaw.gov.bd (4 documents)",   hash: "—",          ts: "5h ago",   href: { page: "jurisdiction", country: "BD" } },
];

// Pipeline jobs (live)
const PIPELINE_JOBS = [
  { id: "j1", stage: "Crawler",    name: "etda.or.th — royal decrees", progress: 64, status: "running" },
  { id: "j2", stage: "OCR",        name: "TH-CCA-2017 — page 27/38",   progress: 71, status: "running" },
  { id: "j3", stage: "Classifier", name: "BD-PDPA-2023D · batch 4/9",  progress: 44, status: "running" },
  { id: "j4", stage: "Verifier",   name: "CVR loop · 18 pending",      progress: 22, status: "running" },
];

const LIVE_LOG = [
  { ts: "08:42:11", lvl: "ok",   text: "Gate 3 passed · §26(1) · predicates {stored within, not transferred} matched" },
  { ts: "08:42:09", lvl: "info", text: "NLI entailment(§26(1) ⊨ 6.1) = 0.94 · DeBERTa-v3" },
  { ts: "08:42:07", lvl: "info", text: "Span Match exact · char_offset [12453, 12527]" },
  { ts: "08:42:04", lvl: "info", text: "Classifier emitted JSON · pillar=6.1 · confidence=0.94" },
  { ts: "08:41:58", lvl: "err",  text: "REJECT §28 · NLI=0.15 · routed to human review" },
  { ts: "08:41:52", lvl: "info", text: "BGE-M3 retrieval · k=12 · query=‘cross-border data transfer’" },
  { ts: "08:41:47", lvl: "warn", text: "OCR consensus: Tesseract/Qwen disagreement on 4 tokens, page 14" },
  { ts: "08:41:33", lvl: "info", text: "Loaded BD-DSA-2018 · 42 pages · 96 clauses · lang=en+bn" },
];

// Ledger
const LEDGER_ENTRIES = [
  { entryNo: 18429, type: "VERIFIED",     desc: "§26(1) of BD-DSA-2018 verified for Pillar 6.1", ownHash: "a3f57c2e…b9c2", prevHash: "9bca31d7…2c1f", ts: "2026-05-20T08:42:11Z", actor: "system" },
  { entryNo: 18428, type: "REJECTED",     desc: "§28 of BD-DSA-2018 rejected · Gate 2 NLI=0.15", ownHash: "7e91a8d2…44fa", prevHash: "5dc41e93…7eaa", ts: "2026-05-20T08:41:58Z", actor: "system" },
  { entryNo: 18427, type: "INGESTED",     desc: "MAS Notice 626 (SG) ingested · 18 pages",        ownHash: "d7e8f901…c4d5", prevHash: "c2d8e5f1…b4c7", ts: "2026-05-20T08:30:14Z", actor: "system" },
  { entryNo: 18426, type: "CONFLICT",     desc: "Conflict logged: BD-DSA §33 vs. BD-ICTA §54",   ownHash: "9bca31d7…2c1f", prevHash: "8aa72c4e…d109", ts: "2026-05-20T08:14:08Z", actor: "system" },
  { entryNo: 18425, type: "HUMAN_EDIT",   desc: "Reviewer edited verbatim_span on TH-PDPA §28",   ownHash: "5dc41e93…7eaa", prevHash: "4cb30d82…6e99", ts: "2026-05-20T08:00:22Z", actor: "n.tan@un-pdpa" },
  { entryNo: 18424, type: "VERIFIED",     desc: "TH-PDPA §28 verified for Pillar 6.2",            ownHash: "e1f2a3b4…d6e7", prevHash: "3ba20c71…5d88", ts: "2026-05-20T07:55:01Z", actor: "system" },
  { entryNo: 18423, type: "REJECTED",     desc: "BD-ICTA §57 rejected · Gate 1 Span Match",       ownHash: "8aa72c4e…d109", prevHash: "2a91fb60…4c77", ts: "2026-05-20T06:18:33Z", actor: "system" },
  { entryNo: 18422, type: "INGESTED",     desc: "TH-CCA-2017 OCR complete · 38 pages (Thai)",    ownHash: "f2a3b4c5…81f8", prevHash: "1f80ea59…3b66", ts: "2026-05-20T05:55:00Z", actor: "system" },
  { entryNo: 18421, type: "CRAWL",        desc: "Re-crawl scheduled: bdlaws.minlaw.gov.bd",       ownHash: "4cb30d82…6e99", prevHash: "0e7fd948…2a55", ts: "2026-05-20T03:00:00Z", actor: "system" },
  { entryNo: 18420, type: "VERIFIED",     desc: "SG-PDPA §26 verified for Pillar 6.2",            ownHash: "b5c6d7e8…2b3", prevHash: "0e7fd948…2a55", ts: "2026-05-20T01:14:11Z", actor: "system" },
];

// CVR rejection breakdown
const REJECTIONS = {
  total: 77,
  byGate: [
    { gate: "Gate 1 — Span Match",            count: 18, pct: 23, color: "var(--info)" },
    { gate: "Gate 2 — NLI Entailment",        count: 41, pct: 53, color: "var(--warning)" },
    { gate: "Gate 3 — Structural Plausibility", count: 18, pct: 24, color: "var(--danger)" },
  ],
};

// Cells for the matrix — rows = jurisdictions × pillars/sub-criteria
function makeMatrixData() {
  // jurisdiction code → sub_criterion_id → { status, count, conflict? }
  return {
    BD: {
      "6.1": { status: "verified", count: 7,  conflict: false },
      "6.2": { status: "partial",  count: 4,  conflict: false },
      "6.3": { status: "rejected", count: 2,  conflict: false },
      "6.4": { status: "verified", count: 5,  conflict: false },
      "7.1": { status: "verified", count: 6,  conflict: false },
      "7.2": { status: "verified", count: 4,  conflict: false },
      "7.3": { status: "pending",  count: 3,  conflict: false },
      "7.4": { status: "partial",  count: 3,  conflict: false },
      "7.5": { status: "rejected", count: 1,  conflict: false },
      "8.1": { status: "verified", count: 3,  conflict: false },
      "8.2": { status: "conflict", count: 4,  conflict: true  },
    },
    TH: {
      "6.1": { status: "verified", count: 5,  conflict: false },
      "6.2": { status: "verified", count: 7,  conflict: false },
      "6.3": { status: "verified", count: 3,  conflict: false },
      "6.4": { status: "verified", count: 6,  conflict: false },
      "7.1": { status: "verified", count: 8,  conflict: false },
      "7.2": { status: "verified", count: 6,  conflict: false },
      "7.3": { status: "verified", count: 5,  conflict: false },
      "7.4": { status: "verified", count: 4,  conflict: false },
      "7.5": { status: "partial",  count: 3,  conflict: false },
      "8.1": { status: "verified", count: 4,  conflict: false },
      "8.2": { status: "conflict", count: 5,  conflict: true  },
    },
    SG: {
      "6.1": { status: "verified", count: 8,  conflict: false },
      "6.2": { status: "verified", count: 9,  conflict: false },
      "6.3": { status: "verified", count: 6,  conflict: false },
      "6.4": { status: "verified", count: 7,  conflict: false },
      "7.1": { status: "verified", count: 9,  conflict: false },
      "7.2": { status: "verified", count: 7,  conflict: false },
      "7.3": { status: "verified", count: 8,  conflict: false },
      "7.4": { status: "verified", count: 6,  conflict: false },
      "7.5": { status: "verified", count: 5,  conflict: false },
      "8.1": { status: "verified", count: 5,  conflict: false },
      "8.2": { status: "verified", count: 6,  conflict: false },
      "9.1": { status: "verified", count: 3,  conflict: false },
      "9.2": { status: "pending",  count: 1,  conflict: false },
    },
  };
}

// Seed registry URLs (for Add Jurisdiction modal)
const SEED_REGISTRY = {
  BD: [
    { url: "https://bdlaws.minlaw.gov.bd", status: "ok" },
    { url: "https://dpdt.portal.gov.bd",   status: "ok" },
    { url: "https://btrc.gov.bd",          status: "warn" },
    { url: "https://bcc.gov.bd",           status: "ok" },
  ],
  TH: [
    { url: "https://ratchakitcha.soc.go.th", status: "ok" },
    { url: "https://pdpc.or.th",             status: "ok" },
    { url: "https://etda.or.th",             status: "ok" },
  ],
  SG: [
    { url: "https://sso.agc.gov.sg", status: "ok" },
    { url: "https://pdpc.gov.sg",    status: "ok" },
    { url: "https://mci.gov.sg",     status: "ok" },
  ],
};

// Cross-source-conflict example for the Conflict Resolution modal
const SAMPLE_CONFLICT = {
  clause: "Cross-border transfer of biometric data",
  sources: [
    {
      label: "A",
      instrument: "BD-DSA-2018",
      title: "Digital Security Act 2018",
      authority: "Primary",
      date: "2018-10-08",
      verbatim: "Any person…shall not save such data…outside the geographic boundaries of Bangladesh.",
      classification: "Pillar 6.1 — Data Localization Requirement",
      hash: "a3f57c2e…b9c2",
    },
    {
      label: "B",
      instrument: "BD-PDPA-2023D",
      title: "Personal Data Protection Act 2023 (Draft)",
      authority: "Amending",
      date: "2023-08-14",
      verbatim: "A data controller may transfer personal data outside Bangladesh provided the recipient jurisdiction offers an adequate level of protection…",
      classification: "Pillar 6.2 — Conditional Cross-Border Transfer",
      hash: "b8e91f24…a3b5",
    },
  ],
  recommendation: {
    winner: "B",
    rationale: "Amending instrument with a later effective date (2023-08-14 > 2018-10-08) supersedes the original prohibition for affected provisions.",
  },
};

// ===========================================================
// PIPELINE PAGES DATA (Pages 6–10)
// ===========================================================

// Active pipeline run (used across pages 6-9)
const PIPELINE_RUNS = [
  {
    id: "run-BD-001",
    name: "Bangladesh · Full re-ingest",
    jurisdiction: "BD",
    startedAt: "2026-05-23T09:12:00Z",
    status: "active",
    currentStep: "separate",
    steps: [
      { id: "discover", label: "Discover",  status: "done",   completedAt: "2026-05-23T09:14:32Z", pages: 52 },
      { id: "harvest",  label: "Harvest",   status: "done",   completedAt: "2026-05-23T09:18:44Z", docs: 14  },
      { id: "separate", label: "Separate",  status: "active", progress: 67 },
      { id: "convert",  label: "Convert",   status: "queued" },
      { id: "ocr",      label: "OCR",       status: "queued" },
      { id: "embed",    label: "Embed",     status: "queued" },
      { id: "map",      label: "Map",       status: "queued" },
      { id: "verify",   label: "Verify",    status: "queued" },
    ],
  },
];

// Real-time crawl stream (Page 6)
const CRAWL_STREAM = [
  { id: "cs-01", url: "https://bdlaws.minlaw.gov.bd/act-1261.html",       status: "fetched",  type: "html",        size: "142 KB", confidence: 0.96, ts: "09:12:04" },
  { id: "cs-02", url: "https://bdlaws.minlaw.gov.bd/act-1261.pdf",        status: "fetched",  type: "native-pdf",  size: "2.1 MB", confidence: 0.97, ts: "09:12:05" },
  { id: "cs-03", url: "https://bdlaws.minlaw.gov.bd/act-950.html",        status: "fetched",  type: "html",        size: "218 KB", confidence: 0.88, ts: "09:12:07" },
  { id: "cs-04", url: "https://btrc.gov.bd/robots.txt",                   status: "skipped",  type: "robots",      size: "—",      confidence: null, ts: "09:12:08" },
  { id: "cs-05", url: "https://dpdt.portal.gov.bd/draft-pdpa-2023.pdf",   status: "fetched",  type: "native-pdf",  size: "1.4 MB", confidence: 0.94, ts: "09:12:11" },
  { id: "cs-06", url: "https://moca.gov.bd/login.php",                    status: "blocked",  type: "login-wall",  size: "—",      confidence: null, ts: "09:12:14", note: "Login-walled — needs manual retrieval" },
  { id: "cs-07", url: "https://btrc.gov.bd/guidelines/data-storage-2024", status: "fetched",  type: "html",        size: "118 KB", confidence: 0.91, ts: "09:12:16" },
  { id: "cs-08", url: "https://dpdt.portal.gov.bd/press/2024-03.html",    status: "fetched",  type: "html",        size: "42 KB",  confidence: 0.41, ts: "09:12:18" },
  { id: "cs-09", url: "https://btrc.gov.bd/circulars/2019-data.pdf",      status: "fetched",  type: "scanned-pdf", size: "4.7 MB", confidence: 0.72, ts: "09:12:21" },
  { id: "cs-10", url: "https://mopa.gov.bd/gazette/2022-amend.pdf",       status: "fetched",  type: "scanned-pdf", size: "6.1 MB", confidence: 0.61, ts: "09:12:24" },
  { id: "cs-11", url: "https://bcc.gov.bd/captcha-gate/",                 status: "blocked",  type: "captcha",     size: "—",      confidence: null, ts: "09:12:28", note: "CAPTCHA detected — cannot bypass" },
  { id: "cs-12", url: "https://blc.gov.bd/data-policy.html",              status: "fetched",  type: "html",        size: "78 KB",  confidence: 0.68, ts: "09:12:31" },
];

// Harvested documents for triage (Page 7)
const HARVESTED_DOCS = [
  { id: "hd-001", type: "native-pdf",  title: "Digital Security Act 2018",                   url: "https://bdlaws.minlaw.gov.bd/act-1261.pdf",              pages: 42,  size: "2.1 MB",  lang: "English",           jurisdiction: "BD", confidence: 0.97, flags: [],                keep: true  },
  { id: "hd-002", type: "native-pdf",  title: "Personal Data Protection Act 2023 (Draft)",   url: "https://dpdt.portal.gov.bd/draft-pdpa-2023.pdf",         pages: 28,  size: "1.4 MB",  lang: "Bengali · English",  jurisdiction: "BD", confidence: 0.94, flags: ["draft"],          keep: true  },
  { id: "hd-003", type: "native-pdf",  title: "ICT Act 2006",                                url: "https://bdlaws.minlaw.gov.bd/act-950.pdf",               pages: 58,  size: "3.2 MB",  lang: "English · Bengali",  jurisdiction: "BD", confidence: 0.88, flags: [],                keep: true  },
  { id: "hd-004", type: "scanned-pdf", title: "BTRC Data Circular 2019 (scanned)",           url: "https://btrc.gov.bd/circulars/2019-data.pdf",            pages: 8,   size: "4.7 MB",  lang: "Bengali",            jurisdiction: "BD", confidence: 0.72, flags: [],                keep: true  },
  { id: "hd-005", type: "scanned-pdf", title: "Ministry Gazette 2022 — Amendments",          url: "https://mopa.gov.bd/gazette/2022-amend.pdf",             pages: 12,  size: "6.1 MB",  lang: "Bengali",            jurisdiction: "BD", confidence: 0.61, flags: [],                keep: false },
  { id: "hd-006", type: "html",        title: "BTRC Guidelines — Data Storage 2024",         url: "https://btrc.gov.bd/guidelines/data-storage-2024",       pages: null, size: "118 KB", lang: "English",            jurisdiction: "BD", confidence: 0.91, flags: [],                keep: true  },
  { id: "hd-007", type: "html",        title: "DPDT Press Release (March 2024)",             url: "https://dpdt.portal.gov.bd/press/2024-03.html",          pages: null, size: "42 KB",  lang: "English",            jurisdiction: "BD", confidence: 0.41, flags: ["press-release"],  keep: false },
  { id: "hd-008", type: "html",        title: "Bangladesh Law Commission — Data Policy Overview", url: "https://blc.gov.bd/data-policy.html",              pages: null, size: "78 KB",  lang: "English",            jurisdiction: "BD", confidence: 0.68, flags: [],                keep: true  },
  { id: "hd-009", type: "docx",        title: "DSA Implementation Guidelines (Word)",        url: "https://moca.gov.bd/docs/dsa-impl.docx",                pages: 18,  size: "890 KB",  lang: "English",            jurisdiction: "BD", confidence: 0.85, flags: ["guideline"],      keep: true  },
  { id: "hd-010", type: "markdown",    title: "BTRC — Summary of Data Requirements",         url: "https://btrc.gov.bd/summary.md",                        pages: null, size: "24 KB",  lang: "English",            jurisdiction: "BD", confidence: 0.76, flags: [],                keep: true  },
  { id: "hd-011", type: "table",       title: "RDTII Indicator Mapping Table (CSV)",         url: "https://dpdt.portal.gov.bd/rdtii-bd.csv",               pages: null, size: "12 KB",  lang: "English",            jurisdiction: "BD", confidence: 0.93, flags: [],                keep: true  },
  { id: "hd-012", type: "html",        title: "Digital Literacy Manual 2023",                url: "https://ictd.gov.bd/manual-2023.html",                  pages: null, size: "312 KB", lang: "Bengali · English",  jurisdiction: "BD", confidence: 0.34, flags: ["irrelevant"],     keep: false },
  { id: "hd-013", type: "other",       title: "BTRC Logo Pack (ZIP)",                        url: "https://btrc.gov.bd/assets/logo.zip",                   pages: null, size: "1.2 MB", lang: "—",                  jurisdiction: "BD", confidence: 0.08, flags: ["irrelevant"],     keep: false },
  { id: "hd-014", type: "native-pdf",  title: "Bangladesh E-Commerce Policy 2024",          url: "https://moca.gov.bd/ecom-policy-2024.pdf",              pages: 24,  size: "1.1 MB",  lang: "English",            jurisdiction: "BD", confidence: 0.79, flags: [],                keep: true  },
];

// OCR Consensus Diff — Page 8.1
const OCR_CONSENSUS = {
  docId: "BD-DSA-2018", docTitle: "Digital Security Act 2018",
  page: 14, totalRegions: 48, agreed: 44, disagreed: 4,
  regions: [
    { id: "r1",  status: "agree",    lang: "en", confidence: 0.99,
      qwen: "Any person who, intentionally or knowingly without lawful authority,",
      tesseract: "Any person who, intentionally or knowingly without lawful authority," },
    { id: "r2",  status: "disagree", lang: "en", confidence: 0.77, editDistance: 1,
      qwen: "collects, sells, takes possession of, supplies or uses any",
      tesseract: "col1ects, sells, takes possession of, supplies or uses any",
      resolved: "collects, sells, takes possession of, supplies or uses any",
      candidateA: { model: "Qwen2-VL", text: "collects", confidence: 0.94 },
      candidateB: { model: "Tesseract", text: "col1ects", confidence: 0.61 } },
    { id: "r3",  status: "agree",    lang: "en", confidence: 0.98,
      qwen: "person's identity-related information, shall not save such data,",
      tesseract: "person's identity-related information, shall not save such data," },
    { id: "r4",  status: "disagree", lang: "en", confidence: 0.77, editDistance: 2,
      qwen: "including biometric information, photographs, financial records",
      tesseract: "including biometric infomation, photographs, financial records",
      resolved: "including biometric information, photographs, financial records",
      candidateA: { model: "Qwen2-VL", text: "information", confidence: 0.96 },
      candidateB: { model: "Tesseract", text: "infomation", confidence: 0.58 } },
    { id: "r5",  status: "agree",    lang: "en", confidence: 0.97,
      qwen: "or registry information, outside the geographic boundaries of Bangladesh.",
      tesseract: "or registry information, outside the geographic boundaries of Bangladesh." },
    { id: "r6",  status: "agree",    lang: "bn", confidence: 0.89,
      qwen: "যে কোনো ব্যক্তি যিনি ইচ্ছাকৃতভাবে বা জেনেশুনে বৈধ কর্তৃত্ব ব্যতীত",
      tesseract: "যে কোনো ব্যক্তি যিনি ইচ্ছাকৃতভাবে বা জেনেশুনে বৈধ কর্তৃত্ব ব্যতীত" },
    { id: "r7",  status: "disagree", lang: "bn", confidence: 0.79, editDistance: 1,
      qwen: "সংগ্রহ করে, বিক্রয় করে, দখলে নেয়, সরবরাহ করে বা ব্যবহার করে",
      tesseract: "সংগ্ৰহ করে, বিক্রয় করে, দখলে নেয়, সরবরাহ করে বা ব্যবহার করে",
      resolved: "সংগ্রহ করে, বিক্রয় করে, দখলে নেয়, সরবরাহ করে বা ব্যবহার করে",
      candidateA: { model: "Qwen2-VL", text: "সংগ্রহ", confidence: 0.91 },
      candidateB: { model: "Tesseract", text: "সংগ্ৰহ", confidence: 0.67 } },
    { id: "r8",  status: "agree",    lang: "bn", confidence: 0.93,
      qwen: "কোনো ব্যক্তির পরিচয়-সংক্রান্ত তথ্য, বাংলাদেশের ভৌগোলিক সীমানার বাইরে সংরক্ষণ করবেন না।",
      tesseract: "কোনো ব্যক্তির পরিচয়-সংক্রান্ত তথ্য, বাংলাদেশের ভৌগোলিক সীমানার বাইরে সংরক্ষণ করবেন না।" },
    { id: "r9",  status: "disagree", lang: "bn", confidence: 0.71, editDistance: 3,
      qwen: "আইনগত কর্তৃপক্ষ ছাড়া বায়োমেট্রিক তথ্য সংগ্রহ করা নিষিদ্ধ।",
      tesseract: "আইনগত কর্তৃপক্ষ ছাড়া বাযোমেট্রিক তথ্য সংগ্রহ করা নিষিদ্ধ।",
      resolved: "আইনগত কর্তৃপক্ষ ছাড়া বায়োমেট্রিক তথ্য সংগ্রহ করা নিষিদ্ধ।",
      candidateA: { model: "Qwen2-VL", text: "বায়োমেট্রিক", confidence: 0.88 },
      candidateB: { model: "Tesseract", text: "বাযোমেট্রিক", confidence: 0.54 } },
    { id: "r10", status: "agree",    lang: "en", confidence: 0.96,
      qwen: "Punishment: imprisonment for a term not exceeding seven (7) years",
      tesseract: "Punishment: imprisonment for a term not exceeding seven (7) years" },
  ],
};

// Live classification stream (Page 9)
const MAPPING_STREAM = [
  { id: "ms-001", ref: "§3(1)",  text: "The Digital Security Agency shall be responsible for the protection of critical digital infrastructure and national security…", pillar: "8.1", pillarLabel: "Critical infrastructure",    gates: ["pass","pass","pass"],   scores: ["exact","0.89","pass"], status: "verified",  ts: "09:22:01", model: "llama-3.1-8b" },
  { id: "ms-002", ref: "§5(2)",  text: "Any person who, without permission, gains access to or attempts to gain access to any computer system or network…",             pillar: "8.2", pillarLabel: "Incident reporting",          gates: ["pass","warn","pass"],   scores: ["exact","0.71","pass"], status: "verified",  ts: "09:22:04", model: "llama-3.1-8b" },
  { id: "ms-003", ref: "§8(1)",  text: "The Director General may, for the purpose of this Act, require any person to produce any document or article…",                 pillar: "7.1", pillarLabel: "Lawful basis for processing", gates: ["pass","fail","fail"],   scores: ["exact","0.15","0 pred"], status: "rejected",  ts: "09:22:08", model: "llama-3.1-8b", rejectedGate: "Gate 2" },
  { id: "ms-004", ref: "§12(3)", text: "No person shall process personal data without the explicit consent of the data subject, except as provided under…",              pillar: "7.1", pillarLabel: "Lawful basis for processing", gates: ["pass","pass","pass"],   scores: ["exact","0.96","pass"], status: "verified",  ts: "09:22:11", model: "llama-3.1-8b" },
  { id: "ms-005", ref: "§14(1)", text: "Data collected for a specific purpose shall not be used for any other purpose without the express consent of the data subject…",  pillar: "7.2", pillarLabel: "Purpose limitation",           gates: ["pass","pass","pass"],   scores: ["exact","0.92","pass"], status: "verified",  ts: "09:22:14", model: "llama-3.1-8b" },
  { id: "ms-006", ref: "§18(2)", text: "Every data controller shall maintain a record of all processing activities under its responsibility…",                           pillar: "7.5", pillarLabel: "DPO / Accountability",          gates: ["pass","warn","pass"],   scores: ["exact","0.73","pass"], status: "verified",  ts: "09:22:17", model: "llama-3.1-8b" },
  { id: "ms-007", ref: "§21(1)", text: "A data subject shall have the right to obtain confirmation of whether personal data concerning them is being processed…",          pillar: "7.3", pillarLabel: "Data subject rights",          gates: ["pass","pass","pass"],   scores: ["exact","0.94","pass"], status: "verified",  ts: "09:22:20", model: "llama-3.1-8b" },
  { id: "ms-008", ref: "§26(1)", text: "Any person who…shall not save such data, including biometric information, photographs, financial records…outside Bangladesh.",    pillar: "6.1", pillarLabel: "Data localization",             gates: ["pass","pass","pass"],   scores: ["exact","0.94","pass"], status: "verified",  ts: "09:22:24", model: "llama-3.1-8b" },
  { id: "ms-009", ref: "§28(1)", text: "Whoever publishes or broadcasts any propaganda…which hurts the religious value or sentiment shall be punished…",                  pillar: "12.1",pillarLabel: "Content removal regime",        gates: ["pass","fail","fail"],   scores: ["exact","0.15","0 pred"], status: "rejected",  ts: "09:22:27", model: "llama-3.1-8b", rejectedGate: "Gate 2" },
  { id: "ms-010", ref: "§33(2)", text: "Any person who commits hacking or any illegal access to a computer system with intent to commit another offence…",                pillar: "8.2", pillarLabel: "Incident reporting",            gates: ["warn","pass","pass"],   scores: ["fuzzy·2","0.78","pass"], status: "verified",  ts: "09:22:31", model: "llama-3.1-8b" },
  { id: "ms-011", ref: "§35(1)", text: "The controller shall notify the supervisory authority of a personal data breach without undue delay and, where feasible…",         pillar: "7.4", pillarLabel: "Breach notification",           gates: ["pass","pass","pass"],   scores: ["exact","0.88","pass"], status: "verified",  ts: "09:22:35", model: "llama-3.1-8b" },
  { id: "ms-012", ref: "§42(3)", text: "The court shall have jurisdiction to try offences under this Act regardless of where the accused was located at the time…",       pillar: "9.1", pillarLabel: "National e-ID framework",         gates: ["pass","fail","fail"],   scores: ["exact","0.22","0 pred"], status: "rejected",  ts: "09:22:38", model: "gpt-4o-cloud", escalated: true },
];

// Source trace highlights — Page 10
const TRACE_HIGHLIGHTS = [
  { id: "th-001", pillar: "6.1",  color: "#0FB5A7", textLabel: "Data Localization",      ref: "§26(1)", page: 14, status: "verified",  confidence: 0.94, matchType: "exact",
    extractedText: "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh." },
  { id: "th-002", pillar: "7.1",  color: "#2563EB", textLabel: "Lawful Basis",           ref: "§12(3)", page: 8,  status: "verified",  confidence: 0.96, matchType: "exact",
    extractedText: "No person shall process personal data without the explicit consent of the data subject, except as provided under sections 14, 15 and 18 of this Act." },
  { id: "th-003", pillar: "7.2",  color: "#7C3AED", textLabel: "Purpose Limitation",     ref: "§14(1)", page: 9,  status: "verified",  confidence: 0.92, matchType: "exact",
    extractedText: "Data collected for a specific purpose shall not be used for any other purpose without the express consent of the data subject, unless required by law." },
  { id: "th-004", pillar: "7.3",  color: "#DB2777", textLabel: "Data Subject Rights",    ref: "§21(1)", page: 12, status: "verified",  confidence: 0.94, matchType: "exact",
    extractedText: "A data subject shall have the right to obtain confirmation of whether personal data concerning them is being processed, and where that is the case, access to that data." },
  { id: "th-005", pillar: "7.4",  color: "#F59E0B", textLabel: "Breach Notification",    ref: "§35(1)", page: 19, status: "verified",  confidence: 0.88, matchType: "exact",
    extractedText: "The controller shall notify the supervisory authority of a personal data breach without undue delay and, where feasible, not later than seventy-two hours after having become aware of it." },
  { id: "th-006", pillar: "8.1",  color: "#10B981", textLabel: "Critical Infrastructure", ref: "§3(1)", page: 2,  status: "verified",  confidence: 0.89, matchType: "exact",
    extractedText: "The Digital Security Agency shall be responsible for the protection of critical digital infrastructure and national security against digital threats and cyberattacks." },
  { id: "th-007", pillar: "8.2",  color: "#059669", textLabel: "Incident Reporting",     ref: "§33(2)", page: 18, status: "verified",  confidence: 0.78, matchType: "fuzzy",
    extractedText: "Any person who commits hacking or any illegal access to a computer system with intent to commit another offence under this Act shall be punished accordingly." },
  { id: "th-008", pillar: "6.2",  color: "#06B6D4", textLabel: "Conditional Transfer",   ref: "§29(1)", page: 15, status: "pending",   confidence: 0.67, matchType: "approximate",
    extractedText: "Cross-border transfer of personal data may be permitted subject to the prior approval of the competent authority and the existence of adequate safeguards." },
];

// Make accessible globally
Object.assign(window, {
  RDTII_PILLARS, JURISDICTIONS, DOCUMENTS, DOC_DETAIL_BDDSA,
  ACTIVITY, PIPELINE_JOBS, LIVE_LOG, LEDGER_ENTRIES, REJECTIONS,
  SEED_REGISTRY, SAMPLE_CONFLICT, makeMatrixData,
  PIPELINE_RUNS, CRAWL_STREAM, HARVESTED_DOCS, OCR_CONSENSUS, MAPPING_STREAM, TRACE_HIGHLIGHTS,
});
