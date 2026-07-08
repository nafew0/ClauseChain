// ===========================================================
// Page 10 — Source Trace View (Turnitin-style)
// ===========================================================
/* global React, TRACE_HIGHLIGHTS, IconGlyph, HashBadge, VerificationChain */

const { useState: useTraceState, useRef: useTraceRef, useEffect: useTraceEffect } = React;

// Full extracted text for BD-DSA-2018 with span locations baked in
// Each segment: { text, highlightId? }
const EXTRACTED_SEGMENTS = [
  { text: "DIGITAL SECURITY ACT, 2018\n\nGovernment of Bangladesh · Act No. 46 of 2018\n\n" },
  { text: "Part I \u2014 Preliminary\n\n\u00a72 \u2014 Definitions\n\nIn this Act, unless the context otherwise requires: 'personal data' means any information relating to an identified or identifiable natural person; 'digital security' means protective measures for digital infrastructure.\n\n" },
  { text: "§3(1) — Agency mandate\n\n", highlightId: "th-006" },
  { text: "The Digital Security Agency shall be responsible for the protection of critical digital infrastructure and national security against digital threats and cyberattacks.", highlightId: "th-006" },
  { text: "\n\nPart II — Personal Data Obligations\n\n§12(3) — Lawful basis\n\n", highlightId: "th-002" },
  { text: "No person shall process personal data without the explicit consent of the data subject, except as provided under sections 14, 15 and 18 of this Act.", highlightId: "th-002" },
  { text: "\n\n§14(1) — Purpose limitation\n\n", highlightId: "th-003" },
  { text: "Data collected for a specific purpose shall not be used for any other purpose without the express consent of the data subject, unless required by law.", highlightId: "th-003" },
  { text: "\n\n§21(1) — Data subject rights\n\n", highlightId: "th-004" },
  { text: "A data subject shall have the right to obtain confirmation of whether personal data concerning them is being processed, and where that is the case, access to that data.", highlightId: "th-004" },
  { text: "\n\nPart V — Crimes and Punishments\n\n§26(1) — Data localization\n\n", highlightId: "th-001" },
  { text: "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.", highlightId: "th-001" },
  { text: "\n\n§29(1) — Conditional transfer\n\n", highlightId: "th-008" },
  { text: "Cross-border transfer of personal data may be permitted subject to the prior approval of the competent authority and the existence of adequate safeguards.", highlightId: "th-008" },
  { text: "\n\n§33(2) — Hacking offences\n\n", highlightId: "th-007" },
  { text: "Any person who commits hacking or any illegal access to a computer system with intent to commit another offence under this Act shall be punished accordingly.", highlightId: "th-007" },
  { text: "\n\n§35(1) — Breach notification\n\n", highlightId: "th-005" },
  { text: "The controller shall notify the supervisory authority of a personal data breach without undue delay and, where feasible, not later than seventy-two hours after having become aware of it.", highlightId: "th-005" },
  { text: "\n\n[End of mapped clauses — remaining sections pending classification]\n" },
];

