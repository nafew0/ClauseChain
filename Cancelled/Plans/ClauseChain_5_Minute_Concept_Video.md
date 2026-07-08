# ClauseChain 5-Minute Concept Video

## 1. Complete Voiceover

ClauseChain is an AI evidence compiler for digital trade regulations.

The problem is simple to understand, but hard to solve. When governments, researchers, or international organizations compare digital trade laws across countries, they need to know what the law actually says. But the evidence is scattered across official websites, PDF laws, scanned amendments, ministry guidelines, older versions, and sometimes unofficial translations.

This makes manual legal mapping slow, expensive, and difficult to verify. It also creates a risk: an AI system may give a confident answer, but the reviewer may not know which law, section, page, or exact sentence supports that answer.

ClauseChain is designed to solve that problem by making legal analysis evidence-first.

On the homepage, we show the full idea in one visual flow. The system starts by discovering official legal sources. It does not only search the web generally; it looks for government portals, legal databases, statutes, regulations, amendments, and guidelines.

Then ClauseChain checks source status. This is important because not every document has the same legal weight. An official statute may be binding law. An amendment may update that law. A ministry guideline may explain the law, but may not be legally binding. A draft may be useful context, but should not be treated as current law.

After that, ClauseChain extracts the text. For normal HTML and digital PDFs, it reads the structure directly. For scanned PDFs, it uses OCR and marks low-confidence text for review. This helps catch dangerous errors, such as reading “shall not” as “shall.”

Next, the system breaks the law into useful legal units. It identifies sections, definitions, rules, exceptions, and conditions. This matters because a clause may not simply ban data transfer. It may allow transfer if comparable protection is provided. That is a conditional rule, and losing the condition changes the policy meaning.

ClauseChain then creates a legal predicate tuple. In plain language, this means it asks: who must do something, what action is regulated, what data is involved, and under what condition. This makes the AI decision more transparent.

The system maps those findings to the UN RDTII framework, especially Pillar 6 for cross-border data policies and Pillar 7 for domestic data protection and privacy.

But mapping is not the final step. ClauseChain verifies every claim through eight gates: official source, current law, exact text span, citation anchor, OCR confidence, predicate support, counter-evidence, and human review.

The benchmark page shows how we measure accuracy at every stage, not only at the final answer. We track discovery recall, authority accuracy, OCR error rate, section boundary accuracy, classification quality, citation accuracy, and abstention.

Abstention means the system can say, “I am not confident enough; a human should review this.” That is better than producing a wrong answer with confidence.

In the evidence audit screen, the reviewer sees the original source on one side, the extracted legal meaning in the middle, and the verification results on the right. Every claim links back to the exact source text.

Finally, ClauseChain exports a reviewable evidence bundle: citations, URLs, section numbers, span hashes, source status, verification results, and reviewer decisions.

The goal is not to replace lawyers or policy experts. The goal is to reduce repetitive discovery work, make AI outputs traceable, and help humans review digital trade regulations faster and with more confidence.

ClauseChain turns legal AI from a black box into a transparent evidence workflow.

## 2. Production Guide

Target length: 5 minutes. Speak slowly and clearly. Use the UI as the main visual, not slides full of text.

Recommended recording flow:

1. Open the homepage at `/`.
   - Show the hero section with “ClauseChain.”
   - Briefly pause on the animated source-to-evidence flow.
   - Voiceover focus: what problem ClauseChain solves.

2. Scroll to the problem cards.
   - Show fragmented evidence, authority confusion, extraction risk, and audit trail risk.
   - Keep the cursor movement slow.
   - Voiceover focus: why legal mapping is hard.

3. Scroll to “Evidence first, model second.”
   - Show the workflow steps: Discover, Acquire, Resolve, Structure, Predicate, Map, Verify, Export.
   - Voiceover focus: explain the pipeline in simple language.

4. Open `/source-status`.
   - Show official statute, amendment, guideline, draft, and translation nodes.
   - Run or point to the source status animation if available.
   - Voiceover focus: not every document is legally equal.

5. Open `/benchmark`.
   - Start the simulated benchmark run.
   - Show per-stage metrics and regression cases.
   - Voiceover focus: accuracy must be measured at each step.

6. Open `/jurisdictions/sg/documents/SG-PDPA-2012`.
   - Show the three-pane evidence audit view.
   - Highlight original text, legal predicate tuple, RDTII mapping, and verification gates.
   - Voiceover focus: every claim is tied to exact evidence.

7. Open `/pipeline/map`.
   - Show the live mapping run animation.
   - Point out predicate extraction, eight gates, counter-evidence, and abstention.
   - Voiceover focus: the AI is constrained and reviewable.

8. Open `/pipeline/export`.
   - Show JSON, CSV, and provenance bundle preview.
   - Voiceover focus: reviewers can export and verify the evidence.

Visual guidance:

- Use 1440px or 1280px desktop width.
- Zoom browser to 90% or 100%, whichever avoids text clipping.
- Hide bookmarks, terminal windows, notifications, and unrelated tabs.
- Use slow scrolling and 1-2 second pauses on each key screen.
- Avoid reading UI labels one by one; explain what the viewer is seeing.
- Use a simple cursor highlight if available.
- Do not overuse transitions. Clean cuts are better.

Optional supporting visuals:

- Add one short title card at the start: “ClauseChain: Evidence-first AI for digital trade regulation.”
- Add one end card: “Open-source, citation-first, human-reviewable.”
- If the recording feels too dense, insert a simple slide between homepage and demo: “Problem → Evidence → Mapping → Verification → Export.”

Suggested final file name:

`ClauseChain_TeamName_LeaderName_Video.mp4`
