"""RDTII mapping: cheap LLM screen (bulk tier) -> constrained mapping (high tier).

Legal logic comes from the DoDont playbook + rubric YAML, never invented here.
Every mapping decision returns a verbatim snippet that MUST later pass G1
(span-exists) — the model is told the quote will be mechanically verified.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

SCREEN_BATCH_SIZE = 12
SCREEN_CAP_PER_INDICATOR = 60   # logged, not silent (envelope warning)

GOLDEN_RULES = """LEGAL RULES (ESCAP RDTII methodology — binding):
- Map on legal FUNCTION, not keywords. A transfer CONDITION is 6.4 (conditional flow), NOT a 6.1 ban.
- A local-storage rule (copy stays in-country) is 6.2; a local server/data-centre PRECONDITION is 6.3; encryption/network-security rules are Pillar 7.2, never 6.x.
- Banking/professional secrecy or confidentiality duties are NOT transfer bans.
- Only current, in-force, official domestic law counts. Drafts/bills/repealed text never count.
- One provision can satisfy several indicators; judge THIS indicator's legal test only.
- If the legal test is not met, say applies=false — never force a mapping."""


class ScreenDecision(BaseModel):
    candidate_index: int
    relevant: bool
    reason: str = ""


class ScreenBatch(BaseModel):
    decisions: list[ScreenDecision] = Field(default_factory=list)


class MapDecision(BaseModel):
    applies: bool
    verbatim_snippet: str = ""
    rationale: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    coverage: str = "Horizontal"            # Horizontal ONLY if ALL sectors; else Sectoral
    sector: str | None = None
    actor: str | None = None
    modality: str | None = None             # must/may/should (+not)
    action: str | None = None
    conditions: list[str] = Field(default_factory=list)
    exceptions: list[str] = Field(default_factory=list)


def _indicator_brief(indicator_id: str, cfg: dict) -> str:
    exclusions = "\n".join(f"- {e}" for e in (cfg.get("exclusions") or []))
    scoring = "\n".join(f"  score {k}: {v}" for k, v in (cfg.get("scoring") or {}).items())
    parts = [
        f"INDICATOR {indicator_id} — {cfg.get('name', '')}",
        f"Legal test: {cfg.get('question', '')}",
    ]
    if cfg.get("polarity") == "framework_absent_scores_high":
        parts.append(
            "EVIDENCE RULE (absence-scored indicator): applies=true when the provision "
            "ESTABLISHES or evidences the framework (purpose/scope clause, core obligation, "
            "or the controlling framework provision). ESCAP records the framework's existence "
            "as the evidence row; the SCORE (not your mapping) captures absence. Do NOT reject "
            "a provision merely because it proves the framework EXISTS."
        )
    if cfg.get("legal_test"):
        parts.append(str(cfg["legal_test"]).strip())
    if exclusions:
        parts.append(f"Exclusions (hard rules):\n{exclusions}")
    if scoring:
        parts.append(f"Official scoring criteria:\n{scoring}")
    return "\n".join(parts)


def screen_candidates(llm_bulk, indicator_id: str, cfg: dict, candidates: list) -> list:
    """Cheap relevance screen over retrieval candidates. Returns the surviving subset."""
    survivors = []
    pool = candidates[:SCREEN_CAP_PER_INDICATOR]
    for start in range(0, len(pool), SCREEN_BATCH_SIZE):
        batch = pool[start:start + SCREEN_BATCH_SIZE]
        listing = "\n\n".join(
            f"[{i}] ({c.props.get('article_section', '?')} — {c.props.get('heading', '')}) {c.text[:900]}"
            for i, c in enumerate(batch)
        )
        prompt = f"""You screen statutory provisions for an RDTII digital-trade-regulation indicator.

{_indicator_brief(indicator_id, cfg)}

{GOLDEN_RULES}

For EACH numbered candidate below, decide if it PLAUSIBLY satisfies the indicator's legal test
(err on the side of relevant=true when unsure — a later stage decides precisely; but apply the
Exclusions strictly: a candidate matching an exclusion is NOT relevant).

CANDIDATES:
{listing}

Return one decision per candidate, using each candidate's index number."""
        result = llm_bulk.complete(prompt, ScreenBatch)
        for decision in result.decisions:
            if decision.relevant and 0 <= decision.candidate_index < len(batch):
                survivors.append(batch[decision.candidate_index])
    return survivors


def map_candidate(llm_high, indicator_id: str, cfg: dict, candidate) -> MapDecision:
    """Precise mapping of one provision to one indicator, with a verifiable quote."""
    props = candidate.props
    prompt = f"""You are a legal analyst applying the ESCAP RDTII 2.1 methodology.

{_indicator_brief(indicator_id, cfg)}

{GOLDEN_RULES}

PROVISION UNDER ANALYSIS
Law: {props.get('law_name', '')}
Citation: {props.get('article_section', '')} — heading: {props.get('heading', '')} ({props.get('part', '')})
Text (verbatim from the official source):
\"\"\"{candidate.text[:6000]}\"\"\"

TASK
1. Extract the predicate: WHO is regulated, WHAT modality (must/may/should, negated?),
   WHAT action, under WHAT conditions, with WHAT exceptions.
2. Decide: does this provision satisfy indicator {indicator_id}'s legal test? (applies)
3. If applies: pick verbatim_snippet = an EXACT contiguous quote from the text above
   (<= 300 characters, copied character-for-character — it will be MECHANICALLY verified
   against the source; any edit fails the row). Choose the operative words.
4. rationale (<= 300 chars): "This [section] [prohibits/requires/permits/establishes] [what].
   Maps to {indicator_id} because [one sentence of legal logic]." Name the legal FUNCTION.
5. coverage: "Horizontal" ONLY if it applies to ALL sectors; otherwise "Sectoral" + sector.
6. confidence 0-1. If the exception ("unless/except") changes the legal effect, account for it:
   a rule with a compliance path is conditional (6.4-type), not a ban (6.1-type)."""
    return llm_high.complete(prompt, MapDecision)
