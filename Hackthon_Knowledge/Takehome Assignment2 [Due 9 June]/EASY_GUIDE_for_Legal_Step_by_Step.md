# Easy Guide: How To Do Assignment 2, Step by Step

**For:** our Legal teammate.
**Language:** simple English on purpose. Short sentences. You can do this.
**Note:** the deadline (9 June) has passed. We still do this work. Why? Your answers become our **answer key**. The engine must give the same answers as you. Your work is the test for the machine.

**One rule before we start: do NOT use ChatGPT or any AI for this task.** The organizers said to do it by hand. The goal is that YOU learn how the data is made. The AI tool we are building will copy YOUR method.

---

## 1. What is this task?

ESCAP keeps a big Excel database about digital trade laws. Each row says: *this country has this law, this part of the law matters, and here is the proof.*

Your job: fill **2 rows** (plus 1 optional row) in their Excel file, by hand.

| Task | Country | Question code | The question in simple words |
|---|---|---|---|
| 1 | Singapore | **6.1** | Does Singapore **ban** sending data to other countries? Or force companies to **process data only inside** Singapore? |
| 2 | Malaysia | **7.3** | Does any Malaysian law say: **you must keep data for at least X years**? |
| 3 (optional) | India | **5.3** | Does the Indian government **own** telecom companies? |

---

## 2. Open these things first

1. The Excel file: `[5th June] Dataset- RDTII 2.1 data collection practice assignment.xlsx` (in this folder). It has one tab for each task. You write your answers there.
2. The rules file: `Format requirements- RDTII data collection practice.pdf` (in this folder). It shows how to write each column.
3. A web browser.

---

## 3. The columns — what to write in each one

The Excel tab has these columns. Here is each one in simple words:

| Column | What it means | Example |
|---|---|---|
| **Pillar_ID** | The big topic number. | `6` |
| **Indicator_ID** | The question number. | `6.1` |
| **Cat_Score** | Rough category: `0` = light rules, `1` = heavy rules. | `0` |
| **Raw Score** | Your real answer: `0`, `0.5`, or `1`. Higher = MORE restriction. | `0` |
| **Act and/or practice** | The law's full name + year + number. ⚠️ Do NOT write section numbers here. | `Personal Data Protection Act 2012 (No. 26 of 2012)` |
| **Coverage** | Who the law applies to. Write `Horizontal` if it applies to all sectors. Write the sector name if only one sector (example: `Financial sector`). | `Horizontal` |
| **Impact or comments** | The important column. Write: the **section number** + what the section says + why it matters for the question. | `Section 26(1) says an organisation shall not transfer personal data outside Singapore unless conditions are met. So transfer is allowed with conditions. This is not a ban.` |
| **Timeframe** | When the law started + last change. Format: `Since [Month Year]; last amended [Month Year]`. | `Since July 2014; last amended February 2021` |
| **References** | The official government link. One link per cell. | `https://sso.agc.gov.sg/Act/PDPA2012` |
| **Note** | Anything strange you want to tell the reviewer. Can be empty. | |

**Three small but important rules:**
- Law name goes in "Act" column. Section number goes in "Impact" column. Never mix them.
- Copy the law's words **exactly**. Do not change them. Do not summarize the quote.
- Only use **official government websites** as References. Never a news site. Never Wikipedia. Never a law firm blog.

---

## 4. TASK 1 — Singapore, question 6.1 (step by step)

**The question again:** Does Singapore BAN sending data abroad? Or force local processing?

**First, understand two words:**
- A **ban** = the law says NO. Data cannot leave the country. Full stop.
- A **condition** = the law says YES, BUT. Data can leave, if you do something first (get consent, get approval, make a contract).

⚠️ **This is the trap of this task.** A "yes, but" rule is NOT a ban. A "yes, but" rule belongs to a different question (6.4), not 6.1.

**Steps:**

1. Open the official Singapore law website: **https://sso.agc.gov.sg**
2. In the search box, type: `Personal Data Protection Act`
3. Open the result called **Personal Data Protection Act 2012**. Make sure it says "Current version" (top of the page). We only use laws that are in force today.
4. Find **Part 6** of the Act, then **Section 26** ("Transfer of personal data outside Singapore"). You can use Ctrl+F and search "transfer".
5. Read Section 26(1) slowly. You will see words like: *"must not transfer personal data outside Singapore **except in accordance with requirements prescribed**…"*
6. Now answer the small question: can data still leave Singapore? **Yes — if the conditions are met.** So this is "yes, but". It is a condition, not a ban.
7. Also check: does any Singapore law force companies to *process* data only inside Singapore? Search the Act for "process". You will not find such a general rule.
8. **So the answer for 6.1 is: Score 0.** Singapore has NO ban and NO local-processing rule.

**Important:** even when the answer is "no measure", we do NOT leave the row empty. We write the main law as proof that we looked. This is the rule: *if you find nothing, still cite the general governing law.*

**Now fill the row like this (check it yourself before copying):**

| Column | Write |
|---|---|
| Pillar_ID | `6` |
| Indicator_ID | `6.1` |
| Cat_Score | `0` |
| Raw Score | `0` |
| Act and/or practice | `Personal Data Protection Act 2012 (No. 26 of 2012)` |
| Coverage | `Horizontal` |
| Impact or comments | `No ban on cross-border data transfer and no local processing requirement found. Section 26(1) of the PDPA allows transfer outside Singapore subject to prescribed conditions (comparable protection). A conditional transfer regime is not a ban.` |
| Timeframe | `Since July 2014; last amended February 2021` *(check the page — confirm these dates yourself)* |
| References | `https://sso.agc.gov.sg/Act/PDPA2012` |
| Note | `Conditional transfer is captured under indicator 6.4, not 6.1.` |

