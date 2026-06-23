# 12 June — Technical Workshop (Corrected Notes)

**Sources (now recovered & read in full):** `RAG and LLMs—Rathachai Ch.pdf` (55 slides), `AI-Assisted Legal Document—Qian Xiao.pdf` (45 slides), `Subtitle 12 june.srt` (both talks + shared Q&A; auto-transcription corrected against the slides + context). *(The earlier `NOTES_12June_Workshop_FILES_MISSING.md` is obsolete — the files were unsynced placeholders then; they downloaded correctly on 22 June.)*

**Two talks, one shared Q&A:**
1. **Rathachai Chawuthai** — Associate Professor, Computer Engineering, **KMITL** — *"RAG and LLMs"* (a broad, practical RAG/LLM tutorial).
2. **Qian Xiao** — **Maynooth International Engineering College** — *"AI-Assisted Legal Document: From Policy Confusion to Compliance Transparency — Embedding Quality Assurance & Auditing"* (legal-judgment, noise, and **a worked RDTII Pillar-6 example** — the most directly relevant talk of the whole series).

> ⚠️ **Attribution caveat:** the two talks share foundational RAG material and one transcript, so *slide* content below is reliably separated (two different decks) but a few *spoken* lines may be cross-attributed. Where a spoken detail is KMITL-specific (e.g. the "CE-KMITL" demo) it's Rathachai's. Qian Xiao's deck past slide ~31 did not render cleanly and is **not reproduced** (not fabricated).

---

## TALK 1 — Rathachai Chawuthai (KMITL): "RAG and LLMs"

A hands-on tutorial. License CC BY-NC-SA 4.0; references byhand.ai and the Transformer Explainer.

**Foundations.** Five kinds of generative AI (text/image/audio/video/code). LLM history: N-grams/bag-of-words → **Word2Vec (2013)** → RNN/LSTM → attention → **Transformer (2017)** → BERT/GPT→ChatGPT. Scale illustration: nano-gpt (85k params) → GPT-2 XL (1.5B) → GPT-3 (174.5B). LLMs are trained on the **"fill-in-the-blank" game → this is statistics, not reasoning.**

**Fine-tuning vs RAG.** Fine-tuning needs labelled data + **GPUs → expensive**; he frames **RAG as the cheaper path** that doesn't retrain the model. (Examples: expanding "CE-KMITL", OTC medication suggestion.)

**The RAG 4-step process (his core content):**
1. **Data preparation** — clean, **chunk**, and **augment** (add summaries/headers/metadata). Pitfalls: *too much low-quality content; documents too large.*
2. **Input processing** — embed the query; **make the query format match the stored content**; use metadata to augment the query.
3. **Retrieval** — **combine vector similarity with deterministic DB queries**; **re-ranking** matters; cache where possible.
4. **Answer generation** — fit retrieved context into the context window; the LLM's job is to **rephrase formal legal text into a clean answer**, not invent facts.

**The retrieval bottleneck (load-bearing):** *if the relevant chunk isn't in the top-k results, no LLM can recover it.* All similarity is statistical, not understanding.

**Embeddings & graph.** **BGE-M3** (multilingual, multi-granularity, up to 8192 tokens; cosine similarity); also ViT (image patches) and spectrogram audio embeddings. **GraphRAG**: knowledge graph + **Text-to-Cypher** over **Neo4j**; he showed a **GraphRAG-for-legal schema** — `Document → Article → Paragraph → Item → Subitem`, with **`AMENDS` and `REVOKE` edges** (worked example: an Employment Agreement 2024 Art. 4 amended by a Contract Amendment 2026 Art. 1; a Subitem marks the revoked bonus clause). Also Microsoft GraphRAG local inference server.

**Q&A highlights (Rathachai):**
- **No GPU? Fine for *inference*.** Use open models from Hugging Face; he mentioned an **NVIDIA DGX Spark**-class desktop for ~120B local. *"GPU isn't the bottleneck for inference — the real cost is pre-processing: converting documents into embeddings/graph and chunking."* (Directly relevant to the 15-June CPU-only constraint.)
- **Amended/withdrawn laws → dangling references:** track **effective date vs enforcement date** (different things); **"identify the delta"** (what changed vs what you already know); **verify a cited document is still valid before citing it**; model amendments/revocations as **graph edges** so broken references are queryable.
- **Model size rules of thumb (June 2026):** **>10B** for general tasks, **>30B** for tool-use / function-calling, **>120B** for good Thai.
- **Auditing LLM output:** no single best framework — design auditing into the system: (1) faithfulness metrics, (2) **expert QA gold pairs** scored by rules, (3) **cross-check a small model with a larger commercial LLM**, (4) confidence intervals.
- **Study Anthropic's "Claude Code for Legal" plugin** as a prompt-engineering exemplar for the legal domain ("do not assume / specify effective vs enforcement dates / identify deltas / verify before citing"). Embed human principles in prompts rather than trying to eliminate stochasticity.

