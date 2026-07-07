# ClauseChain Championship GraphRAG Strategy

**Position:** Top-2-or-nothing architecture for the July 20, 2026 Round 1 submission.

This is the aggressive track. The goal is not to build a plain RAG script that finds some clauses. The goal is to show a legal intelligence engine that can discover, verify, explain, and export regulatory evidence better than a human spreadsheet workflow.

> **⚠️ Post-22-June update — externally validated by the 12-June "RAG and LLMs" talk (Rathachai, KMITL).** The workshop independently presented a **GraphRAG-for-legal schema identical in spirit to ours** — `Document → Article → Paragraph → Item → Subitem` with **`AMENDS` / `REVOKE`** edges — confirming the §5 schema and the currentness/amendment story (adopt those edge types + `SUPERSEDES` / `CROSS_REFERENCES`). It also confirmed **"broad recall, NOT top-k"**: the Direct-Corpus-Interaction / semantic-similarity-bottleneck result (Li et al., arXiv:2605.05242, 2026) — *evidence dropped by a top-k similarity score can't be recovered downstream* — so graph expansion + broad retrieval beat a small top-k. **Final storage decision stands (§12): SQLite-backed `GraphStore` default, Neo4j opt-in.** Master changelog: Dev Plan §0; details in `Hackthon_Knowledge/NOTES_12June_Workshop_Corrected.md`.
>
> **4-Jul gap analysis:** nothing here changes. Reinforced: the SQLite default now also matches the **near-confirmed CPU-only/no-keys eval environment** (Dev Plan §0A/§3A — Path A is the clone-default); the graph's cross-reference edges additionally power the new **dangling-reference gate** (a cross-referenced instrument must still exist and be in force before a row exports — DoDont §12 item 8); and the graph's currentness path is a natural home for the **Malaysia error-audit pass** (Dev Plan §6 P2′).

## 1. Strategic Call

Use **Neo4j-backed Agentic GraphRAG** as a core differentiator.

But use it correctly:

- Neo4j is the **legal evidence graph**, not a loose semantic toy.
- Pydantic schemas are the contract for every graph node, edge, candidate finding, verifier result, and export row.
- The LLM/agent can propose paths and mappings, but final CSV rows pass deterministic verification gates.
- The graph is primary for retrieval quality and demo strength; the CSV writer remains deterministic and template-exact.

The winning system should say:

> "We do not just retrieve legal text. We model the law as a graph of instruments, versions, provisions, definitions, amendments, exceptions, cross-references, and RDTII mappings. The agent reasons over that graph, but every exported row is source-grounded and verifier-checked."

## 2. Why Neo4j Is Worth It

Neo4j gives us visible advantages that plain RAG teams will struggle to show.

| Advantage | Why it matters for scoring |
|---|---|
| Amendment and currentness graph | Avoids the canonical error: citing stale or superseded law. |
| Section and schedule cross-reference traversal | Legal rules often live across definitions, sections, exceptions, and schedules. |
| NEW discovery | Graph comparison against known provisions makes discovery explainable, not just fuzzy. |
| Evidence audit trail | A graph path from indicator to provision to source is stronger than a chat answer. |
| Cross-jurisdiction comparison | Easy demo: SG/MY/AU have different instruments but comparable indicator mappings. |
| Live interview strength | Judges can ask "why this row?" and we can show a graph path plus exact quote. |

If another team shows a CSV and we show a graph-backed proof trail, we look like the infrastructure the UN could actually scale.

## 3. The Non-Negotiable Guardrail

Do **not** build an LLM-fabricated knowledge graph.

Every graph edge must come from one of these sources:

1. Deterministic parsing of legal structure.
2. Explicit textual cross-reference.
3. Official amendment/repeal/currentness metadata.
4. Legal-approved rubric mapping.
5. LLM-proposed relationship that is accepted only after span verification.

This distinction matters. A graph built from unsourced LLM facts is a liability. A graph built from official source spans is a championship differentiator.

## 4. Target Architecture

```text
Official sources
  -> crawler / manual source pack
  -> HTML/PDF/OCR extraction
  -> legal structure parser
  -> RuleUnit store
  -> Neo4j legal evidence graph

Indicator query
  -> sparse + dense retrieval
  -> Neo4j graph expansion
  -> rerank candidates
  -> predicate extraction
  -> RDTII mapping
  -> verifier gates
  -> template-exact CSV + JSON + audit trail
```

Neo4j is not replacing retrieval. It upgrades retrieval.

The sequence for a candidate is:

