# ClauseChain — 5-Minute Competition Video

**Built for:** one continuous screen recording over a pre-generated AI voiceover. **No video editing required.**
**Target length:** 5:00 (±10 s).
**Voiceover length:** ~720 words at standard AI-TTS pace (~145 wpm).
**Competition ask served:** (1) automated discovery of legal documents, (2) mapping and verification of regulatory evidence.
**Tone:** explanatory and plain. Approachable for a non-technical policy reviewer and a non-legal engineer alike.

---

## Section 1 — Voiceover Script

The script is written for an AI voice generator. Sentences are short. Punctuation is conservative (no em-dashes that confuse TTS). Numbers and acronyms are spelled out where needed. Each block is timed to match a specific UI screen, so the voiceover and the screen walk through the same path at the same time.

---

### Block 1 · Opening (0:00 – 0:30) · 65 words
**Screen: Dashboard at `/dashboard` (or homepage).**

ClauseChain is an open source AI pipeline that maps digital trade regulation to the United Nations RDTII framework. It does this differently from a normal AI tool. ClauseChain treats legal evidence as the first thing, and model output as the second thing. Every claim it makes must point back to a real document, a real section, and a real sentence. If it cannot prove a claim, it refuses to ship it.

---

### Block 2 · The Problem (0:30 – 1:00) · 75 words
**Screen: still on Dashboard. Slow scroll through the workspace overview.**

Mapping digital trade regulation is hard. The text is scattered across statutes, amendments, official gazettes, ministry guidelines, scanned PDFs, and unofficial translations. Some sources are binding law. Some are non-binding context. Some have been quietly repealed. A normal AI tool will quote the cleanest sentence it finds, regardless of whether it is actually current and binding. For policy work, that is not good enough. ClauseChain is built to close exactly this gap.

---

### Block 3 · Strategy One — Automated Discovery, Part A (1:00 – 1:30) · 75 words
**Screen: navigate to `/pipeline/crawl`. Hover over the crawl stream.**

Discovery starts on the Crawl Console. The system seeds itself from official government portals listed in a per-country configuration pack. For our demo, that is Bangladesh, Thailand, and Singapore. The crawler is polite. It respects robots files, records every URL, every HTTP header, and the exact bytes it downloaded. Each candidate document is tagged by type. HTML statute. Native PDF. Scanned PDF. Regulator guideline. Or a blocked source like a login wall.

---

### Block 4 · Discovery, Part B — Harvest (1:30 – 1:50) · 50 words
**Screen: navigate to `/pipeline/harvest`. Hover over a keep / discard card.**

In the Harvest Review screen, a human curator can keep or discard documents before the expensive work begins. Drafts and irrelevant pages can be dropped here. Authority, language, and confidence are visible at a glance. This human step is intentional. It prevents the pipeline from over-trusting noisy crawler output.

---

### Block 5 · Discovery, Part C — Extraction and OCR (1:50 – 2:30) · 85 words
**Screen: navigate to `/pipeline/extract`. Switch to the OCR diff tab. Show Qwen2-VL vs Tesseract disagreement.**

The Extraction Workspace handles the hardest part of discovery, which is actually reading the documents. Clean HTML and digital PDFs are parsed directly. Scanned PDFs go through two OCR engines that compare their output, token by token. When they disagree, the disagreement is logged with the original page image, the edit distance, and a confidence score. A reviewer picks the correct version. This matters, because misreading a single word, like turning the phrase "shall not" into "shall", can flip the policy meaning completely.

---

### Block 6 · Strategy Two — Mapping with the CVR Loop (2:30 – 3:30) · 130 words
**Screen: navigate to `/pipeline/map`. Click L2 on the autonomy selector. Click Start mapping. Let two or three clauses stream in.**

Once the text is clean, it goes to the Mapping Run. This is where ClauseChain applies what we call the CVR loop, which stands for Cite, Verify, Reject. Every clause is checked against the RDTII rubric, especially Pillar 6 for cross-border data flows and Pillar 7 for domestic data protection.