---

## TALK 2 — Qian Xiao (Maynooth): "AI-Assisted Legal Document — Quality Assurance & Auditing"

**This is the talk built for our exact problem.** Framed around three questions: understand LLM judgment flaws (structural + inherited); measure & audit LLM judgment; align LLM with human principles.

**The complexity of digital-trade policy.** Legal corpus + a policy lifecycle (develop→approve→implement→monitor→review&update); strong **regional divergence** — explicitly cites **ESCAP's "Digital Trade Regulatory Review for Asia and the Pacific, 2025"** and shows **RDTII Pillar 11** complexity by region. Point: the search *interface* simplifies (ChatGPT/Claude/DeepSeek) but the legal *complexity* doesn't — "tools ≠ effectiveness; tools have learning curves and flaws; tools must be adapted."

**Promise vs flaws.** LLMs save time (summarization, retrieval, reference-finding, **OCR**), are context-aware, navigate ambiguity, enable agentic workflows — **but** hallucinate, are black-box, drift out of alignment, and cost money. "LLM is *another* form of intelligence: its foundation is statistical" (fill-in-the-blank ≠ reasoning). Covered tokens/embeddings via the Transformer Explainer (GPT-2: 768-dim, 50,257-token vocab) and the Embedding Projector.

**⭐ The Semantic-Similarity Bottleneck + Direct Corpus Interaction (most important for our retrieval design).**
- *"Pre-computed semantic similarity forces all evidence through a highly compressed, opaque funnel… **If evidence is filtered out early by a top-k similarity score, no amount of downstream reasoning can recover it.**"*
- Cites **Li, Zhuofeng et al., "Beyond semantic similarity: Rethinking retrieval for agentic search via direct corpus interaction," arXiv:2605.05242 (2026).** On BrowseComp-Plus, a **Direct Corpus Interaction (DCI)** agent answered **21.2% of questions that top-k RAG missed**; most DCI wins were cases where RAG *did* surface the evidence but the top-k snippets couldn't bridge the multi-hop/lexical constraints. The Pareto chart shows a cheap **DCI-Agent-Lite (GPT-5.4-nano, ≈$93, 62.9%)** vs **Claude Sonnet 4.6 (80%+, far costlier)** — i.e. accuracy-per-dollar matters.

**⭐ Noise, fidelity, and a Noise Audit ON RDTII PILLAR 6 (the single most ClauseChain-relevant artifact in the series).**
- Kahneman's *Thinking, Fast and Slow* + *Noise*: human judges are wildly variable (a 208-judge study recommended 1.1 to **15 years** for the same case). **LLMs inherit this noise** (trained on human text). "Reaching zero noise isn't even desirable — it reduces flexibility."
- **Reframe:** *"We cannot reliably measure the accuracy of an LLM's judgment, but we can measure its **fidelity**."* **"Any single score (a number) is not reliable; but simulating ambiguity is computationally cheap."**
- **The Noise Audit procedure:** (1) choose a judgment task; (2) prepare **multiple LLM judges, each a different persona**; (3) collect their conclusions **independently**; (4) measure disagreement; (5) compare actual vs expected disagreement using **Krippendorff's Alpha**.
- **He applied this to RDTII Pillar 6.** The slides show an **"uncertainty whisker chart by Pillar 6 indicator"** using **our exact indicator weights — 0.38 / 0.31 / 0.12 / 0.12 / 0.08** (= 6.1 / 6.3 / 6.2 / 6.4 / 6.5), plus a **"disagreement-intensity (α_k) heatmap"** across scoring dimensions (data type, horizontal scope, sector scope, commercial impact, binding, affected economies, score class). This is a ready-made template for scoring P6 with calibrated uncertainty.

**⭐ Tips slide (quote verbatim — these are design rules for us):**
1. **"Do not collapse evidence into scores too early. Keep source fragments, interpretations, and scoring decisions separate."**
2. **"Always model uncertainty. Legal text is often vague, translated, outdated, or sector-specific."**

