# ClauseChain — Simple Guide for the Legal Teammate

**Who this is for:** our legal/policy teammate. You know law well. You know a little about AI, RAG, and APIs. This guide explains, in plain English, **what we are building, how it works, and what your job is.** No deep tech knowledge needed.

**How to read it:** top to bottom, once. Then keep Part 5 (the Gates) and Part 9 (the Plan) open while you work. If one sentence is unclear, ask — a question costs one minute.

---

## Part 1 — The big picture (what is this competition?)

The UN agency **ESCAP** keeps a big database. It measures how each country regulates digital trade. They call it the **RDTII** (a digital-trade rules index).

Right now, **humans build this database by hand.** Lawyers read each country's laws, find the right rules, and write them down. This is slow and expensive: 10+ researchers, 1–4 weeks per country.

The competition asks: **can you build an AI tool that does this legal research automatically?** The team that builds the best tool wins. Only the winner's tool gets used. So our goal is **first place, not just "good enough."**

**Our part of the work:** two topics (called **Pillars**), for three countries.
- **Pillar 6 = Cross-border data rules.** Can data leave the country? Under what limits?
- **Pillar 7 = Domestic data protection.** How is personal data protected inside the country?
- **Countries (Round 1): Singapore, Australia, Malaysia.** (All in English.)

Inside each Pillar there are **indicators** (small yes/no legal questions). We answer **9 of them**:

