// ===========================================================
// ClauseChain — Modals & Drawers
// ===========================================================
/* global React, Modal, Drawer, IconGlyph, HashBadge, VerificationChain, VerbatimBlock,
   SourceUrlRow, SEED_REGISTRY, JURISDICTIONS, SAMPLE_CONFLICT, DOC_DETAIL_BDDSA,
   LIVE_LOG, PIPELINE_JOBS */

const { useState: useModState } = React;

// ---------- 1.1 Add Jurisdiction ----------
window.AddJurisdictionModal = function AddJurisdictionModal({ open, onClose }) {
  const [country, setCountry] = useModState("Vietnam");
  const [display, setDisplay] = useModState("Vietnam");
  const [seedUrls, setSeedUrls] = useModState([
    "https://congbao.chinhphu.vn",
    "https://www.mic.gov.vn",
    "https://nim.gov.vn",
  ]);

  return (
    <Modal open={open} onClose={onClose} title="Add jurisdiction" subtitle="Bring a new country into the workspace and trigger initial discovery."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-primary" onClick={() => { onClose(); window.showToast?.("Discovery started for " + display); }}>
               Add jurisdiction
             </button>
           </>}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="field-label">Country</label>
            <select className="select" value={country} onChange={(e) => { setCountry(e.target.value); setDisplay(e.target.value); }}>
              <option>Vietnam</option><option>Indonesia</option><option>Sri Lanka</option>
              <option>Malaysia</option><option>India</option><option>Nepal</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Display name</label>
            <input className="input" value={display} onChange={(e) => setDisplay(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Primary languages</label>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            {["Vietnamese", "English", "Bahasa", "Sinhala", "Tamil"].map(l => (
              <button key={l} className="chip" style={{ border: "1px solid var(--ink-300)", background: l === "Vietnamese" || l === "English" ? "var(--teal-50)" : "var(--white)", color: l === "Vietnamese" || l === "English" ? "var(--teal-600)" : "var(--ink-700)", cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Official source URLs · seed registry</label>
          <div className="col" style={{ gap: 6 }}>
            {seedUrls.map((u, i) => (
              <div key={i} className="row" style={{ gap: 8 }}>
                <SourceUrlRow url={u} status="ok" />
                <button className="btn-icon" onClick={() => setSeedUrls(seedUrls.filter((_, j) => j !== i))}><IconGlyph name="trash" size={14} /></button>
              </div>
            ))}
            <button className="btn btn-secondary compact" style={{ alignSelf: "flex-start", marginTop: 4 }}>
              <IconGlyph name="plus" size={12} /> Add URL
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Authority hierarchy</label>
          <div className="col" style={{ gap: 6 }}>
            {["Primary legislation", "Amending instruments", "Regulations", "Guidelines (non-binding)"].map((a, i) => (
              <div key={a} className="row" style={{ padding: "8px 12px", background: "var(--ink-50)", borderRadius: 8, border: "1px solid var(--ink-200)" }}>
                <span className="mono" style={{ color: "var(--ink-500)", fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontSize: 13 }}>{a}</span>
                <IconGlyph name="more" size={14} />
              </div>
            ))}
          </div>
        </div>

        <div className="small" style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "var(--info-bg)", borderRadius: 8, color: "#1D4ED8" }}>
          <IconGlyph name="shield" size={14} />
          <span>Polite crawling: ClauseChain respects <span className="mono">robots.txt</span> and rate-limits requests to ≤ 2/s with an identifying user-agent. No source server is hit more than once per second.</span>
        </div>
      </div>
    </Modal>
  );
};

// ---------- 2.1 Add Document ----------
window.AddDocumentModal = function AddDocumentModal({ open, onClose, country }) {
  const [tab, setTab] = useModState("crawl");
  const seeds = SEED_REGISTRY[country] || SEED_REGISTRY.BD;
  return (
    <Modal open={open} onClose={onClose} title="Add document" subtitle="Three ways to ingest a new instrument."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-primary" onClick={() => { onClose(); window.showToast?.("Ingestion started · 3 stages"); }}>Start ingestion</button>
           </>}>
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${tab === "crawl" ? "active" : ""}`} onClick={() => setTab("crawl")}>Crawl from URL</button>
        <button className={`tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>Upload file</button>
        <button className={`tab ${tab === "seed" ? "active" : ""}`} onClick={() => setTab("seed")}>Pick from seeds</button>
      </div>

      {tab === "crawl" && (
        <div className="col" style={{ gap: 16 }}>
          <div className="field">
            <label className="field-label">Source URL</label>
            <input className="input" placeholder="https://…" />
          </div>
          <div className="small muted">Type and language will be auto-detected; you can override below.</div>
        </div>
      )}

      {tab === "upload" && (
        <div style={{ border: "2px dashed var(--ink-300)", borderRadius: 12, padding: 32, textAlign: "center", color: "var(--ink-500)" }}>
          <IconGlyph name="upload" size={32} />
          <div style={{ marginTop: 12, fontSize: 15, color: "var(--ink-900)", fontWeight: 500 }}>Drag PDF, HTML, or DOCX here</div>
          <div className="small">or click to browse · ≤ 50MB · OCR will run for scanned PDFs</div>
        </div>
      )}

      {tab === "seed" && (
        <div className="col" style={{ gap: 6 }}>
          {seeds.map(s => (
            <div key={s.url} className="row" style={{ padding: 12, border: "1px solid var(--ink-200)", borderRadius: 10 }}>
              <SourceUrlRow url={s.url} status={s.status} />
              <button className="btn btn-tertiary compact">Add</button>
            </div>
          ))}
        </div>
      )}

      <div className="card-divider"></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="field-label">Type</label>
          <select className="select"><option>Act</option><option>Amendment</option><option>Regulation</option><option>Guideline</option></select>
        </div>
        <div className="field">
          <label className="field-label">Language</label>
          <select className="select"><option>Auto-detect</option><option>English</option><option>Bengali</option><option>Thai</option></select>
        </div>
        <div className="field">
          <label className="field-label">Authority</label>
          <select className="select"><option>Primary</option><option>Amending</option><option>Subordinate</option></select>
        </div>
      </div>
    </Modal>
  );
};

// ---------- 2.2 Crawl Status Drawer ----------
window.CrawlStatusDrawer = function CrawlStatusDrawer({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Crawl & pipeline" subtitle="Live view of every job. Pausable. Per-job cancellable.">
      <div className="col" style={{ gap: 20 }}>
        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Running</div>
          <div className="col" style={{ gap: 10 }}>
            {PIPELINE_JOBS.map(j => (
              <div key={j.id} className="card tight">
                <div className="row" style={{ marginBottom: 6 }}>
                  <span className="chip-pillar">{j.stage}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-900)", flex: 1 }}>{j.name}</span>
                  <button className="btn-icon" title="Cancel"><IconGlyph name="x" size={14} /></button>
                </div>
                <div className="progress"><div style={{ width: `${j.progress}%` }}></div></div>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="mono small muted">{j.progress}%</span>
                  <div className="spacer"></div>
                  <span className="meta">eta 1m 20s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="caption">Live log</span>
            <div className="spacer"></div>
            <button className="btn-icon" title="Pause"><IconGlyph name="pause" size={14} /></button>
          </div>
          <div className="live-log" style={{ maxHeight: 280 }}>
            {LIVE_LOG.map((l, i) => (
              <div key={i}><span className="ts">{l.ts}</span> <span className={l.lvl}>[{l.lvl.toUpperCase()}]</span> {l.text}</div>
            ))}
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Recently completed</div>
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ padding: "8px 12px", background: "var(--success-bg)", borderRadius: 8, fontSize: 13 }}>
              <IconGlyph name="check" size={14} style={{ color: "var(--success)" }} />
              <span>BD-DSA-2018 · classification batch complete</span>
              <span className="spacer"></span>
              <span className="meta">2m ago</span>
            </div>
            <div className="row" style={{ padding: "8px 12px", background: "var(--info-bg)", borderRadius: 8, fontSize: 13 }}>
              <IconGlyph name="cloud" size={14} style={{ color: "var(--info)" }} />
              <span>MAS Notice 626 · ingested · 18 pages</span>
              <span className="spacer"></span>
              <span className="meta">12m ago</span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ---------- 3.1 Citation Detail Drawer ----------
window.CitationDetailDrawer = function CitationDetailDrawer({ open, onClose }) {
  const cls = DOC_DETAIL_BDDSA.classification;
  return (
    <Drawer open={open} onClose={onClose} title="Citation provenance" subtitle="Full chain · reproducibly verifiable by any third party"
            footer={<>
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary"><IconGlyph name="refresh" size={14} /> Re-verify now</button>
            </>}>
      <div className="col" style={{ gap: 20 }}>
        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Citation hash</div>
          <div className="row" style={{ padding: 12, background: "var(--ink-50)", borderRadius: 10, border: "1px solid var(--ink-200)" }}>
            <IconGlyph name="hash" size={16} />
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-900)", wordBreak: "break-all", flex: 1 }}>{cls.hash}</span>
            <HashBadge hash={cls.hash} />
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 12 }}>Provenance chain</div>
          <div>
            <ChainStep status="pass" title="Source retrieved" meta={cls.provenance.sourceUrl} icon="cloud" />
            <ChainStep status="pass" title="Layout-aware extraction" meta="Docling · 42 pp · structure preserved" icon="layers" />
            <ChainStep status="pass" title="Character offset bound" meta={`offset ${cls.provenance.charOffset} · bbox ${cls.provenance.bbox}`} icon="document" />
            <ChainStep status="pass" title="Embedded & retrieved" meta="BGE-M3 · k=12 · hybrid" icon="cpu" />
            <ChainStep status="pass" title="Classifier output" meta="Llama 3.1 8B · constrained JSON" icon="zap" />
            <ChainStep status="pass" title="Gate 1 · Span Match · exact" meta="0 edits" icon="check" />
            <ChainStep status="pass" title="Gate 2 · NLI Entailment · 0.94" meta="DeBERTa-v3 · threshold 0.70" icon="check" />
            <ChainStep status="pass" title="Gate 3 · Structural · passed" meta="§26(1) exists · 2/2 predicates present" icon="check" />
            <ChainStep status="pass" title="Ledger entry #18429 written" meta={cls.hash} icon="ledger" />
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Source verification</div>
          <div className="provenance" style={{ display: "flex", flexDirection: "column" }}>
            <div className="row-item"><dt style={{ minWidth: 80 }}>URL</dt><dd>{cls.provenance.sourceUrl}</dd></div>
            <div className="row-item"><dt style={{ minWidth: 80 }}>SHA-256</dt><dd>{cls.provenance.sha256}</dd></div>
            <div className="row-item"><dt style={{ minWidth: 80 }}>Retrieved</dt><dd>{cls.provenance.retrievedAt}</dd></div>
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Reproduce verification yourself</div>
          <pre style={{ background: "var(--ink-950)", color: "#E4E4E7", padding: 14, borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, overflowX: "auto", margin: 0, lineHeight: 1.6 }}>
{`# 1. Fetch the source document
curl -sLO "${cls.provenance.sourceUrl}"

# 2. Verify the SHA-256 matches
sha256sum bdlaws-act-1261-section-46556.html
# expected: ${cls.provenance.sha256.slice(0, 16)}…

# 3. Re-run the NLI entailment check
python verify.py \\
  --span "${cls.verbatimSpan.slice(0, 40)}…" \\
  --claim "Pillar 6.1 · Data Localization"
# expected: entailment = 0.94`}
          </pre>
        </div>
      </div>
    </Drawer>
  );
};

function ChainStep({ status, title, meta, icon }) {
  return (
    <div className="chain-step">
      <div className={`chain-bullet ${status}`}>
        <IconGlyph name={icon} size={12} />
      </div>
      <div className="chain-body">
        <div className="chain-title">{title}</div>
        <div className="chain-meta">{meta}</div>
      </div>
    </div>
  );
}

// ---------- 3.2 Conflict Resolution ----------
window.ConflictModal = function ConflictModal({ open, onClose }) {
  const [choice, setChoice] = useModState(null);
  const c = SAMPLE_CONFLICT;
  return (
    <Modal open={open} onClose={onClose} wide title="Resolve conflict" subtitle={`Two authoritative sources disagree on “${c.clause}”.`}
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-secondary">Mark unresolved</button>
             <button className="btn btn-primary" disabled={!choice}
                     onClick={() => { onClose(); window.showToast?.(`Source ${choice} chosen · logged in ledger`); }}>
               Apply choice
             </button>
           </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {c.sources.map(s => (
          <div key={s.label} onClick={() => setChoice(s.label)}
               className="card tight"
               style={{
                 cursor: "pointer", padding: 16,
                 borderColor: choice === s.label ? "var(--teal-500)" : "var(--ink-200)",
                 boxShadow: choice === s.label ? "0 0 0 3px var(--teal-50)" : "none",
                 background: choice === s.label ? "var(--teal-50)" : "var(--white)",
                 transition: "var(--t-default)",
               }}>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="chip-pillar" style={{ fontSize: 13, padding: "3px 10px" }}>Source {s.label}</span>
              <span className="chip chip-info">{s.authority}</span>
              <div className="spacer"></div>
              <span className="meta mono">{s.date}</span>
            </div>
            <div className="h3" style={{ marginBottom: 4 }}>{s.instrument}</div>
            <div className="meta" style={{ marginBottom: 12 }}>{s.title}</div>
            <VerbatimBlock text={s.verbatim} />
            <div style={{ marginTop: 12, padding: 10, background: "var(--ink-50)", borderRadius: 8, fontSize: 13 }}>
              <div className="caption" style={{ marginBottom: 2 }}>Classification</div>
              <div style={{ color: "var(--ink-900)", fontWeight: 500 }}>{s.classification}</div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <HashBadge hash={s.hash} />
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ padding: "12px 16px", background: "var(--info-bg)", borderRadius: 10, marginBottom: 16, alignItems: "flex-start" }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--info)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <IconGlyph name="spark" size={14} />
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#1D4ED8" }}>ClauseChain recommendation: Source {c.recommendation.winner}</div>
          <div style={{ fontSize: 13, color: "var(--ink-700)", marginTop: 2 }}>{c.recommendation.rationale}</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Reviewer comment (optional)</label>
        <textarea className="textarea" placeholder="Note your reasoning for the ledger…"></textarea>
      </div>
    </Modal>
  );
};

// ---------- 3.3 Edit Classification ----------
window.EditClassificationModal = function EditClassificationModal({ open, onClose }) {
  const cls = DOC_DETAIL_BDDSA.classification;
  const [span, setSpan] = useModState(cls.verbatimSpan);
  const valid = cls.verbatimSpan.includes(span.slice(0, 60));

  return (
    <Modal open={open} onClose={onClose} wide title="Edit classification" subtitle="Human edits preserve audit integrity. Verbatim span must match the source."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-primary" disabled={!valid} onClick={() => { onClose(); window.showToast?.("Classification updated · new ledger entry #18430"); }}>Save edit</button>
           </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field">
          <label className="field-label">Pillar</label>
          <select className="select" defaultValue="6.1">
            <option>6.1 — Data Localization</option><option>6.2 — Conditional Cross-Border</option>
            <option>6.3 — Adequacy</option><option>7.1 — Lawful Basis</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Sub-criterion</label>
          <input className="input" defaultValue="Data localization requirement" />
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">Verbatim span <span style={{ color: "var(--ink-500)", textTransform: "none", letterSpacing: 0 }}>· must appear in source</span></label>
          <textarea className="textarea" value={span} onChange={(e) => setSpan(e.target.value)} style={{ minHeight: 120, fontFamily: "var(--font-mono)", fontSize: 13 }} />
          <div className="row" style={{ marginTop: 4 }}>
            {valid ? (
              <span className="chip chip-verified"><IconGlyph name="check" size={12} /> Span matches source (exact)</span>
            ) : (
              <span className="chip chip-rejected"><IconGlyph name="x" size={12} /> Span not found in source · save blocked</span>
            )}
            <div className="spacer"></div>
            <span className="meta mono">{span.length} chars · OCR tolerance ≤ 2 edits</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Principal rule</label>
          <textarea className="textarea" defaultValue={cls.principalRule}></textarea>
        </div>
        <div className="field">
          <label className="field-label">Exceptions · conditions</label>
          <textarea className="textarea" defaultValue={cls.exceptions.join("\n") + "\n\n" + cls.conditions.join("\n")}></textarea>
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">Reason for edit · required</label>
          <select className="select">
            <option>Rubric refinement</option>
            <option>Model misclassification</option>
            <option>Improved verbatim span</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">Comment (optional)</label>
          <textarea className="textarea" placeholder="Note your reasoning for the audit history…"></textarea>
        </div>
      </div>
    </Modal>
  );
};

// ---------- 3.4 Reject with Reason ----------
window.RejectModal = function RejectModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Reject classification"
           subtitle="Tell the system why. The rejection feeds back into the re-classification queue."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-destructive solid"
                     onClick={() => { onClose(); window.showToast?.("Rejected · ledger entry #18430"); }}>
               <IconGlyph name="x" size={14} /> Confirm rejection
             </button>
           </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="card tight" style={{ background: "var(--ink-50)", border: "1px solid var(--ink-200)" }}>
          <div className="row">
            <span className="chip chip-verified"><IconGlyph name="check" size={12} /> Currently verified</span>
            <span className="chip-pillar">§26(1)</span>
            <div className="spacer"></div>
            <span className="mono small muted">Pillar 6.1</span>
          </div>
          <div className="small" style={{ marginTop: 8 }}>You are rejecting this classification of <strong>BD-DSA-2018</strong>.</div>
        </div>

        <div className="field">
          <label className="field-label">Reason · required</label>
          <select className="select">
            <option>Wrong pillar</option>
            <option>Verbatim does not support the claim</option>
            <option>Source not authoritative</option>
            <option>Clause not applicable to RDTII</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Comment (optional)</label>
          <textarea className="textarea" placeholder="What did the model miss?"></textarea>
        </div>
      </div>
    </Modal>
  );
};

// ---------- 4.1 Matrix Cell Drilldown ----------
window.CellDrilldownModal = function CellDrilldownModal({ open, onClose, data, onNavigate }) {
  if (!data) return null;
  const { jurisdiction, pillar, sub, name, cell } = data;
  if (!cell) return (
    <Modal open={open} onClose={onClose} title={`${jurisdiction.name} · Pillar ${sub}`} subtitle={name}>
      <div className="empty">
        <IconGlyph name="document" size={36} />
        <div className="head">Not covered yet</div>
        <div className="sub">No instrument in this jurisdiction has been classified under {sub} ({name}).</div>
      </div>
    </Modal>
  );

  const sample = [
    { instrument: "BD-DSA-2018", section: "§26(1)", status: "verified", snippet: "shall not save such data, including biometric information…outside Bangladesh." },
    { instrument: "BD-DSA-2018", section: "§26(2)", status: "verified", snippet: "Storage of such data within the territory of Bangladesh shall be subject to…" },
    { instrument: "BD-PDPA-2023D", section: "§14",  status: "pending",  snippet: "A data controller shall ensure that personal data is processed within Bangladesh unless…" },
    { instrument: "BD-ICTA-2006", section: "§54",  status: "rejected", snippet: "Service providers shall maintain logs… [Gate 2 NLI: 0.31]" },
  ];

  return (
    <Modal open={open} onClose={onClose} wide title={`${jurisdiction.flag} ${jurisdiction.name} · Pillar ${sub}`} subtitle={name}
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Close</button>
             <button className="btn btn-primary" onClick={() => { onClose(); onNavigate({ page: "doc", country: jurisdiction.code, doc: "BD-DSA-2018" }); }}>
               View in document workspace <IconGlyph name="arrowR" size={12} />
             </button>
           </>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div className="card tight" style={{ borderColor: "var(--success)", background: "var(--success-bg)" }}>
          <div className="caption" style={{ color: "#047857" }}>Verified</div>
          <div className="kpi-value" style={{ fontSize: 32, color: "#047857" }}>{Math.floor(cell.count * 0.7)}</div>
        </div>
        <div className="card tight" style={{ borderColor: "var(--warning)", background: "var(--warning-bg)" }}>
          <div className="caption" style={{ color: "#B45309" }}>Pending</div>
          <div className="kpi-value" style={{ fontSize: 32, color: "#B45309" }}>{Math.max(1, Math.floor(cell.count * 0.2))}</div>
        </div>
        <div className="card tight" style={{ borderColor: cell.conflict ? "var(--danger)" : "var(--ink-300)", background: cell.conflict ? "var(--danger-bg)" : "var(--ink-50)" }}>
          <div className="caption" style={{ color: cell.conflict ? "#B91C1C" : "var(--ink-500)" }}>Conflicts</div>
          <div className="kpi-value" style={{ fontSize: 32, color: cell.conflict ? "#B91C1C" : "var(--ink-700)" }}>{cell.conflict ? 1 : 0}</div>
        </div>
      </div>

      <div className="caption" style={{ marginBottom: 8 }}>Contributing classifications</div>
      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>Instrument</th><th>Section</th><th>Status</th><th>Excerpt</th></tr></thead>
          <tbody>
            {sample.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 12 }}>{r.instrument}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.section}</td>
                <td><StatusChipInline status={r.status} /></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-700)", maxWidth: 320 }}>{r.snippet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
