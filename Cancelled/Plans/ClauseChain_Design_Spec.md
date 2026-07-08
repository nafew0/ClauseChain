# ClauseChain — UI/UX Design Specification

> **For:** Claude Design (artifact generation)
> **Product:** ClauseChain SaaS — AI for Digital Trade Regulatory Analysis
> **Audience after login:** Regulatory analyst (primary), UN judge (evaluation walkthrough)
> **Design language:** Apple-clean meets UN-formal. Teal accent. Trust over flash.

---

## Table of Contents

1. [Design System Foundations](#1-design-system-foundations)
2. [Information Architecture & User Flow](#2-information-architecture--user-flow)
3. [Page 1 — Workspace Dashboard](#page-1--workspace-dashboard)
   - 1.1 — Add Jurisdiction Modal
   - 1.2 — Quick Search (⌘K)
4. [Page 2 — Jurisdiction Detail](#page-2--jurisdiction-detail)
   - 2.1 — Add Document / Trigger Crawl Modal
   - 2.2 — Document Upload Modal
   - 2.3 — Crawl Status Drawer
5. [Page 3 — Document Workspace (Audit View)](#page-3--document-workspace-the-audit-view)
   - 3.1 — Citation Detail Drawer
   - 3.2 — Conflict Resolution Modal
   - 3.3 — Edit Classification Modal
   - 3.4 — Reject with Reason Modal
6. [Page 4 — RDTII Matrix](#page-4--rdtii-matrix)
   - 4.1 — Matrix Cell Drilldown
   - 4.2 — Export Modal
7. [Page 5 — Pipeline Activity & Provenance Ledger](#page-5--pipeline-activity--provenance-ledger)
   - 5.1 — Ledger Entry Detail
   - 5.2 — Re-verify Modal
8. [Global Components](#global-components)
9. [Empty States, Loading, Errors](#empty-states-loading-errors)
10. [Page-to-Page Navigation Map](#page-to-page-navigation-map)

---

## 1. Design System Foundations

### Brand essence

ClauseChain communicates **structural trust** — not slickness, not enterprise blandness. It feels closer to Apple's developer documentation or Linear's interface than to a typical govtech SaaS. The visual language carries a quiet authority: clean typography, generous whitespace, restrained colour, precise alignment.

### Typography

**Primary font:** SF Pro Display (headings), SF Pro Text (body), SF Mono (code/citations).
Web fallback: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif`.

| Use | Font | Weight | Size | Line height | Letter spacing |
|---|---|---|---|---|---|
| Display (hero numbers, gradient titles) | SF Pro Display | 700 | 48–72px | 1.05 | -0.03em |
| H1 (page title) | SF Pro Display | 600 | 32px | 1.15 | -0.02em |
| H2 (section header) | SF Pro Display | 600 | 22px | 1.25 | -0.01em |
| H3 (card title) | SF Pro Text | 600 | 17px | 1.3 | -0.005em |
| Body | SF Pro Text | 400 | 15px | 1.5 | 0 |
| Small / meta | SF Pro Text | 400 | 13px | 1.45 | 0 |
| Caption / label | SF Pro Text | 500 | 11px | 1.3 | 0.06em (uppercase) |
| Mono (citations, hashes, code) | SF Mono | 400 | 13px | 1.5 | 0 |

**Headings always use tight, slightly-negative letter spacing.** This is the single most "Apple" thing about the type.

### Gradient text (Apple-style, but teal-shifted)

Use **only** on:
- Hero page titles (Workspace name, "Welcome back")
- Key numeric KPIs (the big number on dashboard cards)
- Section headers that need ceremony (one per page, max)

Gradient definition:

```css
.gradient-text {
  background: linear-gradient(135deg, #0FB5A7 0%, #14B8A6 35%, #06B6D4 70%, #2563EB 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

This shifts Apple's blue-purple-pink toward teal-cyan, keeping the optical quality but tying to brand colour.

**Rule:** Gradient text never appears more than once per fold. Restraint is the point.

### Colour palette

**Accent / Brand**
```
Teal 600  #0FB5A7   ← primary buttons, active states
Teal 500  #14B8A6   ← hover, secondary
Teal 100  #CCFBF1   ← tints, badge backgrounds
Teal 50   #F0FDFA   ← soft backgrounds
```

**Neutrals (Apple-style warm-cool greys)**
```
Ink 950   #0A0A0B   ← display headings on light
Ink 900   #18181B   ← body text on light
Ink 700   #3F3F46   ← secondary text
Ink 500   #71717A   ← tertiary, meta
Ink 300   #D4D4D8   ← borders
Ink 200   #E4E4E7   ← dividers
Ink 100   #F4F4F5   ← surface raised
Ink 50    #FAFAFA   ← page background
White     #FFFFFF
```

**Semantic colours**
```
Success   #10B981   ← verified citations, approved
Warning   #F59E0B   ← low confidence, yellow flag
Danger    #EF4444   ← rejected, conflict
Info      #3B82F6   ← informational banners
```

**Verification status colours** (used throughout)
```
Verified (all gates passed)   #10B981  with #ECFDF5 background
Partial (NLI flagged review)  #F59E0B  with #FFFBEB background
Rejected (gate failed)        #EF4444  with #FEF2F2 background
Pending (not yet processed)   #71717A  with #F4F4F5 background
```

### Spacing scale (4px base)

```
xs   4px   ← icon-to-text inside button
sm   8px   ← tight groupings
md   16px  ← default
lg   24px  ← section spacing
xl   40px  ← major section breaks
2xl  64px  ← hero spacing
3xl  96px  ← top-of-page breathing room
```

### Border radius

```
sm   6px   ← inputs, small chips
md   10px  ← buttons, cards
lg   14px  ← surfaces, modals
xl   20px  ← hero cards
full 999px ← pills, avatars
```

### Shadows (very restrained — Apple uses almost none)

```
sm   0 1px 2px rgba(0,0,0,0.04)         ← raised inputs
md   0 4px 12px rgba(0,0,0,0.06)        ← cards on hover
lg   0 12px 32px rgba(0,0,0,0.08)       ← modals
xl   0 24px 64px rgba(0,0,0,0.12)       ← drawer overlay
```

### Buttons

**Primary** — solid teal, white text. Used for ONE action per surface (the primary CTA).
```
background: #0FB5A7
hover: #0E9B8F   (slightly darker)
active: #0C8077
text: #FFFFFF
height: 40px (default), 32px (compact), 48px (hero)
padding: 0 16px
border-radius: 10px
font: SF Pro Text 500 14px
```

**Secondary** — white background, ink border, ink text.
```
background: #FFFFFF
border: 1px solid #D4D4D8
text: #18181B
hover: background #FAFAFA, border #71717A
```

**Tertiary / Ghost** — no background, teal text.
```
background: transparent
text: #0FB5A7
hover: background #F0FDFA
```

**Destructive** — white background, red border, red text. Solid red only for the final confirmation step inside a modal.

### Iconography

Use **Lucide** (open-source, MIT-licensed, consistent stroke). 1.5px stroke weight throughout. Icon size 16px in buttons, 20px in nav, 24px in section headers.

### Motion

- Default transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)` (Apple-style ease-out)
- Hover state: 100ms
- Modal entry: 220ms with subtle scale (0.96 → 1.0) + fade
- Page transitions: pure fade, 180ms — no slide (slides feel "appy", we want "documenty")
- Never animate for animation's sake

### Layout system

- **Max content width:** 1440px
- **Sidebar:** 240px fixed
- **Main content gutter:** 32px desktop, 16px tablet
- **12-column grid** for dashboard cards, 8-column for detail pages
- **Sticky top bar:** 56px tall, white with bottom border `#E4E4E7`

### UN-tier credibility cues

Small visual moves that signal "this is serious tooling":

- Footer on every page: small monospace text showing `Build: clausechain v0.4.2 · Apache 2.0 · github.com/clausechain`
- Hash fragments (`a3f5…b9c2`) shown in SF Mono everywhere they appear
- Timestamps always in ISO 8601 with timezone (`2026-05-19 08:14:22 UTC+06`)
- "Verified by" attribution shown discreetly under classifications

---

## 2. Information Architecture & User Flow

### Top-level navigation (always visible in left sidebar)

```
WORKSPACE
├── 🏠 Dashboard               → Page 1
├── 🌐 Jurisdictions           → Page 2 (list) → Page 2 detail
├── 📊 RDTII Matrix            → Page 4
├── 📜 Pipeline & Ledger       → Page 5
└── ⚙️  Settings (future)

Below nav:
─────────
[User avatar]  Name
               Workspace role
```

### Primary user journey

```
Login ─→ Dashboard (Page 1)
            │
            ├─→ Click jurisdiction card ─→ Jurisdiction Detail (Page 2)
            │                                      │
            │                                      └─→ Click document ─→ Document Workspace (Page 3)
            │                                                                │
            │                                                                └─→ Citation detail (3.1)
            │                                                                └─→ Conflict (3.2)
            │                                                                └─→ Edit (3.3)
            │                                                                └─→ Reject (3.4)
            │
            ├─→ Click "Matrix" ─→ RDTII Matrix (Page 4)
            │                          │
            │                          └─→ Cell drilldown (4.1) → Page 3
            │                          └─→ Export (4.2)
            │
            └─→ Click "Pipeline" ─→ Pipeline & Ledger (Page 5)
                                       │
                                       └─→ Ledger entry detail (5.1)
                                       └─→ Re-verify (5.2)
```

### Information hierarchy

The product has a strict 4-level hierarchy. Every page lives at exactly one level:

```
Level 1: Workspace        (Dashboard, Matrix, Ledger views — span everything)
Level 2: Jurisdiction     (Bangladesh, Thailand, Singapore)
Level 3: Document         (Digital Security Act 2018)
Level 4: Classification   (Section 26 → Pillar 6.1)
```

Breadcrumbs always reflect this hierarchy:
`Dashboard / Bangladesh / Digital Security Act 2018 / §26(1)`

---

# PAGE 1 — Workspace Dashboard

**Purpose:** The judge / analyst lands here. In ten seconds they should understand: how many jurisdictions are covered, how much regulatory ground is mapped, what's verified, what needs review, and what to click next.

**Route:** `/dashboard`

### Layout structure

**Sticky top bar (56px):**
- Left: ClauseChain wordmark (SF Pro Display 600, 18px, with a small teal hash-link icon `⌘` before it)
- Center: empty
- Right: ⌘K search button, notification bell, user avatar

**Page header (top of main content):**
- Greeting: "Welcome back, [Name]" — **gradient text**, 32px
- Subtitle (Ink 500, 15px): "3 jurisdictions · 12 instruments · 487 clauses analyzed"
- Right side: Primary button `+ Add Jurisdiction` (opens 1.1)

**Hero KPI strip (full width, 4 cards):**

Four equal cards in a row, each:
- Caption label (uppercase 11px Ink 500): e.g. "VERIFIED CITATIONS"
- Big number (48px, **gradient text on first card only**): "412"
- Trend chip (small pill, e.g. "+23 today" — teal background, teal-700 text)
- Tiny sparkline (last 7 days, 60px wide, teal)

The four cards:
1. **VERIFIED CITATIONS** — 412 (gradient) — primary success metric
2. **PENDING REVIEW** — 28 — yellow accent
3. **REJECTED BY CVR** — 47 — red accent (this is a *good* metric — show it proudly, it's the anti-hallucination story)
4. **AVG CONFIDENCE** — 0.91 — neutral

**Section: "Your Jurisdictions"** (H2)
- Grid of 3 large jurisdiction cards (responsive: 3-up desktop, 1-up mobile)
- Each card:
  - Flag emoji or small SVG flag (24px), country name (H3)
  - Status badge: "12 instruments · 487 clauses"
  - Mini progress bar showing Pillar 6 / Pillar 7 coverage (two thin bars, teal-filled)
  - 4 mini-stats in a row: Verified / Pending / Rejected / Conflicts
  - Hover: card lifts (shadow-md), border becomes teal-100
  - Click: navigates to Page 2 for that jurisdiction

Empty 4th card with dashed border + `+ Add Jurisdiction` (opens 1.1)

**Section: "Recent Activity"** (H2)
- Timeline list, 6 most recent events
- Each row:
  - Icon (verified ✓ / rejected ✗ / new document ⊕ / conflict ⚠)
  - Timestamp (relative: "2m ago", hover shows ISO)
  - Plain-English description: "Section 26(1) of Digital Security Act 2018 verified as Pillar 6.1"
  - Hash badge (mono, 11px): `a3f5…b9c2`
  - Click row → opens Page 3 anchored on that classification

**Section: "Pipeline Health"** (H2, smaller — secondary content)
- 2-column layout
- Left: small donut chart — CVR gate outcomes (Passed / Flagged / Rejected)
- Right: list of currently-running pipelines (e.g., "Crawling bdlaws.minlaw.gov.bd — 34/52 pages")

**Footer:** tiny build info line.

### Interactive notes
- All KPI cards click-through to filtered views of Page 5 (ledger).
- "⌘K" anywhere opens 1.2 (Quick Search).

---

## 1.1 — Add Jurisdiction Modal

**Triggered from:** `+ Add Jurisdiction` button on Page 1, or 4th card.

**Layout:**
- Modal width: 560px
- Title: "Add a jurisdiction" (H2)
- Subtitle: "We'll seed it with your selected official sources and begin discovery."
- Form:
  - **Country** — searchable dropdown (defaults: Bangladesh, Thailand, Singapore visible; type to expand)
  - **Display name** (auto-fills; editable)
  - **Primary language(s)** — multi-select chips (English, Bengali, Thai, etc.)
  - **Seed sources** — pre-populated textarea showing the URLs from `seeds/{country}.yaml`. Editable. Each URL on its own line with a small "verify" check next to it.
  - **Authority hierarchy** — visual list (drag-to-reorder), showing: "1. Primary legislation → 2. Amendments → 3. Regulations → 4. Guidelines"
- Footer:
  - Secondary: "Cancel"
  - Primary: "Add jurisdiction" — on click, modal closes, toast appears: "Bangladesh added. Discovery started." A new card slides in to the jurisdictions grid.

---

## 1.2 — Quick Search (⌘K Command Palette)

**Triggered by:** ⌘K (Mac) / Ctrl+K (Win) anywhere in the app.

**Layout:**
- Centered overlay, 640px wide
- Search input at top, autofocus, with subtle teal underline on focus
- Below: grouped results
  - **Jurisdictions** (top 3)
  - **Documents** (top 5)
  - **Classifications** (top 5) — show pillar + verbatim_span snippet
  - **Pages** (Dashboard, Matrix, Ledger…)
  - **Actions** ("Add jurisdiction", "Export RDTII matrix", "Re-verify all rejected")
- Each row: icon + label + subtle right-aligned meta + ↵ hint on hover
- Keyboard: ↑↓ to navigate, ↵ to select, Esc to close

---

# PAGE 2 — Jurisdiction Detail

**Purpose:** Inside a single jurisdiction (e.g., Bangladesh), see every instrument we've ingested, their status, and drill into one.

**Route:** `/jurisdictions/:country`

### Layout structure

**Breadcrumb:** `Dashboard / Bangladesh`

**Page header:**
- Flag (32px) + jurisdiction name (32px H1)
- Subtitle: "12 instruments · 487 clauses · last sync 2h ago"
- Right side: secondary button "Trigger Re-Crawl", primary button `+ Add Document` (opens 2.1)

**Coverage strip (compact, full-width band):**
A horizontal band showing RDTII pillar coverage for this jurisdiction:
- 2 segments visible (Pillar 6, Pillar 7) — mandatory ones in solid teal-filled bars showing % coverage
- 6 segments visible (Pillars 8, 9, 12, etc.) — outlined / ghost bars showing "bonus" pillars (greyed unless ingested)
- Hover any segment → tooltip with stats

**Filter bar (sticky as user scrolls):**
- Search input (full-text within this jurisdiction)
- Filter chips: `All` `Acts` `Amendments` `Regulations` `Guidelines`
- Status filter: `All` `Verified` `Pending` `Conflicts`
- Right: view toggle (List / Grid)

**Document table (default list view):**

Columns:
| ✓ | Instrument | Type | Language | Pages | Clauses | Verified | Conflicts | Updated | ⋯ |

Row anatomy:
- Checkbox (for bulk actions)
- Title (e.g., "Digital Security Act 2018") + tiny grey instrument-ID below (`BD-DSA-2018`)
- Type badge (small pill: "Act" / "Amendment" / "Guideline" — guideline is greyed)
- Language flag(s)
- Pages count
- Clauses count
- Verified count (green, with `/total` faded)
- Conflicts count (red if >0)
- Updated relative time
- Overflow menu: "Open", "Re-process", "View source", "Delete from workspace"

Click row → navigates to Page 3.

**Below table — Source health card:**
A subtle card at bottom: "All 4 seed URLs reachable. Last verified 2h ago. [Re-verify sources]"

### Empty states
- No documents yet: large centred illustration (line-art document with magnifying glass), CTA "Trigger discovery from seed URLs" or "Upload a document manually"

---

## 2.1 — Add Document / Trigger Crawl Modal

**Layout:**
- Width 560px
- Title: "Add a document"
- Subtitle: "Choose how to bring it in."
- Tabs across top: `Crawl from URL` | `Upload file` | `Pick from seed registry`

**Tab 1 — Crawl from URL:**
- URL input
- Auto-detected fields (filled when user pastes URL):
  - Instrument type dropdown (Act / Amendment / Regulation / Guideline)
  - Language dropdown
  - Authority level (Primary / Subordinate / Non-binding)
- "We'll respect robots.txt and rate-limit at 2 req/s." — small ghost info text
- Primary button: "Start crawl"

**Tab 2 — Upload file:**
- Drop zone (dashed teal border on hover)
- Supported: PDF, HTML, DOCX
- Detected file type and language shown after upload
- Same metadata fields as Tab 1

**Tab 3 — Pick from seed registry:**
- List view of pre-curated URLs for this jurisdiction (from seeds/{country}.yaml), each with a "+ Add" button
- Useful for the demo — judges can populate fast

---

## 2.2 — Document Upload Modal

(Variant of 2.1 Tab 2, opened directly from drag-drop on the page background — Notion-style.)

---

## 2.3 — Crawl Status Drawer

**Triggered by:** Clicking the "Pipeline Health" widget on Page 1, or "Trigger Re-Crawl" on Page 2.

**Layout:** Right-side drawer, 480px wide, slides in from right.

- Title: "Active pipelines"
- For each running job:
  - Job header (Crawler / OCR / Classifier / Verifier — each with icon)
  - Progress bar (teal, animated)
  - Live log lines (mono 12px, max 5 visible, auto-scrolling)
  - Cancel button per job
- Toggle at top: "Live" / "Paused"

This drawer doubles as a debug surface for judges — show the system working in real time.

---

# PAGE 3 — Document Workspace (The Audit View)

**This is the most important page in the entire product.** This is what the judge will spend the most time on. This is the visual proof of the anti-hallucination story. Design it for screenshot-ability.

**Route:** `/jurisdictions/:country/documents/:doc_id`

### Layout structure — three-pane

```
┌────────────────────────────────────────────────────────────────────────┐
│  Top bar  +  Breadcrumb  +  Document title + actions                   │
├──────────┬──────────────────────────────────┬──────────────────────────┤
│          │                                  │                          │
│ LEFT     │  CENTER                          │ RIGHT                    │
│ Outline  │  Source PDF (rendered)           │ Classification Card      │
│ TOC      │  with bounding-box overlay       │ + Verification chain     │
│          │                                  │                          │
│ ~240px   │  flexible (60% of width)         │ ~400px                   │
│          │                                  │                          │
└──────────┴──────────────────────────────────┴──────────────────────────┘
```

### Top bar of this page
- Breadcrumb: `Dashboard / Bangladesh / Digital Security Act 2018`
- Title: "Digital Security Act 2018" (H1, 24px) — not gradient (gradient is reserved for higher-level pages)
- Right cluster: `Re-process` (ghost) · `Export this document` (secondary) · `Approve all verified` (primary)

### LEFT PANE — Document outline / TOC

- Search box at top (filters the outline)
- Hierarchical list:
  - Part I (collapsible)
    - Chapter 1
      - §1 Definitions
      - §2 Application
    - Chapter 2
      - §3 ...
      - **§26 Punishment for publishing false data** ← currently selected, teal background
        - §26(1) ← sub-clause highlighted
- Each item shows:
  - Indented hierarchy line
  - Status dot (small): green/yellow/red/grey depending on classification status
  - Tiny pillar tag at far right if classified (e.g., "6.1")
- Click an item → scrolls center pane to that section AND updates right pane

### CENTER PANE — Source PDF with overlay

- **PDF.js render** of the actual source document
- Pagination bar at top: `Page 14 of 87` with prev/next, jump-to-page
- Cited span highlighted with a **coloured bounding box**:
  - Green outline (2px solid) for verified citations
  - Yellow outline + diagonal hatching for pending
  - Red outline + dashed for rejected
- A small floating "pin" icon at top-right of the highlight, click → opens Citation Detail Drawer (3.1)
- Zoom controls bottom-right (− 100% +)
- "View original source ↗" link top-right (opens source URL in new tab)

### RIGHT PANE — Classification card

For the currently-selected clause, show one large card:

**Card structure (top to bottom):**

1. **Pillar tag** (large pill at top): `Pillar 6.1 · Data Localization Requirement` — teal background
2. **Verification status chip:** ✓ Verified · `a3f5…b9c2` (clickable hash → opens 3.1)
3. **Confidence:** Visual bar (teal fill, 94% width) with `0.94` numeric
4. **Verbatim span** in a quoted block (mono 13px, left teal border, slight tint background):
   > "Any person…shall not save such data…outside Bangladesh"
5. **Principal rule** (small heading + sentence)
6. **Exceptions** (collapsible list)
7. **Conditions** (collapsible list)
8. **Verification chain** (compact, three rows):
   - Gate 1 Span Match ✓ exact
   - Gate 2 Entailment ✓ 0.94
   - Gate 3 Structural ✓ predicates found
9. **Source ribbon** (small, monospace at bottom):
   `Section 26(1) · Page 14 · char 12453–12527 · SHA-256 a3f5…b9c2 · Retrieved 2026-05-17 08:14 UTC+06`
10. **Action row** (three buttons, full-width):
    - Approve (primary teal — only enabled if status is Pending)
    - Edit (secondary — opens 3.3)
    - Reject (ghost red — opens 3.4)

**Below the card** — small secondary section: "Related clauses in this instrument" — list of 3 nearby classifications with links.

### Reject view variant

When the user opens a rejected classification, the card shows:
- Red header strip: "Rejected by CVR Gate 2"
- Why it was rejected (e.g., "NLI entailment score 0.15 — below 0.7 threshold")
- The verbatim_span the model proposed
- The classification it tried to assign
- Buttons: "Send back for re-classification" / "Mark as truly N/A"

**This view is the visual centrepiece of the anti-hallucination story. The judge sees, in plain sight, what the system catches.**

---

## 3.1 — Citation Detail Drawer

**Triggered by:** Clicking hash badge, pin icon on PDF, or "View citation" anywhere.

**Layout:** Right drawer overlay, 520px wide.

**Content:**
- Header: "Citation a3f5…b9c2" (mono)
- Section 1 — **The chain** (visual flow chart):

  ```
  Source document
       ↓
  Bounding box on page 14
       ↓
  Char offset 12453–12527
       ↓
  Verbatim span
       ↓
  Llama 3.1 8B classifier
       ↓
  Gate 1: Span Match ✓
       ↓
  Gate 2: NLI Entailment ✓ (0.94)
       ↓
  Gate 3: Structural ✓
       ↓
  Verified — recorded in ledger
  ```

  Each node is clickable to see details. Use the brand teal for the connecting line; nodes are small white cards.

- Section 2 — **Source verification**:
  - Source URL (clickable)
  - SHA-256 hash (mono, copy button)
  - Retrieved at (ISO 8601)
  - Button: "Re-verify now" — re-fetches source, recomputes hash, confirms match

- Section 3 — **Reproducibility**:
  - "Any third party can verify this citation independently."
  - Three numbered steps in plain text + code snippets:
    1. Fetch source: `curl {url}`
    2. Compute hash: `sha256sum -`
    3. Compare to `a3f5…b9c2`

This drawer **sells the open-source verifiability angle**. Judges will screenshot it.

---

## 3.2 — Conflict Resolution Modal

**Triggered by:** A conflict banner appearing on a classification (e.g., "⚠ Two sources disagree on this provision").

**Layout:** Wide modal, 880px, two-column.

- Title: "Source conflict on §26(1)"
- Subtitle: "Two authoritative instruments yield different classifications. Choose the controlling source."

**Two side-by-side cards:**

Left card (Source A — HTML primary):
- Source name + instrument ID
- Authority badge (Primary)
- Date
- Verbatim span as quoted block
- Proposed classification

Right card (Source B — Amendment PDF):
- Same fields
- Authority badge (Amending instrument — newer)

**Below cards:**
- System recommendation panel: "ClauseChain recommends Source B (amendment, dated 2017-12-15, post-dates Source A)"
- Reasoning shown briefly
- Radio buttons: ⦿ Use Source A / ⦿ Use Source B / ⦿ Mark unresolved
- Optional comment field

**Footer:** Cancel / Confirm Resolution.

The resolution gets logged in the provenance ledger.

---

## 3.3 — Edit Classification Modal

**Triggered by:** Edit button on Page 3 right pane.

**Layout:** Modal 640px.

- Title: "Edit classification — §26(1)"
- Editable fields:
  - Pillar dropdown
  - Sub-criterion dropdown (filtered by pillar)
  - Verbatim span — text area (warning shown if user types text not in source: "⚠ This text is not present in the source document. Edit will be rejected on save.")
  - Principal rule — text area
  - Exceptions — repeatable text rows
  - Conditions — repeatable text rows
- Below: "Reason for edit" — required dropdown:
  - Rubric refinement
  - Model misclassification
  - Improved verbatim span
  - Other (text field)
- Footer: Cancel / Save edit
- On save: classification record is updated, original is preserved in audit history, ledger gets a new entry

**Crucial detail:** the verbatim span field has live validation — types characters and checks against source. This makes the anti-hallucination principle apply even to human edits.

---

## 3.4 — Reject with Reason Modal

**Triggered by:** Reject button.

**Layout:** Small modal, 480px.

- Title: "Reject classification?"
- Body:
  - Show the current classification in summary
  - "Reason for rejection" — required:
    - ☐ Wrong pillar
    - ☐ Verbatim span doesn't support claim
    - ☐ Source not authoritative
    - ☐ Clause not applicable to RDTII
    - ☐ Other (text)
  - Optional comment box
- Footer: Cancel / Reject (red, destructive style)
- On reject: classification moves to Rejected state, queued for re-classification with feedback signal, ledger entry created.

---

# PAGE 4 — RDTII Matrix

**Purpose:** The "money shot" view. A spreadsheet-like matrix showing jurisdictions × RDTII sub-criteria with cells colour-coded by classification status. This is what UN analysts will use for reporting.

**Route:** `/matrix`

### Layout

**Top bar / header:**
- Title: "RDTII Matrix" (H1, gradient text)
- Subtitle: "Pillar 6 · Pillar 7 · with optional bonus pillars"
- Right cluster: filter dropdown (which pillars), `Export` button (opens 4.2)

**Filter row:**
- Jurisdiction chips (all selected by default; click to toggle)
- Pillar chips (P6, P7, P8, P9, P12 — last three greyed if not ingested)
- Display toggle: `Status` (colour-coded) / `Confidence` (numeric) / `Citation count`

**The matrix table:**

```
                    │  6.1   │  6.2   │  6.3   │  7.1   │  7.2   │  7.3   │
─────────────────────┼────────┼────────┼────────┼────────┼────────┼────────┤
🇧🇩 Bangladesh        │   ✓    │   ✓    │   —    │   ✓    │   ⚠    │   ✓    │
🇹🇭 Thailand          │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
🇸🇬 Singapore         │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
```

- Each cell is clickable and shows status as a colour-coded square fill (not just an icon):
  - Green = fully verified
  - Yellow = pending review
  - Red = conflict / rejected
  - Grey = not yet covered
  - Stripe pattern = partial coverage
- Hover cell → tooltip: "BD · 6.1 · 3 verified citations · 1 conflict"
- Click cell → opens 4.1

**Below matrix — Coverage stats:**
Small horizontal bar showing overall matrix completion: "82% verified · 11% pending · 7% conflicts"

**Optional section — Cross-country comparison view (toggle):**
A second visualisation: a parallel-coordinates chart where each country is a line crossing each pillar at its coverage level. Optional polish for finals; skip for application demo.

---

## 4.1 — Matrix Cell Drilldown

**Triggered by:** Clicking any matrix cell.

**Layout:** Right drawer, 600px wide.

- Header: "Bangladesh · Pillar 6.1 · Data Localization"
- Summary: "3 verified citations · 1 conflict · 0 pending"
- List of contributing classifications:
  - Each row: instrument name, section number, verbatim_span snippet, status chip
  - Click row → navigates to Page 3 anchored on that classification
- Bottom: "View all in Document Workspace" button

---

## 4.2 — Export Modal

**Layout:** Modal 560px.

- Title: "Export RDTII matrix"
- Format radio:
  - ⦿ CSV (RDTII matrix structure)
  - ○ JSON Lines (full classifications with citations)
  - ○ Provenance bundle (all sources + hashes + classifications, zipped)
- Scope:
  - ☑ All jurisdictions / individual checkboxes per jurisdiction
  - ☑ All pillars / chips
  - ☐ Include rejected classifications (for transparency reporting)
- Include options:
  - ☑ Full verbatim spans
  - ☑ Source hashes
  - ☑ Verification scores
  - ☐ Reviewer comments
- Filename preview: `clausechain_rdtii_2026-05-19.csv`
- Footer: Cancel / Export

---

# PAGE 5 — Pipeline Activity & Provenance Ledger

**Purpose:** The append-only audit trail. Every event — crawl, ingest, classify, verify, approve, edit, reject — recorded with a hash chain. This page sells the "reproducibility" and "open accountability" angle.

**Route:** `/ledger`

### Layout

**Top bar:**
- Title: "Pipeline & Ledger" (H1)
- Subtitle: "Append-only event log · 3,847 entries · last verified hash a3f5…b9c2"
- Right: filter dropdown, search input, `Export ledger` button

**Tabs:** `Live activity` | `Provenance ledger` | `CVR rejections`

### Tab 1 — Live activity (default)

A streaming timeline. Each event is a row:

```
[icon]  [timestamp]   [event type]   [description]                  [hash badge]
```

Examples:
- ✓ 08:14:22 UTC+06 — Verified — §26(1) of BD-DSA-2018 → Pillar 6.1 — `a3f5…b9c2`
- ✗ 08:13:58 — Rejected — §24 of TH-CCA-2007 → Gate 2 NLI 0.15 — `7c2e…01ab`
- ⊕ 08:13:11 — Ingested — BD draft PDPA 2023 (PDF, 42 pages)
- 🕷 08:10:00 — Crawl started — bdlaws.minlaw.gov.bd

Filter chips: All / Verified / Rejected / Edited / Ingested / Crawled

Click row → opens 5.1.

### Tab 2 — Provenance ledger

Same data, but displayed as a chain — each entry shows its hash AND the hash of the previous entry (Merkle-style):

```
Entry #3847
Hash:     a3f5...b9c2
Prev:     d2e1...4a9c
Payload:  {"event": "classification_verified", "clause": "BD-DSA-2018 §26(1)", ...}
Verified: ✓
```

Each entry has a small "verify chain" button — recomputes the hash locally in browser, confirms integrity.

A button at top: "Verify entire chain (3,847 entries)" — runs verification client-side and shows a progress bar.

This is the strongest possible visual signal of "this system is auditable end-to-end". The UN judges will love this.

### Tab 3 — CVR rejections

Filtered view showing only rejections, with reasons aggregated:

- Pie chart at top: rejection causes (Gate 1 / Gate 2 / Gate 3)
- Table below: each rejection with reason, verbatim_span the model proposed, gate that caught it
- Bulk action: "Re-classify selected"

This tab is the **anti-hallucination receipts page**. Lean into it.

---

## 5.1 — Ledger Entry Detail

**Triggered by:** Clicking any ledger row.

**Layout:** Right drawer, 560px.

- Header: "Entry #3847 · `a3f5…b9c2`"
- JSON payload viewer (collapsible tree, syntax-highlighted, mono)
- Verification panel:
  - Compute hash button (shows hash computed locally, ✓ matches stored)
  - Previous entry link
  - Next entry link
- Related classification card (mini, with link to Page 3)
- Copy as JSON button

---

## 5.2 — Re-verify Modal

**Triggered by:** "Re-verify now" button on a citation, or bulk "Re-verify all" from ledger.

**Layout:** Modal 520px.

- Title: "Re-verify citation chain"
- Body: explains what re-verification does (refetch source, recompute hash, re-run gates)
- Scope:
  - This citation only
  - All citations in this document
  - All citations in this jurisdiction
- Footer: Cancel / Run re-verification
- After completion: progress completes, summary shown: "247 citations re-verified · 247 passed · 0 changed"

---

## Global Components

These reusable pieces appear across pages.

### Top bar (56px, sticky, white, bottom border)
- Left: logo
- Center: search trigger (⌘K)
- Right: notifications, avatar with dropdown (Settings, Sign out)

### Sidebar (240px, sticky left)
- Logo block top
- Nav items (icon + label, 40px row height)
- Active state: teal background tint, teal text, 3px teal left border
- Hover: ink-50 background
- Workspace switcher at bottom (for future multi-workspace)

### Status chips (used everywhere)
- Verified — green dot + "Verified" + optional hash
- Pending — yellow dot + "Pending review"
- Rejected — red dot + "Rejected · Gate N"
- Conflict — red dot + "Conflict"
- Each chip has consistent padding (0 8px), height (22px), radius (full)

### Hash badge (mono, used for citations)
- Format: `a3f5…b9c2` (first 4 + ellipsis + last 4)
- Click to copy full hash → toast: "Hash copied"
- Hover shows full hash in tooltip

### Verification chain widget
A compact horizontal three-step visual:
`[Gate 1 ✓] → [Gate 2 ✓ 0.94] → [Gate 3 ✓]`
Each step is colour-coded; failure makes the chain break visually with a red node and a small "x" between.

### Confidence bar
Thin horizontal bar (4px tall, full width of container), teal fill, with numeric label at right. Below 0.7 fills with yellow, below 0.5 with red.

### Toast notifications
Bottom-right of screen, 320px wide, slide in from right, auto-dismiss 4s, with icon + message + optional action link.

---

## Empty States, Loading, Errors

### Empty states
- Line-art illustration (single-colour, ink-300 stroke)
- One-line headline
- One-paragraph guidance
- Primary CTA button

Examples:
- No jurisdictions: "Start by adding your first jurisdiction. We'll crawl the official gazette and ingest the primary statutes."
- No classifications yet: "Add a document and run the pipeline to generate your first classifications."
- No rejections: "Nothing rejected yet. The CVR loop will surface failures here when they occur." (with a small reassuring tone — "this is good news" feel)

### Loading
- Skeleton screens for cards (animated shimmer, teal-tinted)
- Spinners only for short async actions (button-internal, 16px)
- Progress bars for pipelines

### Errors
- Inline within the affected component
- Plain language: "Couldn't reach bdlaws.minlaw.gov.bd. Retrying in 30s…"
- Never use technical stack traces in the UI

---

## Page-to-Page Navigation Map

Quick reference for prototype linking:

| From | Element | To |
|---|---|---|
| Page 1 (Dashboard) | Jurisdiction card | Page 2 |
| Page 1 | Recent activity row | Page 3 (anchored) |
| Page 1 | KPI card | Page 5 (filtered) |
| Page 1 | "+ Add Jurisdiction" | Modal 1.1 |
| Page 1 | ⌘K | Modal 1.2 |
| Page 2 (Jurisdiction) | Document row | Page 3 |
| Page 2 | "+ Add Document" | Modal 2.1 |
| Page 2 | "Re-Crawl" | Drawer 2.3 |
| Page 3 (Document) | Hash badge / pin | Drawer 3.1 |
| Page 3 | Conflict banner | Modal 3.2 |
| Page 3 | Edit button | Modal 3.3 |
| Page 3 | Reject button | Modal 3.4 |
| Page 4 (Matrix) | Cell | Drawer 4.1 |
| Page 4 | Export | Modal 4.2 |
| Drawer 4.1 | Classification row | Page 3 |
| Page 5 (Ledger) | Entry row | Drawer 5.1 |
| Page 5 | Re-verify | Modal 5.2 |

---

## Design priorities — what to nail first

If time forces you to choose where to put polish, in priority order:

1. **Page 3 (Document Workspace)** — the audit view sells the entire product. Pixel-perfect this one.
2. **Page 1 (Dashboard)** — first impression for judges. Gradient text on the welcome, clean KPI strip, jurisdictions grid.
3. **Page 4 (RDTII Matrix)** — the "this is useful" view.
4. **Page 5 (Ledger)** — the audit story.
5. **Page 2 (Jurisdiction Detail)** — can be more utilitarian.

Modals and drawers should feel consistent — same width conventions, same header treatment, same close affordance (X top-right + Esc).

---

## What makes this design "UN-tier"

A few principles that should guide every Claude Design prompt:

- **Restraint over ornament.** No drop shadows on everything. No glassmorphism. No gradients on buttons. The gradient is precious and rare.
- **Mono for evidence.** Anywhere a hash, citation, timestamp, or source reference appears — SF Mono. This signals "verifiable artefact" subconsciously.
- **Numbers are the hero.** KPI cards, confidence scores, citation counts — these large numbers in display weight are what the eye lands on.
- **The CVR story is visual.** Don't bury verification behind text. The verification chain widget should appear prominently on every classification.
- **Whitespace as authority.** UN documents are dense; ClauseChain compensates with generous padding. This communicates "we have nothing to hide; we don't need to fill every pixel".

---

## Suggested prompts for Claude Design

When you build each page, give Claude Design a prompt structured like this:

> Design **Page 3 — Document Workspace** for ClauseChain, a UN regulatory analysis SaaS. The product analyses digital trade laws and produces hash-anchored, verified citations. Reference the design system in our spec: SF Pro typography, teal accent (#0FB5A7), gradient text reserved for hero titles, Apple-clean aesthetic. The layout is three-pane: left outline (240px), center PDF viewer with bounding-box overlay, right classification card (400px). The right card must include a Pillar tag, verbatim quote in a teal-bordered block, confidence bar, and a three-step verification chain widget. Show a realistic example: Bangladesh Digital Security Act 2018, Section 26(1), classified as Pillar 6.1 Data Localization, confidence 0.94. Include the source hash badge `a3f5…b9c2` and Approve/Edit/Reject action row at the bottom. Use generous whitespace; this is UN-grade tooling, not consumer.

Adjust per page, but keep the design-system reminders consistent.

---

**End of spec.** Build Page 3 first — every design choice elsewhere descends from how that page lands.
