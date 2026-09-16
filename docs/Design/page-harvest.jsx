// ===========================================================
// Page 7 — Harvest Review & Document Triage
// ===========================================================
/* global React, HARVESTED_DOCS, PipelineStepper, IconGlyph, StatusChip */

const { useState: useHarvestState } = React;

const DOC_TYPES = [
  { id: "all",         label: "All documents",  icon: "layers"   },
  { id: "native-pdf",  label: "Native PDF",      icon: "document" },
  { id: "scanned-pdf", label: "Scanned PDF",     icon: "fileText" },
  { id: "html",        label: "HTML",            icon: "globe"    },
  { id: "docx",        label: "DOCX",            icon: "fileText" },
  { id: "markdown",    label: "Markdown / TXT",  icon: "hash"     },
  { id: "table",       label: "Tables",          icon: "matrix"   },
  { id: "other",       label: "Other / Unknown", icon: "alert"    },
];

const TYPE_LABELS = {
  "native-pdf":  { label: "Native PDF",  cls: "type-native-pdf"  },
  "scanned-pdf": { label: "Scanned PDF", cls: "type-scanned-pdf" },
  "html":        { label: "HTML",        cls: "type-html"        },
  "docx":        { label: "DOCX",        cls: "type-docx"        },
  "markdown":    { label: "Markdown",    cls: "type-markdown"    },
  "table":       { label: "Table",       cls: "type-table"       },
  "other":       { label: "Other",       cls: "type-other"       },
};

const FLAG_LABELS = {
  "draft":         { label: "Draft",        color: "var(--warning)" },
  "press-release": { label: "Press release", color: "var(--ink-500)" },
  "guideline":     { label: "Guideline",    color: "var(--info)"    },
  "irrelevant":    { label: "Irrelevant",   color: "var(--danger)"  },
};

