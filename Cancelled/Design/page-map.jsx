// ===========================================================
// Page 9 — Mapping Run (Classification in Progress)
// ===========================================================
/* global React, MAPPING_STREAM, PipelineStepper, IconGlyph */

const { useState: useMapState, useEffect: useMapEffect } = React;

window.MappingRunPage = function MappingRunPage({ onNavigate }) {
  const [streamIdx, setStreamIdx] = useMapState(0);
  const [running, setRunning] = useMapState(false);
  const [paused, setPaused] = useMapState(false);
  const [autonomy, setAutonomy] = useMapState("L1");
  const [selectedRow, setSelectedRow] = useMapState(null);
  const [showRouting, setShowRouting] = useMapState(true);

  const visible = MAPPING_STREAM.slice(0, streamIdx);
  const isDone = streamIdx >= MAPPING_STREAM.length;

  const verified = visible.filter(r => r.status === "verified").length;
  const rejected = visible.filter(r => r.status === "rejected").length;
  const escalated = visible.filter(r => r.escalated).length;
  const g1pass = visible.filter(r => r.gates[0] === "pass" || r.gates[0] === "warn").length;
  const g2pass = visible.filter(r => r.gates[1] === "pass" || r.gates[1] === "warn").length;
  const g3pass = visible.filter(r => r.gates[2] === "pass" || r.gates[2] === "warn").length;

  useMapEffect(() => {
    if (!running || paused || streamIdx >= MAPPING_STREAM.length) return;
    const delay = 1100 + Math.random() * 600;
    const t = setTimeout(() => setStreamIdx(i => i + 1), delay);
    return () => clearTimeout(t);
  }, [running, paused, streamIdx]);

  const gateColor = g => g === "pass" ? "var(--success)" : g === "warn" ? "var(--warning)" : g === "fail" ? "var(--danger)" : "var(--ink-300)";
  const gateDotClass = g => g === "pass" || g === "warn" ? (g === "warn" ? "warn" : "pass") : "fail";

  const LLM_ROUTES = [
    { stage: "Embedding",      model: "BGE-M3",         type: "local",  detail: "Multilingual · 512-dim" },
    { stage: "Classification", model: "llama-3.1-8b",   type: "local",  detail: "Default classifier · Q4_K_M" },
    { stage: "NLI Gate 2",     model: "DeBERTa-v3-NLI", type: "local",  detail: "Entailment · threshold 0.70" },
    { stage: "Low-confidence", model: "gpt-4o",         type: "cloud",  detail: "Escalation only · budget $2.00" },
    { stage: "Struct. check",  model: "rule-engine",    type: "local",  detail: "Predicate matching · no LLM" },
  ];

  const rejections = visible.filter(r => r.status === "rejected");

  return (
    <React.Fragment>
      <PipelineStepper activeId="map" onNavigate={onNavigate} />
      <div className="page" data-screen-label="09 Mapping Run">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="h1">Mapping Run</h1>
            <div className="subtitle" style={{ marginTop: 6 }}>
              BD-DSA-2018 → RDTII Pillars 6 &amp; 7 ·{" "}
              <span className="mono" style={{ fontSize: 12 }}>run-BD-001</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Autonomy selector (compact) */}
            <div style={{ display: "flex", gap: 4, background: "var(--ink-100)", borderRadius: "var(--r-md)", padding: 3 }}>
              {["L0","L1","L2","L3"].map(l => (
                <button key={l} onClick={() => setAutonomy(l)} style={{
                  padding: "4px 10px", borderRadius: "var(--r-sm)", border: "none", fontSize: 12, fontWeight: 600,
                  background: autonomy === l ? "var(--white)" : "transparent",
                  color: autonomy === l ? "var(--ink-900)" : "var(--ink-500)",
                  cursor: "pointer", boxShadow: autonomy === l ? "var(--shadow-sm)" : "none",
                  transition: "var(--t-default)",
                }}>{l}</button>
              ))}
            </div>

            {!running && !isDone && (
              <button className="btn btn-primary" onClick={() => setRunning(true)}>
                <IconGlyph name="play" size={14} /> Start mapping
              </button>
            )}
            {running && !isDone && !paused && (
              <button className="btn btn-secondary" onClick={() => setPaused(true)}>
                <IconGlyph name="pause" size={14} /> Pause
              </button>
            )}
            {running && paused && (
              <button className="btn btn-primary" onClick={() => setPaused(false)}>
                <IconGlyph name="play" size={14} /> Resume
              </button>
            )}
            {isDone && (
              <button className="btn btn-primary"
                      onClick={() => onNavigate({ page: "trace", docId: "BD-DSA-2018" })}>
                View source trace <IconGlyph name="arrowR" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Progress strip */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: "var(--ink-700)" }}>
              {running ? (paused ? "Paused" : isDone ? "Complete" : "Processing clauses…") : "Ready"}
            </span>
            <span className="mono" style={{ fontWeight: 600 }}>{streamIdx} / {MAPPING_STREAM.length}</span>
          </div>
          <div className="progress" style={{ height: 7 }}>
            <div style={{ width: `${(streamIdx / MAPPING_STREAM.length) * 100}%`, background: isDone ? "var(--success)" : "var(--teal-600)", transition: "width 600ms ease" }}></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* ── Live classification stream ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* CVR Tally */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Verified",   val: verified,  color: "var(--success)",  bg: "var(--success-bg)" },
                { label: "Rejected",   val: rejected,  color: "var(--danger)",   bg: "var(--danger-bg)" },
                { label: "Escalated",  val: escalated, color: "var(--info)",     bg: "var(--info-bg)" },
                { label: "Processing", val: streamIdx < MAPPING_STREAM.length ? (running && !paused ? 1 : 0) : 0,
                  color: "var(--warning)", bg: "var(--warning-bg)" },
              ].map((c, i) => (
                <div key={i} style={{ padding: "14px 16px", background: c.bg, border: `1px solid ${c.color}40`, borderRadius: "var(--r-lg)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c.color, marginBottom: 5 }}>{c.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Stream table */}
            <div className="mapping-stream">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 10 }}>
                <h3 className="h3">Clause stream</h3>
                {running && !isDone && !paused && (
                  <span style={{ fontSize: 11, color: "var(--teal-600)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal-600)", display: "inline-block", animation: "pulse 1.5s infinite" }}></span> Live
                  </span>
                )}
                <div className="spacer"></div>
                <span className="meta" style={{ fontSize: 12 }}>{streamIdx} / {MAPPING_STREAM.length} processed</span>
              </div>

              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 120px 80px", gap: 12, padding: "8px 16px", background: "var(--ink-50)", borderBottom: "1px solid var(--ink-200)" }}>
                {["Clause", "Text snippet", "Pillar", "CVR Gates", "Status"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)" }}>{h}</div>
                ))}
              </div>

              {visible.map((row) => (
                <div key={row.id} className={`mapping-row ${row.status === "rejected" ? "mr-rejected" : ""}`}
                     style={{ background: selectedRow === row.id ? "var(--teal-50)" : undefined }}
                     onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}>
                  <div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-900)" }}>{row.ref}</span>
                    {row.escalated && (
                      <div style={{ fontSize: 10, color: "var(--info)", fontWeight: 600, marginTop: 1 }}>↑ escalated</div>
                    )}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.text}</div>
                  </div>
                  <div>
                    {row.status !== "rejected"
                      ? <span className="chip-pillar">{row.pillar}</span>
                      : <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>Rejected</span>}
                  </div>
                  <div>
                    <div className="gate-dots" style={{ marginBottom: 3 }}>
                      {row.gates.map((g, i) => <span key={i} className={`gate-dot ${gateDotClass(g)}`} title={`Gate ${i+1}: ${g}`}></span>)}
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {row.scores.map((s, i) => (
                        <span key={i} className="mono" style={{ fontSize: 9, color: gateColor(row.gates[i]), background: gateColor(row.gates[i]) + "20", padding: "1px 4px", borderRadius: 3 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={`chip ${row.status === "verified" ? "chip-verified" : "chip-rejected"}`} style={{ fontSize: 11 }}>
                      <span className="dot"></span>{row.status}
                    </span>
                  </div>
                </div>
              ))}

              {visible.length === 0 && (
                <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                  Press Start mapping to begin CVR classification
                </div>
              )}
            </div>

            {/* Rejection feed */}
            {rejections.length > 0 && (
              <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 className="h3" style={{ fontSize: 14 }}>Rejection inspector</h3>
                  <span style={{ background: "var(--danger-bg)", color: "var(--danger)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--r-full)" }}>{rejections.length}</span>
                  <span className="meta" style={{ marginLeft: "auto", fontSize: 12 }}>Anti-hallucination catches</span>
                </div>
                {rejections.map(r => (
                  <div key={r.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--ink-100)", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span className="mono" style={{ fontWeight: 700, color: "var(--ink-900)" }}>{r.ref}</span>
                      <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 12 }}>
                        <IconGlyph name="x" size={12} /> {r.rejectedGate || "Gate 2"} failed
                      </span>
                      <span className="meta">→ proposed <span className="chip-pillar" style={{ marginLeft: 4 }}>{r.pillar}</span></span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-600)", paddingLeft: 4, borderLeft: "2px solid var(--danger-bg)" }}>{r.text.slice(0, 100)}…</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* CVR gate tallies */}
            <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-200)" }}>
                <h3 className="h3" style={{ fontSize: 14 }}>CVR gate throughput</h3>
              </div>
              <div style={{ padding: "16px" }}>
                {[
                  { label: "Gate 1 — Span Match",       passed: g1pass, total: streamIdx, color: "var(--info)" },
                  { label: "Gate 2 — NLI Entailment",    passed: g2pass, total: streamIdx, color: "var(--warning)" },
                  { label: "Gate 3 — Struct. Plausibility", passed: g3pass, total: streamIdx, color: "var(--success)" },
                ].map((g, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--ink-700)" }}>{g.label}</span>
                      <span className="mono" style={{ fontWeight: 600, color: "var(--ink-900)" }}>
                        {g.total > 0 ? `${g.passed}/${g.total}` : "—"}
                      </span>
                    </div>
                    <div style={{ height: 5, background: "var(--ink-100)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: g.color, borderRadius: "var(--r-full)", width: g.total > 0 ? `${(g.passed / g.total) * 100}%` : "0%", transition: "width 600ms ease" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LLM routing panel */}
            <div className="routing-panel">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 8 }}>
                <h3 className="h3" style={{ fontSize: 14 }}>Model routing</h3>
                <span className="chip chip-verified" style={{ marginLeft: "auto", fontSize: 10 }}>All local</span>
              </div>
              {LLM_ROUTES.map((r, i) => (
                <div key={i} className="routing-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-700)" }}>{r.stage}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{r.detail}</div>
                  </div>
                  <span className={`model-badge ${r.type === "local" ? "model-local" : "model-cloud"}`}>
                    {r.type === "cloud" ? <IconGlyph name="cloud" size={10} /> : <IconGlyph name="cpu" size={10} />}
                    {r.model}
                  </span>
                </div>
              ))}
              {escalated > 0 && (
                <div style={{ padding: "10px 16px", background: "var(--info-bg)", borderTop: "1px solid var(--ink-200)", fontSize: 12, color: "var(--info)" }}>
                  <IconGlyph name="cloud" size={13} /> {escalated} clause{escalated > 1 ? "s" : ""} escalated to gpt-4o · cloud model invoked
                </div>
              )}
            </div>

            {/* Cost meter */}
            <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "var(--ink-700)", fontWeight: 500 }}>Cloud token budget</span>
                <span className="mono" style={{ fontWeight: 700, color: "var(--ink-900)" }}>${(escalated * 0.004).toFixed(3)} / $2.00</span>
              </div>
              <div style={{ height: 5, background: "var(--ink-100)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--info)", borderRadius: "var(--r-full)", width: `${Math.min(100, (escalated * 0.004 / 2) * 100)}%`, transition: "width 600ms ease" }}></div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 5 }}>{escalated > 0 ? `${escalated} escalation${escalated > 1 ? "s" : ""} to cloud model` : "All processing local — $0.00 spent"}</div>
            </div>

            {/* Jump to trace */}
            {isDone && (
              <button className="btn btn-primary" style={{ width: "100%" }}
                      onClick={() => onNavigate({ page: "trace", docId: "BD-DSA-2018" })}>
                <IconGlyph name="link" size={14} /> View source trace →
              </button>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
