# ClauseChain — Round 1 বিল্ড গাইড (বাংলা)

**UN Global Hackathon on AI for Digital Trade Regulatory Analysis জেতার জন্য আর্কিটেকচার + ধাপে-ধাপে পরিকল্পনা।**

> এটি `ClauseChain_Round1_Build_Guide.md` (ইংরেজি)-এর বাংলা সংস্করণ। কোড, ফাইলপাথ, ইন্ডিকেটর কোড (`P6-I1`), CSV কলামের নাম এবং schema — যেগুলো বিচারকরা প্রোগ্রামের মাধ্যমে যাচাই করবেন — ইচ্ছাকৃতভাবে ইংরেজিতে রাখা হয়েছে। দুটি ফাইল একসাথে আপডেট রাখবেন।

| বিষয় | মান |
|---|---|
| ডকুমেন্টের ধরন | ইঞ্জিনিয়ারিং ও ডেলিভারি পরিকল্পনা (`ClauseChain_PRD_Application.md`-এর সঙ্গী) |
| পর্যায় | Round 1 — Build (১ জুন → ২০ জুলাই ২০২৬) |
| আজ | ৭ জুন ২০২৬ · জমা দিতে ~৬ সপ্তাহ বাকি |
| বাধ্যতামূলক স্কোপ | অর্থনীতি: **Singapore, Australia, Malaysia** (ইংরেজি) · Pillar **6 ও 7** · Zone **1 + 2** |
| আমাদের নিজস্ব বর্ধিত স্কোপ ("প্রতিটি optional আমাদের জন্য বাধ্যতামূলক") | + Zone 3 scoring (0–1) · + ১টি bonus pillar (**Pillar 2 বা 8**, §7) · + ৮টি ফাইনাল-রাউন্ড অর্থনীতির দিকে স্কেল · + extra-mile UI |
| ইন্ডিকেটর কোড | **`P6-I1…P6-I5`, `P7-I1…P7-I5` — এগুলোই RDTII 2.1 methodology ইন্ডিকেটর, ১:১** (`P6-I1 = 6.1`, … RDTII টিম ৫ জুন নিশ্চিত করেছে)। methodology সংজ্ঞাই চূড়ান্ত (§7); output-template-এর "Indicator Reference" gloss বাতিল। **P6-I5 = 6.5 নন-রেগুলেটরি → ইঞ্জিন P6-I1…I4 + P7-I1…I5 এক্সট্র্যাক্ট করে (৯টি ইন্ডিকেটর)।** |
| কঠোর নিয়ম | কোনো stretch কাজ শুরুর **আগে** বাধ্যতামূলক core জমা-উপযোগী ও অপরাজেয় হতে হবে। কোনো stretch আইটেম core-কে অস্থিতিশীল করতে পারবে না। |

> **লক্ষ্য।** শুধু পাস করা নয় — জেতা, এমনভাবে যেন কোনো ব্লকেই কোনো দল আমাদের ছাড়িয়ে যেতে না পারে। উপায়: (১) বাধ্যতামূলক ডেলিভারিকে নিখুঁত ও রুব্রিক-সঙ্গতিপূর্ণ করা, এরপর (২) ডেডলাইন সুরক্ষিত রেখে একটি freeze-এর পেছনে প্রতিটি optional উপরে যোগ করা।

---

## সূচিপত্র

