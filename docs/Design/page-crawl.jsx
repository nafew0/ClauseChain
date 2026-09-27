// ===========================================================
// Page 6 — Discovery & Crawl Console
// ===========================================================
/* global React, CRAWL_STREAM, SEED_REGISTRY, PipelineStepper, IconGlyph */

const { useState: useCrawlState, useEffect: useCrawlEffect, useRef: useCrawlRef } = React;

window.CrawlConsolePage = function CrawlConsolePage({ onNavigate }) {
  const [urlInput, setUrlInput] = useCrawlState("");
  const [autonomy, setAutonomy] = useCrawlState("L1");
  const [started, setStarted] = useCrawlState(false);
  const [streamIdx, setStreamIdx] = useCrawlState(0);
  const [configOpen, setConfigOpen] = useCrawlState(false);
  const logRef = useCrawlRef(null);

  const stream = CRAWL_STREAM.slice(0, streamIdx);
  const fetchedCount = stream.filter(s => s.status === "fetched").length;
  const blockedCount = stream.filter(s => s.status === "blocked").length;
  const skippedCount = stream.filter(s => s.status === "skipped").length;
  const docsFound   = stream.filter(s => s.status === "fetched" && s.confidence > 0.5).length;
  const confVals    = stream.filter(s => s.confidence != null).map(s => s.confidence);
  const avgConf     = confVals.length ? (confVals.reduce((a,b) => a+b, 0) / confVals.length).toFixed(2) : "—";
  const isRunning   = started && streamIdx < CRAWL_STREAM.length;
  const isDone      = started && streamIdx >= CRAWL_STREAM.length;

  useCrawlEffect(() => {
    if (!started || streamIdx >= CRAWL_STREAM.length) return;
    const item = CRAWL_STREAM[streamIdx];
    const delay = item?.status === "blocked" ? 1300 : 650 + Math.random() * 550;
    const t = setTimeout(() => setStreamIdx(i => i + 1), delay);
    return () => clearTimeout(t);
  }, [started, streamIdx]);

  useCrawlEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [streamIdx]);

  const seeds = SEED_REGISTRY["BD"] || [];

  const AUTONOMY = [
    { id: "L0", label: "L0 — Review all",     desc: "Pause on every item",          color: "#EF4444", bg: "#FEF2F2" },
    { id: "L1", label: "L1 — Review flagged", desc: "Auto-proceed high-confidence",  color: "#F59E0B", bg: "#FFFBEB" },
    { id: "L2", label: "L2 — Assisted",       desc: "Surface conflicts only",        color: "#0FB5A7", bg: "#F0FDFA" },
    { id: "L3", label: "L3 — Autonomous",     desc: "Fully hands-off · all logged",  color: "#2563EB", bg: "#EFF6FF" },
  ];

  const LOG_LINES = [
    { ts:"09:12:02", lvl:"info", text:"Crawl4AI v0.4.3 initialised · depth=3 · rate=2req/s · robots.txt=respect" },
    { ts:"09:12:03", lvl:"info", text:"Loaded seed registry: BD · 4 sources · jurisdiction=Bangladesh" },
    { ts:"09:12:04", lvl:"ok",   text:"GET bdlaws.minlaw.gov.bd/act-1261.html → 200 · 142 KB · markdown emitted" },
    { ts:"09:12:05", lvl:"ok",   text:"GET bdlaws.minlaw.gov.bd/act-1261.pdf → 200 · 2.1 MB · type=native-pdf · conf=0.97" },
    { ts:"09:12:08", lvl:"info", text:"robots.txt checked: btrc.gov.bd · /robots.txt parsed · skipping disallowed paths" },
    { ts:"09:12:11", lvl:"ok",   text:"GET dpdt.portal.gov.bd/draft-pdpa-2023.pdf → 200 · 1.4 MB · conf=0.94" },
    { ts:"09:12:14", lvl:"warn", text:"BLOCKED: moca.gov.bd/login.php · login-walled — flagged for manual retrieval" },
    { ts:"09:12:21", lvl:"ok",   text:"GET btrc.gov.bd/circulars/2019-data.pdf → 200 · 4.7 MB · type=scanned-pdf" },
    { ts:"09:12:28", lvl:"warn", text:"BLOCKED: bcc.gov.bd/captcha-gate/ · CAPTCHA detected · not bypassed" },
    { ts:"09:12:31", lvl:"ok",   text:"GET blc.gov.bd/data-policy.html → 200 · 78 KB · relevance=0.68" },
    { ts:"09:12:33", lvl:"ok",   text:"Discovery complete · 10 fetched · 2 blocked · 1 skipped · ready for harvest" },
  ];
  const visibleLog = LOG_LINES.slice(0, Math.max(2, Math.floor((streamIdx / CRAWL_STREAM.length) * LOG_LINES.length) + 2));

  const statusColor = s => s === "fetched" ? "var(--success)" : s === "blocked" ? "var(--danger)" : "var(--ink-400)";
  const confColor   = c => c == null ? "var(--ink-400)" : c > 0.8 ? "var(--success)" : c > 0.5 ? "var(--warning)" : "var(--danger)";

  return (
    <React.Fragment>
      <PipelineStepper activeId="discover" onNavigate={onNavigate} />
      <div className="page" data-screen-label="06 Crawl Console">

        <div className="page-header">
          <div>
            <h1 className="h1">Discovery &amp; Crawl Console</h1>
            <div className="subtitle" style={{ marginTop: 6 }}>
              Bangladesh ·{" "}
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-700)" }}>run-BD-001</span>
              {" "}· Crawl4AI backend
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isDone && (
              <button className="btn btn-secondary"
                      onClick={() => onNavigate({ page: "harvest", runId: "run-BD-001" })}>
                Review harvested docs <IconGlyph name="chevR" size={14} />
              </button>
            )}
            <button
              className={`btn ${started ? "btn-secondary" : "btn-primary"}`}
              onClick={() => { if (!started) { setStarted(true); window.showToast?.("Crawl started · BD seed registry"); } }}
              disabled={started}
              style={{ minWidth: 144 }}>
              {isRunning ? (
                <><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1.5s infinite", marginRight: 6 }}></span>Crawling…</>
              ) : isDone ? (
                <><IconGlyph name="check" size={14} />Crawl complete</>
              ) : (
                <><IconGlyph name="play" size={14} />Start crawl</>
              )}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left: config ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Manual URL */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 className="h3">Manual URL input</h3>
                <div className="spacer"></div>
                <span className="chip chip-info" style={{ fontSize: 10 }}>SSRF-safe</span>
              </div>
              <textarea
                className="textarea"
                style={{ height: 80, fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                placeholder={"Paste one or more URLs — one per line:\nhttps://bdlaws.minlaw.gov.bd/act-1261.pdf"}
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <button className="btn btn-secondary" style={{ marginTop: 8, width: "100%" }}>
                <IconGlyph name="plus" size={14} /> Add to queue
              </button>
            </div>

            {/* Seed registry */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <h3 className="h3">Seed registry</h3>
                <span className="meta" style={{ marginLeft: 8 }}>BD · {seeds.length} sources</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {seeds.map((s, i) => (
                  <div key={i} style={{
                    padding: "8px 12px", borderRadius: "var(--r-md)",
                    border: "1px solid var(--ink-200)", background: "var(--ink-50)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: s.status === "ok" ? "var(--success)" : "var(--warning)" }}></span>
                    <span className="mono" style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</span>
                    <span style={{ fontSize: 10, color: s.status === "ok" ? "var(--success)" : "var(--warning)", fontWeight: 600, textTransform: "uppercase" }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Autonomy selector */}
            <div className="card">
              <h3 className="h3" style={{ marginBottom: 12 }}>Autonomy level</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {AUTONOMY.map(opt => (
                  <div key={opt.id} className="autonomy-card" style={{
                    color: opt.color,
                    borderColor: autonomy === opt.id ? opt.color : "var(--ink-200)",
                    background: autonomy === opt.id ? opt.bg : "var(--white)",
                  }} onClick={() => setAutonomy(opt.id)}>
                    <div style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", background: `${opt.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{opt.id}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 1 }}>{opt.desc}</div>
                    </div>
                    {autonomy === opt.id && <IconGlyph name="check" size={14} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Config drawer */}
            <div className="card tight">
              <button className="row" style={{ width: "100%", background: "none", border: "none", padding: "4px 0", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--ink-700)" }}
                      onClick={() => setConfigOpen(o => !o)}>
                <IconGlyph name="filter" size={14} />
                <span>Crawl4AI configuration</span>
                <div className="spacer"></div>
                <IconGlyph name={configOpen ? "chevD" : "chevR"} size={14} />
              </button>
              {configOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ink-100)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="field"><label className="field-label">Crawl depth</label>
                      <input className="input" type="number" defaultValue={3} /></div>
                    <div className="field"><label className="field-label">Max pages</label>
                      <input className="input" type="number" defaultValue={200} /></div>
                  </div>
                  <div className="field"><label className="field-label">File types</label>
                    <input className="input" defaultValue="pdf, html, docx" /></div>
                  <div className="field"><label className="field-label">Language hint</label>
                    <select className="select">
                      <option>English + Bengali (auto-detect)</option>
                      <option>English only</option>
                      <option>Bengali only</option>
                    </select>
                  </div>
                  <div className="field"><label className="field-label">Keyword / semantic filter</label>
                    <input className="input" defaultValue="data protection, personal data, digital security" /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--r-md)", background: "var(--teal-50)", border: "1px solid var(--teal-100)", fontSize: 12, color: "var(--ink-700)" }}>
                    <IconGlyph name="shieldCheck" size={14} />
                    Respects <code>robots.txt</code> · rate-limited ≤ 2 req/s
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: live monitor ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Counters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Pages crawled",    val: fetchedCount + blockedCount + skippedCount, color: "var(--ink-950)" },
                { label: "Docs found",        val: docsFound,     color: "var(--success)" },
                { label: "Blocked / manual",  val: blockedCount,  color: "var(--danger)" },
                { label: "Confidence avg",    val: avgConf,       color: "var(--teal-600)" },
              ].map((c, i) => (
                <div key={i} style={{ padding: "16px 18px", background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: c.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Stream table */}
            <div className="card flush">
              <div style={{ padding: "12px 20px 10px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 12 }}>
                <h3 className="h3">Crawl frontier</h3>
                {isRunning && (
                  <span style={{ fontSize: 11, color: "var(--teal-600)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal-600)", display: "inline-block", animation: "pulse 1.5s infinite" }}></span>
                    Live
                  </span>
                )}
                {!started && <span className="meta" style={{ fontSize: 12 }}>Start crawl to stream results</span>}
                {isDone && <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>✓ Complete</span>}
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 76 }}>Status</th>
                      <th>URL</th>
                      <th style={{ width: 96 }}>Type</th>
                      <th style={{ width: 72 }}>Size</th>
                      <th style={{ width: 84 }}>Confidence</th>
                      <th style={{ width: 70 }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stream.map((item, i) => (
                      <tr key={item.id} className="crawl-stream-row">
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: statusColor(item.status) }}>
                            {item.status === "fetched" && <IconGlyph name="check" size={11} />}
                            {item.status === "blocked" && <IconGlyph name="x" size={11} />}
                            {item.status === "skipped" && <IconGlyph name="chevR" size={11} />}
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 11, color: "var(--ink-800)" }}>
                            {item.url.replace("https://", "")}
                          </span>
                          {item.note && <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 1 }}>{item.note}</div>}
                        </td>
                        <td><span className="mono" style={{ fontSize: 11, color: "var(--ink-600)" }}>{item.type || "—"}</span></td>
                        <td><span className="mono" style={{ fontSize: 11, color: "var(--ink-600)" }}>{item.size}</span></td>
                        <td>
                          {item.confidence != null
                            ? <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: confColor(item.confidence) }}>{item.confidence.toFixed(2)}</span>
                            : <span style={{ color: "var(--ink-300)" }}>—</span>}
                        </td>
                        <td><span className="mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>{item.ts}</span></td>
                      </tr>
                    ))}
                    {stream.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "36px 0", color: "var(--ink-400)", fontSize: 13 }}>
                          Waiting for crawl to start…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live log */}
            <div className="card flush">
              <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 10 }}>
                <h3 className="h3" style={{ fontSize: 14 }}>Live log</h3>
                <span className="caption" style={{ marginLeft: "auto" }}>Crawl4AI output stream</span>
              </div>
              <div className="live-log" ref={logRef} style={{ maxHeight: 160, borderRadius: "0 0 var(--r-lg) var(--r-lg)" }}>
                {visibleLog.map((l, i) => (
                  <div key={i} style={{ animation: i === visibleLog.length - 1 ? "fadeIn 300ms ease-out" : "none" }}>
                    <span className="ts">{l.ts} </span>
                    <span className={l.lvl}>{l.text}</span>
                  </div>
                ))}
                {visibleLog.length === 0 && (
                  <span style={{ color: "var(--ink-600)" }}>Waiting for crawl to start…</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