1. Hybrid search finds likely provisions.
2. Neo4j expands around those provisions: definitions, exceptions, schedules, amendments, supersession, related known rows.
3. The agent chooses the strongest evidence path.
4. The verifier checks the exact quote, source URL, article/paragraph, currentness, and mapping.
5. Only verified rows export.

## 5. Legal Graph Schema

### Nodes

| Node | Purpose |
|---|---|
| `Economy` | SG, MY, AU, optional extras. |
| `Authority` | Official source authority, e.g. AGC, legislation.gov.au. |
| `Instrument` | Act, regulation, notice, gazette, code, circular. |
| `InstrumentVersion` | Version with effective date, last amended, source URL, archive URL. |
| `Section` | Article, section, part, schedule, regulation number. |
| `Provision` | Smallest quotable legal unit used for mapping. |
| `Definition` | Defined legal terms and their source provision. |
| `Indicator` | RDTII indicator such as `P6-I1`, `P7-I3`. |
| `KnownProvision` | Assignment-1 / sample DB / Legal-known baseline row. |
| `CandidateFinding` | Engine-proposed mapping before final verification. |
| `VerifiedFinding` | Exportable row after gates pass. |
| `SourceSpan` | Exact text span, page/anchor, bbox if OCR. |

### Edges

| Edge | Meaning |
|---|---|
| `HAS_INSTRUMENT` | Economy or authority owns instrument. |
| `HAS_VERSION` | Instrument has version. |
| `HAS_SECTION` | Version has section. |
| `HAS_PROVISION` | Section has provision. |
| `DEFINES` | Provision defines a term. |
| `USES_DEFINITION` | Provision depends on a definition. |
| `CROSS_REFERENCES` | Provision references another section/schedule/instrument. |
| `QUALIFIES` | Provision narrows another rule. |
| `EXCEPTION_TO` | Provision creates an exception to another rule. |
| `AMENDS` | Instrument/version amends another instrument/version. |
| `REPEALS` | Instrument/version repeals another. |
| `SUPERSEDES` | Later rule replaces earlier rule. |
| `COMMENCES_ON` | Effective date signal. |
| `MAPS_TO` | Provision maps to an RDTII indicator. |
| `EVIDENCED_BY` | Finding is backed by exact source span. |
| `KNOWN_AS` | Provision matches a known baseline row. |
| `NEW_RELATIVE_TO` | Candidate is new relative to baseline. |

## 6. Agentic RAG Tooling

Borrow the **Pydantic AI tool pattern** from Cole Medin's project, but replace the domain completely.

The ClauseChain agent should expose tools like:

| Tool | Job |
|---|---|
| `hybrid_search_rule_units(query, economy, pillar)` | Finds candidate provisions by keyword + embedding. |
| `expand_legal_context(provision_id)` | Pulls definitions, exceptions, schedules, cross-references. |
| `trace_currentness(instrument_id)` | Finds amendments, repeal, supersession, effective date. |
| `compare_known_provisions(candidate)` | Determines KNOWN vs NEW against Legal/sample baseline. |
| `verify_quote_span(candidate)` | Confirms snippet appears exactly at source location. |
| `map_to_rdtii(candidate, indicator)` | Produces constrained mapping rationale. |
| `find_counter_evidence(candidate)` | Looks for exceptions or contradicting provisions. |

The agent output must be a Pydantic object:

```python
class CandidateFinding(BaseModel):
    economy: str
    law_name: str
    law_number_ref: str | None
    last_amended: str | None
    indicator_id: str
    article_section: str
    discovery_tag: Literal["NEW", "KNOWN", "UNCLEAR"]
    location_reference: str
    verbatim_snippet: str
    mapping_rationale: str
    source_url: str
    confidence: float
    graph_path: list[str]
    verifier_risks: list[str] = []
```

Then the deterministic verifier turns it into an export row or rejects it.

## 7. What To Reuse From Cole's Agentic RAG Project

Reuse the ideas and selected patterns:

- Pydantic models for requests, results, tools, and agent dependencies.
- Pydantic AI `Agent` with registered tools.
- OpenAI-compatible provider abstraction.
- Hybrid vector + keyword retrieval pattern.
- Tool-call trace for demo and audit.
- FastAPI streaming pattern if we build the UI/API after the CLI is strong.

Do not directly reuse:

- Generic markdown chunking.
- Big-Tech entity extraction.
- The raw SQL schema without changes.
- Graphiti as the first graph layer.
- Chat-first API as the judged artifact.

## 8. Graphiti vs Direct Neo4j

