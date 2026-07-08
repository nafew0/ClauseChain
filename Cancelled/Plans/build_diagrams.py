#!/usr/bin/env python3
"""
Generate two diagrams for the ClauseChain Technical Memo:

  fig00_architecture.png  - System architecture (10-stage pipeline + 8 gates)
  fig09_cvr_loop.png      - CVR-loop / eight-verification-gate sequence

Both are pure matplotlib (no LaTeX, no graphviz dependency) so they render
identically on macOS / Linux / Windows. Output is 16:9-ish at 200 dpi so they
embed cleanly in the .docx without pixelation when Word zooms.
"""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT = Path(__file__).parent
FIG_DIR = ROOT / "technical_memo_figures"
FIG_DIR.mkdir(exist_ok=True)

# ----------------------------------------------------------------------------
# ClauseChain palette (matches the Tailwind config in frontend/)
# ----------------------------------------------------------------------------
BLUE     = "#2563EB"
VIOLET   = "#7C3AED"
TEAL     = "#0E9F89"
INK_900  = "#1F2937"
INK_700  = "#374151"
INK_500  = "#6B7280"
INK_300  = "#D1D5DB"
INK_200  = "#E5E7EB"
INK_100  = "#F3F4F6"
INK_50   = "#F9FAFB"
AMBER    = "#F59E0B"
RED      = "#DC2626"
GREEN    = "#10B981"
WHITE    = "#FFFFFF"


# ----------------------------------------------------------------------------
# Shape helpers
# ----------------------------------------------------------------------------
def rbox(ax, x, y, w, h, label, *, fill=WHITE, edge=INK_300,
         text_color=INK_900, fontsize=10, bold=False, sub=None,
         sub_color=None, pad=0.04):
    """Rounded-corner box with optional subtitle line."""
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad={pad},rounding_size=0.18",
        linewidth=1.4, edgecolor=edge, facecolor=fill,
    )
    ax.add_patch(box)
    if sub:
        ax.text(x + w / 2, y + h * 0.62, label,
                ha="center", va="center",
                fontsize=fontsize, color=text_color,
                fontweight="bold" if bold else "normal")
        ax.text(x + w / 2, y + h * 0.30, sub,
                ha="center", va="center",
                fontsize=fontsize - 2,
                color=sub_color or INK_500)
    else:
        ax.text(x + w / 2, y + h / 2, label,
                ha="center", va="center",
                fontsize=fontsize, color=text_color,
                fontweight="bold" if bold else "normal")


def arrow(ax, x1, y1, x2, y2, color=INK_500, lw=1.6, style="-|>",
          curve=0.0):
    """Tapered arrow with optional curvature."""
    connection = f"arc3,rad={curve}"
    a = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle=style,
        mutation_scale=16,
        color=color,
        linewidth=lw,
        connectionstyle=connection,
    )
    ax.add_patch(a)


