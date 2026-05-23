// ===========================================================
// ClauseChain — Shared UI components
// ===========================================================
/* global React */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ---------- Icons (Lucide-style, 1.5px stroke) ----------
const Icon = ({ d, size = 16, fill = "none", stroke = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  globe:     <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
  matrix:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  ledger:    <><path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V4z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  filter:    <><path d="M3 4h18l-7 9v6l-4 2v-8z"/></>,
  download:  <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></>,
  check:     <><path d="m5 12 5 5L20 7"/></>,
  x:         <><path d="M6 6l12 12M18 6 6 18"/></>,
  chevR:     <><path d="m9 6 6 6-6 6"/></>,
  chevD:     <><path d="m6 9 6 6 6-6"/></>,
  chevL:     <><path d="m15 6-6 6 6 6"/></>,
  arrowUp:   <><path d="m6 15 6-6 6 6"/></>,
  arrowDown: <><path d="m6 9 6 6 6-6"/></>,
  arrowR:    <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  copy:      <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M3 16V5a2 2 0 0 1 2-2h11"/></>,
  external:  <><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
  alert:     <><path d="M12 9v4M12 17h.01"/><path d="m21 16.5-7.4-13a2 2 0 0 0-3.2 0L3 16.5A2 2 0 0 0 4.6 19.5h14.8A2 2 0 0 0 21 16.5z"/></>,
  warning:   <><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></>,
  shield:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
  fileText:  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>,
  document:  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
  link:      <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></>,
  hash:      <><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>,
  more:      <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  refresh:   <><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>,
  zap:       <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></>,
  bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></>,
  command:   <><path d="M18 3a3 3 0 1 0 0 6h-3v-3a3 3 0 0 0 3-3zM6 21a3 3 0 1 0 0-6h3v3a3 3 0 0 0-3 3zM6 3a3 3 0 1 1 0 6h3V6a3 3 0 0 0-3-3zM18 21a3 3 0 1 1 0-6h-3v3a3 3 0 0 0 3 3z"/><path d="M9 9h6v6H9z"/></>,
  pause:     <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  play:      <><path d="m6 4 14 8L6 20z"/></>,
  edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4z"/></>,
  trash:     <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></>,
  upload:    <><path d="M12 21V9m0 0 4 4m-4-4-4 4M5 3h14"/></>,
  cloud:     <><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 1 0 6 17h11.5z"/></>,
  flag:      <><path d="M4 22V4M4 4h11l-2 4 2 4H4"/></>,
  scale:     <><path d="M16 16.7c0 1.6-2 3.3-4 3.3s-4-1.7-4-3.3"/><path d="M7 10.7C7 9 5 7 3 7s-2 1.7-2 3.3"/><path d="M21 10.7C21 9 19 7 17 7s-2 1.7-2 3.3"/><path d="M12 3v3M12 14V6M3 7l9-1 9 1"/></>,
  layers:    <><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 17 10 6 10-6"/><path d="m2 12 10 6 10-6"/></>,
  cpu:       <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>,
  spark:     <><path d="M3 12h4l3-9 4 18 3-9h4"/></>,
  star:      <><path d="m12 2 3.1 6.3 7 1-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-1z"/></>,
};
window.IconGlyph = ({ name, size = 16 }) => <Icon d={icons[name]} size={size} />;

// ---------- Status chip ----------
window.StatusChip = ({ status, conflict, label }) => {
  if (conflict) return <span className="chip chip-conflict"><span className="dot"></span>{label || "Conflict"}</span>;
  const map = {
    verified:  "chip-verified",
    pending:   "chip-pending",
    rejected:  "chip-rejected",
    partial:   "chip-verified",
    none:      "chip-pending-meta",
    info:      "chip-info",
  };
  const labels = { verified: "Verified", pending: "Pending", rejected: "Rejected", partial: "Partial", none: "Not classified" };
  return <span className={`chip ${map[status] || "chip-pending-meta"}`}><span className="dot"></span>{label || labels[status] || status}</span>;
};

// ---------- Hash badge ----------
window.HashBadge = ({ hash, size }) => {
  const [copied, setCopied] = useState(false);
  if (!hash || hash === "—") return <span className="hash-badge" style={{ opacity: 0.5 }}>—</span>;
  const truncated = hash.length > 12 ? `${hash.slice(0, 4)}…${hash.slice(-4)}` : hash;
  const copy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) navigator.clipboard.writeText(hash);
    setCopied(true);
    window.showToast?.(`Hash copied · ${truncated}`);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <span className={`hash-badge ${copied ? "copied" : ""}`} onClick={copy} title={hash}>
      <IconGlyph name="hash" size={11} />
      {truncated}
      {copied ? <IconGlyph name="check" size={11} /> : <IconGlyph name="copy" size={11} />}
    </span>
  );
};

