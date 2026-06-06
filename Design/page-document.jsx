// ===========================================================
// Page 3 — Document Workspace (the audit view)
// ===========================================================
/* global React, DOC_DETAIL_BDDSA, VerificationChain, VerbatimBlock,
   ConfidenceBar, StatusChip, HashBadge, IconGlyph, RDTII_PILLARS */

const { useState, useMemo } = React;

window.DocumentWorkspacePage = function DocumentWorkspacePage({ onNavigate, onOpenCitationDetail, onOpenConflict, onOpenEdit, onOpenReject }) {
  const doc = DOC_DETAIL_BDDSA;
  const [activeId, setActiveId] = useState(doc.classification.clauseId);

  // Find clause meta in outline
  const flatClauses = useMemo(() => {
    const out = [];
    doc.outline.forEach(part => {
      part.children.forEach(c => out.push({ ...c, partTitle: part.title, partNumber: part.number }));
    });
    return out;
  }, [doc.outline]);

  const activeClause = flatClauses.find(c => c.id === activeId) || flatClauses[0];
  const isRejected = activeClause.status === "rejected";
  const isPending  = activeClause.status === "pending";
  const cls = doc.classification;
  const rej = doc.rejected;
  const showingHero = activeId === cls.clauseId;
  const showingRejected = activeId === rej.clauseId;

  // Document outline filter
  const [outlineSearch, setOutlineSearch] = useState("");
  const filteredOutline = useMemo(() => {
    if (!outlineSearch.trim()) return doc.outline;
    const q = outlineSearch.toLowerCase();
    return doc.outline.map(p => ({
      ...p,
      children: p.children.filter(c =>
        c.number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.pillar && c.pillar.toLowerCase().includes(q))
      ),
    })).filter(p => p.children.length > 0);
  }, [outlineSearch, doc.outline]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 460px", gap: 16, padding: 16, minHeight: "calc(100vh - 56px)" }} data-screen-label="03 Document Workspace">
      {/* ---------- Outline pane ---------- */}
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <div className="caption" style={{ marginBottom: 6 }}>Document outline</div>
          <input className="input" placeholder="Filter sections…" value={outlineSearch}
                 onChange={(e) => setOutlineSearch(e.target.value)}
                 style={{ height: 32, padding: "6px 10px", fontSize: 13 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
          {filteredOutline.map(part => (
            <div key={part.number} style={{ marginBottom: 12 }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)" }}>
                Part {part.number} · {part.title}
              </div>
              {part.children.map(c => (
                <div key={c.id}
                     className={`outline-node ${activeId === c.id ? "active" : ""}`}
                     onClick={() => setActiveId(c.id)}>
                  <span className="num">§{c.number}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                      {c.conflict && <span title="Conflict" style={{ color: "var(--warning)" }}><IconGlyph name="alert" size={12} /></span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                      {c.pillar && <span className="chip-pillar">P{c.pillar}</span>}
                      <StatusDot status={c.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Source pane ---------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        {/* Doc header */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="grow">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="chip-pillar">{doc.id}</span>
                <span className="chip chip-info"><span className="dot"></span>Primary legislation</span>
                <span className="meta">{doc.language}</span>
              </div>
              <div className="h2">{doc.title}</div>
              <div className="meta" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span>{doc.jurisdiction} · {doc.pages} pages</span>
                <span>·</span>
                <span>Last processed {doc.lastProcessedRel}</span>
                <span>·</span>
                <HashBadge hash={doc.sourceHash} />
                <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="row"
                   onClick={(e) => e.preventDefault()}
                   style={{ color: "var(--ink-600)", textDecoration: "none", gap: 4 }}>
                  <IconGlyph name="external" size={12} />
                  <span className="mono" style={{ fontSize: 12 }}>{doc.sourceUrl}</span>
                </a>
              </div>
            </div>
            <div className="row">
              <button className="btn btn-secondary compact"><IconGlyph name="refresh" size={14} /> Re-process</button>
              <button className="btn btn-secondary compact"><IconGlyph name="download" size={14} /> Export</button>
              <button className="btn btn-primary compact"><IconGlyph name="check" size={14} /> Approve all verified</button>
            </div>
          </div>
        </div>

        {/* Conflict banner when applicable */}
        {activeClause.conflict && (
          <ConflictBanner clauseRef={`§${activeClause.number}`} onOpen={onOpenConflict} />
        )}

        {/* Source paper rendering */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <PaperView activeClause={activeClause} isRejected={isRejected} isPending={isPending}
                     verbatimSpan={showingHero ? cls.verbatimSpan : showingRejected ? rej.verbatimSpan : null} />
        </div>
      </div>

      {/* ---------- Classification pane ---------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0, maxHeight: "calc(100vh - 56px - 32px)", overflowY: "auto" }}>
        {showingHero && <VerifiedClassificationCard cls={cls} onOpenCitationDetail={onOpenCitationDetail} onOpenEdit={onOpenEdit} onOpenReject={onOpenReject} />}
        {showingRejected && <RejectedClassificationCard rej={rej} onOpenEdit={onOpenEdit} />}
        {!showingHero && !showingRejected && (
          <PendingOrUnclassifiedCard clause={activeClause} />
        )}

        <RelatedClausesCard flatClauses={flatClauses} activeId={activeId} onSelect={setActiveId} />
      </div>
    </div>
  );
};

// ---------- helpers ----------

function StatusDot({ status }) {
  const map = { verified: "var(--success)", pending: "var(--warning)", rejected: "var(--danger)", none: "var(--ink-300)" };
  const labels = { verified: "Verified", pending: "Pending", rejected: "Rejected" };
  if (!status) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-500)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: map[status] || "var(--ink-300)" }}></span>
      {labels[status]}
    </span>
  );
}

function ConflictBanner({ clauseRef, onOpen }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--warning-bg)", border: "1px solid #FCD34D", borderRadius: 10 }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--warning)", color: "#fff", display: "grid", placeItems: "center" }}>
        <IconGlyph name="alert" size={16} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>Conflict on {clauseRef}</div>
        <div style={{ fontSize: 13, color: "var(--ink-700)" }}>Two authoritative sources disagree. Resolution required before final classification.</div>
      </div>
      <button className="btn btn-secondary compact" onClick={onOpen}>Resolve conflict <IconGlyph name="arrowR" size={12} /></button>
    </div>
  );
}

function PaperView({ activeClause, verbatimSpan, isRejected }) {
  // Render a representative document page with the active clause highlighted
  return (
    <div className="paper">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "#71717A", textTransform: "uppercase" }}>
          The People's Republic of Bangladesh
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>The Digital Security Act, 2018</div>
        <div style={{ fontSize: 13, color: "#71717A", marginTop: 4 }}>Act No. 46 of 2018 · Published in Bangladesh Gazette · 8 October 2018</div>
      </div>

      <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, color: "#3F3F46" }}>
          Chapter V — Crimes and Punishments
        </div>

        <PaperClause num="24" title="Identity fraud"
          active={activeClause.number === "24"}
          status={activeClause.status}
          body={'(1) If a person, with the intention of committing a fraudulent act, dishonestly uses any identity information of another person, he shall be punished with imprisonment for a term not exceeding five (5) years.'} />

        <PaperClause num="25" title="Publishing offensive information"
          active={activeClause.number === "25"}
          status={activeClause.status}
          body={'(1) Whoever knowingly publishes, transmits or causes to be published or transmitted on a website any information which is offensive…'} />

        <PaperClause num="26" title="Punishment for publishing identity-related information"
          active={activeClause.number === "26"}
          status={activeClause.status}
          highlight={activeClause.number === "26" ? verbatimSpan : null}
          isRejected={isRejected}
          body={[
            "(1) Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.",
            "(2) Storage of such data within the territory of Bangladesh shall be subject to the regulations issued by the Digital Security Agency from time to time.",
            "(3) The provisions of this section shall apply notwithstanding anything contrary contained in any other law for the time being in force, save with the express written consent of the data subject for a specified purpose."
          ]} />

        <PaperClause num="27" title="Cyber-terrorism"
          active={activeClause.number === "27"}
          status={activeClause.status}
          body={'(1) If a person, with an intention to threaten national integrity, security or sovereignty, commits or attempts to commit a cyber-related offence…'} />

        <PaperClause num="28" title="Hurting religious values"
          active={activeClause.number === "28"}
          status={activeClause.status}
          highlight={activeClause.number === "28" ? verbatimSpan : null}
          isRejected={activeClause.number === "28"}
          body={'(1) Whoever publishes or broadcasts any propaganda or campaign against any religion through any website or any electronic form which hurts the religious value or sentiment, shall be punished with imprisonment for a term not exceeding ten (10) years…'} />
      </div>

      <div className="page-num">Page 14 of 42</div>
    </div>
  );
}

function PaperClause({ num, title, body, active, status, highlight, isRejected }) {
  const bodyArr = Array.isArray(body) ? body : [body];
  const renderBody = (text, key) => {
    if (highlight && text.includes(highlight)) {
      const i = text.indexOf(highlight);
      const before = text.slice(0, i);
      const after = text.slice(i + highlight.length);
      return (
        <span key={key}>
          {before}
          <span className={`clause-highlight ${isRejected ? "rejected" : ""}`} ref={(el) => { if (el && active) setTimeout(() => el.scrollIntoView ? null : null, 0); }}>{highlight}</span>
          {after}
        </span>
      );
    }
    return <span key={key}>{text}</span>;
  };
  return (
    <div className={`clause ${active ? "active" : ""}`} style={active ? { background: "rgba(15, 181, 167, 0.04)", padding: "6px 10px", borderRadius: 4, marginLeft: -10, marginRight: -10 } : null}>
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14.5 }}><span className="section-num">{num}.</span>{title}</div>
      {bodyArr.map((b, i) => (
        <p key={i} style={{ margin: "8px 0", textAlign: "justify" }}>{renderBody(b, i)}</p>
      ))}
    </div>
  );
}

// ---------- Verified classification card ----------
function VerifiedClassificationCard({ cls, onOpenCitationDetail, onOpenEdit, onOpenReject }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--ink-100)" }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="chip chip-verified"><IconGlyph name="shieldCheck" size={12} /> Verified</span>
          <span className="chip-pillar">§{cls.sectionNumber}</span>
          <div className="spacer"></div>
          <HashBadge hash={cls.hash} />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink-950)", marginTop: 4 }}>
          {cls.pillarLabel}
        </div>
        <div className="meta" style={{ marginTop: 6 }}>{cls.title}</div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Confidence */}
        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Classification confidence</div>
          <ConfidenceBar value={cls.confidence} />
        </div>

        {/* Verification chain — the visual anchor */}
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="caption">CVR verification chain</div>
            <div className="spacer"></div>
            <span className="small" style={{ color: "var(--success)" }}>
              <IconGlyph name="check" size={12} /> All gates passed
            </span>
          </div>
          <VerificationChain gates={cls.gates} />
        </div>

        {/* Verbatim quote */}
        <VerbatimBlock text={cls.verbatimSpan} />

        {/* Principal rule */}
        <div>
          <div className="caption" style={{ marginBottom: 6 }}>Principal rule</div>
          <div className="body" style={{ color: "var(--ink-900)" }}>{cls.principalRule}</div>
        </div>

        {/* Exceptions */}
        {cls.exceptions?.length > 0 && (
          <div>
            <div className="caption" style={{ marginBottom: 6 }}>Exceptions</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-700)", fontSize: 14 }}>
              {cls.exceptions.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}
            </ul>
          </div>
        )}

        {/* Conditions */}
        {cls.conditions?.length > 0 && (
          <div>
            <div className="caption" style={{ marginBottom: 6 }}>Conditions</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-700)", fontSize: 14 }}>
              {cls.conditions.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}
            </ul>
          </div>
        )}

        {/* Provenance ribbon */}
        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="caption">Source provenance</div>
            <div className="spacer"></div>
            <button className="btn-tertiary btn compact" onClick={onOpenCitationDetail}
                    style={{ height: 24, padding: "0 8px", fontSize: 12 }}>
              View full chain <IconGlyph name="arrowR" size={11} />
            </button>
          </div>
          <ProvenanceRibbon provenance={cls.provenance} />
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 16px", background: "var(--ink-50)", borderTop: "1px solid var(--ink-200)", borderRadius: "0 0 14px 14px" }}>
        <button className="btn btn-primary"><IconGlyph name="check" size={14} /> Approve</button>
        <button className="btn btn-secondary" onClick={onOpenEdit}><IconGlyph name="edit" size={14} /> Edit</button>
        <button className="btn btn-destructive" onClick={onOpenReject}><IconGlyph name="x" size={14} /> Reject</button>
      </div>
    </div>
  );
}

// ---------- Rejected classification card ----------
function RejectedClassificationCard({ rej, onOpenEdit }) {
  return (
    <div className="card" style={{ padding: 0, borderColor: "#FECACA" }}>
      <div style={{ padding: "20px 24px 16px", background: "linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)", borderBottom: "1px solid #FECACA", borderRadius: "14px 14px 0 0" }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="chip chip-rejected"><IconGlyph name="x" size={12} /> Rejected by CVR loop</span>
          <span className="chip-pillar">§{rej.sectionNumber}</span>
          <div className="spacer"></div>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink-950)", marginTop: 4 }}>
          Proposed: {rej.proposedPillarLabel}
        </div>
        <div className="meta" style={{ marginTop: 6 }}>{rej.title}</div>

        <div style={{ marginTop: 14, padding: "10px 12px", background: "#fff", border: "1px solid #FECACA", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--danger)", color: "#fff", display: "grid", placeItems: "center" }}>
            <IconGlyph name="shield" size={14} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Caught by {rej.failedGate}</div>
            <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>This output never reached the export pipeline — the system caught its own mistake.</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Verification chain showing failure */}
        <div>
          <div className="caption" style={{ marginBottom: 8 }}>CVR verification chain</div>
          <VerificationChain gates={rej.gates} />
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 6 }}>What the model proposed</div>
          <VerbatimBlock text={rej.verbatimSpan} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, border: "1px solid var(--ink-200)", borderRadius: 8, background: "var(--ink-50)" }}>
            <div className="caption" style={{ marginBottom: 4 }}>NLI score</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)" }}>0.15 / 0.70</div>
            <div className="small muted" style={{ marginTop: 4 }}>span ⊨ claim entailment</div>
          </div>
          <div style={{ padding: 12, border: "1px solid var(--ink-200)", borderRadius: 8, background: "var(--ink-50)" }}>
            <div className="caption" style={{ marginBottom: 4 }}>Predicates found</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)" }}>0 / 2</div>
            <div className="small muted" style={{ marginTop: 4 }}>for Pillar 12.1</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px 16px", background: "var(--ink-50)", borderTop: "1px solid var(--ink-200)", borderRadius: "0 0 14px 14px" }}>
        <button className="btn btn-secondary"><IconGlyph name="refresh" size={14} /> Send back for re-classification</button>
        <button className="btn btn-secondary" onClick={onOpenEdit}>Mark as truly N/A</button>
      </div>
    </div>
  );
}

function PendingOrUnclassifiedCard({ clause }) {
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 10 }}>
        <StatusChip status={clause.status} />
        <span className="chip-pillar">§{clause.number}</span>
        {clause.pillar && <span className="chip-pillar">P{clause.pillar}</span>}
      </div>
      <div className="h3">{clause.title}</div>
      <div className="meta" style={{ marginTop: 6 }}>
        {clause.status === "pending"
          ? "This clause is in the human review queue. The CVR loop flagged it for confirmation before publication."
          : "No classification has been produced for this clause yet. Run the classifier to attempt mapping."}
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn-primary compact">Open in review queue</button>
        <button className="btn btn-secondary compact">Run classifier</button>
      </div>
    </div>
  );
}

