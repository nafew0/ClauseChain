# ClauseChain — সম্পূর্ণ বাংলা ব্যাখ্যা

> **পড়ার আগে একটা কথা:** এই ডকুমেন্টটি একজন টেক-সেভি মানুষের জন্য লেখা হয়েছে যিনি আইন সম্পর্কে নতুন। তাই প্রতিটি আইনি ধারণা একটু বিস্তারিত করে বোঝানো হয়েছে, কোড আর সিস্টেম ডিজাইনের সাথে মিলিয়ে।

---

## সূচিপত্র

1. [আইন সম্পর্কে একদম প্রাথমিক ধারণা](#১-আইন-সম্পর্কে-একদম-প্রাথমিক-ধারণা)
2. [ClauseChain কী এবং কেন দরকার?](#২-clausechain-কী-এবং-কেন-দরকার)
3. [RDTII ফ্রেমওয়ার্ক কী?](#৩-rdtii-ফ্রেমওয়ার্ক-কী)
4. [পুরো পাইপলাইন — ধাপে ধাপে](#৪-পুরো-পাইপলাইন--ধাপে-ধাপে)
5. [Legal Predicate Tuple — মূল আবিষ্কার](#৫-legal-predicate-tuple--মূল-আবিষ্কার)
6. [আটটি Verification Gate](#৬-আটটি-verification-gate)
7. [তিনটি দেশের Demo](#৭-তিনটি-দেশের-demo)
8. [AI কে কী করতে দেওয়া হয়েছে, কী না](#৮-ai-কে-কী-করতে-দেওয়া-হয়েছে-কী-না)
9. [Submission প্রশ্নোত্তর — বাংলায়](#৯-submission-প্রশ্নোত্তর--বাংলায়)
10. [টেকনিক্যাল স্ট্যাক — এক নজরে](#১০-টেকনিক্যাল-স্ট্যাক--এক-নজরে)

---

## ১. আইন সম্পর্কে একদম প্রাথমিক ধারণা

টেকনিক্যাল মানুষ হিসেবে তুমি API, schema, validation এই শব্দগুলো চেনো। আইনের জগতেও প্রায় একই রকম কাঠামো আছে, শুধু vocabulary আলাদা।

### আইনের "স্তর" — Authority Hierarchy

মনে করো এটা একটা **permission system**-এর মতো:

| আইনি স্তর | Tech analogy | উদাহরণ |
|---|---|---|
| **সংবিধান (Constitution)** | Root/Superadmin | সবার উপরে, সবকিছু এখান থেকে |
| **প্রাথমিক আইন (Primary Legislation / Act)** | Core application logic | সংসদে পাস হওয়া আইন, যেমন PDPA 2012 |
| **বিধিমালা (Subsidiary Legislation / Rules)** | Config/Plugin layer | আইনের অধীনে সরকার যে নিয়ম বানায় |
| **নিয়ন্ত্রক নির্দেশিকা (Regulator Guideline)** | Documentation/Best practices | PDPC এর পরামর্শ — মানতে হবে না, কিন্তু ভালো |
| **খসড়া আইন (Draft / Bill)** | Feature branch (not merged) | এখনো চালু হয়নি |
| **বাতিল আইন (Repealed Law)** | Deprecated / deleted code | আর কার্যকর না |

**সবচেয়ে গুরুত্বপূর্ণ বিষয়:** একটা আইনি দাবি (legal claim) শুধু তখনই valid যখন সেটা **binding + current** আইন থেকে আসে। Guideline বা Draft থেকে আসলে সেটা valid না।

### আইনের "কাঠামো" — Legal Structure

একটা আইন লেখা হয় এভাবে:

```
Act (পুরো আইন)
  └── Part (অধ্যায়ের গ্রুপ)
        └── Chapter (অধ্যায়)
              └── Section (ধারা)  ← সবচেয়ে গুরুত্বপূর্ণ ইউনিট
                    └── Subsection (উপধারা)
                          └── Paragraph (অনুচ্ছেদ)
                                └── Proviso (শর্ত — "তবে শর্ত থাকে যে...")
                                └── Exception (ব্যতিক্রম — "তবে...ক্ষেত্র ছাড়া")
```

**একটা উদাহরণ দিই বাংলায়:**

> "কোনো প্রতিষ্ঠান বাংলাদেশের বাইরে ব্যক্তিগত তথ্য স্থানান্তর করতে পারবে না — **তবে শর্ত থাকে যে**, যদি গ্রাহকের সম্মতি থাকে এবং গ্রাহকের তথ্য সুরক্ষিত থাকে, তাহলে স্থানান্তর করা যাবে।"

এখানে:
- **Principal Rule (মূল নিয়ম):** বাইরে পাঠানো যাবে না
- **Exception (ব্যতিক্রম):** সম্মতি থাকলে পাঠানো যাবে
- **Condition (শর্ত):** তথ্য সুরক্ষিত থাকতে হবে

একটা AI যদি শুধু "বাইরে পাঠানো যাবে না" পড়ে, সে ভুল সিদ্ধান্ত দেবে। ClauseChain এই তিনটা অংশ একসাথে পড়ে।

### Cross-Border Data Transfer — মূল বিষয়

মনে করো Netflix বাংলাদেশে কাজ করে। তোমার নাম, ইমেইল, ক্রেডিট কার্ড নম্বর — এই তথ্য Netflix এর সার্ভারে যাচ্ছে যেটা হয়তো আমেরিকায়। এটাই **cross-border data transfer**।

বিভিন্ন দেশ এটা নিয়ন্ত্রণ করে আলাদাভাবে:
- কোনো দেশ বলে "একদম না, সব তথ্য দেশেই রাখতে হবে" — **Data Localization**
- কোনো দেশ বলে "পাঠাতে পারবে, কিন্তু ওই দেশে আমাদের মতো সুরক্ষা থাকতে হবে" — **Conditional Transfer**
- কোনো দেশের কোনো নিয়মই নেই — **No Restriction**

ClauseChain এটা বিভিন্ন দেশের আইন থেকে বের করে দেয়।

---

## ২. ClauseChain কী এবং কেন দরকার?

### সমস্যাটা কী?

কল্পনা করো তোমাকে বলা হলো: "বাংলাদেশ, সিঙ্গাপুর, থাইল্যান্ড — এই তিনটা দেশের ডেটা প্রাইভেসি আইন পড়ো এবং বলো, কোন দেশে ব্যক্তিগত তথ্য বিদেশে পাঠানো যায়, কীভাবে?"

তোমাকে:
1. সরকারি ওয়েবসাইট থেকে PDF/HTML ডাউনলোড করতে হবে
2. কিছু Bengali, কিছু Thai, কিছু English — পড়তে হবে
3. কোনটা চালু আইন, কোনটা বাতিল — বুঝতে হবে
4. মূল আইন আর তার সংশোধনী মেলাতে হবে
5. তারপর UN এর একটা ফ্রেমওয়ার্কে ম্যাপ করতে হবে

এটা একজন আইনজীবীর কয়েক সপ্তাহের কাজ। আর যদি ভুল হয়, সেটা নীতিনির্ধারণকে ভুল পথে নিয়ে যায়।

### Generic AI কেন যথেষ্ট না?

ChatGPT বা সাধারণ RAG (Retrieval-Augmented Generation) সিস্টেম দিয়ে এটা করলে যা হয়:

```
সমস্যা ১: সঠিক কথা ভুল সূত্র থেকে
→ একটা guideline থেকে কোট করল, কিন্তু সেটা binding আইন না

সমস্যা ২: বাতিল আইন থেকে পড়ল
→ 2010 সালের আইন পড়ল, কিন্তু সেটা 2018 সালে বাতিল হয়ে গেছে

সমস্যা ৩: Exception মিস করল
→ "পাঠানো যাবে না" পড়ল, কিন্তু পরের লাইনে "কিন্তু শর্তে পাঠানো যাবে" দেখল না

সমস্যা ৪: ভুল মানচিত্র
→ Data retention rule (কতদিন রাখবে) কে Data transfer rule (কোথায় পাঠাবে) ভেবে বসল
```

### ClauseChain এর সমাধান

ClauseChain একটা **measured legal evidence compiler** — মানে এটা প্রতিটা দাবি যাচাই করে তারপর output দেয়।

**মূল থিসিস:**
> Citation (সূত্র উল্লেখ) আবশ্যক, কিন্তু যথেষ্ট নয়।
> সূত্র সঠিক কিনা + সূত্রটা কার্যকর কিনা + সূত্রের মানে সঠিকভাবে বোঝা হয়েছে কিনা — এই তিনটা একসাথে যাচাই করতে হবে।

---

## ৩. RDTII ফ্রেমওয়ার্ক কী?

**RDTII = Regional Digital Trade Integration Index**

UN এর UNESCAP (এশিয়া-প্যাসিফিকের জন্য UN এর অর্থনৈতিক শাখা) একটা স্কোরকার্ড বানিয়েছে। প্রতিটা দেশ ডিজিটাল ট্রেডের জন্য কতটা প্রস্তুত সেটা মাপার জন্য।

**Tech analogy:** এটা অনেকটা **Lighthouse score** এর মতো — তোমার ওয়েবসাইট কতটা ভালো সেটা যেমন Lighthouse পয়েন্ট দেয়, RDTII তেমন দেশের ডিজিটাল ট্রেড নীতির পয়েন্ট দেয়।

### Pillars (স্তম্ভ) — ClauseChain যেগুলো কভার করে

```
Pillar 2:  Electronic Transactions (বাংলাদেশের জন্য)
           → ই-চুক্তি, ই-সিগনেচার আইনি কিনা?

Pillar 6:  Cross-Border Data Policies (বাধ্যতামূলক)
           → তথ্য বিদেশে পাঠানো নিয়ে কী নিয়ম?
           → Data localization আছে কি?

Pillar 7:  Domestic Data Protection & Privacy (বাধ্যতামূলক)
           → ব্যক্তিগত তথ্য সংগ্রহ/ব্যবহারের নিয়ম কী?
           → ডেটা লঙ্ঘন হলে কী করতে হবে?

Pillar 8:  Internet Intermediary Liability & Content (বোনাস)
           → Facebook/YouTube কতটুকু দায়ী?
           → সরকার কি কনটেন্ট ব্লক করতে পারে?
```

ClauseChain এই Pillar গুলোর প্রতিটা indicator এর জন্য বিভিন্ন দেশের আইন থেকে প্রমাণ খুঁজে বের করে।

---

## ৪. পুরো পাইপলাইন — ধাপে ধাপে

মনে করো তুমি বলছ: "বাংলাদেশের ব্যক্তিগত তথ্য আইন RDTII Pillar 6 এ কী স্কোর পাবে?"

ClauseChain ১০টা ধাপে কাজ করে:

### ধাপ ০: Jurisdiction Pack তৈরি
```yaml
# bd.yaml — বাংলাদেশের "কনফিগ ফাইল"
jurisdiction: BD
name: Bangladesh
languages:
  primary: bn  # Bengali
  supported: [bn, en]
official_sources:
  - name: Bangladesh Laws Portal
    domain: bdlaws.minlaw.gov.bd
    authority_rank: 100  # সর্বোচ্চ
  - name: Ministry Gazette
    domain: mopa.gov.bd
    authority_rank: 90
```

এই YAML ফাইল ClauseChain কে বলে:
- কোন ওয়েবসাইট "official" 
- কোনটার rank কত (কে বেশি authoritative)
- আইনের ভাষা কী
- কীভাবে section number লেখা হয় (ধারা ২৬, s.26, section 26 — সবই একই)

### ধাপ ১: Discovery — তথ্য খোঁজা

```
Input: "বাংলাদেশ" + "ব্যক্তিগত তথ্য" + "cross-border"

Scrapy (crawler) → bdlaws.minlaw.gov.bd
Playwright (browser automation) → JavaScript-heavy pages
Crawl4AI → AI-friendly captures

Output: 
  - Digital Security Act 2018.pdf
  - Draft PDPA 2023.html
  - ICT Act 2006 (amended 2013).pdf
  - Ministry Guideline on Data.html
  → প্রতিটায় tag: "law" / "guideline" / "draft" / "amendment"
```

**robots.txt মানা হয়** — ClauseChain কোনো CAPTCHA বা login bypass করে না।

### ধাপ ২: Source Acquisition — সংরক্ষণ

```python
# প্রতিটা ফাইলের জন্য:
{
  "url": "https://bdlaws.minlaw.gov.bd/act-1261.pdf",
  "retrieved_at": "2026-05-25T10:30:00+06:00",
  "raw_sha256": "9f2c4e8a1b...",  # ফাইলের fingerprint
  "mime_type": "application/pdf",
  "file_size": 2847392,
  "redirect_chain": []
}
```

SHA-256 hash কেন? পরে কেউ বলতে পারবে না "আইনটা পরিবর্তন হয়ে গেছে" — কারণ hash দিয়ে prove করা যাবে ঠিক কোন version পড়া হয়েছিল।

### ধাপ ৩: Authority & Current-Law Resolver — যাচাই

এটা সবচেয়ে গুরুত্বপূর্ণ ধাপগুলোর একটা।

```
Digital Security Act 2018
  → status: binding_current ✓
  → in_force_since: 2018-10-08
  → repealed: false ✓
  → consolidated: true ✓

ICT Act 2006
  → status: binding_current ✓ (partially)
  → amended_by: ICT (Amendment) Act 2013
  → note: Some sections repealed

Draft PDPA 2023
  → status: draft ✗
  → binding: false ✗
  → cannot support current-law claim!

Ministry Data Guideline
  → status: non_binding_context
  → authority_rank: 6
  → cannot override binding text!
```

**আইনি ব্যাখ্যা (সহজ ভাষায়):**
- বাতিল আইন থেকে কোট করা মানে 2010 সালের obsolete API documentation পড়া
- খসড়া আইন থেকে কোট করা মানে unmerged PR কে production বলা
- Guideline থেকে binding claim করা মানে README কে technical spec বলা

### ধাপ ৪: Extraction — টেক্সট বের করা

তিনটা ভিন্ন পথ:

```
HTML file
  → Trafilatura (HTML parser)
  → Section anchors (<a id="section26">) preserve করা হয়
  → সবচেয়ে নির্ভরযোগ্য

Native PDF (text layer আছে)
  → Docling + PyMuPDF
  → Page number, char offsets সহ text বের হয়

Scanned PDF (বাংলাদেশের gazette — ছবি স্ক্যান করা)
  → PaddleOCR-VL (primary)
  → Tesseract (fallback)
  → প্রতিটা word এর জন্য: text + bounding box + confidence score
  → Confidence < 0.75 হলে → VLM repair (Qwen2-VL local বা cloud Claude)
```

**OCR এর ব্যাপারটা কেন জটিল?**
বাংলাদেশের সরকারি gazette অনেক সময় স্ক্যান করা কাগজ। সেই স্ক্যানে:
- কালি ছড়িয়ে যায়
- "না" কে "না" দেখায় না হয়তো
- আইনি মানে পুরো বদলে যেতে পারে একটা অক্ষর ভুল হলে

তাই OCR confidence 77% হলে সেটা flag করা হয় এবং original page image সহ রাখা হয়।

### ধাপ ৫: Legal Structure & Rule Units — কাঠামো বোঝা

```
Digital Security Act 2018
  ├── Part: Chapter 5 (Data-related offences)
  │     └── Section 26 (Data localization)
  │           ├── 26(1): Principal Rule
  │           │     "কোনো ব্যক্তি... বাংলাদেশের বাইরে... সংরক্ষণ করতে পারবে না"
  │           └── 26(2): Exception/Condition  
  │                 [যদি থাকে]
  └── Schedule: Definitions
        └── "personal data" = [definition]
```

**Rule Unit** হলো principal rule + তার exception + তার condition — এগুলো কখনো আলাদা করা হয় না।

**কেন এটা গুরুত্বপূর্ণ?**
একটা সাধারণ RAG system chunk করে ফেলে:
```
Chunk 1: "কোনো প্রতিষ্ঠান ব্যক্তিগত তথ্য বাইরে পাঠাতে পারবে না"
Chunk 2: "তবে সম্মতি থাকলে পাঠানো যাবে"
```
Chunk 1 পেলে সে বলবে "total ban" — ভুল।
ClauseChain এই দুটো একসাথে রাখে।

### ধাপ ৬: Retrieval — প্রাসঙ্গিক অংশ খোঁজা

```
Query: "cross-border personal data transfer restriction Bangladesh"

BM25 (keyword search):
  → "personal data" exact match
  → "transfer" exact match
  → Score: 0.87

Dense Embeddings (BGE-M3 — multilingual):
  → Bengali query → Bengali text similarity
  → English query → Bengali text similarity (cross-lingual!)
  → Score: 0.91

Combined Hybrid Score → Top 20 candidates

Cross-encoder Reranker (Qwen3-Reranker):
  → Full text pair comparison
  → Final Top 5 candidates
```

**বিশেষ বিষয়:** BGE-M3 multilingual model — তুমি English এ query দিলেও Bengali আইনের text খুঁজে পাবে। এটা সম্ভব কারণ model টা 100+ ভাষায় trained।

### ধাপ ৭: Legal Predicate Extraction — অর্থ বের করা

এটাই ClauseChain এর সবচেয়ে innovative অংশ।

সাধারণ AI বলে: "এটা Pillar 6 এর transfer restriction"।  
ClauseChain বলে: **"কে কী করতে পারবে না, কীভাবে, কী শর্তে?"**

```json
{
  "actor": "যেকোনো ব্যক্তি/প্রতিষ্ঠান",
  "action": "store / transfer",
  "object": "personal data (biometric, financial, etc.)",
  "destination": "বাংলাদেশের বাইরে",
  "modality": "prohibited_by_default",
  "condition": "lawful authority ছাড়া",
  "exception": "statutory requirements পূরণ হলে",
  "legal_role": "principal_rule_with_condition",
  "source_status": "binding_current",
  "evidence_span_ids": ["span_DSA_26_1", "span_DSA_26_2"]
}
```

এই tuple ছাড়া RDTII mapping হয় না। Tuple এর প্রতিটা field একটা নির্দিষ্ট span ID এর সাথে linked — মানে প্রতিটা দাবির পেছনে নির্দিষ্ট text আছে।

### ধাপ ৮: RDTII Mapping — ম্যাপিং

Rubric-as-code দিয়ে deterministic check:

```yaml
# pillar_6.yaml
indicators:
  transfer_restriction:
    required_predicates:
      action: [transfer, store_outside]
      destination: [outside_jurisdiction]
      modality: [prohibited_by_default, conditional_permission]
    exclusions:
      - domestic_retention_only  # শুধু দেশে রাখার নিয়ম — transfer নয়
      - cybersecurity_only       # শুধু security নিয়ম — data transfer নয়
```

বাংলাদেশের DSA s.26 tuple এর বিরুদ্ধে check:
- ✓ `action: store_outside` → match
- ✓ `destination: outside_jurisdiction` → match  
- ✓ `modality: prohibited_by_default` → match
- ✗ exclusions triggered? → না
- **Result: Pillar 6 → transfer_restriction → MATCH**

### ধাপ ৯: Verification Gates — চূড়ান্ত যাচাই

এই ৮টা gate এর সব পাস না করলে output যায় না:

```
G1 Span ✓     → ঠিক এই text কি source এ আছে?
G2 Location ✓ → এই page/section এ কি আছে?
G3 Authority ✓ → DSA 2018 কি binding law? (হ্যাঁ, rank=100)
G4 Currentness ✓ → এখনো চালু? (হ্যাঁ, repealed=false)
G5 Structure ✓ → Rule unit সম্পূর্ণ? Exception আছে?
G6 Tuple ✓    → NLI score: 0.88 (threshold 0.70) → pass
G7 RDTII ✓    → Required predicates সব আছে?
G8 Counter ✓  → কোনো conflicting amendment আছে? → none_found
```

সব pass → `final_status: verified` → export হবে।

যদি যেকোনো একটা fail করে → হয় reject, নয় human review queue।

### ধাপ ১০: Human Audit & Export

**Audit UI (Next.js):**
```
Left pane:    Original PDF page, highlighted span
Middle pane:  Extracted legal node + rule unit
Right pane:   Predicate tuple + RDTII mapping + Gate results
              [Approve] [Edit] [Reject] [Uncertain]
```

**Export formats:**
- `JSONL` → পরের pipeline বা evaluation এর জন্য
- `CSV` → Analyst spreadsheet review
- `Markdown` → GitHub-readable report
- `Provenance bundle` → Raw bytes + hashes + সব কিছু — যে কেউ verify করতে পারবে

---

## ৫. Legal Predicate Tuple — মূল আবিষ্কার

Tech analogy দিয়ে বোঝাই:

**সাধারণ AI আইন পড়ার মতো:**
```sql
SELECT text FROM legal_chunks 
WHERE similarity(text, query) > 0.8
-- এই text টা relevant মনে হচ্ছে, Pillar 6 দাও
```

**ClauseChain এর approach:**
```python
# প্রথমে structured meaning বের করো
predicate = extract_tuple(text)
# {actor, action, object, destination, modality, condition, exception}

# তারপর rubric এর বিরুদ্ধে deterministic check করো
if matches_rubric(predicate, pillar6_indicator):
    if all_gates_pass(predicate, source, evidence):
        return verified_claim
```

**কেন এটা better?**

ধরো দুটো sentence:
1. "Organizations must not transfer personal data outside the country"
2. "Organizations must retain personal data within the country for 5 years"

Cosine similarity-তে এরা কাছাকাছি (দুটোতেই "personal data", "country" আছে)।  
কিন্তু semantically:
- ১ নম্বর → Cross-border transfer restriction (Pillar 6)
- ২ নম্বর → Data retention rule (Pillar 7, NOT transfer restriction)

Predicate tuple দেখলে পার্থক্য স্পষ্ট:
```json
// Sentence 1:
{"action": "transfer", "destination": "outside_country"} → Pillar 6 ✓

// Sentence 2:
{"action": "retain", "destination": "within_country", "duration": "5_years"} → Pillar 7, retention
// "destination" field = "within_country" → Pillar 6 exclusion triggered!
```

---

## ৬. আটটি Verification Gate

প্রতিটা gate কী করে সহজ ভাষায়:

### G1: Span Gate — "টেক্সট আসলেই আছে কি?"
```
দাবি: "বাংলাদেশের বাইরে সংরক্ষণ করা যাবে না"
Source file: DSA_2018.pdf

Exact match? → হ্যাঁ, char offset 18742-19103 → PASS ✓
OCR fuzzy match (edit_distance=2)? → PASS (OCR region এ allowed) ✓
কোনো match নেই? → REJECT ✗
```

### G2: Location Gate — "ঠিক জায়গায় আছে কি?"
```
দাবি বলছে: Section 26, Page 14, bbox: {x0:72, y0:412...}
PDF তে সত্যিই সেখানে আছে?
bbox IoU ≥ 0.85 → PASS ✓
```

### G3: Authority Gate — "সূত্র কি বিশ্বাসযোগ্য?"
```
DSA 2018 → bdlaws.minlaw.gov.bd → authority_rank: 100 → binding primary law
→ PASS ✓

Ministry Guideline → rank: 60 → non_binding_context
→ binding claim এর জন্য FAIL ✗ (context হিসেবে দেখানো যাবে)
```

### G4: Currentness Gate — "আইনটা এখনো চালু?"
```
DSA 2018:
  - repealed: false ✓
  - in_force: true ✓
  - consolidated_text_age: recent ✓
  → PASS ✓

ICT Act 2006 (amended):
  - amended_by: 2013 amendment
  - consolidated text available?
  → Check consolidated text → PASS if incorporated ✓
```

### G5: Structure Gate — "Rule unit সম্পূর্ণ?"
```
Rule unit: 
  Principal rule: ✓ (found)
  Exception: ✓ (found and linked)
  Condition: ✓ (found and linked)
  → PASS ✓

Exception missing?
  → Route to human review (আইনের অর্থ অসম্পূর্ণ)
```

### G6: Tuple Gate — "Evidence কি দাবি support করে?"
```
Claim: "transfer prohibited"
Evidence span: "shall not... store... outside Bangladesh"

Multilingual NLI (Natural Language Inference):
  ENTAILMENT score: 0.88 > threshold 0.70 → PASS ✓
  
Score 0.45 হলে → REJECT ✗
```

### G7: RDTII Gate — "Rubric predicates পূরণ হয়েছে?"
```
Pillar 6 transfer_restriction requires:
  ✓ action = [transfer/store_outside]
  ✓ destination = [outside_jurisdiction]  
  ✓ modality = [prohibited_by_default/conditional]
  ✗ exclusion: domestic_retention_only? → NOT triggered

All required predicates present + no exclusion → PASS ✓
```

### G8: Counter-Evidence Gate — "বিপরীত কিছু আছে?"
```
Corpus search for DSA 2018 s.26:
  - Repeal notice? → Not found
  - Amendment targeting s.26? → Not found
  - Conflicting provision in same act? → Not found
  - Later act superseding this? → Not found
  → "none_found" → PASS ✓

যদি conflict পাওয়া যায় → Human review route
(দুটো conflicting evidence সহ reviewer দেখতে পাবে)
```

---

## ৭. তিনটি দেশের Demo

### সিঙ্গাপুর — "Clean Baseline"

**কেন সিঙ্গাপুর প্রথম?**
- PDPA 2012 (rev. 2021) — সুন্দর HTML, English, official, current
- সহজ test case, pipeline কাজ করছে কিনা prove করার জন্য

**মূল ধারা:** PDPA ss. 13, 17, 26(1)
- Section 13: Data collection এর lawful basis
- Section 17: Purpose limitation (যে কারণে নিয়েছ সেজন্যই ব্যবহার করতে হবে)
- Section 26(1): Cross-border transfer — conditional regime

**ClauseChain এর output:**
```json
{
  "jurisdiction": "SG",
  "pillar": 6,
  "indicator": "conditional_cross_border_transfer",
  "source": "PDPA 2012 s.26(1)",
  "modality": "prohibited_by_default",
  "condition": "comparable_protection_required",
  "status": "verified"
}
```

### থাইল্যান্ড — "Bilingual Complexity"

**চ্যালেঞ্জ কী?**
- Thai PDPA (PDPA B.E. 2562) — Thai + English উভয় ভাষায়
- Royal Gazette PDF format (সরকারি গেজেট)
- ss. 26-29: Cross-border transfer এর পুরো regime
- Subordinate notifications 2022-2024: Primary law এর অধীনে বিধিমালা

**বিশেষ বিষয়:** BGE-M3 ব্যবহার করে Thai-language clause কে English RDTII query দিয়ে retrieve করা হচ্ছে।

**Rule-exception কমপ্লেক্সিটি:**
```
Section 26: Transfer abroad → prohibited by default
Section 27: Exception → adequacy decision
Section 28: Exception → appropriate safeguards  
Section 29: Exception → derogations (consent, vital interest, etc.)

ClauseChain এই সবগুলো একটা Rule Unit এ bind করে।
```

### বাংলাদেশ — "OCR & Status Stress Test"

**চ্যালেঞ্জ কী?**
- Digital Security Act 2018 s.26: Scanned PDF, Bengali
- Draft PDPA 2023: চালু নয় — system কি সঠিকভাবে reject করবে?
- ICT Act 2006 (amended 2013): Status conflict handling

**DSA s.26 — আইনি ব্যাখ্যা:**
```
"Any person who, intentionally or knowingly without lawful authority, 
collects, sells, takes possession of, supplies or uses any person's 
identity-related information, shall not save such data, including 
biometric information, photographs, financial records or registry 
information, outside the geographic boundaries of Bangladesh."
```

সহজ কথায়: পরিচয়-সম্পর্কিত তথ্য (biometric, ছবি, আর্থিক তথ্য, রেজিস্ট্রি তথ্য) বাংলাদেশের বাইরে রাখা যাবে না।

**এটা Pillar 6 এ কী?**
- Data localization (specific categories) → Pillar 6 indicator
- modality: `prohibited_by_default`
- object: `identity_information_categories`

**Draft PDPA 2023 এর handling:**
```
Status: draft → binding: false → G4 FAIL
→ Cannot support current-law claim
→ Output: "Draft law — not currently in force. 
           Cannot be used as binding evidence."
→ Reviewer কে দেখানো হবে context হিসেবে, binding claim হিসেবে নয়
```

---

## ৮. AI কে কী করতে দেওয়া হয়েছে, কী না

### AI করতে **পারবে:**
```
✓ Retrieved context থেকে span extract করা
✓ Constrained JSON schema fill করা (Pydantic + Outlines)
✓ Predicate tuple fields identify করা
✓ Fixed enumeration থেকে RDTII indicator suggest করা
✓ Calibrated confidence দেওয়া
✓ "not_applicable" বা "insufficient_evidence" বলা
✓ Verification pass করার পরে explanation দেওয়া
```

### AI করতে **পারবে না:**
```
✗ Retrieved set এর বাইরের document cite করা
✗ Section number, URL, page number বানানো
✗ Guideline কে binding law বলা
✗ Training memory থেকে legal knowledge ব্যবহার করা
✗ Rule এবং Exception একসাথে মিলিয়ে একটা উপসংহার দেওয়া
✗ Authority/Currentness gate override করা
✗ Gate results ছাড়া "verified" emit করা
```

**Tech analogy:** AI টা একটা **strictly typed function**:
```typescript
function classifyClause(
  retrievedSpans: Span[],  // শুধু এই input
  rubric: RDTIIRubric
): LegalPredicate | "not_applicable" {
  // training memory use করা = accessing global mutable state → forbidden
  // hallucination = returning value not in input → forbidden
}
```

---

## ৯. Submission প্রশ্নোত্তর — বাংলায়

### প্রশ্ন ১.১: দুটো phrase এর মধ্যে "linguistic conflict" কী?

**প্রশ্নে দেওয়া দুটো phrase:**
- Phrase 1: "একটি প্রতিষ্ঠান ব্যক্তিগত তথ্য দেশের বাইরে স্থানান্তর করতে **পারবে না**"
- Phrase 2: "**ব্যতীত** তুলনামূলক সুরক্ষা নিশ্চিত করে এমন শর্তে স্থানান্তর করা যাবে"

**Surface-level conflict:**
একটা বলছে "পারবে না", আরেকটা বলছে "পারবে" — দেখতে contradiction।

**আসল বিষয়:**
এরা দুটো আলাদা নিয়ম নয়, **একটাই composite rule**:
```
Default: পারবে না
Exception: সুরক্ষা নিশ্চিত হলে পারবে

Combined meaning: তুলনামূলক সুরক্ষা ছাড়া transfer নিষিদ্ধ
```

**Trap:** একটা AI যদি chunk করে দুটো আলাদা context window এ পাঠায়:
- Context 1 থেকে বলবে: "Total ban on transfer" (Pillar 6: localization)
- Context 2 থেকে বলবে: "Transfer permitted" (Pillar 6: open)

দুটোই ভুল। ClauseChain এই দুটো একটা Rule Unit হিসেবে রাখে।

---

### প্রশ্ন ১.২: কোনটা precedence নেয়, policy rationale কী?

**উত্তর:** কোনোটাই একা "precedence" নেয় না।

**Primary standard:** Conditional cross-border transfer regime
```
Phrase 1 → Default rule (baseline)
Phrase 2 → Exception (conditional pathway)
Combined → "Transfer prohibited unless comparable protection"
```

**Policy rationale (আইনের উদ্দেশ্য):**
```
Data protection by default + Controlled cross-border flow

মানে:
- Data subject (তুমি) সুরক্ষিত → কারণ তোমার তথ্য যেখানেই যাক, সুরক্ষা যেতে হবে
- Trade enabled → কারণ ব্যবসা করতে হলে data share করতে হয়
- Total ban নয় → কারণ সেটা ডিজিটাল ট্রেড অসম্ভব করে দিত
- Open permission নয় → কারণ সেটা তোমার সুরক্ষা নষ্ট করত
```

**ClauseChain এর mapping:**
```
NOT: "data_localization" (total ban নয়)
NOT: "unrestricted_transfer" (open permission নয়)
YES: "conditional_cross_border_transfer"
  modality: prohibited_by_default
  condition: comparable_protection_required
```

---

### প্রশ্ন ১.৩: ClauseChain এটা technically কীভাবে করে?

**৫টা deterministic ধাপ:**

**ধাপ ১ — Structural Parse:**
```python
# Legal parser "except", "unless", "provided that" detector
connector = detect_exception_connector(text)
# Found: "except" → Exception structure identified
```

**ধাপ ২ — Rule Unit Binding:**
```python
rule_unit = {
  "principal_rule": "shall not transfer",
  "exception": "except in accordance with requirements",
  "condition": "comparable protection"
}
# এরা কখনো আলাদা chunk হবে না
```

**ধাপ ৩ — Predicate Extraction:**
```json
{
  "modality": "prohibited_by_default",
  "condition": "comparable_protection_required",
  "exception": "statutory_requirements_satisfied"
}
# প্রতিটা field → specific span_id এর সাথে linked
```

**ধাপ ৪ — Rubric-as-Code:**
```python
# deterministic check, LLM call এর আগে
if predicate.action in ["transfer", "disclose"]:
    if predicate.destination == "outside_jurisdiction":
        if predicate.modality == "prohibited_by_default":
            candidate_indicator = "transfer_restriction"
```

**ধাপ ৫ — Gate Checks:**
```
G5: Exception present? → ✓
G7: Required predicates present? → ✓
G7: Exclusion "localization_only" triggered? → ✗ (exception আছে)
→ PASS → "conditional_cross_border_transfer"
```

---

### প্রশ্ন ২: End-to-End approach (Collect → Export)

**সংক্ষিপ্ত flow:**

```
1. COLLECT
   Scrapy + Playwright + Crawl4AI
   → Official sources থেকে politely crawl
   → Tag: law/regulation/guideline/draft/amendment

2. ACQUIRE  
   → Raw bytes + SHA-256 + timestamp
   → PDF → page images (audit এর জন্য)

3. RESOLVE AUTHORITY
   → Binding/non-binding/draft/repealed
   → Amendment graph build

4. EXTRACT
   → HTML: Trafilatura
   → PDF: Docling
   → Scanned: PaddleOCR-VL + VLM repair
   → Output: text + bbox + confidence

5. STRUCTURE
   → Section tree build
   → Rule units (principal + exception + condition)

6. RETRIEVE
   → BM25 (keyword) + BGE-M3 (semantic) hybrid
   → Cross-encoder reranker

7. CLASSIFY
   → Legal predicate tuple extract
   → Rubric-as-code → RDTII indicator

8. CITE
   → Span ID + section + page + bbox + char offset + SHA-256

9. VERIFY
   → G1-G8 gates
   → Verified / Human Review / Reject

10. EXPORT
    → JSONL + CSV + Markdown + Provenance bundle
    → Every claim re-verifiable from raw bytes
```

---

### প্রশ্ন ৩: Data Sources & Scope

**তিনটা দেশ, তিনটা ভিন্ন challenge:**

| দেশ | চ্যালেঞ্জ | মূল আইন | Source |
|---|---|---|---|
| সিঙ্গাপুর | Clean baseline | PDPA 2012 ss.13,17,26(1) | `sso.agc.gov.sg` |
| থাইল্যান্ড | Bilingual, gazette PDF | PDPA B.E.2562 ss.26-29 | `ratchakitcha.soc.go.th` |
| বাংলাদেশ | OCR, status conflict | DSA 2018 s.26 + Draft PDPA 2023 | `bdlaws.minlaw.gov.bd` |

**Document types:** HTML, native PDF, scanned PDF, guidelines, drafts, unofficial translations

**Languages:** English, Thai, Bengali — BGE-M3/Qwen3-Embedding দিয়ে cross-lingual retrieval

**Pillars covered:** 6 (cross-border data), 7 (domestic privacy), 8 (intermediary liability)

---

### প্রশ্ন ৪: Evidence & Citation Method (Anti-Hallucination)

**প্রতিটা claim এর সাথে যা থাকে:**

```json
{
  "source_url": "https://bdlaws.minlaw.gov.bd/act-1261.pdf",
  "retrieved_at": "2026-05-25T10:30:00+06:00",
  "source_sha256": "9f2c4e8a1b...",
  "authority_rank": "binding_primary_law",
  "section": "26(1)",
  "page": 14,
  "char_offset": [18742, 19103],
  "bbox": {"x0": 72, "y0": 412, "x1": 540, "y1": 488},
  "quote": "shall not save such data... outside Bangladesh",
  "ocr_confidence": 0.77,
  "edit_distance": 2,
  "gate_results": {
    "G1": "pass (fuzzy, edit=2)",
    "G2": "pass (IoU=0.91)",
    "G3": "pass",
    "G4": "pass",
    "G5": "pass",
    "G6": "pass (NLI=0.88)",
    "G7": "pass",
    "G8": "none_found"
  },
  "verification_status": "verified"
}
```

**Provenance bundle:** কেউ এই bundle download করে নিজের machine এ সব verify করতে পারবে — raw bytes থেকে শুরু করে।

---

### প্রশ্ন ৫: তিনটা source scenario

**Scenario:** (1) Official HTML regulation, (2) Scanned older amendment, (3) Ministry guideline

**ClauseChain কীভাবে handle করে:**

```
1. Authority Resolution:
   HTML (official domain) → binding_current, rank≤5 ✓
   Scanned amendment → binding + (superseded if HTML is consolidated)
   Ministry guideline → non_binding_context, rank=6 ✗ (binding claim এ ব্যবহার হবে না)

2. Extraction:
   HTML → Trafilatura (section anchors preserved)
   Scanned PDF → PaddleOCR-VL + Tesseract comparison
              → Disagreements logged with edit distance + page image
              → VLM repair only on low-confidence regions
   Guideline → Extracted কিন্তু non-binding tagged

3. Conflict Resolution:
   HTML vs Amendment disagree → G4: consolidated text preferred
   Amendment cited only for amendment history questions
   Guideline: supplementary context only, never controlling

4. Output:
   Citation → HTML source (binding)
   Guideline → audit view এ context হিসেবে দেখানো
   Provenance bundle → সব তিনটাই included কিন্তু roles আলাদা
```

---

### প্রশ্ন ৬: Anti-Hallucination Technical Design

**Core principle:**
> Model টা একটা **constrained schema filler**, free-form classifier নয়।

**Technical mechanisms:**

1. **Pydantic + Outlines:** Model শুধু predefined JSON structure এ output দিতে পারে
   ```python
   class LegalPredicate(BaseModel):
       actor: Literal["organization", "person", "government", ...]
       action: Literal["transfer", "store", "collect", "process", ...]
       modality: Literal["prohibited", "conditional", "permitted", ...]
       # free-text field নেই
   ```

2. **Evidence-only grounding:** প্রতিটা field must link to a `span_id`
   ```json
   {"modality": "prohibited_by_default", "evidence_span": "span_001"}
   // span_001 না থাকলে → abstain
   ```

3. **Retrieval-only scope:** Model শুধু retrieved spans থেকে কাজ করে
   ```python
   system_prompt = """
   You can ONLY cite from the following spans: {retrieved_spans}
   If the answer is not in these spans, output: "insufficient_evidence"
   """
   ```

4. **Eight gates as hard constraints:** সব gate pass ছাড়া verified status impossible

**Concrete failure case caught:**

```
Naive RAG:
  Retrieved: Ministry guideline (cleaner language) + Repealed 2008 act
  Output: "Bangladesh prohibits cross-border transfer (binding current law)"
  → WRONG: guideline is non-binding, act is repealed

ClauseChain:
  G3: Ministry guideline → rank=6 → non_binding_context → cannot be binding evidence
  G4: 2008 act → repealed: true → current-law claim BLOCKED
  G8: Counter-evidence search → finds DSA 2018 as current law
  Output: "DSA 2018 s.26 — binding_current — [verified citation]"
  Or: "Current binding source not found — ABSTAIN" (if DSA not retrieved)
```

---

## ১০. টেকনিক্যাল স্ট্যাক — এক নজরে

### Local Stack (GPU সহ)

```
Model Serving:    vLLM
LLM:              Qwen2.5-7B-Instruct (Apache 2.0)
OCR:              PaddleOCR-VL (Apache 2.0)
OCR fallback:     Tesseract (Apache 2.0)
VLM repair:       Qwen2-VL-7B (Apache 2.0)
Embeddings:       BGE-M3 (MIT) / Qwen3-Embedding (Apache 2.0)
Reranker:         BGE-reranker-v2-m3 (MIT)
NLI Verifier:     DeBERTa-v3 multilingual (MIT)
HTML extraction:  Trafilatura (Apache 2.0)
PDF extraction:   Docling (MIT)
Crawler:          Scrapy + Playwright + Crawl4AI (Apache 2.0)
```

### Infrastructure

```
Backend API:   FastAPI
Workers:       Celery/RQ (crawl, OCR, index, classify jobs)
Database:      Postgres + pgvector
Search:        OpenSearch (BM25/hybrid)
Vector DB:     Qdrant
Object Store:  MinIO
Queue/Cache:   Redis
Frontend:      Next.js 16 / React 19
Packaging:     Docker Compose
```

### Cloud Routing (Optional)

```yaml
# প্রতিটা task এর জন্য আলাদা config:
tasks:
  predicate_extraction:
    routing: confidence_threshold  # local confidence < 0.65 হলে cloud
    local:  Qwen2.5-7B-Instruct
    cloud:  anthropic/claude-sonnet-4-6
    
  rdtii_mapping:
    routing: confidence_margin     # top-2 score gap < 0.15 হলে cloud
    local:  Qwen2.5-7B-Instruct
    cloud:  anthropic/claude-sonnet-4-6
    
  embedding:
    routing: always_local          # কখনো cloud না
    local:  BGE-M3
```

**Routing modes:**
- `always_local` → কখনো cloud যাবে না
- `always_cloud` → সরাসরি cloud
- `confidence_threshold` → local চেষ্টা করো, কম confident হলে cloud
- `confidence_margin` → top-2 prediction এর gap কম হলে cloud

**Important:** Cloud routing **কখনো** verification gates bypass করে না। Cloud output কেও G1-G8 দিয়ে verify করতে হয়।

### Deployment Modes

| Mode | Hardware | Cloud Use | Cost/Run |
|---|---|---|---|
| Local-only (Government) | L40S 48GB GPU | কিছু না | ~$0 marginal |
| Local-lean | RTX 4090 24GB | OCR VLM repair only | ~$0.10 |
| Hybrid (Analysts) | RTX 4090 + internet | Low-confidence tasks | $0.30-$0.80 |
| Cloud-only (Laptop) | 16GB MacBook, no GPU | সব LLM/VLM | $1.50-$4.00 |

---

## বোনাস: ClauseChain কীভাবে অন্যদের থেকে আলাদা

| Tool | কী করে | কী করে না |
|---|---|---|
| LexisNexis/Harvey | Litigation, contracts | RDTII mapping নেই, closed source |
| LangChain RAG | Retrieve + cite | Authority verify করে না, outdated cite করে |
| OECD i-Reg | Manual curation | Source document থেকে extract করে না |
| **ClauseChain** | Discovery + Extract + Verify + Map | Legal advice দেয় না (out of scope) |

**ClauseChain এর unique position:**
```
Open-source ✓
Self-hostable ✓  
RDTII-native ✓
Per-stage measured accuracy ✓
Predicate-tuple verification ✓
Evidence ledger (re-verifiable) ✓
```

---

## সারসংক্ষেপ

ClauseChain মূলত একটা **measured evidence compiler**। এটা:

1. **খোঁজে** — সরকারি সূত্র থেকে আইন
2. **যাচাই করে** — এই আইন কি চালু? কি binding?
3. **বোঝে** — "কে কী করতে পারবে, কীভাবে, কী শর্তে?"
4. **ম্যাপ করে** — RDTII indicator এ
5. **প্রমাণ করে** — ৮টা gate দিয়ে
6. **দেখায়** — reviewer কে সব evidence সহ

এবং যখন নিশ্চিত না, **থামে** — হ্যালুসিনেশন করে না।

---

*এই ডকুমেন্ট ClauseChain PRD (v1.0, 24 May 2026) এবং Submission Answers থেকে তৈরি। আইনি পরামর্শের জন্য নয় — শুধু system বোঝার জন্য।*