function StatusChipInline({ status }) {
  return <span className={`chip ${status === "verified" ? "chip-verified" : status === "pending" ? "chip-pending" : "chip-rejected"}`}><span className="dot"></span>{status}</span>;
}

// ---------- 4.2 Export Modal ----------
window.ExportModal = function ExportModal({ open, onClose }) {
  const [format, setFormat] = useModState("csv");
  return (
    <Modal open={open} onClose={onClose} title="Export workspace" subtitle="Generate exportable artefacts with full provenance."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <button className="btn btn-primary" onClick={() => { onClose(); window.showToast?.("Export queued · check downloads in 30s"); }}>Export</button>
           </>}>
      <div className="col" style={{ gap: 18 }}>
        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Format</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <FormatPick label="CSV" desc="Matrix structure · spreadsheet-friendly" active={format === "csv"} onClick={() => setFormat("csv")} icon="fileText" />
            <FormatPick label="JSON Lines" desc="Full classifications · with citations" active={format === "jsonl"} onClick={() => setFormat("jsonl")} icon="document" />
            <FormatPick label="Provenance bundle" desc="Sources + hashes + ledger · zipped" active={format === "zip"} onClick={() => setFormat("zip")} icon="layers" />
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Scope</div>
          <div className="col" style={{ gap: 6 }}>
            {JURISDICTIONS.map(j => (
              <label key={j.code} className="row" style={{ padding: "8px 10px", border: "1px solid var(--ink-200)", borderRadius: 8, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--teal-600)" }} />
                <span style={{ fontSize: 14 }}>{j.flag} {j.name}</span>
                <div className="spacer"></div>
                <span className="meta">{j.clauses} clauses</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Include</div>
          <div className="col" style={{ gap: 6 }}>
            {[
              ["Full verbatim spans", true],
              ["Source SHA-256 hashes", true],
              ["Verification scores (NLI · Span Match · Structural)", true],
              ["Rejected classifications (transparency reporting)", true],
              ["Reviewer comments", false],
            ].map(([label, def]) => (
              <label key={label} className="row" style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked={def} style={{ accentColor: "var(--teal-600)" }} />
                <span style={{ fontSize: 13.5 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="provenance" style={{ display: "block" }}>
          <div className="caption" style={{ marginBottom: 4 }}>Filename preview</div>
          <div className="mono" style={{ color: "var(--ink-900)", fontSize: 13 }}>
            clausechain_rdtii-matrix_BD-TH-SG_{new Date().toISOString().slice(0,10)}.{format === "jsonl" ? "jsonl" : format === "zip" ? "zip" : "csv"}
          </div>
        </div>
      </div>
    </Modal>
  );
};
function FormatPick({ label, desc, active, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: 14, border: "1.5px solid", borderColor: active ? "var(--teal-500)" : "var(--ink-200)",
      borderRadius: 10, background: active ? "var(--teal-50)" : "var(--white)",
      textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4,
      color: active ? "var(--teal-600)" : "var(--ink-900)",
    }}>
      <IconGlyph name={icon} size={18} />
      <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: active ? "var(--teal-600)" : "var(--ink-500)" }}>{desc}</div>
    </button>
  );
}

// ---------- 5.1 Ledger Entry Detail ----------
window.LedgerEntryModal = function LedgerEntryModal({ open, onClose, entry, onNavigate }) {
  if (!entry) return null;
  return (
    <Modal open={open} onClose={onClose} wide title={`Ledger entry #${entry.entryNo}`} subtitle={entry.desc}
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>Close</button>
             <button className="btn btn-secondary"><IconGlyph name="chevL" size={12} /> Previous</button>
             <button className="btn btn-secondary">Next <IconGlyph name="chevR" size={12} /></button>
             <button className="btn btn-primary"><IconGlyph name="shieldCheck" size={14} /> Verify this entry</button>
           </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ padding: 14, background: "var(--success-bg)", border: "1px solid #A7F3D0", borderRadius: 10 }}>
          <IconGlyph name="shieldCheck" size={18} style={{ color: "var(--success)" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#047857" }}>Hash verified in browser</div>
            <div style={{ fontSize: 12, color: "var(--ink-700)" }}>SHA-256 recomputed locally · matches stored value</div>
          </div>
          <div className="spacer"></div>
          <span className="mono small">128 ms</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card tight">
            <div className="caption" style={{ marginBottom: 4 }}>This entry hash</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-900)", wordBreak: "break-all" }}>{entry.ownHash}</div>
          </div>
          <div className="card tight">
            <div className="caption" style={{ marginBottom: 4 }}>Previous entry hash</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-900)", wordBreak: "break-all" }}>{entry.prevHash}</div>
          </div>
        </div>

        <div>
          <div className="caption" style={{ marginBottom: 8 }}>Event payload</div>
          <pre style={{ background: "var(--ink-950)", color: "#E4E4E7", padding: 16, borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, margin: 0, overflowX: "auto" }}>
{JSON.stringify({
  entry_no: entry.entryNo,
  type: entry.type,
  ts: entry.ts,
  actor: entry.actor,
  payload: {
    classification: { instrument: "BD-DSA-2018", section: "§26(1)", pillar: "6.1", confidence: 0.94 },
    verification: { span_match: "exact", nli_score: 0.94, structural_check: "passed" },
    final_decision: entry.type.toLowerCase(),
  },
  own_hash: entry.ownHash,
  prev_hash: entry.prevHash,
}, null, 2)}
          </pre>
        </div>

        <button className="btn btn-tertiary" onClick={() => { onClose(); onNavigate({ page: "doc", country: "BD", doc: "BD-DSA-2018" }); }}>
          Open underlying classification <IconGlyph name="arrowR" size={12} />
        </button>
      </div>
    </Modal>
  );
};

// ---------- 5.2 Re-verify Modal ----------
window.ReverifyModal = function ReverifyModal({ open, onClose }) {
  const [running, setRunning] = useModState(false);
  const [done, setDone] = useModState(false);
  const [pct, setPct] = useModState(0);

  const run = () => {
    setRunning(true); setDone(false); setPct(0);
    const t = setInterval(() => {
      setPct(p => {
        if (p >= 100) { clearInterval(t); setRunning(false); setDone(true); return 100; }
        return p + 8;
      });
    }, 90);
  };

  return (
    <Modal open={open} onClose={onClose} title="Re-verify citations" subtitle="Re-fetch sources, recompute hashes, re-run all three CVR gates."
           footer={<>
             <button className="btn btn-secondary" onClick={onClose}>{done ? "Done" : "Cancel"}</button>
             {!running && !done && <button className="btn btn-primary" onClick={run}>Run re-verification</button>}
           </>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field">
          <label className="field-label">Scope</label>
          <select className="select">
            <option>This citation only</option>
            <option>All citations in current document</option>
            <option>All citations in jurisdiction</option>
            <option>Entire workspace (1,017 citations)</option>
          </select>
        </div>

        <div className="small" style={{ background: "var(--ink-50)", padding: 12, borderRadius: 8, color: "var(--ink-700)" }}>
          Re-verification re-fetches each source from its original URL, recomputes the SHA-256 to detect upstream changes, and re-runs Gate 1 (Span Match), Gate 2 (NLI Entailment), and Gate 3 (Structural Plausibility) on every citation. Failures move into the human review queue.
        </div>

        {(running || done) && (
          <div>
            <div className="progress"><div style={{ width: `${pct}%` }}></div></div>
            <div className="row" style={{ marginTop: 6, fontSize: 12, color: "var(--ink-600)" }}>
              <span>{running ? "Verifying…" : "Complete"}</span>
              <div className="spacer"></div>
              <span className="mono">{pct}%</span>
            </div>
          </div>
        )}

        {done && (
          <div className="row" style={{ padding: 12, background: "var(--success-bg)", borderRadius: 10 }}>
            <IconGlyph name="check" size={18} style={{ color: "var(--success)" }} />
            <div>
              <div style={{ fontWeight: 600, color: "#047857" }}>Re-verification complete</div>
              <div className="small" style={{ color: "var(--ink-700)" }}>96 re-verified · 2 source-hash changes · 1 newly rejected</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