window.HarvestReviewPage = function HarvestReviewPage({ onNavigate }) {
  const [docs, setDocs] = useHarvestState(HARVESTED_DOCS);
  const [activeType, setActiveType] = useHarvestState("all");
  const [selected, setSelected] = useHarvestState(null);
  const [showDiscard, setShowDiscard] = useHarvestState(false);
  const [discardTarget, setDiscardTarget] = useHarvestState(null);

  const toggleKeep = (id) => {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, keep: !d.keep } : d));
  };

  const bulkKeepHighConf = () => {
    setDocs(ds => ds.map(d => ({ ...d, keep: d.confidence > 0.75 })));
    window.showToast?.("Bulk triage: keeping 10 high-confidence documents");
  };

  const filtered = activeType === "all" ? docs : docs.filter(d => d.type === activeType);
  const keepCount = docs.filter(d => d.keep).length;

  const countByType = (t) => t === "all" ? docs.length : docs.filter(d => d.type === t).length;

  const confColor = c => c > 0.8 ? "var(--success)" : c > 0.5 ? "var(--warning)" : "var(--danger)";

  return (
    <React.Fragment>
      <PipelineStepper activeId="harvest" onNavigate={onNavigate} />
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 112px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", flex: 1, minHeight: 0 }}>

          {/* ── Type sidebar ── */}
          <div style={{ background: "var(--white)", borderRight: "1px solid var(--ink-200)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="caption" style={{ padding: "0 10px 8px" }}>Document types</div>
            {DOC_TYPES.map(t => (
              <button key={t.id} className={`type-bucket-btn ${activeType === t.id ? "active" : ""}`}
                      onClick={() => setActiveType(t.id)}>
                <IconGlyph name={t.icon} size={14} />
                {t.label}
                <span className="bucket-count">{countByType(t.id)}</span>
              </button>
            ))}

            <div className="divider" style={{ margin: "12px 0" }}></div>
            <div className="caption" style={{ padding: "0 10px 8px" }}>Bulk actions</div>
            <button className="type-bucket-btn" onClick={bulkKeepHighConf}>
              <IconGlyph name="zap" size={14} /> Keep conf &gt; 0.75
            </button>
            <button className="type-bucket-btn" onClick={() => setDocs(ds => ds.map(d => ({ ...d, keep: false })))}>
              <IconGlyph name="trash" size={14} /> Discard all
            </button>
            <button className="type-bucket-btn" onClick={() => setDocs(ds => ds.map(d => ({ ...d, keep: true })))}>
              <IconGlyph name="check" size={14} /> Keep all
            </button>
          </div>

          {/* ── Document cards ── */}
          <div style={{ padding: "20px 28px 100px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div>
                <h2 className="h2">
                  {activeType === "all" ? "All documents" : TYPE_LABELS[activeType]?.label || activeType}
                </h2>
                <div className="meta" style={{ marginTop: 3 }}>
                  {filtered.filter(d => d.keep).length} kept · {filtered.filter(d => !d.keep).length} discarded
                </div>
              </div>
              <div className="spacer"></div>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" style={{ width: 200, height: 36, fontSize: 13 }} placeholder="Search…" />
                <button className="btn btn-secondary compact"><IconGlyph name="filter" size={13} /></button>
              </div>
            </div>

            <div className="harvest-grid">
              {filtered.map(doc => (
                <HarvestCard key={doc.id} doc={doc} onToggleKeep={toggleKeep}
                             isSelected={selected === doc.id}
                             onSelect={() => setSelected(selected === doc.id ? null : doc.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sticky action bar ── */}
        <div className="harvest-actions-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--ink-950)", lineHeight: 1 }}>{keepCount}</div>
            <div style={{ fontSize: 13, color: "var(--ink-700)" }}>documents selected<br /><span className="meta">{docs.length - keepCount} discarded</span></div>
          </div>
          <div style={{ flex: 1, height: 6, background: "var(--ink-200)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--teal-600)", borderRadius: "var(--r-full)", width: `${(keepCount / docs.length) * 100}%`, transition: "width 300ms ease" }}></div>
          </div>
          <button className="btn btn-secondary" onClick={() => window.showToast?.("Changes reverted")}>
            Reset triage
          </button>
          <button className="btn btn-primary hero" onClick={() => {
            window.showToast?.(`Proceeding with ${keepCount} documents → extraction`);
            setTimeout(() => onNavigate({ page: "extract", runId: "run-BD-001", docId: "hd-001", tab: "split" }), 600);
          }}>
            Proceed with {keepCount} documents <IconGlyph name="arrowR" size={16} />
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

// ---- Individual harvest card ----
function HarvestCard({ doc, onToggleKeep, isSelected, onSelect }) {
  const tl = TYPE_LABELS[doc.type] || { label: doc.type, cls: "type-other" };
  const confColor = c => c > 0.8 ? "var(--success)" : c > 0.5 ? "var(--warning)" : "var(--danger)";

  return (
    <div className={`harvest-card ${doc.keep ? "" : "discarded"}`}
         style={{ cursor: "pointer", borderColor: isSelected ? "var(--teal-500)" : "var(--ink-200)", background: isSelected ? "var(--teal-50)" : "var(--white)" }}
         onClick={onSelect}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <span className={`type-badge ${tl.cls}`}>{tl.label}</span>
        <div className="spacer"></div>
        {/* Keep toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }} onClick={e => { e.stopPropagation(); onToggleKeep(doc.id); }}>
          <span style={{ fontSize: 11, color: doc.keep ? "var(--teal-600)" : "var(--ink-400)", fontWeight: 500 }}>{doc.keep ? "Keep" : "Discard"}</span>
          <button className={`keep-toggle ${doc.keep ? "on" : "off"}`}></button>
        </div>
      </div>

      {/* Title */}
      <div className="harvest-card-title" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-950)", marginBottom: 6, lineHeight: 1.35 }}>
        {doc.title}
      </div>

      {/* URL */}
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-500)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {doc.url.replace("https://", "")}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {doc.lang !== "—" && (
          <span style={{ fontSize: 11, color: "var(--ink-600)", background: "var(--ink-100)", padding: "2px 7px", borderRadius: "var(--r-full)" }}>{doc.lang}</span>
        )}
        {doc.pages && (
          <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{doc.pages} pp</span>
        )}
        <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{doc.size}</span>
        {doc.flags.map(f => {
          const fl = FLAG_LABELS[f] || { label: f, color: "var(--ink-500)" };
          return (
            <span key={f} style={{ fontSize: 11, fontWeight: 500, color: fl.color, background: fl.color + "15", padding: "2px 7px", borderRadius: "var(--r-full)" }}>
              {fl.label}
            </span>
          );
        })}
      </div>

      {/* Confidence bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)", minWidth: 68 }}>Confidence</span>
        <div style={{ flex: 1, height: 5, background: "var(--ink-100)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: confColor(doc.confidence), width: `${doc.confidence * 100}%`, borderRadius: "var(--r-full)", transition: "width 400ms ease" }}></div>
        </div>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: confColor(doc.confidence), minWidth: 34, textAlign: "right" }}>
          {doc.confidence.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
