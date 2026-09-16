// ===========================================================
// Page 8 — Extraction & Markdown Workspace (incl. 8.1 OCR Diff)
// ===========================================================
/* global React, OCR_CONSENSUS, HARVESTED_DOCS, PipelineStepper, IconGlyph */

const { useState: useExtractState } = React;

// Simulated clean markdown output for BD-DSA-2018
const MARKDOWN_OUTPUT = `# Digital Security Act 2018
**Government of Bangladesh · Act No. 46 of 2018**

---

## Part I — Preliminary

### Section 1 — Short title and commencement

(1) This Act may be called the Digital Security Act, 2018.

(2) It shall come into force on such date as the Government may, by notification in the Official Gazette, appoint.

### Section 2 — Definitions

In this Act, unless the context otherwise requires—

\`"digital security"\` means measures taken to protect digital devices, networks and data from unauthorized access, attacks or damage;

\`"personal data"\` means any information relating to an identified or identifiable natural person;

\`"data localization"\` means the requirement to store, process or transfer data within the geographic boundaries of Bangladesh;

---

## Part V — Crimes and Punishments

### Section 26 — Identity-related data localization

(1) Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, **shall not save such data**, including biometric information, photographs, financial records or registry information, **outside the geographic boundaries of Bangladesh**.

(2) If any person commits the offence under sub-section (1), he shall be punished with imprisonment for a term not exceeding five (5) years, or with fine not exceeding Taka five lakh, or with both.

### Section 27 — Cyber-terrorism

(1) If any person, with the intention to threaten the unity, integrity, security and sovereignty of Bangladesh or to create terror among the public or any section of the public…

### Section 28 — Hurting religious values

(1) If any person intentionally or knowingly publishes or broadcasts any information through website or any electronic format which hurts the religious value or sentiment…
> ⚠️ **CVR Rejected** — Gate 2 NLI entailment 0.15 · not mapped to RDTII`;

// Simulated source paper text
const SOURCE_SECTIONS = [
  { id: "s-prelim", num: "Part I", heading: "Preliminary", content: "This Act may be called the Digital Security Act, 2018. It shall come into force on such date as the Government may, by notification in the Official Gazette, appoint." },
  { id: "s-defs",   num: "§2",    heading: "Definitions", content: "In this Act, unless the context otherwise requires — \"digital security\" means measures taken to protect digital devices, networks and data; \"personal data\" means any information relating to an identified or identifiable natural person; \"data localization\" means the requirement to store, process or transfer data within the geographic boundaries of Bangladesh." },
  { id: "s-26",     num: "§26(1)", heading: "Identity-related data localization", highlight: true,
    content: "Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh." },
  { id: "s-27",     num: "§27",   heading: "Cyber-terrorism", content: "If any person, with the intention to threaten the unity, integrity, security and sovereignty of Bangladesh or to create terror among the public or any section of the public, destroys, damages or disrupts any critical information infrastructure..." },
  { id: "s-28",     num: "§28",   heading: "Hurting religious values", rejected: true,
    content: "If any person intentionally or knowingly publishes or broadcasts any propaganda or campaign against any religion through any website or any electronic form which hurts the religious value or sentiment, shall be punished..." },
];