**Evaluation of LLM judgment in law.** "In law, correctness cannot be reduced to one solution… the task is to cultivate judgment — weigh competing reasons, grapple with ambiguity, reach a defensible conclusion." Cites the Stanford study **Salinas et al., "Law Professors Prefer AI Over Peer Answers" (2026)**: Gemini 2.5 Pro won **75.9%** / NotebookLM+RAG **74.75%** of blind comparisons vs instructors — *but* also a notable **harmfulness rate** and wide Bradley-Terry uncertainty. Lesson: AI can beat experts on average **and still be noisy/harmful** → audit, never trust a single output.

**Q&A (Qian Xiao):** on hallucination — "the vector DB only knows mathematical similarity, not human meaning; a good-enough LLM can filter the correct answer from the incorrect ones. For your hackathon, build a *smart* model, not a stupid one."

---

## WHAT THIS MEANS FOR CLAUSECHAIN (grounded in the talks; our inferences marked)

1. **Validates "broad recall, NOT top-k" — strongly.** Two independent sources now say it: the DCI bottleneck slide ("evidence filtered out early can't be recovered") + Nikita on 5 June. Our retrieval must over-retrieve and let the gates/mapper cut, never gate on a small top-k. *(Inference: consider a "direct corpus / graph interaction" step where the mapper can query the corpus or graph directly for exact lexical constraints — article numbers, defined terms — instead of relying only on pre-computed embeddings.)*

2. **GraphRAG-for-legal schema = our graph schema, externally validated.** Rathachai's `Document → Article → Paragraph → Item → Subitem` with **`AMENDS` / `REVOKE`** edges is essentially our `SqliteGraphStore` model. Action: adopt those exact relationship types (amends / revokes / supersedes / cross-references) — they power both the currentness gate (G5) and the amendment story.

3. **Implement the Noise Audit for Zone 3 — this is a differentiator handed to us.** Score each indicator with **multiple persona LLM judges, independently**, then report **disagreement/uncertainty (Krippendorff's Alpha)** and flag high-noise rows for human review, instead of emitting a single 0/0.5/1. This *is* our "AI suggests, human approves" design, now with a principled uncertainty measure — and Qian Xiao already prototyped it on **Pillar 6 with our weights**. High pitch value; directly feeds the audit-trail rubric.

4. **"Keep evidence separate from scores; always model uncertainty."** Confirms our pipeline separation (evidence row → predicate → mapping → score) and argues for explicit **confidence + flags** on every output row (we have `Confidence` + `Notes`/`Status`). Don't let the score overwrite the evidence.

5. **Skip fine-tuning; RAG + strong prompting.** Both speakers; and it's forced by the 15-June no-GPU/no-API-key constraint. Our plan already avoids fine-tuning — keep it that way.

6. **CPU reality check (ties to the 15-June runtime constraint).** Inference on open models is fine on CPU; **the real cost is preprocessing/embedding** → precompute embeddings offline, cache, and pick a CPU-friendly multilingual embedding. *(Inference/decision: BGE-M3 is multilingual but heavy for pure CPU; for Round 1's English economies a smaller/quantized embedding + BM25 may be the better cost trade-off — decide via our eval harness.)*

7. **Hybrid retrieval is explicitly endorsed** — "combine semantic search with deterministic queries." Our BM25 + dense + graph design is exactly what both talks recommend.

8. **Study the Anthropic "Claude Code for Legal" plugin** for legal prompt patterns (effective-vs-enforcement dates, identify-delta, verify-before-cite) — fold these into our mapper/predicate prompts and the currentness gate.

9. **Model-size guidance for our local default** (the 15-June action item): tool-use/mapping wants ≥30B-class quality, but CPU pushes toward quantized models — an explicit accuracy-vs-cost-vs-runnable trade-off to settle when we pick the default profile.

---

## Correction notes (worst garbles → fixed)
"IHG / I-A-G" → **RAG**; "LAM / rm / last-run module" → **LLM**; "coppers / cipher" → **Cypher**; "old 4j" → **Neo4j**; "entropic" → **Anthropic**; "BPE-M3 / BGM3 / VTM3" → **BGE-M3**; "DigiX Spark" → **DGX Spark**; "Latachi Shau-Wu Tai / Latacai" → **Rathachai Chawuthai (KMITL)**; "Sheng Chil / Shen Chiu" → **Qian Xiao (Maynooth)**; "lego" → **legal documents**; "CE-KMTL" → **CE-KMITL**; "word to work" → **Word2Vec**; "fill in blank game" → masked-language / next-token training. Slide facts, paper citations (arXiv:2605.05242; Salinas 2026), and the Pillar-6 weights were cross-checked against the two PDFs.
