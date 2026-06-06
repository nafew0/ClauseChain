// ===========================================================
// Page 2 — Jurisdiction Detail
// ===========================================================
/* global React, JURISDICTIONS, DOCUMENTS, RDTII_PILLARS, SEED_REGISTRY,
   PillarCoverageStack, IconGlyph, StatusChip, SourceUrlRow */

const { useState: useJurState } = React;

window.JurisdictionPage = function JurisdictionPage({ country, onNavigate, onOpenAddDocument, onOpenCrawlDrawer }) {
  const j = JURISDICTIONS.find(x => x.code === country) || JURISDICTIONS[0];
  const docs = DOCUMENTS[j.code] || [];
  const seeds = SEED_REGISTRY[j.code] || [];

  const [filter, setFilter] = useJurState("all");
  const [q, setQ] = useJurState("");
  const [selected, setSelected] = useJurState(new Set());

  const filtered = docs.filter(d => {
    if (filter !== "all" && d.type !== filter) return false;
    if (q && !(d.title + " " + d.id).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="page" data-screen-label="02 Jurisdiction">
      <div className="page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>{j.flag}</div>
            <div>
              <div className="h1" style={{ fontSize: 36 }}>{j.name}</div>
              <div className="subtitle" style={{ marginTop: 4 }}>
                {j.languages.join(" · ")} · last synced {j.lastSyncRel} · {j.instruments} instruments · {j.clauses} clauses
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onOpenCrawlDrawer}>
            <IconGlyph name="refresh" size={14} /> Re-crawl seeds
          </button>
          <button className="btn btn-primary" onClick={onOpenAddDocument}>
            <IconGlyph name="plus" size={14} /> Add document
          </button>
        </div>
      </div>

      {/* Top row — Coverage + Stats + Source health */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <h3 className="h3">RDTII coverage</h3>
            <div className="spacer"></div>
            <span className="meta">Pillar 6 & 7 mandatory</span>
          </div>
          <PillarCoverageStack coverage={j.coverage} />
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 className="h3">Status</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SmallStat label="Verified" value={j.verified} color="var(--success)" />
            <SmallStat label="Pending" value={j.pending} color="var(--warning)" />
            <SmallStat label="Rejected" value={j.rejected} color="var(--danger)" />
            <SmallStat label="Conflicts" value={j.conflicts} color={j.conflicts > 0 ? "var(--danger)" : "var(--ink-400)"} />
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 className="h3">Source health</h3>
            <div className="spacer"></div>
            <span className="meta">{seeds.length} seeds</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {seeds.map(s => <SourceUrlRow key={s.url} url={s.url} status={s.status} />)}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <h2 className="h2">Documents</h2>
        <div className="spacer"></div>
        {selected.size > 0 && (
          <div className="row" style={{ background: "var(--teal-50)", padding: "4px 8px 4px 12px", borderRadius: 999, color: "var(--teal-600)", fontSize: 13 }}>
            <span>{selected.size} selected</span>
            <button className="btn btn-tertiary compact" style={{ height: 28 }}>Re-process</button>
            <button className="btn btn-tertiary compact" style={{ height: 28 }}>Export</button>
            <button className="btn btn-tertiary compact" style={{ height: 28, color: "var(--danger)" }}>Remove</button>
          </div>
        )}
        <input className="input" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)}
               style={{ width: 240, height: 32, fontSize: 13 }} />
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}
                style={{ width: 160, height: 32, fontSize: 13 }}>
          <option value="all">All types</option>
          <option value="Act">Act</option>
          <option value="Amendment">Amendment</option>
          <option value="Regulation">Regulation</option>
          <option value="Guideline">Guideline</option>
        </select>
      </div>

      <div className="card flush">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Document</th>
              <th style={{ width: 130 }}>Type</th>
              <th style={{ width: 130 }}>Language</th>
              <th style={{ width: 110, textAlign: "right" }}>Clauses</th>
              <th style={{ width: 110, textAlign: "right" }}>Verified</th>
              <th style={{ width: 110, textAlign: "right" }}>Conflicts</th>
              <th style={{ width: 120 }}>Updated</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className={selected.has(d.id) ? "selected" : ""}
                  onClick={() => onNavigate({ page: "doc", country: j.code, doc: d.id })}>
                <td onClick={(e) => { e.stopPropagation(); toggleSelect(d.id); }}>
                  <input type="checkbox" checked={selected.has(d.id)} readOnly
                         style={{ accentColor: "var(--teal-600)" }} />
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: d.binding === false ? 0.6 : 1 }}>
                    <span className="doc-title-link">{d.title}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>{d.id} · {d.pages} pp · {d.authority}</span>
                  </div>
                </td>
                <td>
                  <span className="chip-pillar" style={{ background: d.type === "Guideline" ? "var(--ink-100)" : "var(--teal-50)", color: d.type === "Guideline" ? "var(--ink-500)" : "var(--teal-600)" }}>
                    {d.type}
                  </span>
                </td>
                <td className="small">{d.languages.join(", ")}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--ink-900)", fontWeight: 500 }}>{d.clauses}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--success)", fontWeight: 600 }}>{d.verified}</td>
                <td className="mono" style={{ textAlign: "right", color: d.conflicts > 0 ? "var(--danger)" : "var(--ink-400)", fontWeight: 600 }}>{d.conflicts}</td>
                <td className="small muted">{d.updatedRel}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon"><IconGlyph name="more" size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty">
            <IconGlyph name="document" size={48} />
            <div className="head">No documents yet for {j.name}</div>
            <div className="sub">Start discovery from the {seeds.length} pre-curated seed URLs, or upload a PDF, HTML, or DOCX file manually.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={onOpenCrawlDrawer}>Run discovery</button>
              <button className="btn btn-primary" onClick={onOpenAddDocument}>Upload document</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function SmallStat({ label, value, color }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div className="caption">{label}</div>
    </div>
  );
}
