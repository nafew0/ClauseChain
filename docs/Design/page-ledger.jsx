// ===========================================================
// Page 5 — Pipeline Activity & Provenance Ledger
// ===========================================================
/* global React, LEDGER_ENTRIES, PIPELINE_JOBS, LIVE_LOG, REJECTIONS, ACTIVITY, IconGlyph, HashBadge */

const { useState: useLedState } = React;

window.LedgerPage = function LedgerPage({ initialTab, onOpenLedgerEntry, onOpenReverify }) {
  const [tab, setTab] = useLedState(initialTab || "live");
  const [paused, setPaused] = useLedState(false);

  return (
    <div className="page" data-screen-label="05 Ledger">
      <div className="page-header">
        <div>
          <h1 className="h1">Pipeline & Provenance Ledger</h1>
          <div className="subtitle">Append-only, hash-chained audit trail. Every event recorded. Tamper-evident in your browser.</div>
        </div>
        <div className="row">
          <button className="btn btn-secondary"><IconGlyph name="filter" size={14} /> Filter</button>
          <button className="btn btn-secondary"><IconGlyph name="download" size={14} /> Export ledger</button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${tab === "live" ? "active" : ""}`} onClick={() => setTab("live")}>Live activity</button>
        <button className={`tab ${tab === "ledger" ? "active" : ""}`} onClick={() => setTab("ledger")}>Provenance ledger</button>
        <button className={`tab ${tab === "rejections" ? "active" : ""}`} onClick={() => setTab("rejections")}>CVR rejections</button>
      </div>

      {tab === "live" && <LiveActivityView paused={paused} setPaused={setPaused} />}
      {tab === "ledger" && <ProvenanceView onOpenEntry={onOpenLedgerEntry} />}
      {tab === "rejections" && <RejectionsView onOpenReverify={onOpenReverify} />}
    </div>
  );
};

// ---------- Live activity ----------
function LiveActivityView({ paused, setPaused }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <div className="card flush">
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 12 }}>
          <h3 className="h3">Live activity stream</h3>
          <span className="chip chip-verified" style={{ marginLeft: 8 }}>
            <span className="dot" style={{ animation: paused ? "none" : "pulse 2s infinite" }}></span>
            {paused ? "Paused" : "Live"}
          </span>
          <div className="spacer"></div>
          <button className="btn-icon" onClick={() => setPaused(p => !p)}>
            <IconGlyph name={paused ? "play" : "pause"} size={14} />
          </button>
        </div>
        <div style={{ padding: 8, maxHeight: "60vh", overflowY: "auto" }}>
          {ACTIVITY.map(a => (
            <div key={a.id} className="feed-item">
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
                  <span>{a.ts}</span><span>·</span>
                  <HashBadge hash={a.hash} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <h3 className="h3" style={{ marginBottom: 14 }}>Running jobs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PIPELINE_JOBS.map(j => (
              <div key={j.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "var(--ink-700)" }}>
                    <span className="mono" style={{ color: "var(--ink-500)", marginRight: 8 }}>{j.stage}</span>{j.name}
                  </span>
                  <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{j.progress}%</span>
                </div>
                <div className="progress"><div style={{ width: `${j.progress}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card flush">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-200)" }}>
            <h3 className="h3">Pipeline log</h3>
            <div className="meta" style={{ marginTop: 2 }}>tail · auto-scroll</div>
          </div>
          <div className="live-log" style={{ margin: 12, borderRadius: 8 }}>
            {LIVE_LOG.map((l, i) => (
              <div key={i}><span className="ts">{l.ts}</span> <span className={l.lvl}>[{l.lvl.toUpperCase()}]</span> {l.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Provenance ledger ----------
function ProvenanceView({ onOpenEntry }) {
  return (
    <div className="card flush">
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--ink-200)" }}>
        <div>
          <h3 className="h3">Hash chain · Merkle-style</h3>
          <div className="meta" style={{ marginTop: 4 }}>Every entry signed by the previous · {LEDGER_ENTRIES.length} of 18,429 shown</div>
        </div>
        <div className="spacer"></div>
        <button className="btn btn-secondary compact" onClick={() => window.showToast?.("Chain integrity verified · 18,429/18,429 entries")}>
          <IconGlyph name="shieldCheck" size={14} /> Verify entire chain
        </button>
      </div>

      <div style={{ padding: "12px 20px 6px", display: "grid", gridTemplateColumns: "80px 1fr 220px 220px 100px", gap: 12, fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
        <div>Entry #</div>
        <div>Event</div>
        <div>This hash</div>
        <div>Previous hash</div>
        <div style={{ textAlign: "right" }}>Time</div>
      </div>

      <div>
        {LEDGER_ENTRIES.map((e, i) => (
          <div key={e.entryNo} className="ledger-row" onClick={() => onOpenEntry(e)}>
            <div className="ledger-entryno">#{e.entryNo}</div>
            <div>
              <div className="row" style={{ marginBottom: 4 }}>
                <LedgerTypeChip type={e.type} />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-900)" }}>{e.desc}</div>
              <div className="small muted" style={{ marginTop: 2 }}>by {e.actor}</div>
            </div>
            <div><HashBadge hash={e.ownHash} /></div>
            <div><HashBadge hash={e.prevHash} /></div>
            <div className="mono small" style={{ textAlign: "right", color: "var(--ink-500)" }}>{e.ts.split("T")[1].slice(0, 8)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LedgerTypeChip({ type }) {
  const styles = {
    VERIFIED:   { bg: "#ECFDF5", c: "#047857" },
    REJECTED:   { bg: "#FEF2F2", c: "#B91C1C" },
    INGESTED:   { bg: "#EFF6FF", c: "#1D4ED8" },
    CONFLICT:   { bg: "#FFFBEB", c: "#B45309" },
    HUMAN_EDIT: { bg: "#F5F3FF", c: "#6D28D9" },
    CRAWL:      { bg: "var(--ink-100)", c: "var(--ink-700)" },
  };
  const s = styles[type] || styles.CRAWL;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.c, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em" }}>
      {type}
    </span>
  );
}

// ---------- CVR rejections view ----------
function RejectionsView({ onOpenReverify }) {
  const rejections = LEDGER_ENTRIES.filter(e => e.type === "REJECTED").concat([
    { entryNo: 18419, type: "REJECTED", desc: "BD-DSA §43 rejected · Gate 3 (cited section does not exist in instrument)", ownHash: "1a2b3c4d…5e6f", prevHash: "0e7fd948…2a55", ts: "2026-05-19T22:18:00Z", actor: "system", gate: 3 },
    { entryNo: 18415, type: "REJECTED", desc: "TH-CCA §17 rejected · Gate 2 NLI=0.42 (span does not support claim)", ownHash: "9d8c7b6a…5e4f", prevHash: "8c7b6a5d…4e3f", ts: "2026-05-19T20:00:00Z", actor: "system", gate: 2 },
    { entryNo: 18411, type: "REJECTED", desc: "BD-ICTA §57 rejected · Gate 1 Span Match (fuzzy 4 edits — exceeds OCR tolerance)", ownHash: "7b6a5d4c…3e2f", prevHash: "6a5d4c3b…2e1f", ts: "2026-05-19T18:30:00Z", actor: "system", gate: 1 },
  ]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
      {REJECTIONS.byGate.map((g, i) => (
        <div key={i} className="card" style={{ borderLeft: `4px solid ${g.color}`, paddingLeft: 20 }}>
          <div className="caption">{g.gate}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "var(--ink-950)", letterSpacing: "-0.02em", marginTop: 8 }}>
            {g.count}
          </div>
          <div className="row" style={{ marginTop: 4 }}>
            <span className="meta">{g.pct}% of all rejections</span>
            <div className="spacer"></div>
            <span className="meta">last 24h</span>
          </div>
        </div>
      ))}

      <div className="card" style={{ gridColumn: "1 / -1", padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center" }}>
          <div>
            <h3 className="h3">Rejected classifications</h3>
            <div className="meta" style={{ marginTop: 2 }}>The system's anti-hallucination receipts — outputs caught before reaching the user.</div>
          </div>
          <div className="spacer"></div>
          <button className="btn btn-primary compact" onClick={onOpenReverify}>
            <IconGlyph name="refresh" size={14} /> Bulk re-verify
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Rejection</th>
              <th style={{ width: 200 }}>Gate</th>
              <th style={{ width: 180 }}>Hash</th>
              <th style={{ width: 140 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {rejections.map(r => (
              <tr key={r.entryNo}>
                <td><input type="checkbox" style={{ accentColor: "var(--teal-600)" }} /></td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: "var(--ink-900)" }}>{r.desc.split(" · ")[0]}</span>
                    <span className="mono small muted">entry #{r.entryNo} · by {r.actor}</span>
                  </div>
                </td>
                <td><GateBadge text={r.desc.split(" · ").slice(1).join(" · ")} /></td>
                <td><HashBadge hash={r.ownHash} /></td>
                <td className="mono small muted">{r.ts.replace("T", " ").slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GateBadge({ text }) {
  const isG1 = /Gate 1/i.test(text);
  const isG2 = /Gate 2/i.test(text);
  const isG3 = /Gate 3/i.test(text);
  const color = isG1 ? "var(--info)" : isG2 ? "var(--warning)" : isG3 ? "var(--danger)" : "var(--ink-500)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-700)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }}></span>
      {text || "—"}
    </span>
  );
}
