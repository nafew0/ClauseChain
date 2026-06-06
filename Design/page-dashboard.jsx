// ===========================================================
// Page 1 — Workspace Dashboard
// ===========================================================
/* global React, JURISDICTIONS, ACTIVITY, PIPELINE_JOBS, REJECTIONS,
   KPI, PillarCoverageStack, HashBadge, IconGlyph */

const { useState: useDashState } = React;

window.DashboardPage = function DashboardPage({ onNavigate, onOpenAddJurisdiction }) {
  return (
    <div className="page" data-screen-label="01 Dashboard">
      {/* Hero greeting */}
      <div className="page-header">
        <div>
          <div className="caption" style={{ marginBottom: 6 }}>Wednesday · 20 May 2026 · UTC+06</div>
          <h1 className="h1" style={{ fontSize: 40, lineHeight: 1.1 }}>
            Good morning, <span className="gradient-text">Asha.</span>
          </h1>
          <div className="subtitle">
            12 verifications cleared overnight. 3 conflicts opened across Bangladesh and Thailand.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><IconGlyph name="download" size={14} /> Export workspace</button>
          <button className="btn btn-primary" onClick={onOpenAddJurisdiction}>
            <IconGlyph name="plus" size={14} /> Add jurisdiction
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="kpi" style={{ background: "linear-gradient(140deg, #FFFFFF 0%, #F0FDFA 100%)", borderColor: "var(--teal-100)" }}>
          <div className="kpi-label" style={{ color: "var(--teal-600)" }}>Verified citations</div>
          <div className="kpi-value gradient-text" style={{ fontSize: 56 }}>826</div>
          <div className="kpi-meta">
            <span className="delta up"><IconGlyph name="arrowUp" size={12} /> +48</span>
            <span>vs. yesterday · 1,017 across workspace</span>
          </div>
        </div>
        <KPI label="Pending review" value="97" delta="−12" deltaDir="down" sub="awaiting human" accent="var(--warning)" />
        <KPI label="Rejected by CVR" value="77" delta="+18" deltaDir="up" sub="anti-hallucination saves" accent="var(--danger)" />
        <KPI label="Avg confidence" value="0.91" delta="+0.03" deltaDir="up" sub="across verified" />
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24 }}>
        {/* Left: jurisdictions */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="h2">Jurisdictions</h2>
            <span className="meta">3 active · 28 pillars in scope</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {JURISDICTIONS.map(j => (
              <JurisdictionCard key={j.code} j={j} onClick={() => onNavigate({ page: "jurisdiction", country: j.code })} />
            ))}
            {/* Add-card */}
            <button onClick={onOpenAddJurisdiction} style={{
              border: "1.5px dashed var(--ink-300)", borderRadius: 14, padding: 24, background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, minHeight: 240, cursor: "pointer", color: "var(--ink-500)", transition: "var(--t-default)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--teal-500)"; e.currentTarget.style.color = "var(--teal-600)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--ink-300)"; e.currentTarget.style.color = "var(--ink-500)"; }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink-100)", display: "grid", placeItems: "center" }}>
                <IconGlyph name="plus" size={20} />
              </span>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Add jurisdiction</div>
              <div style={{ fontSize: 12 }}>Vietnam · Indonesia · Sri Lanka …</div>
            </button>
          </div>

          <RecentActivityCard onNavigate={onNavigate} />
        </div>

        {/* Right: pipeline + rejections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PipelineHealthCard />
          <CVRBreakdownCard onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};

// ---------- Jurisdiction summary card ----------
function JurisdictionCard({ j, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: "pointer", transition: "var(--t-default)" }}
         onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--ink-300)"; }}
         onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--ink-200)"; }}>
      <div className="row" style={{ marginBottom: 16, alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{j.flag}</div>
        <div style={{ flex: 1 }}>
          <div className="h3">{j.name}</div>
          <div className="meta">{j.languages.join(" · ")} · synced {j.lastSyncRel}</div>
        </div>
        {j.conflicts > 0 && (
          <span className="chip chip-conflict" title={`${j.conflicts} conflicts`}>
            <IconGlyph name="alert" size={11} /> {j.conflicts}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 14 }}>
        <Stat val={j.instruments} label="Instruments" />
        <Stat val={j.clauses} label="Clauses" />
        <Stat val={j.verified} label="Verified" color="var(--success)" />
        <Stat val={j.rejected} label="Rejected" color="var(--danger)" />
      </div>

      <PillarCoverageStack coverage={j.coverage} />
    </div>
  );
}

function Stat({ val, label, color }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: color || "var(--ink-950)", fontVariantNumeric: "tabular-nums" }}>
        {val}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ---------- Recent activity ----------
function RecentActivityCard({ onNavigate }) {
  const [filter, setFilter] = useDashState("all");
  const filtered = filter === "all" ? ACTIVITY : ACTIVITY.filter(a => a.type === filter);
  return (
    <div className="card flush">
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 16 }}>
        <h3 className="h3">Recent activity</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[
            ["all", "All"],
            ["verified", "Verified"],
            ["rejected", "Rejected"],
            ["conflict", "Conflicts"],
            ["ingested", "Ingestion"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
                    className={`btn ${filter === k ? "btn-tertiary" : ""} compact`}
                    style={{ height: 28, fontSize: 12, padding: "0 10px", color: filter === k ? "var(--teal-600)" : "var(--ink-600)", background: filter === k ? "var(--teal-50)" : "transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 8 }}>
        {filtered.map(a => (
          <div key={a.id} className="feed-item" onClick={() => a.href && onNavigate(a.href)}>
            <div className={`feed-icon ${a.type}`}>
              {a.type === "verified" && <IconGlyph name="check" size={16} />}
              {a.type === "rejected" && <IconGlyph name="x" size={16} />}
              {a.type === "ingested" && <IconGlyph name="cloud" size={16} />}
              {a.type === "conflict" && <IconGlyph name="alert" size={16} />}
              {a.type === "crawl" && <IconGlyph name="refresh" size={16} />}
            </div>
            <div className="feed-body">
              <div className="feed-headline">{a.desc}</div>
              <div className="feed-meta">
                <span>{a.ts}</span>
                <span>·</span>
                <HashBadge hash={a.hash} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Pipeline health ----------
function PipelineHealthCard() {
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 16 }}>
        <h3 className="h3">Pipeline health</h3>
        <div className="spacer"></div>
        <span className="chip chip-verified"><span className="dot" style={{ animation: "pulse 2s infinite" }}></span> Healthy</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PIPELINE_JOBS.map(j => (
          <div key={j.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "var(--ink-700)" }}>
                <span className="mono" style={{ color: "var(--ink-500)", marginRight: 8 }}>{j.stage}</span>
                {j.name}
              </span>
              <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{j.progress}%</span>
            </div>
            <div className="progress"><div style={{ width: `${j.progress}%` }}></div></div>
          </div>
        ))}
      </div>

      <div className="card-divider"></div>

      <div className="caption" style={{ marginBottom: 10 }}>L40S workload (24GB)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        <ResourceRow label="Llama 3.1 8B" val="16.2 GB" pct={67} />
        <ResourceRow label="BGE-M3" val="3.1 GB" pct={13} />
        <ResourceRow label="DeBERTa-v3 NLI" val="0.5 GB" pct={2} />
        <ResourceRow label="Free" val="4.2 GB" pct={18} dim />
      </div>
    </div>
  );
}

function ResourceRow({ label, val, pct, dim }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 110, color: dim ? "var(--ink-500)" : "var(--ink-700)" }}>{label}</span>
      <div className="progress" style={{ flex: 1 }}>
        <div style={{ width: `${pct}%`, background: dim ? "var(--ink-300)" : "var(--teal-600)" }}></div>
      </div>
      <span className="mono" style={{ color: "var(--ink-900)", fontSize: 12, minWidth: 56, textAlign: "right" }}>{val}</span>
    </div>
  );
}

// ---------- CVR rejection breakdown ----------
function CVRBreakdownCard({ onNavigate }) {
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 4 }}>
        <h3 className="h3">CVR gate distribution</h3>
        <div className="spacer"></div>
        <a className="small" style={{ color: "var(--teal-600)", cursor: "pointer" }}
           onClick={() => onNavigate({ page: "ledger", tab: "rejections" })}>
          See ledger <IconGlyph name="arrowR" size={11} />
        </a>
      </div>
      <div className="small muted" style={{ marginBottom: 16 }}>Last 24 hours · 77 rejections · these are <em>good</em> numbers — the system catching its own mistakes.</div>

      {/* Stacked bar visual */}
      <div style={{ height: 12, display: "flex", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
        {REJECTIONS.byGate.map((g, i) => (
          <div key={i} style={{ flex: g.pct, background: g.color }} title={`${g.gate}: ${g.count}`}></div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {REJECTIONS.byGate.map((g, i) => (
          <div key={i} className="row" style={{ fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color }}></span>
            <span style={{ flex: 1, color: "var(--ink-700)" }}>{g.gate}</span>
            <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{g.count}</span>
            <span className="meta" style={{ minWidth: 40, textAlign: "right" }}>{g.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