# ============================================================================
# DIAGRAM A — System Architecture (vertical pipeline + gate sidebar)
# ============================================================================
def build_architecture():
    fig, ax = plt.subplots(figsize=(14, 19), dpi=200)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 19)
    ax.axis("off")
    ax.set_aspect("equal")

    # --- Title strip ------------------------------------------------------
    ax.text(7.0, 18.4, "ClauseChain — System Architecture",
            ha="center", va="center",
            fontsize=22, fontweight="bold", color=INK_900)
    ax.text(7.0, 17.85,
            "Ten-stage typed pipeline with eight verification gates and "
            "per-task local / cloud model routing",
            ha="center", va="center",
            fontsize=11.5, color=INK_500, fontstyle="italic")

    # ------------------------------------------------------------------
    # Left column: pipeline stages
    # ------------------------------------------------------------------
    PIPE_X = 1.0
    PIPE_W = 7.5
    BOX_H = 0.85
    GAP = 0.45

    # input / source row (top, side-by-side)
    INPUT_Y = 16.30
    rbox(ax, PIPE_X,         INPUT_Y, 3.55, BOX_H,
         "Jurisdiction Packs (YAML)",
         sub="authority graph · rubric · langs",
         fill=INK_50, edge=INK_300, fontsize=10)
    rbox(ax, PIPE_X + 3.95,  INPUT_Y, 3.55, BOX_H,
         "Official portals (SG · TH · BD)",
         sub="HTML statute · gazette PDF · scanned",
         fill=INK_50, edge=INK_300, fontsize=10)

    # the 10 pipeline stages (top -> bottom)
    stages = [
        ("1.  Discovery",
         "Scrapy + Playwright + Crawl4AI · robots-aware crawl",
         BLUE),
        ("2.  Source Acquisition",
         "raw bytes · SHA-256 · headers · rendered pages",
         BLUE),
        ("3.  Authority & Current-Law Resolver",
         "binding / draft / repealed / consolidated / amendment / translation",
         BLUE),
        ("4.  Extraction + OCR",
         "Trafilatura · Docling · PaddleOCR-VL  (+VLM repair on hard regions)",
         BLUE),
        ("5.  Legal Structure + Rule Units",
         "section tree · principal rule + exception + condition binding",
         BLUE),
        ("6.  Hybrid Retrieval",
         "OpenSearch BM25  +  BGE-M3 / Qwen3-Embedding  +  cross-encoder rerank",
         BLUE),
        ("7.  Legal Predicate Extraction",
         "actor · action · object · modality · condition · exception (Qwen2.5-7B)",
         VIOLET),
        ("8.  RDTII Mapping  (Pillars 6 · 7 · 8 · 9)",
         "rubric-as-code deterministic checks + constrained classifier",
         VIOLET),
        ("9.  Verification Gates  G1 – G8",
         "span · location · authority · currentness · structure · tuple · RDTII · counter-evidence",
         AMBER),
        ("10. Human Audit + Export",
         "review UI · JSONL · CSV · Markdown · provenance bundle",
         TEAL),
    ]

    top_y = 15.15
    stage_centers = []   # (label, y_center) for gate arrows later
    for i, (label, sub, color) in enumerate(stages):
        y = top_y - i * (BOX_H + GAP)
        rbox(ax, PIPE_X, y, PIPE_W, BOX_H, label, sub=sub,
             fill=WHITE, edge=color, fontsize=11, bold=True,
             sub_color=INK_500)
        stage_centers.append((label, y + BOX_H / 2))

    # arrows: source row -> stage 1
    arrow(ax, PIPE_X + 1.78, INPUT_Y, PIPE_X + PIPE_W / 2 - 0.3,
          stage_centers[0][1] + BOX_H / 2 + 0.05, color=INK_300)
    arrow(ax, PIPE_X + 5.92, INPUT_Y, PIPE_X + PIPE_W / 2 + 0.3,
          stage_centers[0][1] + BOX_H / 2 + 0.05, color=INK_300)

    # arrows between consecutive stages
    for i in range(len(stages) - 1):
        y_from = stage_centers[i][1] - BOX_H / 2
        y_to   = stage_centers[i + 1][1] + BOX_H / 2
        arrow(ax, PIPE_X + PIPE_W / 2, y_from,
              PIPE_X + PIPE_W / 2, y_to,
              color=INK_300, lw=1.4)

    # outputs row below stage 10
    out_y = stage_centers[-1][1] - BOX_H / 2 - 0.80
    out_x = PIPE_X
    for j, (lbl, sub) in enumerate([
        ("JSONL", "evidence records"),
        ("CSV matrix", "indicator × clause"),
        ("Provenance bundle", "raw bytes + hashes"),
    ]):
        ox = out_x + j * (PIPE_W / 3 + 0.0)
        ow = PIPE_W / 3 - 0.15
        rbox(ax, ox, out_y, ow, 0.78, lbl, sub=sub,
             fill=TEAL, edge=TEAL, text_color=WHITE,
             sub_color="#D1FAE5", fontsize=10, bold=True)
    # arrow from stage 10 down to outputs
    arrow(ax, PIPE_X + PIPE_W / 2, stage_centers[-1][1] - BOX_H / 2,
          PIPE_X + PIPE_W / 2, out_y + 0.78, color=INK_300, lw=1.4)

    # ------------------------------------------------------------------
    # Right column: 8 verification gates
    # ------------------------------------------------------------------
    GATE_X = 9.4
    GATE_W = 3.7
    GATE_H = 0.78
    GATE_GAP = 0.32

    ax.text(GATE_X + GATE_W / 2, INPUT_Y + BOX_H + 0.20,
            "Eight Verification Gates",
            ha="center", va="center",
            fontsize=13, fontweight="bold", color=AMBER)
    ax.text(GATE_X + GATE_W / 2, INPUT_Y + BOX_H - 0.15,
            "pass  ·  review  ·  reject",
            ha="center", va="center",
            fontsize=9, color=INK_500, fontstyle="italic")

    gates = [
        ("G1  Span",            "exact / OCR-fuzzy ≤ 3"),
        ("G2  Location",        "bbox IoU ≥ 0.85"),
        ("G3  Authority",       "binding tier (rank ≤ 5)"),
        ("G4  Currentness",     "not repealed / draft"),
        ("G5  Structure",       "rule + exception present"),
        ("G6  Tuple",           "multilingual NLI ≥ 0.70"),
        ("G7  RDTII",           "rubric predicates satisfied"),
        ("G8  Counter-evidence","no contradicting source"),
    ]
    top_gate_y = INPUT_Y - 0.85   # start gates aligned with stage 1
    gate_centers = []
    for i, (label, sub) in enumerate(gates):
        y = top_gate_y - i * (GATE_H + GATE_GAP)
        rbox(ax, GATE_X, y, GATE_W, GATE_H, label, sub=sub,
             fill="#FFFBEB", edge=AMBER, fontsize=10, bold=True,
             sub_color=INK_500)
        gate_centers.append(y + GATE_H / 2)

    # gate -> stage mapping (which stage each gate primarily validates)
    # stage index in `stages` list (0-based)
    gate_to_stage = {
        0: 3,   # G1 Span        -> Extraction
        1: 3,   # G2 Location    -> Extraction
        2: 2,   # G3 Authority   -> Authority Resolver
        3: 2,   # G4 Currentness -> Authority Resolver
        4: 4,   # G5 Structure   -> Structure + Rule Units
        5: 6,   # G6 Tuple       -> Predicate Extraction
        6: 7,   # G7 RDTII       -> RDTII Mapping
        7: 8,   # G8 Counter-ev. -> Verification stage itself
    }
    for gate_idx, stage_idx in gate_to_stage.items():
        gy = gate_centers[gate_idx]
        sy = stage_centers[stage_idx][1]
        # arrow from stage-right-edge to gate-left-edge with slight curve
        curve = 0.05 if gy < sy else -0.05
        arrow(ax, PIPE_X + PIPE_W, sy, GATE_X, gy,
              color=AMBER, lw=1.0, style="-|>", curve=curve)

    # ------------------------------------------------------------------
    # Routing legend (bottom strip, clear of outputs)
    # ------------------------------------------------------------------
    legend_y = 0.35
    leg_items = [
        ("Local-first",    BLUE,   "vLLM · Qwen / Llama family"),
        ("Cloud-routable", VIOLET, "per-task: OpenAI · Anthropic"),
        ("Verification",   AMBER,  "8 gates · pass / review / reject"),
        ("Export",         TEAL,   "JSONL · CSV · provenance"),
    ]
    lx = 0.5
    lw_each = 3.15
    for i, (name, color, desc) in enumerate(leg_items):
        x0 = lx + i * (lw_each + 0.10)
        rbox(ax, x0, legend_y, lw_each, 0.70, name, sub=desc,
             fill=WHITE, edge=color, fontsize=10, bold=True,
             text_color=color, sub_color=INK_500)

    fig.savefig(FIG_DIR / "fig00_architecture.png",
                bbox_inches="tight", pad_inches=0.25,
                facecolor=WHITE)
    plt.close(fig)
    print("  fig00_architecture.png")