The reviewer can choose the autonomy level. L zero means a human approves every single clause. L three means the system runs autonomously and only escalates when it is unsure. Each clause flows through three gates in real time. The first gate checks that the cited span actually exists in the source. The second gate checks that the meaning supports the rubric criterion. The third gate checks that the legal structure makes sense. If a clause fails any gate, it is rejected or sent for human review.

---

### Block 7 · The Legal Predicate (3:30 – 3:55) · 60 words
**Screen: still on Mapping Run. Hover over a verified row to show the predicate detail.**

Behind the scenes, ClauseChain does not jump straight from text to a label. It first extracts a structured legal predicate. Who is the actor. What is the action. What is the object. What is the modality. What are the conditions and exceptions. This intermediate step is what makes the AI decision auditable, instead of a black box guess.

---

### Block 8 · Verification — The Source Trace Screen (3:55 – 4:35) · 95 words
**Screen: navigate to `/pipeline/trace`. Click on one verified span. Show the dual-panel sync scroll. Then click on a pending span to show the hatched pattern.**

This is the Source Trace screen, and it is the most important screen in the system. On the left are the extracted clauses. On the right is the original document. Click any highlighted span, and both panels scroll to the exact same location. You can see the gate results, the confidence score, the page number, and whether the match is exact, approximate, or fuzzy. Pending clauses show as hatched. Fuzzy OCR matches show as striped. There is no black box. Every claim is traceable.

---

### Block 9 · Export and Closing (4:35 – 5:00) · 85 words
**Screen: navigate to `/pipeline/export`. Show the Records tab, then click JSON to show the machine-readable format.**

The final output is the Export Output page. Each record carries the RDTII indicator, the exact citation, the verbatim quoted text, the confidence score, the CVR gate results, and discovery tags that show how the evidence was found. You can export as JSON, CSV, or JSONL. A second analyst, on a different machine, can re-verify every claim from the provenance bundle alone. Every claim has a source. Every source has a status. Every status is reviewable. Thank you for watching.

---

**Total: 720 words.**

---

## Section 2 — Production Guide (No-Editing Path)

This guide assumes you will not edit the video afterward. You will record the screen once, with the AI voiceover already playing through your speakers or headphones, and the screen recorder captures both at the same time. The output is a single MP4, ready to upload.

### 2.1 Tools you actually need

| Job | Tool | Cost |
|---|---|---|
| Generate the AI voiceover | **ElevenLabs** (recommended), OpenAI TTS, Play.ht, or Microsoft Azure TTS | Free tier sufficient for 720 words |
| Play the voiceover during recording | Built-in music player (QuickTime, VLC, Windows Media Player) | Free |
| Record screen + system audio together | **Loom** (easiest, browser-based), OBS Studio (free, more control), or ScreenStudio for Mac | Free tier sufficient |

**The single trick that makes this work:** the screen recorder must capture *system audio* (the sound your computer is playing), not microphone input. Loom does this by default in the desktop app. OBS requires adding a "Desktop Audio" source. On Mac, OBS needs a virtual audio driver like BlackHole (free) to route system audio.

### 2.2 Generate the voiceover first

1. Open ElevenLabs (or your chosen TTS).
2. Pick a voice. **Recommended for this script:** a clear, neutral, professional voice. Good ElevenLabs options: "Adam" (calm male), "Rachel" (clear female), "Bill" (warm narrator). Avoid overly dramatic or breathy voices.
3. Set speed to about 0.95x to 1.0x. Default pace works for most voices.
4. Paste the **entire voiceover script as one block** (Section 1 above, just the spoken text). Strip out the bold headers, the screen instructions, and the timing markers. Keep only the words to be spoken.
5. Generate. Listen back once. If a word is mispronounced (RDTII for example, or Qwen, or Tesseract), use the phonetic spelling: "R D T two I", "Quen", "Tess-er-act".
6. Download the MP3.

**Important:** the final MP3 length should be between 4:50 and 5:10. If it is too long, increase voice speed slightly. If too short, ask the TTS to read more slowly, or add a 5-second silent intro.

### 2.3 Practice the walkthrough once, dry