1. [ডিজাইন নীতিমালা](#১-ডিজাইন-নীতিমালা)
2. [স্কোপ ল্যাডার — core বনাম stretch](#২-স্কোপ-ল্যাডার)
3. [সিস্টেম আর্কিটেকচার](#৩-সিস্টেম-আর্কিটেকচার)
4. [টেক স্ট্যাক](#৪-টেক-স্ট্যাক)
5. [রিপোজিটরি কাঠামো](#৫-রিপোজিটরি-কাঠামো)
6. [আউটপুট কন্ট্রাক্ট](#৬-আউটপুট-কন্ট্রাক্ট)
7. [ইন্ডিকেটর rubric-as-code (সংশোধিত সংজ্ঞা)](#৭-ইন্ডিকেটর-rubric-as-code)
8. [NEW-evidence discovery ইঞ্জিন (২০-পয়েন্টের চাবিকাঠি)](#৮-new-evidence-discovery)
9. [Jurisdiction pack ও দেশ স্কেলিং](#৯-jurisdiction-pack)
10. [মূল্যায়ন ও benchmark harness](#১০-মূল্যায়ন)
11. [তারিখসহ ধাপে-ধাপে পরিকল্পনা](#১১-ধাপে-ধাপে-পরিকল্পনা)
12. [ডেলিভারেবল চেকলিস্ট](#১২-ডেলিভারেবল)
13. [UI পরিকল্পনা — extra mile](#১৩-ui-পরিকল্পনা)
14. [ঝুঁকি রেজিস্টার ও ডেডলাইন সুরক্ষা](#১৪-ঝুঁকি)
15. [ভূমিকা ও দায়িত্ব](#১৫-দায়িত্ব)

---

## ১. ডিজাইন নীতিমালা

40/30/30 রুব্রিকের প্রতিটি ব্লক আমরা *ইচ্ছাকৃতভাবে* একটি ফিচার হিসেবে বানাই, পার্শ্বপ্রতিক্রিয়া হিসেবে নয়।

| রুব্রিক ব্লক | পয়েন্ট | ডিজাইন অঙ্গীকার |
|---|---|---|
| Substantive — framework alignment | 20 | `P6-I1…P7-I5`-এর জন্য rubric-as-code; LLM কল করার আগেই deterministic predicate চেক; অনুমান না করে `not_applicable` আউটপুট। |
| Substantive — **NEW evidence** | (40-এর মধ্যে) | sample-kit provision সেটের সাথে diff করে স্বয়ংক্রিয় discovery + NEW/KNOWN ট্যাগ। **এখানেই চ্যাম্পিয়নশিপ জেতা হয় — §৮।** |
| Substantive — citation fidelity | — | হুবহু span + article **সহ paragraph** (`s. 26(1)`) + page/anchor + অফিসিয়াল working URL। কখনো paraphrase নয়। |
| Technical — live crawling (10) | 10 | Playwright-ভিত্তিক crawler স্বয়ংক্রিয়ভাবে অফিসিয়াল পোর্টাল navigate করে; per-site connector; বিচার্য পথে কোনো manual ডাউনলোড নেই। |
| Technical — OCR (10) | 10 | Coordinate-native OCR, পরিমাপকৃত CER < 5%; শুধু low-confidence অঞ্চলে VLM repair; প্রতি document-এ CER রিপোর্ট। |
| Technical — end-to-end (কোনো manual step নয়) | — | একটি কমান্ড দিলে CSV+JSON বের হয়। রিভিউয়ার শুধু `country + pillar` দেবেন; আর কিছু নয়। |
| Architecture — **modular backend (15)** | 15 | `configs/models.yaml` এডিট করে LLM/OCR swap — কোনো কোড পরিবর্তন নয়। `LLMProvider`, `OCREngine` ইন্টারফেস, local + OpenAI + Anthropic সহ। |
| Architecture — **audit trail (15)** | 15 | প্রতিটি আউটপুট row-তে verbatim snippet + source hash + gate result; UI-তে row ক্লিক করলেই হুবহু হাইলাইট করা উৎস। |
| Architecture — cost-efficiency | — | প্রতি-run cost meter; local-first ডিফল্ট; শুধু low-confidence-এ cloud escalation; $/document রিপোর্ট। |

**Anti-hallucination একটি স্কোরিং ফিচার।** Canvas ডেক-এর "issues" তালিকা (ভুল citation, missing acts, আইনের ভুল ব্যাখ্যা, indicator-এর মূল প্রশ্নের ভুল উত্তর, broken URL, পুরোনো আইন, hallucinated indicator/আইন) — এটাই আমাদের gate চেকলিস্ট। প্রতিটি ব্যর্থতা *ধরা পড়ছে* — ডেমোতে দেখাব।

### ১.১ কঠোর আইনি-শুদ্ধতার নিয়ম (১/৪/৫ জুন ওয়ার্কশপ থেকে)

এগুলো RDTII টিমের live worked-example-এ চিহ্নিত করা সুনির্দিষ্ট ভুল। প্রতিটি একটি gate-এর সাথে মেলে এবং ডেমোতে ধরা পড়া দেখাই:

| নিয়ম | কেন (ওয়ার্কশপ উদাহরণ) | কোথায় enforce |
|---|---|---|
| **Currentness সর্বাগ্রে** | Assignment-1-এর মূল ভুল: একটি *পুরোনো* notice (MAS Cyber-Hygiene, ১ জুলাই ২০২২-এ বাতিল → FSM-N16 দিয়ে প্রতিস্থাপিত) একটি *broken URL* দিয়ে cite করা। In-force পরীক্ষা: গৃহীত+প্রকাশিত → effective date → repealed/superseded নয়। | G4 currentness + amendment graph; URL live রিজল্ভ হতে হবে |
| **Verbatim বাস্তবে থাকতে হবে** | Hallucination উদাহরণ: একটি টুল "IT Act s.70B(1)/(4)" cite করেছে — যা act-এ নেই। | G1 span: quote অবশ্যই extracted উৎসে থাকতে হবে, নইলে reject |
| **আইনি function দিয়ে map, keyword দিয়ে নয়** | একটি transfer *condition* (6.4)-কে *ban* (6.1) হিসেবে ভুল কোডিং; Bhutan-এর network-segmentation নিয়ম cybersecurity (7.2), infrastructure (6.3) নয়। | LLM label-এর আগে predicate tuple + rubric exclusions |
| **Sectoral instrument রেকর্ড করা হয়** | Horizontal আইন থাকলেও sectoral notice বাদ দেবেন না — রেকর্ড করুন (role ট্যাগ), "recorded" বনাম "controlling evidence" আলাদা করুন। | Authority resolver G2/G3 রাখে, role ট্যাগ দেয়; কখনো ফিল্টার করে না |
| **এক provision → একাধিক indicator** | একই আইনি টেক্সট কয়েকটি indicator পূরণ করতে পারে; mutually exclusive নয়। | আউটপুট = প্রতি (provision × indicator)-এ এক row; multi-label mapping |
| **শুধু domestic primary source** | একটি LLM ভুল করে **CPTPP (আন্তর্জাতিক চুক্তি)**-কে domestic measure হিসেবে রেকর্ড করেছিল। | Source-type filter: আন্তর্জাতিক চুক্তি domestic measure নয় (non-regulatory indicator ছাড়া) |
| **"NO খোঁজা"** | কোনো দেশে ban *নেই* প্রমাণ করতে পুরো universe খুঁজতে হয়; কিছু না পেলে **general governing law-কে reference basis হিসেবে cite (score 0)** করুন, ফাঁকা নয়। | স্পষ্ট absence/score-0 path; কোনো indicator নীরবে বাদ নয় |
| **Dead-link fallback** | সরকারি PDF কখনো হারিয়ে যায় কিন্তু third party অফিসিয়াল টেক্সট হোস্ট করে। | **archived copy + access date** রাখুন; web-archive/third-party = discovery lead, cite অফিসিয়াল instrument |

---

## ২. স্কোপ ল্যাডার

আমরা সমকেন্দ্রিক রিং আকারে ডেলিভার করি। প্রতিটি রিং স্বাধীনভাবে demo-যোগ্য এবং নিচের রিংকে বিপদে না ফেলে পয়েন্ট যোগ করে।

```
RING 0 — CORE (অবশ্যই ship হবে, অপরাজেয়)        ← 5 জুলাইয়ের মধ্যে freeze
  SG + AU + MY · Pillar 6 ও 7 · Zone 1 (crawl) + Zone 2 (extract/map/cite)
  হুবহু template আউটপুট (CSV+JSON) · verbatim audit trail · OCR path · modular config
  NEW/KNOWN discovery · amendment ("Last Amended") ট্র্যাকিং

RING 1 — উচ্চ-মূল্যের OPTIONAL (আমাদের জন্য বাধ্যতামূলক)  ← core freeze-এর পর, শুধু যোগ
  Zone 3: RDTII 0–1 compliance-cost scoring + "Impact" rationale
  + Bonus pillar (Pillar 2 বা 8) SG/AU/MY-এর জন্য
  Extra-mile UI, live engine-এর সাথে যুক্ত

RING 2 — চ্যাম্পিয়নশিপ STRETCH (স্কেলের প্রমাণ)  ← শুধু Ring 1 সবুজ হলে
  connector প্যাটার্নে অতিরিক্ত অর্থনীতি, কঠিনতা অনুযায়ী স্তরে স্তরে:
    Tier A (ইংরেজি / কাঠামোবদ্ধ): India, Indonesia, Mongolia, Timor-Leste
    Tier B (নন-ল্যাটিন / কঠিন পোর্টাল): Thailand, Russian Federation, Lao PDR, China
  Round 1 টার্গেট: SG/AU/MY নিখুঁত + ২–৩টি অতিরিক্ত অর্থনীতি live প্রমাণ হিসেবে।
  Finals টার্গেট: সব ৮টি (সেখানে ৩টি বাধ্যতামূলক) — আর্কিটেকচার আগেই সেখানে পৌঁছাতে সক্ষম হতে হবে।
```

> **বাস্তবতা।** ২০ জুলাইয়ের আগে সব ৮টি অতিরিক্ত অর্থনীতি পুরোপুরি স্কোর করা Round 1-এর শর্ত *নয়* (এগুলো ফাইনালের অংশ, যেখানে ৮টির মধ্যে ৩টি বাধ্যতামূলক)। Round 1 জেতার চাল হলো **নিখুঁত SG/AU/MY + কয়েকটি অতিরিক্ত অর্থনীতিতে কার্যকর, প্রমাণযোগ্য স্কেল** — এবং connector আর্কিটেকচার দেখিয়ে দেওয়া যে বাকিগুলো শুধু "একটা jurisdiction pack যোগ করা" মাত্র। ডেডলাইন না হারিয়ে চ্যাম্পিয়নের মতো দেখানোর উপায় এটাই।

---

## ৩. সিস্টেম আর্কিটেকচার

ইঞ্জিনটি একটি staged, typed pipeline। প্রতিটি stage একটি typed artifact + একটি quality signal বের করে। এটি PRD-এর pipeline-ই, SG/AU/MY এবং হুবহু output contract-এর দিকে **পুনঃনির্দেশিত**।

```
            ┌─────────────────────────────────────────────────────────────┐
 INPUT  →   │  run.py --country SG --pillar 6   (CLI)  ·  POST /runs (API)  │
            └─────────────────────────────────────────────────────────────┘
                                     │
   [0] Jurisdiction Pack   sg.yaml / au.yaml / my.yaml — seed URL, authority graph,
        load                citation pattern, ভাষা, KNOWN-provision তালিকা
                                     │
   [1] Discovery (Zone 1)  অফিসিয়াল পোর্টাল crawl (Playwright) → candidate document,
                            indicator-এর সাথে semantic + keyword প্রাসঙ্গিকতায় ranked
                                     │
   [2] Acquisition         raw bytes + SHA-256 + headers + rendered page image
        & provenance
                                     │
   [3] Authority &         binding / current / draft / repealed / amended;
        currentness        "Last Amended" তারিখ; supersession graph
                                     │
   [4] Extraction (Zone 2) HTML (Trafilatura) | native PDF (PyMuPDF/Docling) |
                            scanned (PaddleOCR→CER, VLM repair) — text + bbox + conf
                                     │
   [5] Legal structure     section tree; rule unit (principal rule + exception +
        & rule units        condition + definition); Horizontal বনাম Sectoral coverage
                                     │
   [6] Retrieval           hybrid BM25 + dense (BGE-M3) + rerank, প্রতি indicator
                                     │
   [7] Predicate extraction actor/action/object/destination/modality/condition/exception
                                     │
   [8] RDTII mapping        rubric-as-code (deterministic) → constrained LLM →
                            P6-I1…P7-I5  (+ optional Zone 3 score 0–1)
                                     │
   [9] Verification gates   G1 span · G2 location · G3 authority · G4 currentness ·
        (G1–G8)             G5 structure · G6 tuple · G7 rubric · G8 counter-evidence
                                     │
  [10] Discovery diff       jurisdiction pack-এর KNOWN-তালিকার সাথে NEW বনাম KNOWN ট্যাগ
                                     │
  [11] Export               CSV (template-exact) + JSON envelope + provenance bundle
                                     │
            ┌─────────────────────────────────────────────────────────────┐
 OUTPUT →   │  output.csv · output.json · logs/ · provenance/   +   UI view │
            └─────────────────────────────────────────────────────────────┘
```

**দুটি entry point, একটি core।** CLI (`run.py`) ডেলিভারেবল #১ এবং "no manual steps" পরীক্ষা পূরণ করে। FastAPI সার্ভিস একই pipeline এক্সপোজ করে, যাতে Next.js UI (extra-mile) mock data নয়, *আসল* run রেন্ডার করে। Pipeline core import-শেয়ারড — কখনো ডুপ্লিকেট নয়।

**Modularity convention দিয়ে নয়, interface দিয়ে enforce করা হয়:**

```python
class LLMProvider(Protocol):
    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel: ...
# impls: LocalVLLM, OllamaProvider, OpenAIProvider, AnthropicProvider

class OCREngine(Protocol):
    def extract(self, page_image: bytes) -> list[OCRToken]: ...  # token + bbox + conf
# impls: PaddleOCREngine, TesseractEngine, (VLM repair: QwenVL / cloud vision)
```

নির্বাচন ১০০% config-চালিত (`configs/models.yaml`)। বিচারকের আক্ষরিক পরীক্ষা — "একটা config value পাল্টে OpenAI-কে Llama 3 দিয়ে swap করা" — গঠনগতভাবেই পাস হয়।

**Production practice দ্বারা যাচাইকৃত (TH2OECD, ৪ জুন ওয়ার্কশপ)।** একটি live সরকারি legal-AI সিস্টেম স্বাধীনভাবে আমাদের দুটি মূল বাজিতে পৌঁছেছে, যা আমরা স্পষ্টভাবে গ্রহণ করি:
- **plain RAG-এর বদলে GraphRAG।** Evidence ledger একটি legal knowledge graph — `Law → Section → Provision` + typed relationship (`amends`, `supersedes`, `qualifies`, `cross-references`, `defines`)। এটি retrieval, exception-following (Schedule-এ পয়েন্ট করা provision), এবং counter-evidence/amendment detection উন্নত করে। এটিই §3-এর ledger, GraphRAG হিসেবে উপস্থাপিত।
- **কঠোর AI/code সীমানা।** LLM শুধু ambiguity, পড়া, তুলনা, draft-এর জন্য; **validation, required-field চেক, scoring, version control ও output packaging-এর জন্য deterministic code** (= আমাদের rubric-as-code + gates)। এটিই ফলাফলকে reproducible করে।
- **প্রথম দিন থেকে observability।** প্রতিটি agent output, retrieved source, intermediate result, rubric hit, score ও model version লগ করুন, যাতে ব্যর্থতা retrieval বনাম classification বনাম reasoning বনাম formatting-এ চিহ্নিত করা যায়। iteration loop-এ feed করে (প্রতিটি reviewer সংশোধন → regression test)।
- **Responsible-AI framing** (OECD principles) pitch-এ: transparency, traceability, human oversight, কোনো autonomous চূড়ান্ত সিদ্ধান্ত নয় — যা আমাদের audit trail + HITL ইতিমধ্যে দেয়।

---

## ৪. টেক স্ট্যাক

এমনভাবে বাছা যেন **একটি ছোট কিন্তু শক্তিশালী দল ৭ সপ্তাহে ship করতে পারে**, অথচ modular বৈশিষ্ট্য বজায় থাকে। PRD-এর ভারী infra (OpenSearch, Qdrant, MinIO, vLLM cluster) Round 1-এ আবশ্যক নয় — *optional scale-up* মাত্র।

| স্তর | Round 1 পছন্দ | কেন / swap path |
|---|---|---|
| ভাষা | Python 3.11 (engine) | এক ভাষা, AI-assistant-এ দ্রুত গতি। |
| Pipeline | stage function-এর সরল typed DAG; Prefect optional | testable, debug-যোগ্য; framework lock-in নেই। |
| Crawl | **Playwright** (JS/anti-bot) + `httpx`; per-site connector | laws.go.th / legislation.gov.au / lom.agc.gov.my সামলায়। Crawl4AI optional। |
| HTML extract | **Trafilatura** + কাস্টম legal DOM adapter | section anchor সংরক্ষণ করে। |
| PDF extract | **PyMuPDF** + **Docling**; টেবিলের জন্য `pdfplumber` | reading order, layout, coordinate। |
| OCR | **PaddleOCR** (coord-native) → **Tesseract** fallback → VLM repair | CER পরিমাপকৃত; bbox citation-কে anchor করে। |
| Embeddings | **BGE-M3** (multilingual, local) | এখন EN + পরে TH/ZH/RU/LO-তে কাজ করে। Qwen3-Embedding বা OpenAI-তে swap সম্ভব। |
| Retrieval | BM25 (`rank_bm25` / SQLite FTS5) + dense (FAISS বা pgvector) + cross-encoder rerank | hybrid; exact legal term + semantics। |
| LLM | Config-routed: **local (Ollama/vLLM) ডিফল্ট**, OpenAI / Anthropic cloud | ১৫-পয়েন্টের modular শর্ত। |
| Schema | **Pydantic v2** + Outlines/JSON-schema constrained decoding | free-form hallucinated output নয়। |
| Storage | **Postgres + pgvector** (server) / **SQLite + FAISS** (laptop mode) | laptop mode = cloud-only বিচারক পথ। |
| Object store | Local FS (`storage/`) → MinIO optional | raw bytes, page image, export। |
| API | **FastAPI** | UI + প্রোগ্রাম্যাটিক অ্যাক্সেস; CLI-এর সাথে একই core। |
| UI | **Next.js 16 / React 19** (বিদ্যমান অ্যাপ), React Query → FastAPI | `/pipeline/*` পুনঃব্যবহার; বিচার্য পথ থেকে SaaS/billing সরানো। |
| Eval | `pytest` + bootstrap-CI metric script | sample DB-এর বিপরীতে reproducible benchmark। |

**বিদ্যমান রিপো প্রসঙ্গে:** Django `accounts` + `subscriptions` (Stripe/bKash) backend বিচার্য ইঞ্জিনের অংশ **নয়** — জমার পথ থেকে বাইরে রাখুন (open-source টুলের জন্য off-message)। Next.js front-end পুনঃব্যবহৃত; এর mock `lib/clausechain/data.ts`-কে live FastAPI কল দিয়ে প্রতিস্থাপন করা হয়।

---

## ৫. রিপোজিটরি কাঠামো

```
clausechain/
  apps/
    cli/            run.py — বিচার্য entry point
    api/            FastAPI service (একই core)
    web/            Next.js audit UI (পুনঃব্যবহৃত, API-তে rewired)
  packages/
    core/           pydantic schema, evidence ledger, run orchestrator
    connectors/     per-portal crawler: sg_sso.py, au_legislation.py, my_lom.py, ...
    extractors/     html.py, pdf.py, ocr.py  (+ OCREngine impls)
    retrieval/      bm25.py, dense.py, rerank.py, hybrid.py
    rdtii/          rubric loader + check
    providers/      LLMProvider impls (local/openai/anthropic)
    verifier/       G1–G8 gate
    discovery/      NEW/KNOWN diff engine
    export/         csv_writer.py (template-exact), json_envelope.py, provenance.py
  configs/
    models.yaml             routing: local | cloud | hybrid
    jurisdictions/          sg.yaml, au.yaml, my.yaml, (id.yaml, in.yaml, ...)
    rdtii/                  pillar_6.yaml, pillar_7.yaml, (optional pillar_2/8.yaml)
  tests/
    fixtures/  golden/  regression/        # sample DB থেকে তৈরি
  benchmark/
    dataset.jsonl  run_benchmark.py  report.md
  docs/
    README.md (Quick Start — বাধ্যতামূলক)  architecture.md  adding_a_jurisdiction.md
  docker-compose.yml
  output_template.xlsx        # organizer template; আমাদের writer এর বিপরীতে validate করে
```

---

## ৬. আউটপুট কন্ট্রাক্ট

**এটি আপস-অযোগ্য এবং বিচারকরা প্রোগ্রামের মাধ্যমে যাচাই করবেন।** কলামের নাম ও ক্রম `OUTPUT_TEMPLATE_31MAY.xlsx`-এর সাথে হুবহু মিলতে হবে। আমাদের `export/csv_writer.py` CI-তে template ফাইলের বিপরীতে header assert করে।

**CSV কলাম (হুবহু):**

`Economy` · `Law Name` · `Law Number / Ref` · `Last Amended` · `Indicator ID` · `Article / Section` · `Discovery Tag` · `Location Reference` · `Verbatim Snippet` · `Mapping Rationale` · `Source URL` · `Confidence` · `Notes`

Writer-এ গেঁথে দেওয়া নিয়ম:
- **প্রতি (provision × indicator)-এ একটি row।** একটি article দুটি indicator-এ ম্যাপ হলে = দুটি row।
- `Economy` = অফিসিয়াল UN নাম। `Law Name` = সম্পূর্ণ নাম + সাল, কখনো সংক্ষিপ্ত নয়।
- `Indicator ID` ∈ {`P6-I1`…`P6-I4`, `P7-I1`…`P7-I5`, optional `P8-I*`} — rubric-এর বিপরীতে validated; **কখনো বানানো নয়**। (`P6-I5`=6.5 নন-রেগুলেটরি, treaty database থেকে আসে — ইঞ্জিন এটি এক্সট্র্যাক্ট করে না।)
- `Article / Section`-এ সবসময় paragraph: `s. 26(1)`, `Art. 26(2)` — কখনো শুধু `Art. 26` নয়।
- `Discovery Tag` ∈ {`NEW`, `KNOWN`} — dropdown-enforced।
- `Verbatim Snippet` = হুবহু উৎস টেক্সট, কোনো পরিবর্তন নয়। G1 পাস করতে হবে (extracted উৎসে span বিদ্যমান)।
- `Mapping Rationale` ≤ ৩০০ অক্ষর, ফরম্যাট: *"This [section] [prohibits/requires/permits/establishes] [what]. Maps to [indicator] because [এক বাক্যের আইনি যুক্তি]।"* অনিশ্চিত হলে ফাঁকা।
- `Source URL` = সরাসরি অফিসিয়াল-পোর্টাল লিংক (Google নয়, third-party DB নয়), live চেক করা।
- **`Coverage` (Horizontal / Sectoral[+sector])** যোগ করুন — Zone-2 স্পেক-এর আবশ্যিক এবং প্রতিটি sample-DB row-তে আছে। (template header না ভেঙে CSV-তে না গেলে JSON + `Notes`-এ রাখুন; Q&A-তে নিশ্চিত করুন।)

**JSON envelope (সম্পূরক, ডেক অনুযায়ী):**

```json
{
  "economy": "Singapore",
  "law_name": "Personal Data Protection Act 2012",
  "source_pdf_path": "storage/runs/<id>/sg_pdpa.pdf",
  "ocr_quality_cer": 0.012,
  "processing_time": 41,
  "model_version": "qwen2.5-7b@local + paddleocr-2.7",
  "provisions": [
    {
      "indicator_id": "P6-I4",
      "article": "s. 26(1)",
      "verbatim": "An organisation shall not transfer any personal data ... unless ... requirements prescribed ...",
      "mapping_rationale": "This s.26(1) permits cross-border transfer only if comparable-protection requirements are met. Maps to P6-I4 (conditional flow regime) — transfer stays possible, so it is NOT a 6.1 ban.",
      "discovery_tag": "NEW",
      "coverage": "Horizontal",
      "measure_type": "binding_primary_law",
      "status": "in_force",
      "last_amended": "2021",
      "source_url": "https://sso.agc.gov.sg/Act/PDPA2012",
      "archived_copy": "storage/runs/<id>/archive/sg_pdpa_2012.html",
      "access_date": "2026-06-07",
      "location_reference": "page 32",
      "translation": null,
      "confidence": 0.94,
      "gate_results": {"G1":"pass","G2":"pass","G3":"pass","G4":"pass","G5":"pass","G6":"pass","G7":"pass","G8":"none_found"},
      "raw_context": "Part VI ... s.26(1) ... (2) ...",
      "rdtii_score": 1.0,
      "impact": "Conditional cross-border transfer regime (RDTII 6.4)."
    }
  ],
  "confidence": 0.94
}
```

JSON-এ CSV-র বাইরেও ওয়ার্কশপে চাওয়া RDTII-methodology ফিল্ড থাকে: **`coverage`** (Horizontal/Sectoral + sector), **`measure_type`**, **`status`** (in_force / amended / repealed / draft / not-yet-effective), **`translation`** (মূল + ইংরেজি + uncertainty flag, নন-ইংরেজি অর্থনীতির জন্য), এবং **`archived_copy` + `access_date`** (link-preservation — একটি চিহ্নিত সমস্যা)। `mapping_rationale` আইনি **function** অনুযায়ী লেখা, snippet-এর paraphrase নয়।

---

## ৭. ইন্ডিকেটর rubric-as-code

**জমার কোডগুলোই RDTII 2.1 methodology ইন্ডিকেটর, ১:১** — RDTII টিম ৫ জুন নিশ্চিত করেছে: `P6-I1 = Indicator 6.1`, `P6-I2 = 6.2`, … `P7-I5 = 7.5`। (পুরোনো `OUTPUT_TEMPLATE`-এর "Indicator Reference" tab আলাদা GDPR-ধাঁচের gloss দিয়েছিল — *adequacy / SCCs / consent / purpose-limitation / breach* — যা **বাতিল**। নিচের methodology সংজ্ঞাই চূড়ান্ত; sample DB, portals CSV, এবং organizers-দের নিজস্ব Assignment 1 সবই এগুলোই ব্যবহার করে।) কোনো **crosswalk নেই** — কোডটিই methodology নম্বর। প্রতিটি indicator YAML হিসেবে এনকোড করি (required predicate, positive cue, exclusion, gold example সহ)।

**Pillar 6 — Cross-border data flows** ("ডেটা কি সীমানা পেরোতে পারে, কী শর্তে, কী খরচে?"):

| Code | Indicator | কী ধরে | উদাহরণ |
|---|---|---|---|
| P6-I1 | 6.1 Ban & local processing | transfer-এ ban **অথবা** local-processing requirement (সর্বাধিক restrictive) | Korea: financial cloud-এ credit data locally process |
| P6-I2 | 6.2 Local storage | একটি **copy** domestically রাখতে হবে (নিজে থেকে transfer নিষেধ করে না) | Türkiye: বড় social network user data দেশে রাখে |
| P6-I3 | 6.3 Infrastructure | service দিতে local **server / data centre / infrastructure** শর্ত | Vietnam: provider-দের ≥১টি local server |
| P6-I4 | 6.4 Conditional flow | শর্ত পূরণ হলে **তবেই** transfer (consent / adequacy / contractual safeguards / approval)। transfer সম্ভব থাকলে এটি ban **নয়**। | Palau: transfer-এর আগে ministry-কে notify + consent |
| P6-I5 | 6.5 No binding data-transfer agreement | **নন-রেগুলেটরি** — external treaty database থেকে; **আমাদের ইঞ্জিন এটি এক্সট্র্যাক্ট করে না।** | — |

> ইঞ্জিন শুধু **P6-I1…P6-I4** কভার করে (P7 সহ মোট **৯টি regulatory indicator**)।

**Pillar 7 — Domestic governance of personal data:**

| Code | Indicator | কী ধরে | উদাহরণ |
|---|---|---|---|
| P7-I1 | 7.1 Comprehensive DP framework | horizontal personal-data-protection আইন (**sectoral আইনও রেকর্ড হয়**) | SG PDPA 2012 (horizontal) |
| P7-I2 | 7.2 Dedicated cybersecurity framework | *বিশেষভাবে* cybersecurity-র জন্য আইন (বিক্ষিপ্ত security clause নয়) | SG Cybersecurity Act 2018 |
| P7-I3 | 7.3 Minimum retention period | data **≥ নির্দিষ্ট সময়** রাখতে হবে (≠ "প্রয়োজনের বেশি রাখবেন না") | BD: e-commerce রেকর্ড ৬ বছর |
| P7-I4 | 7.4 DPIA / DPO | DPO নিয়োগ এবং/অথবা DPIA করার বাধ্যবাধকতা | SG: সংস্থাকে DPO নিয়োগ করতে হয় |
| P7-I5 | 7.5 Government access | সরকারি access সক্ষম/বাধ্য করা আইন — privacy law-এর **বাইরেও দেখুন**: criminal procedure, surveillance, telecom | SG Criminal Procedure Code s.39 |

```yaml
# configs/rdtii/pillar_6.yaml   (codes == methodology numbers)
schema_version: rdtii-2.1
P6-I1:
  name: Ban and local processing requirements        # = Indicator 6.1
  question: Does the law ban cross-border transfer OR mandate local processing?
  required_predicates: { action: [transfer, process], modality: [prohibited, mandatory_local] }
  positive_cues: ["shall not transfer", "must be processed within", "may not be sent abroad"]
  exclusions: ["transfer allowed if conditions met -> that is P6-I4, not a ban"]
P6-I2: { name: Local storage requirements, question: "Must a copy be stored domestically?" }
P6-I3: { name: Infrastructure requirements, question: "Local server / data centre required to provide the service?" }
P6-I4:
  name: Conditional flow regimes                      # = Indicator 6.4
  question: Is transfer permitted subject to consent / adequacy / safeguards / approval?
  required_predicates: { action: [transfer], modality: [conditional], condition: [consent, adequacy, contract, approval] }
  exclusions: ["unconditional ban -> P6-I1"]
P6-I5: { name: No binding data-transfer agreement, regulatory: false }   # non-regulatory: SKIP
```

```yaml
# configs/rdtii/pillar_7.yaml
P7-I1: { name: Comprehensive data-protection framework, note: "record sectoral laws too" }
P7-I2: { name: Dedicated cybersecurity framework }
P7-I3: { name: Minimum data-retention period, exclusions: ["keep no longer than necessary -> NOT 7.3"] }
P7-I4: { name: DPIA / DPO requirements }
P7-I5: { name: Government access to personal data, sources: [privacy_law, criminal_procedure, surveillance, telecom] }
```

**RDTII অনুযায়ী mapping প্রশ্ন (= আমাদের predicate tuple):** *কে* regulated · *কী* required/prohibited · *কোন* data/service/sector-এ · *কোন* শর্তে · *কোন* exception সহ। আইনি **function অনুযায়ী map করুন, keyword নয়** — একটি transfer *condition* হলো 6.4 (6.1 ban নয়); network-segmentation/encryption নিয়ম cybersecurity 7.2 (infrastructure 6.3 নয়)। threshold, exemption, schedule, implementing rule উপেক্ষা করবেন না।

**Bonus pillar.** Organizers **Pillar 3, 5, 9** উদাহরণ হিসেবে বলেছেন — কিন্তু তাদের indicator (3.4, 5.3, 9.1) *secondary-source / de-facto-practice* হ্যান্ডলিং চায় (ভিন্ন pipeline)। আমাদের P6/P7 *regulatory* ইঞ্জিনের সর্বোচ্চ পুনঃব্যবহারের জন্য বিশুদ্ধ-regulatory pillar ভালো: **Pillar 2 (Public Procurement)** — horizontal, পরিষ্কার gold data, আমাদের PRD-তে আছে — অথবা **Pillar 8 (Intermediary Liability)**। Ring 0 সবুজ হলে ঠিক করুন; এটি আরেকটি `pillar_X.yaml` মাত্র। *(সুপারিশ "শুধু P8" থেকে "P2 বা P8, পুনঃব্যবহারের জন্য P2 কিছুটা অগ্রাধিকার"-এ আপডেট করা হলো।)*

---

## ৮. NEW-evidence discovery

**এটিই একমাত্র সবচেয়ে বড় differentiator (৪০-এর মধ্যে ২০ substantive পয়েন্ট) এবং "বেশিরভাগ দল এটি মিস করে।"** আমরা এটিকে উপজাত নয়, একটি প্রধান ফিচার হিসেবে দেখি।

**সংজ্ঞা (৫ জুন Q&A অনুযায়ী পরিমার্জিত)।** NEW/KNOWN বিচার হয় **provision granularity-তে, law granularity-তে নয়।** *ইতিমধ্যে রেকর্ড করা একটি law-এর ভেতরে একটি নতুন provision*-ও **NEW** গণ্য হয় — কারণ RDTII টিম প্রায়ই শুধু law-এর নাম বা প্রথম প্রাসঙ্গিক provision রেকর্ড করেছে (space/time সীমা)। তাই SG PDPA-র মতো "known" আইনেও অনেক NEW সুযোগ আছে: অতিরিক্ত article, exception, sectoral provision যা তারা কখনো cite করেনি। `KNOWN` = হুবহু (instrument + article) আগে দেওয়া উদাহরণ ছিল (পুনরুৎপাদন করুন — recall প্রমাণ করে)।

**ডিজাইন:**
1. প্রতিটি jurisdiction pack-এ sample kit / sample DB থেকে **(instrument + article)** কী-তে একটি `known_provisions:` তালিকা — এবং যেখানে DB শুধু law-এর নাম রেখেছে তা চিহ্নিত করুন (তখন আমাদের cite করা *যেকোনো* নির্দিষ্ট article = NEW)।
2. mapping + verification-এর পর discovery-diff stage প্রতিটি ফলাফল `(instrument, article, indicator)` normalize করে KNOWN সেটের সাথে চেক করে → `NEW`/`KNOWN` ট্যাগ। known instrument-এর ভেতরে নতুন article → `NEW`।
3. **Recall সর্বোচ্চকরণ**-ই আসল ইঞ্জিনিয়ারিং: ব্যাপক two-pass discovery (পুরো পোর্টালে semantic + keyword), rule-unit granularity-তে retrieval, এবং exception/amendment-এর জন্য *counter-retrieval*।
4. প্রতিটি `NEW` row সম্পূর্ণ gate স্ট্যাক-এর মধ্য দিয়ে যায় — verification-ব্যর্থ NEW provision না-পাওয়ার চেয়েও খারাপ (false positive পয়েন্ট হারায়)। NEW + verified-ই সোনা।
5. আউটপুট + UI-তে একটি **discovery summary**: "X provision পাওয়া · Y NEW · Z KNOWN · sample kit-এর তুলনায় recall = …"।

**কেন আমরা বেশি discover করব:** আমাদের authority/currentness resolver *amendment ও superseding instrument* খোঁজে (দেশের টাস্কই "amendment ও নতুন regulation খোঁজা"), এবং rule-unit retrieval সেই exception clause ধরে যা naive top-k chunking বাদ দেয়। দুটোই NEW-provision কারখানা।

---

## ৯. Jurisdiction pack ও দেশ স্কেলিং

একটি অর্থনীতি যোগ করা = একটি `configs/jurisdictions/<cc>.yaml` + (প্রয়োজনে) per-portal connector। এটিই "সব ৮টিতে স্কেল" দাবিকে বিশ্বাসযোগ্য করে।

```yaml
# configs/jurisdictions/au.yaml
jurisdiction: AU
name: Australia
languages: { primary: en, supported: [en] }
official_sources:
  - { name: Federal Register of Legislation, domain: legislation.gov.au, authority_rank: 100 }
authority_hierarchy: { binding_current: [act, legislative_instrument], guidance: [oaic_guidance] }
citation_patterns: { section: ["s {n}", "section {n}"] }
known_provisions: [ ... sample DB থেকে ... ]
connector: au_legislation
rdtii_bindings: { pillars: [6, 7, 8] }
```

**স্কেলিং স্তর (এই ক্রমে connector বানান):**

| স্তর | অর্থনীতি | চ্যালেঞ্জ | পুনঃব্যবহার |
|---|---|---|---|
| Core | SG, AU, MY | ইংরেজি, কাঠামোবদ্ধ | সম্পূর্ণ pipeline |
| A (Round-1 stretch) | India, Indonesia, Mongolia, Timor-Leste | বেশিরভাগ ইংরেজি / ল্যাটিন লিপি, ভিন্ন পোর্টাল | নতুন connector + pack; একই extractor |
| B (Finals) | Thailand, Russian Federation, Lao PDR, China | নন-ল্যাটিন লিপি, OCR-নির্ভর, কঠিন পোর্টাল | + multilingual embeddings (BGE-M3 আছে) + OCR ভাষা প্যাক |

**Round 1 অঙ্গীকার:** SG/AU/MY ১০০% + **২–৩টি Tier-A অর্থনীতি কার্যকর প্রমাণ হিসেবে**। ডেক-এর "additional economies (extra points)" পূরণ হয়, এবং connector প্যাটার্ন ফাইনালের জন্য সব ৮টিতে পৌঁছানোর পথ দেখায়।

---

## ১০. মূল্যায়ন

আমরা নিজেদের গ্রেড করতে পারি কারণ **sample database হলো AU/SG/MY-এর জন্য সব pillar জুড়ে labeled gold data** — যার মধ্যে আসল Pillar 6/7 row আছে (যেমন SG PDPA s.26 → 6.4; Companies Act → retention)।

| Metric | লক্ষ্য | সত্যের উৎস |
|---|---|---|
| Mapping macro-F1 (P6/P7) | ≥ 0.80 | sample DB row (codes ≡ 6.x / 7.x) |
| Field accuracy (article, URL, last-amended) | ≥ 0.90 | sample DB |
| NEW-provision precision | ≥ 0.90 (কোনো ভুল NEW নয়) | manual spot-check + gate |
| Citation exactness (span verifies) | ≥ 0.95 | G1 |
| OCR CER (scanned doc) | < 5% | প্রতি-doc পরিমাপকৃত |
| Crawl recall@20 | ≥ 0.90 | known instrument উপস্থিত |

`benchmark/run_benchmark.py` bootstrap confidence interval সহ `report.md` তৈরি করে। Assignment-2-এর সুপারিশকৃত পদ্ধতি (F1, field accuracy, inter-annotator agreement, RDTII DB-এর বিপরীতে ≥১০টি real provision) হলো সর্বনিম্ন মান; আমরা তা ছাড়িয়ে যাই।

**RDTII quality-control চেকলিস্ট (Juntong, ৫ জুন) — প্রতিটি row ship করার আগে automated gate হিসেবে এনকোড করুন:**
1. Guide অনুযায়ী সঠিক indicator **ও তার scope**?
2. উৎস **official, current ও in force**? (draft/repealed/superseded নয়)
3. শুধু law-এর title নয়, **হুবহু operative provision** ধরা হয়েছে?
4. **মূল নিয়ম তার exception / approval / threshold থেকে আলাদা** করা হয়েছে?
5. কোনো restriction না থাকলে, **general governing law-কে reference basis** হিসেবে cite (score 0) করা হয়েছে, না ফাঁকা রাখা হয়েছে?

এই পাঁচটি human reviewer-দের নিজস্ব pre-entry চেক — এগুলোকে deterministic gate-এ পরিণত করাই human accuracy-র সমান হওয়ার সবচেয়ে সস্তা উপায়।

---

## ১১. ধাপে-ধাপে পরিকল্পনা

৭ সপ্তাহ। **Core ৫ জুলাই freeze; এরপর stretch শুধু যোগ-করা-যায় (additive-only)।** Technical workshop ১১–১৫ জুন (RAG/OCR/architecture) Phase 1–2-কে সমৃদ্ধ করবে — অংশ নিন ও শিক্ষা যুক্ত করুন।

| Phase | তারিখ | ফলাফল | যার সাথে মেলে |
|---|---|---|---|
| **P0 — Foundations** | ৩–৭ জুন | Repo skeleton; Pydantic schema; template header assert করা `csv_writer`; **methodology সংজ্ঞা সহ** `pillar_6/7.yaml` (P6-I1…I4 + P7-I1…I5); SG/AU/MY-এর KNOWN-তালিকা (instrument+article granularity-তে); local+cloud provider সহ `models.yaml`; sample DB-তে যুক্ত eval harness skeleton। | Architecture, Output contract |
| **P1 — Vertical slice** | ৮–১৪ জুন | **একটি কমান্ড end-to-end:** `run.py --country SG --pillar 6` → SSO HTML crawl → extract → P6-I1…I4 map → CSV+JSON, verbatim + exact citation। SG gold-এর সাথে cross-check। প্রথম সবুজ benchmark row। | ডেলিভারেবল ১,২; ছোট স্কেলে সব রুব্রিক ব্লক |
| **P2 — Breadth & resilience** | ১৫–২৮ জুন | **Pillar 7** যোগ; **AU + MY** যোগ (connector); **live crawling** শক্ত করা; একটি scanned MY/SG gazette-এ **OCR path** CER<5% সহ; **modular swap** demo (local↔cloud)। তিন অর্থনীতি × P6+P7 benchmark পাস। | Technical (10+10+e2e), Architecture (15 modular) |
| **P3 — Differentiators** | ২৯ জুন–৫ জুলাই | **NEW/KNOWN discovery** + recall সর্বোচ্চকরণ; **amendment/Last-Amended** ট্র্যাকিং; প্রতিটি row-তে **G1–G8** যুক্ত; **Zone 3 scoring (0–1) + Impact**; confidence + flag-for-review। **CORE FREEZE ৫ জুলাই।** | Substantive (NEW 20pt), Audit trail (15), Zone 3 |
| **P4 — Stretch (champion)** | ৬–১২ জুলাই | SG/AU/MY-এর জন্য **Bonus pillar (P2/P8)**; **২–৩টি Tier-A অর্থনীতি** (India/Indonesia/Mongolia/Timor-Leste) live প্রমাণ হিসেবে; **extra-mile UI** engine-এর সাথে যুক্ত; cost meter। | সব optional |
| **P5 — Package & harden** | ১৩–১৯ জুলাই | **Quick Start README**; **pitch deck** (40/30/30 + failure-mode catch-এর উপর সাজানো); **≤১০-মিনিট screen recording** (scanned-PDF → citation); benchmark `report.md`; edge-case হ্যান্ডলিং (ভুল বানানের country, dead URL); **live-demo dry run**। | ডেলিভারেবল ১,৩,৪; live-pitch প্রস্তুতি |
| **Submit** | **২০ জুলাই** | সব ৫টি ডেলিভারেবল আপলোড। | — |
| Pitch prep | ২১ জুলাই–৩ আগস্ট | live run রিহার্সাল; hold-out economy; ইন্টারভিউ Q&A। | ডেলিভারেবল ৫ (৩ আগস্ট) |

---

## ১২. ডেলিভারেবল

| # | ডেলিভারেবল | মালিক phase | গ্রহণযোগ্যতা |
|---|---|---|---|
| ১ | Functional prototype (Task 1+2) + **Quick Start README** | P1→P5 | **CLI বাধ্যতামূলক** (৫ জুন নিশ্চিত): রিভিউয়ার `python run.py --country SG --pillar 6` চালান, CSV+JSON পান, কোনো manual step নেই; text **ও** scanned PDF-এ কাজ করে; open-source fallback switch; pinned version। Quick-start "১০ মিনিট" = install-এর **পরে** runtime (setup সময় বাদ)। |
| ২ | Structured output (CSV+JSON) | P1 | `OUTPUT_TEMPLATE_31MAY.xlsx`-এর বিপরীতে প্রোগ্রাম্যাটিকভাবে validate; live URL; NEW row উপস্থিত। |
| ৩ | Technical pitch deck | P5 | Problem→solution; extraction+mapping logic; **স্পষ্টভাবে 40/30/30 ও failure-mode catch-এর সাথে ম্যাপ করা**; non-technical + technical উভয় বিচারকের জন্য। |
| ৪ | ≤১০-মিনিট screen recording | P5 | Engine একটি **scanned/image PDF** প্রসেস করে, সঠিক citation তৈরি করে, audit trail দেখায়। |
| ৫ | Live demo + interview (৩ আগস্ট) | P5+ | Engine একটি country+pillar-এ **live** চলে, real time-এ output দেয়; একটি hold-out economy সামলায়। |

---

## ১৩. UI পরিকল্পনা — extra mile

Engine হলো scored core; UI হলো যেভাবে আমরা চ্যাম্পিয়নের মতো দেখাই এবং policy বিচারকরা সেকেন্ডে যাচাই করেন। বিদ্যমান Next.js অ্যাপ পুনঃব্যবহার করুন; **বিচার্য পথ থেকে SaaS/auth/billing surface বাদ দিন**; `/pipeline/*`-কে React Query দিয়ে FastAPI engine-এর সাথে যুক্ত করুন।

অগ্রাধিকার স্ক্রিন (PRD-এর "যে তিনটি demo জেতায়", পুনঃনির্দেশিত):
1. **Run console** — economy + pillar(s) বাছুন → stage-গুলোর মধ্য দিয়ে live progress → ফলাফল টেবিল। "no manual steps" গল্পের ভিজ্যুয়াল।
2. **Evidence audit (টাকার স্ক্রিন)** — output row ↔ মূল উৎস পাশাপাশি, **আসল PDF/HTML-এ verbatim span হাইলাইট**, predicate tuple, indicator, gate badge, NEW/KNOWN tag, confidence। এটিই ১৫-পয়েন্টের audit trail।
3. **Discovery & coverage dashboard** — NEW বনাম KNOWN গণনা, SG/AU/MY জুড়ে per-indicator coverage, sample kit-এর তুলনায় recall, cost meter, CER। এক নজরে substantive accuracy প্রমাণ।
4. **Source status / amendment view** — current বনাম superseded, "Last Amended," counter-evidence — প্রমাণ করে আমরা পুরোনো আইন cite করি না।
5. **Cross-jurisdiction comparative view** — একই indicator SG/AU/MY জুড়ে পাশাপাশি (সরাসরি WTO end-user অনুরোধ: "একই query বিভিন্ন jurisdiction-এ চালিয়ে comparative analysis দাও")। per-economy আউটপুটের উপর সস্তায় বানানো যায়; উচ্চ demo-মূল্য।

Engine চালাতে UI কখনো আবশ্যক নয় (**CLI-ই বিচার্য artifact — ৫ জুন নিশ্চিত যে আবশ্যক; GUI অতিরিক্ত**), কিন্তু এটি *আসল* run রেন্ডার করবে।

---

## ১৪. ঝুঁকি রেজিস্টার ও ডেডলাইন সুরক্ষা

| ঝুঁকি | প্রশমন |
|---|---|
| Stretch কাজ core ভেঙে দেয় | **৫ জুলাই Core freeze**; stretch branch-এ; core সবুজ ও জমা-উপযোগী ৫ জুলাই থেকে। প্রয়োজনে ৫ জুলাইতেই জমা দেওয়া যেত। |
| ৮ অর্থনীতিতে স্কেল ডেডলাইন খেয়ে ফেলে | Round 1 ship করে SG/AU/MY + শুধু ২–৩টি Tier-A; all-8 একটি *finals* লক্ষ্য। connector প্যাটার্ন = সম্পূর্ণ coverage ছাড়াই স্কেলের সস্তা প্রমাণ। |
| কঠিন পোর্টাল (anti-bot/JS) crawler ব্লক করে | Playwright + per-site connector; manual-upload fallback retrieval issue হিসেবে logged (তবু প্রসেস হয়), তাই e2e path কখনো পুরোপুরি ব্যর্থ হয় না। |
| খারাপ scan-এ OCR CER > 5% | প্রতি-doc পরিমাপ; low-confidence অঞ্চলে VLM repair; শুধু verified span cite; CER সৎভাবে রিপোর্ট। |
| Indicator-কোড অস্পষ্টতা (P* বনাম *.x) | **সমাধান হয়েছে** (৫ জুন): `P6-Ix ≡ 6.x`, `P7-Ix ≡ 7.x`; methodology সংজ্ঞা `pillar_*.yaml`-এ; output-template gloss উপেক্ষিত। |
| পুরোনো/বাতিল আইন cite করা (মূল ভুল) | G4 in-force চেক (গৃহীত+প্রকাশিত → effective date → repealed/superseded নয়) + amendment graph + live URL রিজল্যুশন। |
| "NO খোঁজা" — absence প্রমাণ কঠিন | স্পষ্ট score-0 path: restriction না পেলে general governing law-কে reference basis হিসেবে cite; কোনো indicator নীরবে বাদ নয়। |
| Dead সরকারি লিংক | acquisition-এ archived copy + access date; third-party host = discovery lead, cite অফিসিয়াল instrument। |
| LLM indicator/আইন বা অস্তিত্বহীন টেক্সট hallucinate করে | constrained decoding + rubric enum + **G1 span (quote অবশ্যই উৎসে থাকতে হবে)** + G7 reject; catch demo। |
| Infra over-engineering | SQLite+FAISS laptop mode দিয়ে শুরু; প্রয়োজনে Postgres/pgvector-এ স্কেল। |
| Team bus factor | পরিষ্কার দায়িত্ব (§১৫); schema আগে শেয়ার করুন যাতে stage পরিষ্কারভাবে integrate হয়। |

**সোনালি নিয়ম:** প্রতিটি সাপ্তাহিক checkpoint-এ main branch অবশ্যই end-to-end চলবে এবং অন্তত SG-এর জন্য valid output দেবে। না দিলে feature কাজ থামিয়ে আগে ঠিক করুন।

---

## ১৫. ভূমিকা ও দায়িত্ব

হ্যাকাথনের "Tech Lead + Substantive Lead" কাঠামোর সাথে সঙ্গতিপূর্ণ; দলের আকার অনুযায়ী মানিয়ে নিন।

| ট্র্যাক | দায়িত্ব |
|---|---|
| **Substantive lead** | Rubric YAML (methodology সংজ্ঞা), gold-set labeling, mapping-rationale গুণমান, indicator সঠিকতা, Q&A-পোর্টাল escalation, pitch (policy অংশ)। |
| **Tech lead / backend** | Pipeline core, connector, extractor/OCR, provider, verification gate, CLI/API, benchmark। |
| **Frontend** | Next.js UI rewire, evidence-audit স্ক্রিন, discovery dashboard। |
| **Shared** | Output contract (আগে schema!), README, screen recording, live-demo রিহার্সাল। |

---

## তাৎক্ষণিক পরবর্তী কাজ (এই সপ্তাহ, P0)

1. **Juntong-এর manual extraction assignment করুন (deadline ৯ জুন)** — Indicator 6.1 (Singapore) + 7.3 (Malaysia), 5.3 (India) optional। এটি আমাদের **gold-label spec** হিসেবেও কাজ করে: হাতে সংগ্রহ করা operative clause, citation, coverage, timeframe ও reasoning-ই প্রথম benchmark row হবে যা আমাদের engine-কে পুনরুৎপাদন করতে হবে।
2. Repo scaffold করুন (§৫); **আগে** Pydantic schema + template-assert করা `csv_writer` সংজ্ঞায়িত করুন যাতে প্রতিটি stage আসল contract-কে target করে।
3. **methodology সংজ্ঞা সহ** (§৭) `pillar_6.yaml` + `pillar_7.yaml`, এবং sample kit + portals CSV থেকে SG/AU/MY `known_provisions` তালিকা (instrument+article) লিখুন।
4. একটি local provider + একটি cloud provider সহ `models.yaml` দাঁড় করান, এবং swap প্রমাণ করুন।
5. eval harness sample DB-তে যুক্ত করুন যাতে প্রথম দিন থেকেই একটি scoreboard থাকে।

> PRD-তে আগেই ডিজাইন করা engine বানান — শুধু Singapore, Australia, Malaysia, হুবহু `P6-I1…P7-I5` output template, এবং NEW-evidence পুরস্কারের দিকে তাক করা। আগে core-কে অপরাজেয় করুন; এরপর বাকি প্রতিটি ঘণ্টা সেই optional-গুলোতে দিন যা "shortlisted"-কে "champion"-এ পরিণত করে।
