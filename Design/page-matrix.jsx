// ===========================================================
// Page 4 — RDTII Matrix
// ===========================================================
/* global React, JURISDICTIONS, RDTII_PILLARS, makeMatrixData, IconGlyph */

const { useState: useMatState, useMemo: useMatMemo } = React;

window.MatrixPage = function MatrixPage({ onNavigate, onOpenCellDrilldown, onOpenExport }) {
  const matrix = useMatMemo(() => makeMatrixData(), []);
  const [mode, setMode] = useMatState("status"); // status | confidence | citations
  const [jurFilter, setJurFilter] = useMatState(new Set(["BD", "TH", "SG"]));
  const [pillarFilter, setPillarFilter] = useMatState(new Set(["6", "7", "8"]));

  const visibleJurisdictions = JURISDICTIONS.filter(j => jurFilter.has(j.code));

  // Build pillar/sub-criterion column list
  const columns = useMatMemo(() => {
    const cols = [];
    Object.keys(RDTII_PILLARS).forEach(pk => {
      if (!pillarFilter.has(pk)) return;
      Object.keys(RDTII_PILLARS[pk].sub).forEach(sk => {
        cols.push({ pillar: pk, sub: sk, label: sk, name: RDTII_PILLARS[pk].sub[sk] });
      });
    });
    return cols;
  }, [pillarFilter]);

  // Coverage tally
  const tally = useMatMemo(() => {
    let v = 0, p = 0, r = 0, c = 0, total = 0;
    visibleJurisdictions.forEach(j => {
      columns.forEach(col => {
        const cell = matrix[j.code][col.sub];
        total++;
        if (!cell) { return; }
        if (cell.conflict) c++;
        else if (cell.status === "verified" || cell.status === "partial") v++;
        else if (cell.status === "pending") p++;
        else if (cell.status === "rejected") r++;
      });
    });
    return { v, p, r, c, total };
  }, [matrix, visibleJurisdictions, columns]);

  const togglePillar = (pk) => setPillarFilter(s => { const n = new Set(s); n.has(pk) ? n.delete(pk) : n.add(pk); return n; });
  const toggleJur = (jc) => setJurFilter(s => { const n = new Set(s); n.has(jc) ? n.delete(jc) : n.add(jc); return n; });

  return (
    <div className="page" data-screen-label="04 RDTII Matrix">
      <div className="page-header">
        <div>
          <h1 className="h1"><span className="gradient-text">RDTII Matrix</span></h1>
          <div className="subtitle">Jurisdictions × sub-criteria · evidence-graded · audit-ready · hash-anchored</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><IconGlyph name="filter" size={14} /> View</button>
          <button className="btn btn-primary" onClick={onOpenExport}>
            <IconGlyph name="download" size={14} /> Export
          </button>
        </div>
      </div>

      {/* Filter strip */}
      <div className="card" style={{ marginBottom: 16, padding: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div className="row">
          <span className="caption">Jurisdictions</span>
          {JURISDICTIONS.map(j => (
            <FilterChip key={j.code} active={jurFilter.has(j.code)} onClick={() => toggleJur(j.code)}>
              <span style={{ fontSize: 13 }}>{j.flag}</span> {j.code}
            </FilterChip>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: "var(--ink-200)" }}></div>
        <div className="row">
          <span className="caption">Pillars</span>
          {Object.entries(RDTII_PILLARS).map(([pk, p]) => (
            <FilterChip key={pk} active={pillarFilter.has(pk)} onClick={() => togglePillar(pk)} dim={!p.mandatory}>
              P{pk} {!p.mandatory && <span style={{ fontSize: 10, opacity: 0.7 }}>bonus</span>}
            </FilterChip>
          ))}
        </div>
        <div className="spacer"></div>
        <div className="row" style={{ background: "var(--ink-50)", border: "1px solid var(--ink-200)", borderRadius: 8, padding: 4 }}>
          {[["status", "Status"], ["confidence", "Confidence"], ["citations", "Citations"]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
                    className="btn compact"
                    style={{
                      height: 28, padding: "0 12px", fontSize: 12,
                      background: mode === k ? "var(--white)" : "transparent",
                      color: mode === k ? "var(--ink-900)" : "var(--ink-600)",
                      boxShadow: mode === k ? "var(--shadow-sm)" : "none",
                    }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <SummaryStat label="Verified" value={`${Math.round((tally.v / tally.total) * 100)}%`}
                     sub={`${tally.v} of ${tally.total} sub-criteria`} color="var(--success)" />
        <SummaryStat label="Pending review" value={`${tally.p}`} color="var(--warning)" sub="awaiting analyst" />
        <SummaryStat label="Conflicts" value={`${tally.c}`} color="var(--danger)" sub="cross-source disagreement" />
        <SummaryStat label="Rejected by CVR" value={`${tally.r}`} color="var(--ink-700)" sub="anti-hallucination saves" />
      </div>

      {/* Matrix */}
      <div className="matrix-wrap">
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              {/* Pillar group header row */}
              <tr>
                <th className="corner" style={{ background: "var(--white)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Jurisdiction</span>
                </th>
                {(() => {
                  const groups = [];
                  let i = 0;
                  while (i < columns.length) {
                    const pk = columns[i].pillar;
                    let span = 0;
                    while (i + span < columns.length && columns[i + span].pillar === pk) span++;
                    groups.push({ pk, span, name: RDTII_PILLARS[pk].name });
                    i += span;
                  }
                  return groups.map(g => (
                    <th key={g.pk} colSpan={g.span} className="group-head">
                      Pillar {g.pk} · {g.name}
                    </th>
                  ));
                })()}
              </tr>
              <tr>
                <th className="corner"></th>
                {columns.map(c => (
                  <th key={c.sub} title={c.name}>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: "var(--ink-900)" }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-500)", marginTop: 2, fontWeight: 400, textTransform: "none", letterSpacing: 0, maxWidth: 88, lineHeight: 1.25, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleJurisdictions.map(j => (
                <tr key={j.code}>
                  <th>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{j.flag}</span>
                      <div>
                        <div>{j.name}</div>
                        <div className="sub mono" style={{ fontSize: 11 }}>{j.code} · {j.instruments} instruments</div>
                      </div>
                    </div>
                  </th>
                  {columns.map(c => (
                    <MatrixCell key={c.sub} cell={matrix[j.code][c.sub]} mode={mode}
                                onClick={() => onOpenCellDrilldown({ jurisdiction: j, pillar: c.pillar, sub: c.sub, name: c.name, cell: matrix[j.code][c.sub] })} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="row" style={{ marginTop: 16, gap: 16, flexWrap: "wrap" }}>
        <LegendSwatch className="cell-verified" label="Verified" />
        <LegendSwatch className="cell-partial" label="Partial" />
        <LegendSwatch className="cell-pending" label="Pending review" />
        <LegendSwatch className="cell-rejected" label="Rejected" />
        <LegendSwatch className="cell-conflict" label="Conflict" />
        <LegendSwatch className="cell-none" label="Not covered" />
        <div className="spacer"></div>
        <span className="meta mono">Click any cell to see the underlying classifications</span>
      </div>
    </div>
  );
};

function FilterChip({ active, onClick, children, dim }) {
  return (
    <button onClick={onClick} className="chip"
            style={{
              cursor: "pointer", border: "1px solid",
              background: active ? "var(--teal-50)" : "var(--white)",
              borderColor: active ? "var(--teal-200, #99F6E4)" : "var(--ink-300)",
              color: active ? "var(--teal-600)" : "var(--ink-700)",
              opacity: !active && dim ? 0.6 : 1,
              fontWeight: active ? 600 : 500,
              padding: "4px 10px",
            }}>
      {children}
    </button>
  );
}

function MatrixCell({ cell, mode, onClick }) {
  if (!cell) {
    return <td className="matrix-cell cell-none" onClick={onClick}><div className="cell-inner"><span style={{ fontSize: 18, color: "var(--ink-300)" }}>—</span></div></td>;
  }
  const cls = `cell-${cell.status}`;
  let content;
  if (mode === "status") {
    content = cell.status === "verified" ? <IconGlyph name="check" size={14} /> :
              cell.status === "partial"  ? <IconGlyph name="check" size={14} /> :
              cell.status === "pending"  ? <IconGlyph name="more" size={14} /> :
              cell.status === "rejected" ? <IconGlyph name="x" size={14} /> :
              cell.status === "conflict" ? <IconGlyph name="alert" size={14} /> : null;
  } else if (mode === "confidence") {
    const conf = cell.status === "verified" ? 0.94 :
                 cell.status === "partial"  ? 0.82 :
                 cell.status === "pending"  ? 0.65 :
                 cell.status === "rejected" ? 0.15 :
                 cell.status === "conflict" ? 0.78 : null;
    content = conf != null ? <span className="cell-count">{conf.toFixed(2)}</span> : null;
  } else {
    content = <span className="cell-count">{cell.count}</span>;
  }
  return (
    <td className={`matrix-cell ${cls}`} onClick={onClick}>
      <div className="cell-inner">
        {content}
        {mode !== "citations" && <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{cell.count}</span>}
      </div>
    </td>
  );
}

function SummaryStat({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="caption">{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: color || "var(--ink-950)", marginTop: 4, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="meta" style={{ marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function LegendSwatch({ className, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-700)" }}>
      <span className={`matrix-cell ${className}`} style={{ display: "block", width: 18, height: 12, borderRadius: 3, cursor: "default" }}></span>
      {label}
    </div>
  );
}