# ============================================================================
# DIAGRAM B — CVR Loop / 8-Gate Sequence
# ============================================================================
def build_cvr_loop():
    fig, ax = plt.subplots(figsize=(20, 10.5), dpi=200)
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 10.5)
    ax.axis("off")
    ax.set_aspect("equal")

    # --- Title -----------------------------------------------------------
    ax.text(10, 9.95, "ClauseChain — CVR Loop  (Cite · Verify · Reject)",
            ha="center", va="center",
            fontsize=22, fontweight="bold", color=INK_900)
    ax.text(10, 9.50,
            "Every mapped clause must pass all eight gates before it "
            "is exported; any failure rejects or routes to human review.",
            ha="center", va="center",
            fontsize=11.5, color=INK_500, fontstyle="italic")

    # --- Lane labels (three horizontal lanes) ---------------------------
    LANE_REVIEW = 7.7
    LANE_PASS   = 5.0
    LANE_REJECT = 2.3

    # Lane labels at the very far left, *before* the input box
    for y, label, color in [
        (LANE_REVIEW, "REVIEW",  AMBER),
        (LANE_PASS,   "PASS",    GREEN),
        (LANE_REJECT, "REJECT",  RED),
    ]:
        ax.text(0.25, y, label, ha="left", va="center",
                fontsize=10, color=color, fontweight="bold")
        # subtle horizontal guide
        ax.plot([1.05, 19.0], [y, y], color=INK_100, linewidth=1, zorder=0)

    # --- Input box (left edge, shifted right of lane labels) -----------
    INPUT_X = 1.10
    INPUT_W = 1.85
    rbox(ax, INPUT_X, LANE_PASS - 0.45, INPUT_W, 0.9,
         "Mapped clause",
         sub="predicate tuple + spans",
         fill=BLUE, edge=BLUE, text_color=WHITE, sub_color="#DBEAFE",
         fontsize=10, bold=True)

    # --- 8 gates evenly spaced on PASS lane -----------------------------
    GATE_W = 1.45
    GATE_H = 0.95
    first_x = INPUT_X + INPUT_W + 0.45      # gap between input and G1
    pitch = 1.85                            # gap between gates so arrows show
    gates = [
        ("G1", "Span",          "exact / fuzzy"),
        ("G2", "Location",      "bbox · section"),
        ("G3", "Authority",     "binding tier"),
        ("G4", "Currentness",   "not repealed"),
        ("G5", "Structure",     "rule + exception"),
        ("G6", "Tuple",         "NLI ≥ 0.70"),
        ("G7", "RDTII",         "rubric satisfied"),
        ("G8", "Counter-ev.",   "no conflict"),
    ]
    # gates that can route to review (route mainly on "uncertain" outcomes)
    can_review = {"G2", "G4", "G5", "G6", "G7", "G8"}
    # gates that can outright reject
    can_reject = {"G1", "G2", "G3", "G4", "G6", "G7"}

    gate_xy = []
    for i, (gid, name, thr) in enumerate(gates):
        gx = first_x + i * pitch
        gy = LANE_PASS - GATE_H / 2
        rbox(ax, gx, gy, GATE_W, GATE_H,
             f"{gid}  {name}",
             sub=thr,
             fill=WHITE, edge=AMBER, fontsize=10, bold=True,
             sub_color=INK_500)
        gate_xy.append((gx, gy, gid, name))

    # pass arrows: input -> G1 -> G2 -> ... -> G8 -> verified
    prev_right = INPUT_X + INPUT_W
    for gx, gy, _, _ in gate_xy:
        arrow(ax, prev_right, LANE_PASS, gx - 0.02, LANE_PASS,
              color=GREEN, lw=2.0)
        prev_right = gx + GATE_W

    # verified terminal
    VX = prev_right + 0.35
    rbox(ax, VX, LANE_PASS - 0.55, 1.70, 1.1,
         "VERIFIED",
         sub="exported as evidence",
         fill=GREEN, edge=GREEN, text_color=WHITE, sub_color="#D1FAE5",
         fontsize=11, bold=True)
    arrow(ax, prev_right, LANE_PASS, VX - 0.02, LANE_PASS,
          color=GREEN, lw=2.0)

    # review terminal (top-right)
    REV_X = VX
    rbox(ax, REV_X, LANE_REVIEW - 0.55, 1.70, 1.1,
         "HUMAN REVIEW",
         sub="reviewer queue",
         fill=AMBER, edge=AMBER, text_color=WHITE, sub_color="#FEF3C7",
         fontsize=10, bold=True)

    # reject terminal (bottom-right)
    REJ_X = VX
    rbox(ax, REJ_X, LANE_REJECT - 0.55, 1.70, 1.1,
         "REJECTED",
         sub="blocked from export",
         fill=RED, edge=RED, text_color=WHITE, sub_color="#FECACA",
         fontsize=10, bold=True)

    # review arrows (up) and reject arrows (down) from each gate
    for gx, gy, gid, _ in gate_xy:
        cx = gx + GATE_W / 2
        top_y = gy + GATE_H
        bot_y = gy

        if gid in can_review:
            arrow(ax, cx, top_y, cx, LANE_REVIEW - 0.05,
                  color=AMBER, lw=1.3, style="-|>", curve=0.0)
        if gid in can_reject:
            arrow(ax, cx, bot_y, cx, LANE_REJECT + 0.05,
                  color=RED, lw=1.3, style="-|>", curve=0.0)

    # merge arrows from each gate column into the right-side terminals
    # (visually suggest review/reject lanes flow rightward to the terminals)
    # subtle horizontal arrows to the boxes
    arrow(ax, gate_xy[-1][0] + GATE_W, LANE_REVIEW,
          REV_X, LANE_REVIEW, color=AMBER, lw=1.3, curve=0.0)
    arrow(ax, gate_xy[-1][0] + GATE_W, LANE_REJECT,
          REJ_X, LANE_REJECT, color=RED, lw=1.3, curve=0.0)

    # --- Footer notes ---------------------------------------------------
    note_y = 1.05
    notes = [
        ("Cite",   BLUE,   "exact span + URL + SHA-256 + section + page + bbox"),
        ("Verify", AMBER,  "G1 span · G2 location · G3 authority · G4 currentness · "
                           "G5 structure · G6 tuple · G7 RDTII · G8 counter-evidence"),
        ("Reject", RED,    "unsupported, outdated, or guideline-as-law claims are "
                           "blocked before export"),
    ]
    ax.text(0.5, note_y + 0.55, "Three principles enforced by the gates:",
            ha="left", va="center", fontsize=10, color=INK_500,
            fontstyle="italic")
    for i, (kw, color, body) in enumerate(notes):
        y = note_y - i * 0.32
        ax.text(0.5, y, kw, ha="left", va="center",
                fontsize=10, color=color, fontweight="bold")
        ax.text(1.45, y, body, ha="left", va="center",
                fontsize=9.5, color=INK_700)

    fig.savefig(FIG_DIR / "fig09_cvr_loop.png",
                bbox_inches="tight", pad_inches=0.25,
                facecolor=WHITE)
    plt.close(fig)
    print("  fig09_cvr_loop.png")


# ----------------------------------------------------------------------------
if __name__ == "__main__":
    print("Building diagrams...")
    build_architecture()
    build_cvr_loop()
    print(f"Written to {FIG_DIR}/")