| Code | The legal question (does a law…) |
|---|---|
| 6.1 | …**ban** sending data abroad, OR force data to be **processed** only inside the country? |
| 6.2 | …require a **copy** of the data to be **stored** inside the country? |
| 6.3 | …require local **servers / data centres** to operate? |
| 6.4 | …**allow** transfer abroad **only if conditions** are met (consent, approval, safeguards)? |
| 7.1 | …give a **general personal-data-protection law**? (we score the *lack* of one) |
| 7.2 | …give a **dedicated cybersecurity law**? (we score the *lack* of one) |
| 7.3 | …force keeping data for **at least X years** (a minimum)? |
| 7.4 | …require a **Data Protection Officer or impact assessment**? (in **every** sector = full score; one sector only = half) |
| 7.5 | …let the **government access** personal data **WITHOUT needing a court order**? (If a judge's permission is required, the score is 0. This is the key test — updated 4 July.) |

*(There is also 6.5 about treaties. It is "non-regulatory" — the tool does NOT handle it. We skip it.)*

---

## Part 2 — The manual job we are replacing (this is YOUR world)

Today a human researcher does these steps for each indicator. **This is exactly what our tool must copy.**

1. **Find the right law.** Go to the official government law website. Search. Pick the correct law.
2. **Check it is real and current.** Is it in force? Not a draft? Not repealed (cancelled)?
3. **Read the provision.** Find the exact section/article. Read it carefully — including the "unless / except / provided that" parts.
4. **Decide the indicator.** Ask: who is regulated, what is required or banned, what data, under what conditions, with what exceptions. Then match it to the right indicator (6.1, 6.4, etc.) — by the **legal meaning**, not by keywords.
5. **Write the evidence.** Record: country, law name + year, exact section, the exact quoted text, why it matters, the official link, and the date.

You already do this kind of thinking as a lawyer. **The tool is just a fast junior researcher that tries to do these 5 steps automatically.** Your job is to teach it what "correct" means and to check its work.

---

## Part 3 — What we are building (the engine = a robot junior researcher)

Our tool is called **ClauseChain**. Think of it as an **assembly line**. The law goes in one end. A clean, checked answer comes out the other end. Here are the stations, in order, in plain words:

1. **Fetcher / crawler** — opens the government website and downloads the law. *(Like a clerk who fetches the file.)*
2. **OCR** — if the law is a scanned image (a photo of paper), OCR turns the picture into real text the computer can read. *(Like re-typing a scanned page.)*
3. **Parser** — breaks the long law into its parts: sections, articles, sub-sections. *(Like adding tabs and a table of contents.)*
4. **Retriever (this is the "RAG" part)** — out of hundreds of sections, it finds the few that might answer our indicator question. *(Like a smart search that finds the relevant clauses.)*
5. **Reader (the AI / LLM)** — reads a clause and answers: who, what, conditions, exceptions. Then it **maps** the clause to an indicator (6.1, 6.4…). *(Like a junior associate's first draft opinion.)*
6. **The Gates** — a list of quality checks. A clause must pass them before it becomes a final answer. *(Like a senior partner's review checklist before filing. Part 5.)*
7. **NEW / KNOWN tag** — marks whether this evidence is something ESCAP already had, or something new we found. *(New = bonus points. Part 6.)*
8. **Scorer** — gives the indicator a score: 0, 0.5, or 1. **You approve every score.** *(The AI suggests; the human decides.)*
9. **Writer** — writes the final answer into the required file (a spreadsheet/CSV + a JSON file). *(The final filing.)*

There is also a **knowledge graph** (we use a tool called Neo4j) running beside the line. It stores laws → sections → links between them (for example, "this 2026 law **amends** that 2018 law"). It helps the tool follow amendments and cross-references — the kind of links a careful lawyer follows by hand.

---

## Part 4 — Tech words, made simple (a tiny dictionary)

You do not need to build any of this. You only need to understand it enough to check our work.

- **AI / LLM** = the "reader" model (like ChatGPT). It reads text and answers in words. **Warning: it can sound confident and still be wrong.** That is why we have Gates.
- **RAG** = "find first, then answer." Instead of letting the AI answer from memory, we first **find the real law text**, then ask the AI to answer **using only that text**. This stops the AI from inventing law.
- **Embeddings / vector search** = a way to search by *meaning*, not just exact words. So a search for "send data abroad" can also find "transfer outside the country." *(Like a thesaurus-powered search.)*
- **Broad recall (not "top-k")** = we tell the search to bring back **many** possible clauses, not just the top few. Why? If the right clause is missed early, no later step can recover it. Better to bring too many and let the Gates remove the wrong ones.
- **Crawler / connector** = the part that visits government websites and downloads laws.
- **OCR** = turning a scanned image of a page into real, searchable text.
- **API** = a way for two programs to talk. We use cloud AI through an API.
- **Knowledge graph / GraphRAG** = storing laws and their links (amends, replaces, refers to) so the tool can follow connections, like footnotes between laws.
- **Gate** = an automatic quality check that a result must pass. See Part 5.

---

## Part 5 — The Gates (the quality checks) — **this is where you help most**

The Gates are the heart of "is this answer correct?" They are automatic checks. **A result must pass all the gates that apply, or it is rejected or sent to a human (you) for review.** This is exactly the senior-lawyer review you would do before filing.

You can read each gate and ask: *"Is this check enough? What legal mistake could still slip through? How would I improve it?"* That feedback is gold — please give it.

| Gate | What it checks (plain English) | A legal mistake it catches |
|---|---|---|
| **G1 — Quote is real** | The quoted text **actually exists** in the source document. | The AI "remembers" a section that does not exist (e.g., it cited "IT Act s.70B(1)" — those sub-sections are not in the act). Fake quote → rejected. |
| **G2 — Location is right** | The section number / page / link **points to the exact quote**. | Right words, wrong place — the citation does not lead a reader to the text. |
| **G3 — Source is official** | The source is an **official, binding** law (government site), not news, a blog, or a law-firm summary. | Citing a law-firm article instead of the real statute. |
| **G4 — Law is current** | The law is **in force now** — not a draft, not repealed, not replaced. | Citing a 2019 notice that was cancelled in 2022. **A repealed law shown as current = penalty.** |
| **G5 — Whole rule captured** | The cited unit includes the **rule AND its exception** together. | Quoting "shall not transfer…" but dropping the "…unless conditions are met." That turns a 6.4 into a false 6.1. |
| **G6 — Evidence supports the meaning** | The clause text **really supports** what the AI said it means. | The AI's summary adds something the text does not say. |
| **G7 — Meaning fits the indicator** | The legal **function** matches the indicator's test (not just matching keywords). | A bank "confidentiality" duty is not a data-transfer ban, even though both mention data. |
| **G8 — Nothing contradicts it** | We searched for an **amendment, repeal, or exception** elsewhere that would change the answer. | A later law changed the rule, but we missed it. |

**Important:** the Gates that need legal judgment (especially **G4 currentness, G5 rule-and-exception, G7 function-not-keywords, G8 counter-evidence**) are where your expertise improves the tool. If you think a gate is too weak, or you know a trick the law plays that a gate would miss, tell us — we turn your point into a new check or a new example.

---

## Part 6 — NEW vs KNOWN (the biggest points)

ESCAP already has a database of laws they found by hand. We compare our findings to theirs:
- **KNOWN** = they already had this exact law + section.
- **NEW** = we found something they did **not** have.

**NEW evidence is worth the most points** (about 20 of 40 for accuracy). And there is a special rule confirmed by ESCAP: **a new section inside a law they already listed still counts as NEW.** Because when they did it by hand, they often recorded only the first relevant section and stopped. So there is a lot of "new" hiding inside "known" laws.

The best place to find NEW evidence is **indicator 7.5 (government access)**, because that rule often lives outside the privacy law — in criminal procedure, surveillance, or telecom laws. ESCAP could not check every law by hand. We can.

**Warning:** a wrong "NEW" is worse than finding nothing. So every NEW finding must pass all the Gates, and **you verify it** before it ships.

---

## Part 7 — What one final answer looks like

Every answer is one row, with these columns (the first 13 are required by ESCAP; we add a few extra at the end, which they allow):

`Economy · Law Name · Law Number · Last Amended · Indicator ID · Article/Section · Discovery Tag (NEW/KNOWN) · Location · Verbatim Snippet (the EXACT quote) · Mapping Rationale (why it maps) · Source URL · Confidence · Notes` — plus our extras: `Coverage (Horizontal/Sectoral) · Verbatim (English) · Status (in force/repealed)`.

Two rules you will care about most:
- **Verbatim Snippet = the EXACT words, copied, no edits.** Like quoting a statute precisely. No paraphrasing.
- **Article/Section must be precise** — down to the paragraph, e.g. `s. 26(1)`, not just `s. 26`.

---

## Part 8 — Your job (why you matter — you own 40% of the score)

The score has three parts: **40% legal accuracy**, 30% technical, 30% architecture. **The 40% is yours.** Code cannot earn it. You own:

1. **The "answer key" (gold sets).** For each indicator, you write down the correct law, section, exact quote, and score. The tool must match your answers. This is how we measure if the tool is right.
2. **The rubric (what each indicator means).** You confirm the exact legal test for 6.1, 6.4, etc., so the tool maps by meaning, not keywords. (These live in simple rule files; an engineer types them, you check them.)
3. **Human approval.** You **approve or correct every score (0/0.5/1) and every NEW finding** before it ships. The AI only suggests.
4. **Finding the traps.** You know the legal tricks (ban vs conditional, "minimum retention" vs "do not keep too long", a rule hiding in a schedule). You tell us; we add a check or example.
5. **The pitch (legal half).** You explain to the judges why our legal mappings are sound.

You do all of this in **spreadsheets and simple forms**, not code. We build you a simple review screen so you can approve rows by clicking.

---

## Part 9 — The plan, phase by phase (Round 1) — **updated 4 July**

Today is 4 July. The deadline is **20 July** (we aim to upload on the **19th**, one day early). We lost some time, so the plan is now shorter and the extra countries are **cancelled** for this round. Here is each phase in plain words, and **what you do** in it.

| Phase | Dates | What the team builds | **What YOU (Legal) do** |
|---|---|---|---|
| **P1′ — First real answer** | Jul 5–9 | Make the tool work for **Singapore, Pillar 6 only**, start to finish. | Write the **Singapore Pillar-6 answer key** (which sections map to 6.1–6.4). Check the tool's first answers. Flag wrong mappings. |
| **P2′ — All 3 countries + the Malaysia error hunt** | Jul 9–13 | Add **Malaysia and Australia**, add **Pillar 7**, add reading of **scanned** laws. **NEW: the Malaysia error hunt** — ESCAP hid deliberate mistakes in Malaysia's sample data (wrong links, old laws, wrong sections), and Malaysia is worth **double points** because finding and fixing them is part of the test. | Build the **Malaysia then Australia answer keys** for Pillars 6 & 7. Write down the tricky distinctions (6.1 vs 6.4, 7.2 cyber, 7.3 retention, **7.5 court-order test**). **Review every "error" the tool claims to find in Malaysia's data** — a false accusation is worse than a miss. |
| **P3′ — Quality + FREEZE** | Jul 13–16 | Turn on all the **Gates**, the **NEW/KNOWN** check, and the **scoring with uncertainty**. Then "freeze" the core (stop changing it) on **July 16**. | **Approve every score and every NEW finding.** Finalize the quality checklist. Start writing the legal part of the pitch. |
| **P5′ — Package and submit** | Jul 16–19 | Final testing, the demo video, the pitch deck, the final spreadsheet, and upload on **July 19**. | **Finish the pitch deck's legal half.** Do a final accuracy review of the whole output — the judges grade our **output spreadsheet first**, so this review is the most important hour of the project. |

**The golden rule:** the 3 main countries (Singapore, Australia, Malaysia) must be **perfect**. That is what gets us to the next round. The extra 7 countries are cancelled for this round (they score zero now); we already saved ESCAP's answer data for them, so we can prepare for the finals later.

**One legal rule that changed on 4 July (important):** for indicator **7.5**, the question is not "can the government access personal data?" but "**can it do so WITHOUT a court order?**" If the law says the police need a judge's warrant first, that scores **0**. If they can demand data directly, that scores **1**. Also: **7.2** and **7.4** now have half-scores (0.5) when the law covers only one sector — ask us to show you the updated table in the rulebook (§9.1).

---

## Part 10 — How you can re-verify and improve our approach

You asked how to check our approach and make it better. Here is exactly how:

1. **Test the Gates against real tricks.** Take a hard law you know. Ask: would our gates (Part 5) catch the mistake? If not, tell us which gate is weak. We add a check.
2. **Stress the indicator logic.** Give us a "ban vs conditional" example, or a "minimum retention vs data-minimisation" example, where the AI might choose wrong. We add it as a worked example so the AI learns it.
3. **Check the answer keys.** When we show you the tool's output beside your gold answer, mark every disagreement. Each disagreement makes the tool better.
4. **Watch for the four classic AI mistakes** (these are what ESCAP itself warned about): fake citation, outdated law, wrong indicator, broken link. If you see any in our output, flag it — that is a bug we must fix.
5. **Read the deeper rules when ready.** The full legal rulebook is `ClauseChain_Legal_Matching_DoDont.md` (it has a list of ✅ correct and ❌ wrong examples). It uses harder English — read it slowly, and ask about anything unclear. It is the single source of truth for "what is a correct mapping."

---

## Where to find more (but these are harder English)
- `ClauseChain_Dev_Plan_and_Task_Distribution.md` — the full team plan (the simple version is Part 9 above).
- `ClauseChain_Legal_Matching_DoDont.md` — the legal rulebook (your domain; read slowly).
- `Hackthon_Knowledge/Takehome Assignment2 [Due 9 June]/EASY_GUIDE_for_Legal_Step_by_Step.md` — a simple, step-by-step guide for doing one extraction by hand (good practice).

> **One last thing:** you are not a "checker" at the end. You are the brain of this project. The tool is only as correct as the answer keys and rules you give it, and the scores you approve. When in doubt, ask. Welcome aboard.