// Source document segments (paper simulation)
const SOURCE_SEGMENTS = [
  { text: "DIGITAL SECURITY ACT, 2018", style: "heading" },
  { text: "Government of the People's Republic of Bangladesh", style: "sub" },
  { text: "\nPart I — Preliminary\n", style: "part" },
  { text: "Section 2. Definitions. — In this Act, unless the context otherwise requires, the following expressions shall have the meanings hereinafter assigned to them…\n\n" },
  { text: "Section 3.", style: "secnum" }, { text: " (1) ", style: "secnum" },
  { text: "The Digital Security Agency shall be responsible for the protection of critical digital infrastructure and national security against digital threats and cyberattacks.", highlightId: "th-006" },
  { text: "\n\nPart II — Personal Data Obligations\n", style: "part" },
  { text: "Section 12.", style: "secnum" }, { text: " (3) " },
  { text: "No person shall process personal data without the explicit consent of the data subject, except as provided under sections 14, 15 and 18 of this Act.", highlightId: "th-002" },
  { text: "\nSection 14.", style: "secnum" }, { text: " (1) " },
  { text: "Data collected for a specific purpose shall not be used for any other purpose without the express consent of the data subject, unless required by law.", highlightId: "th-003" },
  { text: "\nSection 21.", style: "secnum" }, { text: " (1) " },
  { text: "A data subject shall have the right to obtain confirmation of whether personal data concerning them is being processed, and where that is the case, access to that data.", highlightId: "th-004" },
  { text: "\n\nPart V — Crimes and Punishments\n", style: "part" },
  { text: "Section 26.", style: "secnum" }, { text: " (1) " },
  { text: "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.", highlightId: "th-001" },
  { text: "\nSection 29.", style: "secnum" }, { text: " (1) " },
  { text: "Cross-border transfer of personal data may be permitted subject to the prior approval of the competent authority and the existence of adequate safeguards.", highlightId: "th-008" },
  { text: "\nSection 33.", style: "secnum" }, { text: " (2) " },
  { text: "Any person who commits hacking or any illegal access to a computer system with intent to commit another offence under this Act shall be punished accordingly.", highlightId: "th-007" },
  { text: "\nSection 35.", style: "secnum" }, { text: " (1) " },
  { text: "The controller shall notify the supervisory authority of a personal data breach without undue delay and, where feasible, not later than seventy-two hours after having become aware of it.", highlightId: "th-005" },
];

const STATUS_PATTERNS = {
  verified:    { style: "solid",   opacity: 1 },
  pending:     { style: "hatched", opacity: 0.7 },
  fuzzy:       { style: "fuzzy",   opacity: 0.85 },
};