window.ExtractionWorkspacePage = function ExtractionWorkspacePage({ tab: initTab, onNavigate }) {
  const [activeTab, setActiveTab] = useExtractState(initTab || "split");
  const [activeDoc, setActiveDoc] = useExtractState("hd-001");
  const [humanPick, setHumanPick] = useExtractState({});   // regionId → "A"|"B"

  const doc = HARVESTED_DOCS.find(d => d.id === activeDoc) || HARVESTED_DOCS[0];
  const isScanned = doc.type === "scanned-pdf";

  const TABS = [
    { id: "split", label: "Side-by-Side" },
    { id: "ocr",   label: "OCR Consensus Diff", badge: OCR_CONSENSUS.disagreed },
    { id: "tree",  label: "Canonical Structure" },
  ];

  return (
    <React.Fragment>
      <PipelineStepper activeId={activeTab === "ocr" ? "ocr" : "convert"} onNavigate={onNavigate} />
      <div className="page" data-screen-label="08 Extraction Workspace">

        <div className="page-header">
          <div>
            <h1 className="h1">Extraction Workspace</h1>
            <div className="subtitle" style={{ marginTop: 6 }}>
              {doc.title} · <span className="mono" style={{ fontSize: 12 }}>{doc.type}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select" style={{ height: 40, fontSize: 13, width: 260 }}
                    value={activeDoc} onChange={e => setActiveDoc(e.target.value)}>
              {HARVESTED_DOCS.filter(d => d.keep).map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            <button className="btn btn-secondary"><IconGlyph name="download" size={14} /> Export MD</button>
            <button className="btn btn-primary" onClick={() => {
              window.showToast?.("Extraction accepted → proceeding to mapping");
              setTimeout(() => onNavigate({ page: "map", runId: "run-BD-001" }), 500);
            }}>
              Accept &amp; map <IconGlyph name="arrowR" size={14} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
                    onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ marginLeft: 6, background: "var(--warning)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: "var(--r-full)" }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "split" && <SideBySideView sections={SOURCE_SECTIONS} markdown={MARKDOWN_OUTPUT} />}
        {activeTab === "ocr"   && <OcrDiffView humanPick={humanPick} setHumanPick={setHumanPick} />}
        {activeTab === "tree"  && <CanonicalTreeView />}
      </div>
    </React.Fragment>
  );
};

// ---- Side-by-Side ----
function SideBySideView({ sections, markdown }) {
  return (
    <div className="extract-panes">
      {/* Source */}
      <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="extract-pane-header">
          <IconGlyph name="document" size={14} />
          Source document
          <span style={{ marginLeft: "auto", color: "var(--ink-400)", textTransform: "none", letterSpacing: 0, fontWeight: 400, fontSize: 11 }}>Digital Security Act 2018 · 42 pp</span>
        </div>
        <div className="paper" style={{ flex: 1, overflow: "auto", maxHeight: 580, padding: "32px 40px" }}>
          <h2 style={{ textAlign: "center", fontSize: 16, marginBottom: 4 }}>DIGITAL SECURITY ACT, 2018</h2>
          <p style={{ textAlign: "center", fontSize: 13, color: "#555", marginBottom: 24 }}>Government of Bangladesh · Act No. 46 of 2018</p>
          {sections.map(s => (
            <div key={s.id} className="clause" id={`src-${s.id}`}>
              <strong>{s.num} — {s.heading}</strong>
              <p className={s.highlight ? "clause-highlight" : s.rejected ? "clause-highlight rejected" : ""}>
                {s.content}
              </p>
            </div>
          ))}
          <div className="page-num">Page 14 of 42</div>
        </div>
      </div>

      {/* Markdown output */}
      <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="extract-pane-header">
          <IconGlyph name="zap" size={14} />
          Extracted markdown
          <span style={{ marginLeft: 8 }} className="chip chip-verified">Crawl4AI · Docling</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-400)", textTransform: "none", letterSpacing: 0, fontWeight: 400, fontSize: 11 }}>structure preserved</span>
        </div>
        <div className="markdown-out">
          {markdown.split("\n").map((line, i) => {
            if (line.startsWith("# "))   return <div key={i} className="md-h1">{line.slice(2)}</div>;
            if (line.startsWith("## "))  return <div key={i} className="md-h2">{line.slice(3)}</div>;
            if (line.startsWith("### ")) return <div key={i} className="md-h2" style={{ fontSize: 13 }}>{line.slice(4)}</div>;
            if (line.startsWith("---"))  return <hr key={i} style={{ border: "none", borderTop: "1px solid var(--ink-200)", margin: "12px 0" }} />;
            if (line.startsWith("> "))   return <div key={i} className="md-fence" style={{ borderLeft: "3px solid var(--warning)", background: "var(--warning-bg)" }}>{line.slice(2)}</div>;
            if (line.startsWith("`"))    return <div key={i} className="md-fence">{line}</div>;
            if (line.trim() === "")      return <div key={i} style={{ height: 8 }}></div>;
            return <div key={i} className="md-p" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}></div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ---- OCR Consensus Diff ----
function OcrDiffView({ humanPick, setHumanPick }) {
  const c = OCR_CONSENSUS;
  const agreedPct = Math.round((c.agreed / c.totalRegions) * 100);

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total regions",  val: c.totalRegions, color: "var(--ink-950)" },
          { label: "Both agree",     val: c.agreed,       color: "var(--success)" },
          { label: "Disagreements",  val: c.disagreed,    color: "var(--warning)" },
          { label: "Agreement rate", val: `${agreedPct}%`, color: "var(--teal-600)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr 56px", gap: 12, padding: "10px 16px", background: "var(--ink-50)", borderBottom: "2px solid var(--ink-200)" }}>
          <div></div>
          {["Qwen2-VL", "Tesseract", "Resolved", "Lang"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)" }}>{h}</div>
          ))}
        </div>

        {c.regions.map(r => (
          <OcrRegionRow key={r.id} region={r} pick={humanPick[r.id]} onPick={(v) => setHumanPick(p => ({ ...p, [r.id]: v }))} />
        ))}
      </div>

      <div style={{ marginTop: 12, padding: "10px 16px", background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--ink-700)" }}>
        <strong style={{ color: "var(--teal-600)" }}>OCR consensus resolved:</strong> {c.agreed} regions agree, {c.disagreed} resolved via Qwen2-VL majority. Bengali sections handled by Qwen2-VL exclusively — higher accuracy on non-Latin scripts.
      </div>
    </div>
  );
}

function OcrRegionRow({ region, pick, onPick }) {
  const isDisagree = region.status === "disagree";
  return (
    <div className={`ocr-row ${region.status === "agree" ? "ocr-agree" : "ocr-disagree"}`}>
      {/* Indicator */}
      <div className="ocr-indicator" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 2 }}>
        {region.status === "agree"
          ? <IconGlyph name="check" size={14} />
          : <IconGlyph name="alert" size={14} />}
      </div>

      {/* Qwen */}
      <div>
        <div className={region.status === "agree" ? "ocr-agree-text" : isDisagree && (!pick || pick === "A") ? "ocr-resolved-text" : "ocr-disagree-text"}
             style={{ lineHeight: 1.5, fontFamily: region.lang === "bn" ? "inherit" : "var(--font-mono)", fontSize: 12 }}>
          {region.qwen}
        </div>
        {isDisagree && region.candidateA && (
          <button onClick={() => onPick("A")} style={{ marginTop: 4, fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", border: `1px solid ${(!pick || pick === "A") ? "var(--teal-500)" : "var(--ink-200)"}`, background: (!pick || pick === "A") ? "var(--teal-50)" : "transparent", color: (!pick || pick === "A") ? "var(--teal-600)" : "var(--ink-500)", cursor: "pointer" }}>
            Qwen2-VL · {region.candidateA.confidence.toFixed(2)}
          </button>
        )}
      </div>

      {/* Tesseract */}
      <div>
        <div className={isDisagree ? "ocr-disagree-text" : "ocr-agree-text"}
             style={{ lineHeight: 1.5, fontFamily: region.lang === "bn" ? "inherit" : "var(--font-mono)", fontSize: 12 }}>
          {region.tesseract}
        </div>
        {isDisagree && region.candidateB && (
          <button onClick={() => onPick("B")} style={{ marginTop: 4, fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", border: `1px solid ${pick === "B" ? "var(--ink-500)" : "var(--ink-200)"}`, background: pick === "B" ? "var(--ink-100)" : "transparent", color: pick === "B" ? "var(--ink-900)" : "var(--ink-500)", cursor: "pointer" }}>
            Tesseract · {region.candidateB.confidence.toFixed(2)}
          </button>
        )}
      </div>

      {/* Resolved */}
      <div className="ocr-resolved-text" style={{ fontFamily: region.lang === "bn" ? "inherit" : "var(--font-mono)", fontSize: 12, lineHeight: 1.5 }}>
        {region.resolved || region.qwen}
        {isDisagree && (
          <div style={{ fontSize: 10, color: "var(--ink-500)", marginTop: 3 }}>
            edit dist. {region.editDistance} · auto-resolved
          </div>
        )}
      </div>

      {/* Lang badge */}
      <div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "var(--r-sm)", background: region.lang === "bn" ? "#FEF3C7" : "var(--ink-100)", color: region.lang === "bn" ? "#92400E" : "var(--ink-600)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {region.lang}
        </span>
      </div>
    </div>
  );
}

// ---- Canonical Structure ----
function CanonicalTreeView() {
  const nodes = [
    { depth: 0, label: "Digital Security Act 2018", type: "Act", id: "BD-DSA-2018" },
    { depth: 1, label: "Part I — Preliminary",     type: "Part", id: "p1" },
    { depth: 2, label: "§1 — Short title",         type: "Section", pillar: null, status: "verified" },
    { depth: 2, label: "§2 — Definitions",         type: "Section", pillar: null, status: "verified" },
    { depth: 1, label: "Part V — Crimes & Punishments", type: "Part", id: "p5" },
    { depth: 2, label: "§26(1) — Data localization",    type: "Section", pillar: "6.1", status: "verified" },
    { depth: 2, label: "§27 — Cyber-terrorism",         type: "Section", pillar: "8.2", status: "verified" },
    { depth: 2, label: "§28 — Religious values",        type: "Section", pillar: null,  status: "rejected" },
    { depth: 2, label: "§33 — Hacking offences",        type: "Section", pillar: "8.2", status: "verified", conflict: true },
    { depth: 1, label: "Part VI — Investigation",  type: "Part", id: "p6" },
    { depth: 2, label: "§40 — Investigation procedure", type: "Section", pillar: null, status: "pending" },
  ];
  const statusColors = { verified: "var(--success)", rejected: "var(--danger)", pending: "var(--warning)" };
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--ink-200)", display: "flex", alignItems: "center", gap: 10 }}>
        <h3 className="h3" style={{ fontSize: 15 }}>Canonical structure — BD-DSA-2018</h3>
        <span className="chip chip-verified" style={{ marginLeft: "auto" }}>96 clauses extracted</span>
      </div>
      {nodes.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", paddingLeft: `${20 + n.depth * 24}px`, borderBottom: "1px solid var(--ink-100)", fontSize: 13, background: i % 2 === 0 ? "transparent" : "var(--ink-50)" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", minWidth: 52 }}>{n.type}</span>
          <span style={{ flex: 1, color: n.depth === 0 ? "var(--ink-950)" : "var(--ink-800)", fontWeight: n.depth < 2 ? 600 : 400 }}>{n.label}</span>
          {n.pillar && <span className="chip-pillar">{n.pillar}</span>}
          {n.conflict && <span className="chip chip-conflict" style={{ fontSize: 10 }}>conflict</span>}
          {n.status && <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors[n.status] || "var(--ink-300)", flexShrink: 0 }}></span>}
        </div>
      ))}
    </div>
  );
}