function ProvenanceRibbon({ provenance }) {
  const rows = [
    ["Section", provenance.section],
    ["Page", String(provenance.page)],
    ["Char offset", provenance.charOffset],
    ["Bounding box", provenance.bbox],
    ["Retrieved at", provenance.retrievedAt],
    ["SHA-256", provenance.sha256.slice(0, 16) + "…"],
  ];
  return (
    <div className="provenance">
      {rows.map(([k, v]) => (
        <div key={k} className="row-item">
          <dt style={{ minWidth: 84 }}>{k}</dt>
          <dd style={{ fontSize: 11.5 }}>{v}</dd>
        </div>
      ))}
    </div>
  );
}

function RelatedClausesCard({ flatClauses, activeId, onSelect }) {
  const others = flatClauses.filter(c => c.id !== activeId && c.status !== "none").slice(0, 5);
  return (
    <div className="card">
      <div className="caption" style={{ marginBottom: 10 }}>Related clauses · same instrument</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {others.map(c => (
          <div key={c.id} onClick={() => onSelect(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", transition: "var(--t-default)" }}
               onMouseEnter={(e) => e.currentTarget.style.background = "var(--ink-50)"}
               onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-500)", minWidth: 36 }}>§{c.number}</span>
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink-900)" }}>{c.title}</span>
            {c.pillar && <span className="chip-pillar">P{c.pillar}</span>}
            <StatusDot status={c.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