window.SourceTracePage = function SourceTracePage({ docId, onNavigate }) {
  const [activeSpan, setActiveSpan] = useTraceState(null);
  const [activeFilter, setActiveFilter] = useTraceState(null);  // pillar id or null
  const [showPopover, setShowPopover] = useTraceState(null);    // highlight id
  const [confThreshold, setConfThreshold] = useTraceState(0);
  const leftRef = useTraceRef(null);
  const rightRef = useTraceRef(null);

  // Sync scroll: when active span changes, scroll both panels to that span
  useTraceEffect(() => {
    if (!activeSpan) return;
    const scrollToSpan = (ref, spanId) => {
      if (!ref.current) return;
      const el = ref.current.querySelector(`[data-span="${spanId}"]`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    scrollToSpan(leftRef,  activeSpan);
    scrollToSpan(rightRef, activeSpan);
  }, [activeSpan]);

  const filtered = TRACE_HIGHLIGHTS.filter(h => {
    if (activeFilter && h.pillar !== activeFilter) return false;
    if (h.confidence < confThreshold) return false;
    return true;
  });

  const isVisible = (id) => filtered.some(h => h.id === id);
  const getHighlight = (id) => TRACE_HIGHLIGHTS.find(h => h.id === id);

  const handleSpanClick = (id, e) => {
    e.stopPropagation();
    if (activeSpan === id) {
      setActiveSpan(null);
      setShowPopover(null);
    } else {
      setActiveSpan(id);
      setShowPopover(id);
    }
  };

  const coverage = {
    total: TRACE_HIGHLIGHTS.length,
    verified: TRACE_HIGHLIGHTS.filter(h => h.status === "verified").length,
    pending:  TRACE_HIGHLIGHTS.filter(h => h.status === "pending").length,
    fuzzy:    TRACE_HIGHLIGHTS.filter(h => h.matchType === "fuzzy").length,
  };

  return (
    <div className="page" data-screen-label="10 Source Trace" style={{ paddingBottom: 40 }} onClick={() => { setShowPopover(null); setActiveSpan(null); }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <button className="btn btn-icon" onClick={() => onNavigate({ page: "doc", country: "BD", doc: "BD-DSA-2018" })}>
              <IconGlyph name="chevL" size={16} />
            </button>
            <h1 className="h1" style={{ fontSize: 26 }}>Source Trace</h1>
          </div>
          <div className="subtitle">
            Digital Security Act 2018 ·{" "}
            <span className="mono" style={{ fontSize: 12 }}>BD-DSA-2018</span>
            {" "}· {coverage.verified} verified · {coverage.pending} pending · {coverage.fuzzy} fuzzy-matched
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary compact" onClick={() => window.showToast?.("Trace report exported")}>
            <IconGlyph name="download" size={13} /> Export trace
          </button>
          <button className="btn btn-secondary compact" onClick={() => onNavigate({ page: "doc", country: "BD", doc: "BD-DSA-2018" })}>
            Open in audit view <IconGlyph name="arrowR" size={13} />
          </button>
        </div>
      </div>

      {/* Coverage summary bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-md)", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-700)" }}>
          {coverage.total} clauses mapped across {new Set(TRACE_HIGHLIGHTS.map(h => h.pillar)).size} indicators
        </div>
        <div style={{ flex: 1, height: 6, background: "var(--ink-200)", borderRadius: "var(--r-full)", overflow: "hidden", margin: "0 8px" }}>
          <div style={{ display: "flex", height: "100%", gap: 0 }}>
            <div style={{ width: `${(coverage.verified / coverage.total) * 100}%`, background: "var(--success)", transition: "width 400ms ease" }}></div>
            <div style={{ width: `${(coverage.pending  / coverage.total) * 100}%`, background: "var(--warning)", transition: "width 400ms ease" }}></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
          {[{ c: "var(--success)", l: "Verified" }, { c: "var(--warning)", l: "Pending" }, { c: "var(--ink-400)", l: "Fuzzy" }].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ink-600)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }}></span>{x.l}
            </span>
          ))}
        </div>
      </div>

      {/* Legend / filter bar */}
      <div className="legend-bar" style={{ marginBottom: 12 }}>
        <span className="caption" style={{ marginRight: 4 }}>Filter by indicator:</span>
        <button className={`legend-item ${!activeFilter ? "active" : ""}`}
                style={{ background: "var(--ink-100)", color: "var(--ink-700)", borderColor: !activeFilter ? "var(--ink-500)" : "transparent" }}
                onClick={() => setActiveFilter(null)}>
          All <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: 4 }}>{TRACE_HIGHLIGHTS.length}</span>
        </button>
        {TRACE_HIGHLIGHTS.map(h => (
          <button key={h.id} className={`legend-item ${activeFilter === h.pillar ? "active" : ""}`}
                  style={{ background: h.color + "20", color: h.color, borderColor: activeFilter === h.pillar ? h.color : "transparent" }}
                  onClick={() => setActiveFilter(activeFilter === h.pillar ? null : h.pillar)}>
            <span className="legend-dot" style={{ background: h.color }}></span>
            {h.pillar} · {h.textLabel}
          </button>
        ))}
      </div>

      {/* Status legend */}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--ink-500)", marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 20, height: 10, background: "rgba(15,181,167,0.25)", border: "1.5px solid #0FB5A7", borderRadius: 2, display: "inline-block" }}></span>Solid fill = verified</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 20, height: 10, background: "repeating-linear-gradient(45deg,rgba(245,158,11,0.2) 0,rgba(245,158,11,0.2) 3px,transparent 3px,transparent 6px)", border: "1.5px dashed var(--warning)", borderRadius: 2, display: "inline-block" }}></span>Hatched = pending</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 20, height: 10, background: "repeating-linear-gradient(135deg,rgba(107,114,128,0.2) 0,rgba(107,114,128,0.2) 3px,transparent 3px,transparent 6px)", border: "1.5px dashed var(--ink-400)", borderRadius: 2, display: "inline-block" }}></span>Striped = fuzzy OCR match</span>
      </div>

      {/* Dual panels */}
      <div className="trace-layout" onClick={e => e.stopPropagation()}>

        {/* Left: extracted text */}
        <div className="trace-panel" ref={leftRef}>
          <div className="trace-panel-header">
            <IconGlyph name="fileText" size={13} />
            Extracted text (Crawl4AI + Docling)
          </div>
          <div className="trace-text-body">
            {EXTRACTED_SEGMENTS.map((seg, i) => {
              if (!seg.highlightId) {
                return <span key={i} style={{ color: seg.text.startsWith("\n") ? "var(--ink-500)" : "inherit" }}>{seg.text}</span>;
              }
              const h = getHighlight(seg.highlightId);
              if (!h) return <span key={i}>{seg.text}</span>;
              const visible2 = isVisible(seg.highlightId);
              if (!visible2) return <span key={i} style={{ color: "var(--ink-500)", opacity: 0.5 }}>{seg.text}</span>;

              const isFuzzy    = h.matchType === "fuzzy";
              const isPending  = h.status === "pending";
              const bg = isPending
                ? "repeating-linear-gradient(45deg," + h.color + "20 0," + h.color + "20 3px,transparent 3px,transparent 6px)"
                : h.color + "25";

              return (
                <span key={i} className={`trace-span ${activeSpan === seg.highlightId ? "active" : ""}`}
                      data-span={seg.highlightId}
                      style={{ background: bg, borderBottom: `2px solid ${h.color}`, color: "inherit", position: "relative" }}
                      onClick={(e) => handleSpanClick(seg.highlightId, e)}>
                  {seg.text}
                  {showPopover === seg.highlightId && (
                    <SpanPopover highlight={h} onNavigate={() => {}} onClose={() => { setShowPopover(null); setActiveSpan(null); }} />
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="trace-panel-divider" />

        {/* Right: source document */}
        <div className="trace-panel" ref={rightRef}>
          <div className="trace-panel-header">
            <IconGlyph name="document" size={13} />
            Source document (official text)
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "var(--ink-400)" }}>
              bdlaws.minlaw.gov.bd
            </span>
          </div>
          <div className="trace-source-body">
            {SOURCE_SEGMENTS.map((seg, i) => {
              if (seg.style === "heading") return <h2 key={i} style={{ textAlign: "center", fontSize: 16, margin: "0 0 4px" }}>{seg.text}</h2>;
              if (seg.style === "sub")     return <p key={i} style={{ textAlign: "center", fontSize: 13, color: "#666", margin: "0 0 20px" }}>{seg.text}</p>;
              if (seg.style === "part")    return <div key={i} style={{ fontWeight: 700, fontSize: 14, margin: "16px 0 8px" }}>{seg.text}</div>;
              if (seg.style === "secnum")  return <strong key={i}>{seg.text}</strong>;
              if (!seg.highlightId)        return <span key={i}>{seg.text}</span>;

              const h = getHighlight(seg.highlightId);
              if (!h) return <span key={i}>{seg.text}</span>;
              const visible2 = isVisible(seg.highlightId);
              if (!visible2) return <span key={i} style={{ opacity: 0.4 }}>{seg.text}</span>;

              const isFuzzy   = h.matchType === "fuzzy";
              const isPending = h.status === "pending";
              const bg = isPending
                ? "repeating-linear-gradient(45deg," + h.color + "20 0," + h.color + "20 3px,transparent 3px,transparent 6px)"
                : h.color + "28";

              return (
                <span key={i}
                      data-span={seg.highlightId}
                      className={`trace-bbox ${isFuzzy ? "trace-bbox fuzzy" : ""} ${activeSpan === seg.highlightId ? "active" : ""}`}
                      style={{ background: bg, borderBottom: `2px solid ${h.color}`, color: "inherit" }}
                      onClick={(e) => { e.stopPropagation(); setActiveSpan(activeSpan === seg.highlightId ? null : seg.highlightId); setShowPopover(null); }}>
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active span detail bar */}
      {activeSpan && (() => {
        const h = getHighlight(activeSpan);
        if (!h) return null;
        return (
          <div style={{ marginTop: 14, padding: "14px 20px", background: "var(--white)", border: `1px solid ${h.color}60`, borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: h.color, flexShrink: 0 }}></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>
                {h.pillar} — {h.textLabel} · <span className="mono" style={{ fontSize: 12 }}>{h.ref}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>
                Page {h.page} · confidence <span className="mono" style={{ fontWeight: 700, color: h.confidence > 0.8 ? "var(--success)" : "var(--warning)" }}>{h.confidence}</span>
                {" "}· match: <span className="mono">{h.matchType}</span>
                {h.matchType === "fuzzy" && <span style={{ color: "var(--warning)", marginLeft: 4 }}>⚠ OCR approximate — bbox may sit slightly off source</span>}
              </div>
            </div>
            <div className="spacer"></div>
            <span className={`chip ${h.status === "verified" ? "chip-verified" : h.status === "pending" ? "chip-pending" : "chip-pending-meta"}`}>
              <span className="dot"></span>{h.status}
            </span>
            <button className="btn btn-secondary compact" onClick={() => onNavigate({ page: "doc", country: "BD", doc: "BD-DSA-2018" })}>
              Open audit card <IconGlyph name="arrowR" size={13} />
            </button>
            <button className="btn-icon" onClick={() => { setActiveSpan(null); setShowPopover(null); }}>
              <IconGlyph name="x" size={16} />
            </button>
          </div>
        );
      })()}
    </div>
  );
};

// ---- Span popover ----
function SpanPopover({ highlight: h, onClose }) {
  const GATE_NAMES = ["Span Match", "NLI Entailment", "Struct. Plausibility"];
  const GATE_VALS  = h.confidence > 0.9 ? ["exact", "0.94", "pass"]
                   : h.confidence > 0.7 ? ["exact", (h.confidence).toFixed(2), "pass"]
                   : ["fuzzy·2", (h.confidence).toFixed(2), "pass"];
  return (
    <div className="span-popover" style={{ top: "120%", left: 0, zIndex: 30 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: h.color }}></span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-950)" }}>{h.pillar} — {h.textLabel}</span>
        <button className="btn-icon" style={{ marginLeft: "auto", width: 24, height: 24 }} onClick={onClose}>
          <IconGlyph name="x" size={13} />
        </button>
      </div>

      <div className="verbatim" style={{ fontSize: 11, marginBottom: 10 }}>{h.extractedText.slice(0, 120)}…</div>

      <div style={{ marginBottom: 8 }}>
        {GATE_NAMES.map((name, i) => (
          <div key={i} className="mini-gate">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }}></span>
            <span style={{ flex: 1, color: "var(--ink-700)" }}>Gate {i+1} · {name}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-900)", fontWeight: 600 }}>{GATE_VALS[i]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
        <div>
          <div style={{ color: "var(--ink-500)", marginBottom: 2 }}>Reference</div>
          <div className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{h.ref}</div>
        </div>
        <div>
          <div style={{ color: "var(--ink-500)", marginBottom: 2 }}>Confidence</div>
          <div className="mono" style={{ color: h.confidence > 0.8 ? "var(--success)" : "var(--warning)", fontWeight: 700 }}>{h.confidence}</div>
        </div>
        <div>
          <div style={{ color: "var(--ink-500)", marginBottom: 2 }}>Page</div>
          <div className="mono" style={{ color: "var(--ink-900)" }}>{h.page}</div>
        </div>
        <div>
          <div style={{ color: "var(--ink-500)", marginBottom: 2 }}>Match type</div>
          <div className="mono" style={{ color: "var(--ink-900)" }}>{h.matchType}</div>
        </div>
      </div>
    </div>
  );
}