// ---------- Verification chain widget (THE anchor) ----------
window.VerificationChain = ({ gates, compact }) => {
  return (
    <div className="vchain" style={compact ? { padding: 8 } : null}>
      {gates.map((g, i) => (
        <div key={i} className={`vgate ${g.status}`}>
          <div className="vgate-head">
            <div className="vgate-name">Gate {i + 1} · {g.name}</div>
            <div className="vgate-status-icon">
              {g.status === "pass" ? <IconGlyph name="check" size={12} /> :
               g.status === "fail" ? <IconGlyph name="x" size={12} /> :
                                     <IconGlyph name="alert" size={12} />}
            </div>
          </div>
          <div className="vgate-detail">{g.value}</div>
          {!compact && <div className="vgate-label">{g.detail}</div>}
        </div>
      ))}
    </div>
  );
};

// ---------- Verbatim block ----------
window.VerbatimBlock = ({ text }) => (
  <div className="verbatim">{text}</div>
);

// ---------- Confidence bar ----------
window.ConfidenceBar = ({ value }) => {
  // value 0..1
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? "var(--success)" :
                value >= 0.7 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="confidence">
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="confidence-value">{value.toFixed(2)}</div>
    </div>
  );
};

// ---------- KPI card ----------
window.KPI = ({ label, value, delta, deltaDir, sub, accent, large }) => {
  const valueStyle = accent ? { color: accent } : null;
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={valueStyle}>{value}</div>
      <div className="kpi-meta">
        {delta != null && (
          <span className={`delta ${deltaDir || "neutral"}`}>
            <IconGlyph name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={12} />
            {delta}
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  );
};

// ---------- Pillar coverage bar ----------
window.PillarBar = ({ verified, pending, rejected, total }) => {
  const v = (verified / total) * 100;
  const p = (pending / total) * 100;
  const r = (rejected / total) * 100;
  return (
    <div className="pillar-bar" title={`${verified} verified · ${pending} pending · ${rejected} rejected · of ${total}`}>
      <div className="seg-verified" style={{ width: `${v}%` }}></div>
      <div className="seg-pending"  style={{ width: `${p}%` }}></div>
      <div className="seg-rejected" style={{ width: `${r}%` }}></div>
    </div>
  );
};

// ---------- Flag ----------
window.Flag = ({ code, emoji }) => (
  <span className="flag" title={code}>{emoji || code}</span>
);

// ---------- Sidebar ----------
window.Sidebar = ({ current, onNavigate, jurisdictions }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="brand-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/>
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>
        </svg>
      </div>
      <div className="brand-wordmark">ClauseChain</div>
    </div>

    <button className={`nav-item ${current.page === "dashboard" ? "active" : ""}`} onClick={() => onNavigate({ page: "dashboard" })}>
      <IconGlyph name="dashboard" size={16} /> Dashboard
    </button>
    <button className={`nav-item ${current.page === "matrix" ? "active" : ""}`} onClick={() => onNavigate({ page: "matrix" })}>
      <IconGlyph name="matrix" size={16} /> RDTII Matrix
    </button>
    <button className={`nav-item ${current.page === "ledger" ? "active" : ""}`} onClick={() => onNavigate({ page: "ledger" })}>
      <IconGlyph name="ledger" size={16} /> Pipeline & Ledger
    </button>

    <div className="nav-section-label">Pipeline</div>
    <button className={`nav-item ${current.page === "crawl" ? "active" : ""}`}
            onClick={() => onNavigate({ page: "crawl", country: "BD" })}>
      <IconGlyph name="spark" size={16} /> Crawl Console
    </button>
    <button className={`nav-item ${current.page === "harvest" ? "active" : ""}`}
            onClick={() => onNavigate({ page: "harvest", runId: "run-BD-001" })}>
      <IconGlyph name="layers" size={16} /> Harvest Review
    </button>
    <button className={`nav-item ${current.page === "extract" ? "active" : ""}`}
            onClick={() => onNavigate({ page: "extract", runId: "run-BD-001", docId: "hd-001", tab: "split" })}>
      <IconGlyph name="fileText" size={16} /> Extraction
    </button>
    <button className={`nav-item ${current.page === "map" ? "active" : ""}`}
            onClick={() => onNavigate({ page: "map", runId: "run-BD-001" })}>
      <IconGlyph name="cpu" size={16} /> Mapping Run
    </button>
    <div className="nav-section-label">Jurisdictions</div>
    {jurisdictions.map(j => (
      <button key={j.code}
              className={`nav-item ${((current.page === "jurisdiction" || current.page === "doc") && current.country === j.code) ? "active" : ""}`}
              onClick={() => onNavigate({ page: "jurisdiction", country: j.code })}>
        <span style={{ fontSize: 14 }}>{j.flag}</span>
        {j.name}
        <span className="count">{j.instruments}</span>
      </button>
    ))}

    <div className="footer">
      clausechain v0.4<br/>
      Apache 2.0
    </div>
  </aside>
);

// ---------- Topbar with breadcrumbs ----------
window.TopBar = ({ crumbs, onNavigate, onOpenSearch }) => (
  <div className="topbar">
    <div className="breadcrumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={`crumb ${i === crumbs.length - 1 ? "current" : ""}`}
                onClick={() => c.nav && onNavigate(c.nav)}>{c.label}</span>
          {i < crumbs.length - 1 && <span className="sep"><IconGlyph name="chevR" size={12} /></span>}
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-right">
      <button className="search-trigger" onClick={onOpenSearch}>
        <IconGlyph name="search" size={14} />
        <span>Search anything…</span>
        <span className="kbd">⌘K</span>
      </button>
      <button className="btn-icon" title="Notifications"><IconGlyph name="bell" size={18} /></button>
      <div className="avatar" title="Asha Rahman · UN Trade & Digital Policy">AR</div>
    </div>
  </div>
);

// ---------- Toast host ----------
window.ToastHost = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    window.showToast = (msg, opts = {}) => {
      const id = Math.random();
      setToasts(t => [...t, { id, msg, ...opts }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 2600);
    };
  }, []);
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="icon"><IconGlyph name="check" size={16} /></span>
          {t.msg}
        </div>
      ))}
    </div>
  );
};