---

## 5. TASK 2 — Malaysia, question 7.3 (step by step)

**The question again:** Does any Malaysian law say data must be kept for AT LEAST some time (example: "keep records for 6 years")?

**First, the trap of this task:**
- "Keep data for **at least** 7 years" → ✅ YES, this is 7.3.
- "Do **not** keep data **longer than needed**" → ❌ NO. This is the OPPOSITE rule (it limits keeping). It is never 7.3.

Malaysia's privacy law (PDPA 2010) has the second type. So the privacy law is NOT your answer. **You must look in other laws.** This is normal. Retention rules usually live in money laws, company laws, and tax laws.

**Steps:**

1. Open the official Malaysia law portal: **https://lom.agc.gov.my** (Laws of Malaysia). Google can help you find acts, but the final link you cite must be official.
2. Look in these laws, one by one. These are the usual homes of "keep for X years" rules:
   - **Anti-Money Laundering, Anti-Terrorism Financing and Proceeds of Unlawful Activities Act 2001 (Act 613)** — look for "retention of records" (banks must keep records for some years).
   - **Companies Act 2016 (Act 777)** — look for "accounting records" (companies must keep them for some years).
   - **Income Tax Act 1967 (Act 53)** — look for "keep records" (taxpayers must keep records for some years).
3. In each law: open the PDF or page, press Ctrl+F, search the words: `retain`, `retention`, `keep`, `years`.
4. When you find a sentence like *"shall keep the records for a period of not less than seven years"* — that is the gold. Write down: the law name, the **exact section number**, and the **exact sentence**.
5. ⚠️ I am not giving you the exact section numbers on purpose. Numbers change with amendments. **Find them on the official page and copy what YOU see.** Never trust numbers from memory — not mine, not anyone's. (This exact mistake — citing a section that does not exist — is the #1 error AI tools make. We humans must not make it.)
6. Decide the score: you found at least one clear "keep for ≥ X years" rule → **Raw Score = 1**.
7. Coverage: these laws apply to specific groups (banks, companies, taxpayers). So Coverage is **sectoral** — name the group, for example `Financial institutions; companies (accounting records)`.

**Fill the row the same way as Task 1.** In "Impact": write the section number + the exact words + one short sentence: *"This sets a minimum data retention period, so indicator 7.3 applies."* You can list 2–3 laws in one row. Separate them with semicolons (;). The format PDF allows this.

---

## 6. TASK 3 (optional) — India, question 5.3

**The question:** Does the Indian government own telecom companies?

This question is special: for 5.3, **news and reports are allowed** as sources (this is an official exception for this indicator — most indicators do not allow this).

Short path: India's government owns **BSNL** and **MTNL** (state telecom companies). Find one official proof — the company's annual report page, a government press release, or the DoT (Department of Telecommunications) website. Score: government ownership exists → score per the methodology sheet in the Excel (read the "RDTII 2.1 methodology" tab for the exact 0/0.5/1 rule). Keep it short. This task is optional — do it only after Tasks 1 and 2 are done well.

---

## 7. Check yourself before you finish (5 questions)

Ask these 5 questions for EVERY row. This is the official ESCAP checklist, in simple words:

1. **Right question?** Does my row really answer 6.1 (or 7.3)? Not a different question?
2. **Real law?** Is my source official, current, and in force? (Not a draft. Not a bill. Not cancelled.)
3. **Exact place?** Did I write the exact section number — not just the law name?
4. **Rule vs exception?** Did I read the "unless / except / provided that" parts? Did they change the meaning?
5. **Empty answer?** If I found no measure, did I still cite the main law as proof I looked?

Also click every link one more time. A broken link = a wrong row.

---

## 8. Common mistakes (do not do these)

| Mistake | Why it is wrong |
|---|---|
| Writing "PDPA" instead of the full name | Always full name + year: `Personal Data Protection Act 2012` |
| Putting "Section 26" in the Act column | Section numbers go in the Impact column |
| Calling Singapore's s.26 a "ban" | It allows transfer with conditions → not a ban (this is the #1 trap) |
| Using "don't keep longer than necessary" for 7.3 | That is a retention LIMIT — the opposite of a minimum |
| Citing a law firm article or news as the Reference | Only official government links (exception: task 3 / indicator 5.3) |
| Copying a section number without opening the law | Sections must be checked with your own eyes |
| Citing a bill or draft | Not law yet. We only record rules that are in force |
| Changing words inside a quote | Quotes must be exact, word for word |

---

## 9. When you finish

1. Save the Excel file.
2. Send it to the team lead.
3. We copy your rows into `engine/data/gold/gold_rows.csv` and mark them **verified**. From that moment, your rows are the standard. The engine is "correct" only when it finds what you found.

If anything in this guide is not clear, ask. A question costs 1 minute. A wrong row costs points.

---

*Where do the rules in this guide come from? The 5-June workshop (Juntong + Nikita), the Format requirements PDF in this folder, and the RDTII 2.1 Guide. The full (harder-English) version of these rules lives in `ClauseChain_Legal_Matching_DoDont.md` in the repo root — read it later, when you feel ready.*