Cole's project uses Graphiti, which is strong for temporal knowledge graphs. For ClauseChain, the first graph implementation should be **direct Neo4j with explicit legal schema**.

Reason:

- Legal graph edges need high precision.
- We know the node and relationship types upfront.
- The judged output requires exact citations, not broad graph memories.
- Graphiti can be an optional exploration layer later, but it should not own the canonical graph.

Recommended approach:

1. Build canonical graph with Neo4j driver and Cypher.
2. Load graph only from verified `RuleUnit`, source metadata, and explicit references.
3. Add an optional Graphiti/agent memory experiment after the canonical graph is working.

## 9. Championship Build Order

### Step 1 - Skeleton with Graph Contract

Ship these first:

- `run.py --country SG --pillar 6`
- Pydantic schemas
- template-exact CSV writer
- stub orchestrator
- Neo4j schema/migration
- one fake graph path from indicator to source span

### Step 2 - SG P6 Real Graph Slice

Make Singapore P6 the first real proof:

- Crawl official SG law source.
- Parse sections into `RuleUnit`.
- Insert instruments, versions, sections, provisions, source spans into Neo4j.
- Retrieve P6 candidates.
- Expand graph context.
- Export verified CSV rows.

### Step 3 - MY OCR + Graph Differentiator

Malaysia is where we can look elite:

- OCR scanned gazettes.
- Store bbox/page spans.
- Create graph nodes from OCR-derived provisions.
- Show exact quote tracing from graph node to page coordinate.

This is the best screen-recording story.

### Step 4 - AU as Fast Breadth

Australia is cleaner HTML. Use it to prove the architecture scales:

- Fast connector reuse.
- More stable source extraction.
- Cross-jurisdiction comparison view.

### Step 5 - NEW Discovery

The graph should power NEW discovery:

```text
Candidate provision
  -> normalized instrument + section + legal predicate
  -> compare to KnownProvision nodes
  -> exact match = KNOWN
  -> related but not same = REVIEW
  -> no matching known node + verified source = NEW
```

## 10. Winning Demo Script

The demo should not be "we asked a chatbot."

The demo should be:

1. Run `python run.py --country MY --pillar 7`.
2. Show a scanned legal source going through OCR.
3. Show provision nodes and source spans created in Neo4j.
4. Ask why a row maps to `P7-I3` or `P7-I5`.
5. Show graph expansion: provision -> definition -> exception/schedule -> current version -> indicator.
6. Show exact verbatim quote and official URL.
7. Export the official CSV row.
8. Show a NEW finding and why it is not in the known baseline.

That is a top-5 demo. Plain RAG teams will not have that story.

## 11. Failure Mode Control

Aggressive does not mean reckless. Champions do not let one dependency kill the submission.

Required safeguards:

- The graph *data model* is part of the primary pipeline; the **storage backend is swappable** (SQLite default for the judged path, Neo4j optional — §12).
- A cached graph snapshot ships with the demo.
- The export writer works from verified findings even if the UI/API is down.
- Every graph edge has provenance.
- Every LLM-created candidate must pass source-span verification.
- No AI-only Zone 3 score exports without Legal approval.
- The judged CSV never contains a row that cannot be traced back to an official source span.

## 12. Decision

ClauseChain should pursue the **Neo4j Agentic GraphRAG track**.

The conservative path can produce a working CSV. The championship path produces a legal reasoning and evidence engine. Given the July 20, 2026 cut to the top teams, the second path is the correct one.

**Final refinement (11 June — this governs):** pursue the GraphRAG **data model** behind a swappable **`GraphStore` interface**, not a hard Neo4j dependency.

- **Default judged path = SQLite-backed graph store** (same node/edge schema as §5, zero extra service). Rationale: the README quick-start contract is clone → venv → pip → `.env` → one command, and judges run it on a fresh machine — a required Neo4j install/container adds friction exactly where the rubric pays for frictionlessness.
- **Neo4j ships as an optional driver** behind the same interface (`GRAPH_BACKEND=neo4j` in config), powering the live-demo graph view, Cypher answers in the interview, and the §10 demo script. The cached-graph-snapshot safeguard (§11) still applies.
- The backend swap itself becomes a **scored modularity proof** — same trick as the LLM/OCR swap, demonstrated live.
- Everything else in this document stands: the schema (§5), the guardrail (§3), the agent tooling (§6), the build order (§9), the demo script (§10).

The win condition is:

> A judge can click any output row and see the exact official source, the provision, the graph path, the currentness proof, the RDTII mapping rationale, the NEW/KNOWN comparison, and the verifier gates that allowed export.