// ---------- Pipeline Stepper ----------
window.PipelineStepper = function PipelineStepper({ activeId, onNavigate }) {
  const STEPS = [
    { id: "discover", label: "Discover", nav: { page: "crawl",   country: "BD" } },
    { id: "harvest",  label: "Harvest",  nav: { page: "harvest", runId: "run-BD-001" } },
    { id: "separate", label: "Separate", nav: null },
    { id: "convert",  label: "Convert",  nav: { page: "extract", runId: "run-BD-001", docId: "hd-001", tab: "split" } },
    { id: "ocr",      label: "OCR",      nav: { page: "extract", runId: "run-BD-001", docId: "hd-001", tab: "ocr" } },
    { id: "embed",    label: "Embed",    nav: null },
    { id: "map",      label: "Map",      nav: { page: "map",     runId: "run-BD-001" } },
    { id: "verify",   label: "Verify",   nav: null },
  ];
  const activeIdx = STEPS.findIndex(s => s.id === activeId);
  return (
    <div className="pipeline-stepper">
      <div className="stepper-run-badge">
        <IconGlyph name="zap" size={11} />
        run-BD-001
      </div>
      <div className="stepper-track">
        {STEPS.map((step, i) => {
          const status = i < activeIdx ? "done" : i === activeIdx ? "active" : "queued";
          const clickable = status === "done" && step.nav;
          return (
            <React.Fragment key={step.id}>
              <div className={`stepper-step ss-${status} ${clickable ? "ss-clickable" : ""}`}
                   onClick={() => clickable && onNavigate(step.nav)}>
                <div className="ss-circle">
                  {status === "done"
                    ? <IconGlyph name="check" size={11} />
                    : <span>{i + 1}</span>}
                </div>
                <span className="ss-label">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`ss-connector ${status === "done" ? "ss-connector-done" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Mini source-host helper ----------
window.relTime = (iso) => {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

// ---------- Pillar coverage block (per-jurisdiction card) ----------
window.PillarCoverageStack = ({ coverage, compact }) => {
  const mandatoryKeys = ["6", "7"];
  const bonusKeys = ["8", "9", "12"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {mandatoryKeys.map(k => {
        const c = coverage[k];
        if (!c) return null;
        const pct = Math.round(((c.verified) / c.total) * 100);
        return (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--ink-700)", fontWeight: 500 }}>
                Pillar {k} · {RDTII_PILLARS[k].name}
              </span>
              <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{pct}%</span>
            </div>
            <PillarBar verified={c.verified} pending={c.pending} rejected={c.rejected} total={c.total} />
          </div>
        );
      })}
      {!compact && (
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {bonusKeys.map(k => {
            const c = coverage[k];
            const onTrack = c && c.verified > 0;
            return (
              <span key={k} className="chip-pillar" style={{ opacity: onTrack ? 1 : 0.45 }}>
                {k}{onTrack ? ` · ${Math.round((c.verified / c.total) * 100)}%` : " · —"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- Source URL row (with reachability dot) ----------
window.SourceUrlRow = ({ url, status }) => {
  const colors = { ok: "var(--success)", warn: "var(--warning)", err: "var(--danger)" };
  return (
    <div className="row" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--ink-100)" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || "var(--ink-400)" }}></span>
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-900)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
      <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--ink-500)" }}><IconGlyph name="external" size={14} /></a>
    </div>
  );
};

// ---------- Modal shell ----------
window.Modal = ({ open, onClose, title, subtitle, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="h2">{title}</div>
            {subtitle && <div className="small muted" style={{ marginTop: 6 }}>{subtitle}</div>}
          </div>
          <button className="btn-icon" onClick={onClose}><IconGlyph name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ---------- Drawer ----------
window.Drawer = ({ open, onClose, title, subtitle, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="h2">{title}</div>
            {subtitle && <div className="small muted" style={{ marginTop: 6 }}>{subtitle}</div>}
          </div>
          <button className="btn-icon" onClick={onClose}><IconGlyph name="x" size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </aside>
    </div>
  );
};

// ---------- Command Palette ----------
window.CommandPalette = ({ open, onClose, onNavigate }) => {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const groups = [
      { label: "Jurisdictions", items: JURISDICTIONS.map(j => ({
        kind: "jurisdiction", icon: "globe",
        label: j.name,
        meta: `${j.code} · ${j.instruments} instruments`,
        nav: { page: "jurisdiction", country: j.code },
      })) },
      { label: "Documents", items: Object.values(DOCUMENTS).flat().map(d => ({
        kind: "document", icon: "document",
        label: d.title,
        meta: d.id,
        nav: { page: "doc", country: d.id.split("-")[0], doc: d.id },
      })) },
      { label: "Classifications", items: [
        { kind: "class", icon: "shieldCheck", label: "§26(1) · BD-DSA · Pillar 6.1", meta: "a3f5…b9c2", nav: { page: "doc", country: "BD", doc: "BD-DSA-2018" } },
        { kind: "class", icon: "shieldCheck", label: "§28 · TH-PDPA · Pillar 6.2",  meta: "e1f2…d6e7", nav: { page: "doc", country: "TH", doc: "TH-PDPA-2019" } },
        { kind: "class", icon: "alert",       label: "§28 · BD-DSA · Rejected (Gate 2)", meta: "7e91…44fa", nav: { page: "doc", country: "BD", doc: "BD-DSA-2018" } },
      ] },
      { label: "Pages", items: [
        { kind: "page", icon: "dashboard", label: "Workspace Dashboard", meta: "/dashboard", nav: { page: "dashboard" } },
        { kind: "page", icon: "matrix",    label: "RDTII Matrix",        meta: "/matrix",    nav: { page: "matrix" } },
        { kind: "page", icon: "ledger",    label: "Provenance Ledger",   meta: "/ledger",    nav: { page: "ledger" } },
      ] },
      { label: "Actions", items: [
        { kind: "action", icon: "plus",     label: "Add jurisdiction",     meta: "⌘N",  action: () => window.openAddJurisdiction?.() },
        { kind: "action", icon: "download", label: "Export RDTII matrix",  meta: "⌘E",  action: () => window.openExport?.() },
        { kind: "action", icon: "refresh",  label: "Re-verify all rejected", meta: "⌘R", action: () => window.showToast?.("Re-verification scheduled · 77 entries") },
      ] },
    ];
    if (!ql) return groups;
    return groups.map(g => ({
      ...g,
      items: g.items.filter(i => (i.label + " " + i.meta).toLowerCase().includes(ql)),
    })).filter(g => g.items.length > 0);
  }, [q]);

  const flat = useMemo(() => results.flatMap(g => g.items.map(i => ({ ...i, group: g.label }))), [results]);

  useEffect(() => {
    if (!open) { setQ(""); setActive(0); return; }
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(flat.length - 1, a + 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      if (e.key === "Enter") {
        const it = flat[active];
        if (!it) return;
        if (it.nav) { onNavigate(it.nav); onClose(); }
        else if (it.action) { it.action(); onClose(); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, flat, active, onClose, onNavigate]);

  if (!open) return null;
  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <IconGlyph name="search" size={18} />
          <input className="cmd-input" placeholder="Search jurisdictions, documents, classifications, actions…"
                 autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} />
          <span className="kbd" style={{ background: "var(--ink-100)", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-500)" }}>esc</span>
        </div>
        <div className="cmd-results">
          {flat.length === 0 && <div style={{ padding: 20, color: "var(--ink-500)", fontSize: 14 }}>No results.</div>}
          {results.map(g => g.items.length > 0 && (
            <div key={g.label}>
              <div className="cmd-group-label">{g.label}</div>
              {g.items.map(it => {
                const idx = flat.findIndex(f => f === it);
                return (
                  <div key={idx} className={`cmd-result ${idx === active ? "active" : ""}`}
                       onMouseEnter={() => setActive(idx)}
                       onClick={() => {
                         if (it.nav) { onNavigate(it.nav); onClose(); }
                         else if (it.action) { it.action(); onClose(); }
                       }}>
                    <span className="icon"><IconGlyph name={it.icon} size={16} /></span>
                    <span className="label">{it.label}</span>
                    <span className="meta-text">{it.meta}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