Open the frontend at `http://localhost:3000`. Walk through these URLs in order, with the voiceover playing in the background but **without recording yet**.

| Voiceover block | Screen | What to do |
|---|---|---|
| Block 1, 2 (0:00 – 1:00) | `/dashboard` | Stay on dashboard. Slow scroll once. |
| Block 3 (1:00 – 1:30) | `/pipeline/crawl` | Show the crawl stream. Slow scroll through 4–5 rows. |
| Block 4 (1:30 – 1:50) | `/pipeline/harvest` | Hover over 2 keep/discard cards. |
| Block 5 (1:50 – 2:30) | `/pipeline/extract` | Switch to the OCR diff tab. Pause on a disagreement row. |
| Block 6 (2:30 – 3:30) | `/pipeline/map` | Click L2 on the autonomy pill. Click Start mapping. Let the clauses stream. |
| Block 7 (3:30 – 3:55) | `/pipeline/map` | Stay on the same screen. Hover over a verified row. |
| Block 8 (3:55 – 4:35) | `/pipeline/trace` | Click a verified span. Click a pending span. Show the dual-panel scroll. |
| Block 9 (4:35 – 5:00) | `/pipeline/export` | Show the Records tab. Click the JSON tab. Done. |

Do this dry run twice. You will get the rhythm. The voiceover paces itself; your job is to land on the right screen by the time the matching sentence is being spoken.

### 2.4 Browser setup before recording

- Resize the window to **1920 by 1080**, or zoom the browser to 100 percent on a 1440-width window.
- Hide bookmarks bar (Command Shift B on Mac, Control Shift B on Windows).
- Close all other tabs and windows.
- Turn on Do Not Disturb to block notifications.
- Make sure you are already logged in. Auth screens are dead time.
- Increase mouse cursor size in OS settings for visibility.
- If the dev server is restarting often, pre-load every URL once so all pages are warm.

### 2.5 The actual recording

1. Open the voiceover MP3 in QuickTime or VLC. Do not press play yet.
2. Open Loom (or OBS). Choose "Screen and system audio". Microphone off.
3. Start the screen recording.
4. Switch to the voiceover and press play.
5. Walk through the URLs in the order practiced. The voiceover guides you.
6. When the voiceover ends, wait 2 seconds, then stop the recording.

That is the entire production process. If you mess up halfway, just stop and re-do the recording. The MP3 stays the same, so re-doing is cheap.

### 2.6 Quality checks before submitting

- Watch the full video once with the sound on. Does the voiceover land on the right screen at the right time?
- Watch once with sound off. Is the walkthrough understandable from visuals alone?
- Watch the first 30 seconds and last 30 seconds carefully. These are the parts judges will weight most.
- Confirm length is between 4 minutes 50 seconds and 5 minutes 10 seconds.
- Confirm no notification banner or personal info appears in any frame.

### 2.7 If you have to fall back to mic recording

If TTS is not available, you can still do a single-take recording with your own voice. Same script, same walkthrough. Read at a pace slow enough that you can also operate the mouse comfortably. Practice twice. Record once. Submit.

### 2.8 Optional polish if you have ten extra minutes

- **Title overlay on the first screen.** If you want a title card, just open a Google Slides slide that says "ClauseChain. Evidence-first AI for digital trade regulation." Make it full-screen for 5 seconds before navigating to the dashboard. The screen recording will capture it naturally.
- **End card.** Same trick at the end. A slide that says "Open source. Apache 2.0. github dot com slash nafew zero slash ClauseChain." Held for 5 seconds.
- **Captions.** Upload the final MP4 to YouTube as unlisted. YouTube auto-generates captions within 10 minutes. Download the SRT file. If the platform you submit to accepts SRT, attach it.

### 2.9 File naming

`ClauseChain_TeamName_LeaderName_Video.mp4`

---

**The one rule:** the video is explaining a strategy, not selling a product. Stay calm, stay clear, let the UI do the work. The voiceover and the cursor are a tour guide, not an actor. If a judge can describe ClauseChain's discovery strategy and verification gates back to a colleague after one viewing, the video has done its job.
