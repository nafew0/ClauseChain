# 11 June — Technical Workshop (Corrected Notes)

**Sources:** `Engineering AI Across Borders—Varanyu S.pdf` (60 slides), `Responsible AI for Global Trade—Xiaochen Zhang.pdf` (10 slides, AI 2030), `Subtitle 11 June.srt` (full talk + Q&A, auto-transcription corrected against context).

**Character of the session:** two *strategy/responsible-AI* talks (not deep build tutorials). Highest value for us is the **pitch narrative** (development divide, trust > compliance, human accountability, OECD/UNESCO framing) and a few **design priorities** (the "five borders", the "model ≠ system" layered view). Moderator: Latthaporn Palichariwat (KMITL).

---

## TALK 1 — Varanyu Suchivoraphanpong (DEMETER ICT): "Engineering AI Across Borders"

Thesis: **"Building AI is easy. Predicting human behaviour is hard."** Most AI projects die between demo and impact. He gave a funnel: ~1000 prototypes → ~100 pilots → ~10 deployments → ~1 real-world impact.

### Why AI projects fail (5 causes)
No real problem · poor data quality · no workflow integration · lack of trust · no ownership/accountability.

### The Five Borders to cross when deploying AI across countries
1. **Language** — minority languages under-represented; even within one language, regional/legal variants differ.
2. **Culture** — user behaviour & expectations differ; the same platform needs local adaptation.
3. **Regulation** — every country governs AI differently; *compliance is necessary but not sufficient for trust.* (He cited a G20 AI-regulation spread so wide it's effectively un-harmonised.)
4. **Infrastructure** — US + China hold ~half the world's data centres; many economies lack compute/connectivity → edge/distributed/local strategies.
5. **Organisation** — clear ownership chain: *Developer → Organisation → Operator → Decision-maker.*

### "Model ≠ System" — the six-layer view (his core engineering point)
> "People confuse a model with a system. When someone says 'we're building an AI solution,' they often mean they've selected GPT, Gemini, or Claude. But a model is only one component."

Layers (model sits in the *middle*, not the top): **Users** (care about outcomes/trust, not benchmarks) → **Applications** (must fit existing workflow, no copy-paste friction) → **AI Services** (LLM reasoning + **RAG** for knowledge + agents + tools) → **Knowledge** ("the most underrated component — outdated/incorrect knowledge degrades everything") → **Enterprise Systems** ("if AI can't connect to operational systems it's an isolated intelligence layer and creates no value") → **Governance** (security, audit, monitoring — "without governance you can't trust AI; without trust you can't scale it").

### Five dimensions of success
Problem · People (adoption) · Process (workflow fit) · Platform (data/infra) · Policy (compliance & governance). "Missing even one and the project is stuck."

### Problem selection (he was blunt with hackathon teams)
- Evaluate every idea on: **important? scalable? feasible? measurable?**
- The anti-pattern: *Start with AI → pick tech → build demo → search for a problem.* The right order: *Problem → People → Workflow → (only then) AI → Measure impact.*
- Named high-impact domains — **Digital Trade is first on his list** ("language barriers, regulatory barriers, market-intelligence and documentation inefficiencies… AI can reduce barriers to international trade"), then public services, healthcare, education, climate, agriculture.
> "The world does not need more AI demos. The world needs solutions that improve lives."

### Responsible AI = trust, not compliance
> "Responsible AI is not about compliance. Responsible AI is about building systems people can trust. … Just because we can build it doesn't mean we should."

Five questions: *Should we build it? Who benefits? Who could be harmed (bias/exclusion/misinformation/privacy/safety)? Who is accountable? How do we monitor it (build→deploy→monitor→measure→improve)?* Five-test checklist: **Useful · Fair · Explainable · Safe · Accountable.** Failure case studies: Microsoft **Tay** (learned from poisoned inputs) and **Amazon hiring** (amplified historical gender bias) — both "garbage/ bias in → amplified at scale."

### Q&A highlights (corrected)
- **Trust in "black-box" outputs:** comply with the country's laws/standards; users trust government-aligned compliance + audit reports. (For us: cite official sources + verifiable audit trail.)
- **#1 weakness across ~1000 startup applications he reviews:** teams haven't researched the landscape/competitors — "they claim 'nobody's doing this' and it isn't true." (For us: know the comparable indices/tools; we already position vs OECD i-Reg, EUI DTI, etc.)
- **Liability when AI is wrong:** "Accountability always belongs to the organisations or decision-makers who build it. AI cannot bear responsibility." Procurement contracts must allocate liability when building on foundation models. (For us: human-in-the-loop + audit trail = the accountability story.)

---

## TALK 2 — Xiaochen Zhang (AI 2030): "Responsible AI for Global Trade"

A policy/stakes talk. Most useful as **pitch ammunition** (the "why this matters for the Global South / development divide" framing ESCAP cares about).

### The stakes
- AI could add **+34–37% to world trade by 2040** (WTO 2025); **+14–15% income** for low/middle-income economies if they close half the digital gap.
- But **87% of notable AI models sit in high-income economies** (home to 17% of people). "On current trends, AI **compounds** the development divide. The window to change course: **2025–2027**."

### Where AI moves the needle in trade
Trade-finance gap (US$2.5tn unmet) · customs & documentation (20–40 docs/shipment; AI cuts checks 20 min → 2 min, ADB-ESCAP) · supply-chain visibility · **non-tariff measures (NTMs now cost more than tariffs for 88% of countries; AI can cut compliance cost ~19%)** · illicit-trade/AML screening.

### What actually works (evidence, not hype)
Brazil **SISAM** customs risk-targeting (100% of declarations) · Ant **MYbank "310"** SME credit (3-min apply, 1-sec approve, 53m SMEs) · public digital-trade backbones (Singapore NTP, India ULIP, ASEAN Single Window) · automated HS classification (~85–89%) · smart ports. Pattern: **"long-horizon, narrow-purpose AI wins; grand platform plays fail without neutral governance"** (TradeLens collapsed because competitors distrusted a Maersk-run "neutral" platform).

### Risks of getting it wrong
Connectivity divide · data/platform concentration · algorithmic bias (a 10-algorithm African fintech audit found a **37% underfunding penalty against women-led SMEs at identical financials**) · job displacement · cyber exposure · energy & extraterritorial rules (EU AI Act).

### Responsible-AI frameworks to anchor on (relevant to our pitch's RAI section)
**UNESCO Recommendation on the Ethics of AI** (adopted by 194 states — near-universal) · **OECD AI Principles** (47 jurisdictions; the de-facto interoperability anchor, imported into the EU AI Act & UN texts) · **Global Digital Compact (2024)**. The ask to negotiators: invest in connectivity/compute/context/competency; anchor on UNESCO/OECD definitions; **operationalise responsible AI (human-in-the-loop oversight + bias audits)**; be rule-makers, not rule-takers.

### Q&A highlight
- **What gets a government tool adopted vs. stuck as a prototype:** government plays two roles — *adopter* (has internal POC→pilot→adoption process) and *enabler* (open data, compute, open-source platforms). Startups benefit most from the enabler role. (For us: ESCAP is the adopter; our open-source Apache-2.0 + reproducibility is aimed at exactly that.)

---

## WHAT THIS MEANS FOR CLAUSECHAIN (corrected — RDTII engine, not a contract tool)

> ⚠️ The auto-digest of this session mis-described ClauseChain as a "contract-analysis" product. It is **not** — ClauseChain crawls official legal sources, extracts statutory provisions, maps them to RDTII Pillar 6/7 indicators, verifies citations, and exports the template CSV/JSON. The takeaways below are reframed correctly.

**For the build (design priorities):**
1. **"Model ≠ system" → our layered architecture is the right instinct.** Judges reward architecture (30%): keep the **Knowledge layer** (jurisdiction packs + KNOWN index + rubric YAML) and **Governance layer** (gates + audit trail + observability) first-class, with the LLM as one swappable component in the middle. This directly matches Varanyu's diagram.
2. **Knowledge is "the most underrated component"** — and our differentiator. The RDTII rubric, the master-DB KNOWN index, and per-jurisdiction packs *are* the knowledge layer; invest there, not in model choice.
3. **Workflow fit + human-in-the-loop** — the reviewer's verification step is the "application layer." Make every row reviewable in seconds (verbatim snippet + live URL + rationale). This is both Varanyu's "fit the workflow" and the 15-June "document-by-document, human-verification" requirement.
4. **The five borders ≈ our jurisdiction-pack design** (language, citation grammar, source-acceptance, calendar per country). Validates "add a country = add a YAML." (Reminder from 15 June: extra countries aren't *scored* in Round 1 — build the pattern, don't burn time scoring them yet.)

**For the pitch (deliverable #3 — this is where these talks pay off):**
5. **Open with the development-divide framing** (Xiaochen's numbers: AI compounds the divide; NTMs cost more than tariffs; ESCAP's manual RDTII is unsustainable). Position ClauseChain as the *sustainability + capacity-building* answer that lets any economy score itself — "AI for All / responsible AI for global trade."
6. **Responsible-AI slide** anchored on **UNESCO + OECD principles**: transparency, traceability, **human oversight (no autonomous final scoring)**, bias-awareness. We already deliver this via the audit trail + HITL + deterministic gates — name the principles explicitly.
7. **Accountability story:** "AI cannot bear responsibility" → our design keeps the human as final arbiter (Zone 3 score = AI *suggests*, human *approves*); the engine accelerates Zone 1 ~100× and makes review instant.
8. **"Narrow-purpose AI wins; grand platforms fail without neutral governance"** → frame ClauseChain as a *focused* RDTII evidence engine under *neutral UN/open-source governance*, not a sprawling legal-AI platform. Depth over breadth — which also matches Dr. Witada's "we value solving pain points over a general tool."

---

## Correction notes (worst garbles → fixed)
"Wuran-yoo / Wala Panpong" → **Varanyu Suchivoraphanpong**; "middle ICT" → **DEMETER ICT**; "Latapum Palichatwisha / Kimmukud Institute, Latkabang" → **Latthaporn Palichariwat, King Mongkut's Institute of Technology Ladkrabang (KMITL)**; "Xiong Zhang" → **Xiaochen Zhang**; "Core" (in "GPT, Gemini, Core") → **Claude**; "exability" → **explainability**. Slide facts/numbers were cross-checked against the two PDFs (both read in full).
