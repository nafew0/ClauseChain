'use client'
import { useEffect, useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { OCR_CONSENSUS, OcrRegion } from '@/lib/clausechain/data'
import { AlertCircle, CheckCircle, Pause, Play } from 'lucide-react'

type Tab = 'split' | 'ocr' | 'tree'

const CANONICAL_MARKDOWN = `# Digital Security Act, 2018

## Part V — Crimes and Punishments

### Section 26 — Punishment for publishing identity-related information

**26(1)** Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, **outside the geographic boundaries of Bangladesh.**

**26(2)** Whoever commits the offence under sub-section (1) shall be punished with imprisonment for a term not exceeding seven (7) years, or with fine not exceeding five lakh taka, or with both.

---

### Section 27 — Cyber-terrorism

**27(1)** If any person commits or attempts to commit any offence in relation to any critical information infrastructure or cyber infrastructure…`

const SIMULATED_PDF = `CHAPTER V

CRIMES AND PUNISHMENTS

Section 26. Punishment for publishing identity-related information

(1) Any person who, intentionally or knowingly without lawful authority, collects, sells, takes
possession of, supplies or uses any person's identity-related information, shall not save such
data, including biometric information, photographs, financial records or registry information,
outside the geographic boundaries of Bangladesh.

(2) Whoever commits the offence under sub-section (1) shall be punished with imprisonment
for a term not exceeding seven (7) years, or with fine not exceeding five lakh taka, or with
both.

Section 27. Cyber-terrorism

(1) If any person commits or attempts to commit any offence in relation to any critical
information infrastructure or cyber infrastructure with the intention of causing or likely
to cause death or injury to any person, or serious damage to or destruction of any
critical information infrastructure or any cyber infrastructure…`

const RISK_EVENTS = [
  { token: 'shall not', risk: 'Negation preserved', score: 0.96, status: 'pass' },
  { token: 'outside', risk: 'Cross-border location term', score: 0.91, status: 'pass' },
  { token: 'বায়োমেট্রিক', risk: 'Bengali legal term repaired', score: 0.88, status: 'warn' },
  { token: 'adequate safeguards', risk: 'Rule-exception connector', score: 0.84, status: 'pass' },
  { token: 'shall transfer', risk: 'Conflicts with visual "shall not"', score: 0.58, status: 'fail' },
]

function OcrStatusIcon({ status }: { status: 'agree' | 'disagree' }) {
  return status === 'agree'
    ? <CheckCircle size={15} color="#10B981" />
    : <AlertCircle size={15} color="#F59E0B" />
}

function HumanPickButton({ region }: { region: OcrRegion }) {
  const [picked, setPicked] = useState<'A' | 'B' | null>(null)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {(['A', 'B'] as const).map(c => {
        const cand = c === 'A' ? region.candidateA : region.candidateB
        return (
          <button
            key={c}
            onClick={() => setPicked(c)}
            style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: picked === c ? 'var(--cc-teal-600)' : 'var(--cc-ink-100)',
              color: picked === c ? 'white' : 'var(--cc-ink-600)',
              border: 'none',
            }}
            title={cand?.model}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

export default function ExtractionWorkspace() {
  const [tab, setTab] = useState<Tab>('split')
  const [riskIdx, setRiskIdx] = useState(0)
  const [riskRunning, setRiskRunning] = useState(false)
  const [riskPaused, setRiskPaused] = useState(false)
  const ocr = OCR_CONSENSUS

  useEffect(() => {
    if (!riskRunning || riskPaused || riskIdx >= RISK_EVENTS.length) return
    const timer = setTimeout(() => setRiskIdx((value) => value + 1), 780)
    return () => clearTimeout(timer)
  }, [riskIdx, riskPaused, riskRunning])

  const startRiskScan = () => {
    if (riskIdx >= RISK_EVENTS.length) setRiskIdx(0)
    setRiskRunning(true)
    setRiskPaused(false)
  }

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Extraction' }]}>
      <PipelineStepper activeId="ocr" />

      <div className="cc-page cc-pipeline-page">
        {/* Header */}
        <div className="cc-page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cc-ink-950)', margin: 0 }}>
              Extraction Workspace
            </h1>
            <p style={{ fontSize: 13, color: 'var(--cc-ink-500)', marginTop: 3 }}>
              {ocr.docTitle} · Page {ocr.page} · {ocr.agreed}/{ocr.totalRegions} regions agree
            </p>
          </div>
          <div style={{ flex: 1 }} />
          {/* OCR agreement summary */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>Agreed</div>
              <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 24, fontWeight: 700, color: '#10B981', lineHeight: 1 }}>{ocr.agreed}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>Disagreed</div>
              <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 24, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>{ocr.disagreed}</div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-sm font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors">
            Accept canonical →
          </button>
        </div>

        <div className="cc-extraction-risk-grid">
          <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--cc-ink-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 15, margin: 0 }}>Legal-term risk stream</h2>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-ink-500)' }}>{riskIdx} / {RISK_EVENTS.length}</span>
            </div>
            <div className="cc-risk-header" style={{ padding: '8px 16px', background: 'var(--cc-ink-50)', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>
              <span>Token</span>
              <span>Risk check</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            {RISK_EVENTS.slice(0, riskIdx).map((event) => (
              <div key={event.token} className="cc-risk-row crawl-stream-row" style={{ padding: '9px 16px', borderBottom: '1px solid var(--cc-ink-100)', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, color: 'var(--cc-ink-900)' }}>{event.token}</span>
                <span style={{ fontSize: 12, color: 'var(--cc-ink-700)' }}>{event.risk}</span>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 700, color: event.status === 'fail' ? '#B91C1C' : event.status === 'warn' ? '#B45309' : '#047857' }}>{event.score.toFixed(2)}</span>
                <span style={{ display: 'inline-flex', justifyContent: 'center', borderRadius: 999, padding: '2px 7px', fontSize: 11, fontWeight: 700, background: event.status === 'fail' ? '#FEF2F2' : event.status === 'warn' ? '#FFFBEB' : '#ECFDF5', color: event.status === 'fail' ? '#B91C1C' : event.status === 'warn' ? '#B45309' : '#047857' }}>{event.status}</span>
              </div>
            ))}
            {riskIdx === 0 && (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--cc-ink-400)', fontSize: 13 }}>
                Run the risk scan to show confidence-aware OCR routing.
              </div>
            )}
          </div>
          <div style={{ background: riskIdx >= RISK_EVENTS.length ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${riskIdx >= RISK_EVENTS.length ? '#A7F3D0' : '#FDE68A'}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: riskIdx >= RISK_EVENTS.length ? '#047857' : '#B45309', marginBottom: 8 }}>
              Confidence-aware routing
            </div>
            <p style={{ fontSize: 13, color: 'var(--cc-ink-700)', lineHeight: 1.5, marginBottom: 12 }}>
              Only disagreement regions and legal-risk tokens get expensive VLM repair. Failed negation checks abstain before mapping.
            </p>
            {!riskRunning || riskIdx >= RISK_EVENTS.length ? (
              <button onClick={startRiskScan} className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-cc-teal-600 text-sm font-medium text-white transition-colors hover:bg-[#0E9F92]">
                <Play size={14} fill="white" stroke="none" /> Run risk scan
              </button>
            ) : (
              <button onClick={() => setRiskPaused((value) => !value)} className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-cc-ink-300 bg-white text-sm font-medium text-cc-ink-900 transition-colors hover:bg-cc-ink-50">
                {riskPaused ? <Play size={14} /> : <Pause size={14} />} {riskPaused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cc-ink-200)', marginBottom: 20 }}>
          {[
            { id: 'split', label: 'Side-by-side' },
            { id: 'ocr',   label: 'OCR Diff' },
            { id: 'tree',  label: 'Canonical tree' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              style={{
                padding: '10px 16px', background: 'none', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                borderBottom: tab === t.id ? '2px solid var(--cc-teal-600)' : '2px solid transparent',
                color: tab === t.id ? 'var(--cc-teal-600)' : 'var(--cc-ink-500)',
                marginBottom: -1,
                transition: 'color 150ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'split' && (
          <div className="extract-panes">
            {/* Source PDF simulation */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
              <div className="extract-pane-header">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                Source · BD-DSA-2018 · Page {ocr.page}
              </div>
              <div className="markdown-out" style={{ fontFamily: '"Times New Roman", serif', fontSize: 14, lineHeight: 1.7, color: '#1F1F23' }}>
                <pre style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {SIMULATED_PDF}
                </pre>
              </div>
            </div>

            {/* Canonical markdown */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
              <div className="extract-pane-header">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                Canonical Markdown · PaddleOCR + Qwen2-VL consensus
              </div>
              <div className="markdown-out">
                {CANONICAL_MARKDOWN.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <div key={i} className="md-h1">{line.slice(2)}</div>
                  if (line.startsWith('## ')) return <div key={i} className="md-h2">{line.slice(3)}</div>
                  if (line.startsWith('### ')) return <div key={i} className="md-h2" style={{ fontSize: 14 }}>{line.slice(4)}</div>
                  if (line === '---') return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--cc-ink-200)', margin: '12px 0' }} />
                  if (line === '') return <div key={i} style={{ height: 6 }} />
                  return <div key={i} className="md-p">{line}</div>
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'ocr' && (
          <div className="cc-table-scroll" style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'auto' }}>
            {/* OCR diff header */}
            <div className="cc-ocr-header" style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 56px', gap: 12, padding: '10px 16px', background: 'var(--cc-ink-50)', borderBottom: '1px solid var(--cc-ink-200)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>
              <span />
              <span>Qwen2-VL</span>
              <span>Tesseract</span>
              <span>Resolved</span>
              <span>Pick</span>
            </div>
            {ocr.regions.map(r => (
              <div key={r.id} className={`ocr-row ${r.status === 'agree' ? 'ocr-agree' : 'ocr-disagree'}`}>
                <span className="ocr-indicator" style={{ paddingTop: 2 }}>
                  <OcrStatusIcon status={r.status} />
                </span>
                <span className={r.status === 'disagree' ? 'ocr-disagree-text' : 'ocr-agree-text'} style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, lineHeight: 1.5 }}>
                  {r.qwen}
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--cc-ink-400)', marginTop: 2 }}>
                    {r.lang === 'bn' ? 'Bengali' : 'English'} · conf {r.confidence.toFixed(2)}
                  </span>
                </span>
                <span className={r.status === 'disagree' ? 'ocr-disagree-text' : 'ocr-agree-text'} style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, lineHeight: 1.5 }}>
                  {r.tesseract}
                  {r.editDistance != null && (
                    <span style={{ display: 'block', fontSize: 10, color: '#EF4444', marginTop: 2 }}>edit dist. {r.editDistance}</span>
                  )}
                </span>
                {r.resolved ? (
                  <span className="ocr-resolved-text" style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12 }}>
                    {r.resolved}
                    <span style={{ display: 'block', fontSize: 10, color: '#10B981', marginTop: 2 }}>
                      {r.candidateA?.model ?? 'Qwen2-VL'} · {r.candidateA?.confidence.toFixed(2)}
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--cc-ink-400)' }}>—</span>
                )}
                {r.status === 'disagree' ? <HumanPickButton region={r} /> : <span />}
              </div>
            ))}
          </div>
        )}

        {tab === 'tree' && (
          <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 14, color: 'var(--cc-ink-600)', marginBottom: 16 }}>Hierarchical document structure extracted by the parser.</div>
            {[
              { level: 0, label: 'Digital Security Act, 2018', type: 'document' },
              { level: 1, label: 'Part I — Preliminary', type: 'part' },
              { level: 2, label: '§1 Short title and commencement', type: 'section' },
              { level: 2, label: '§2 Definitions', type: 'section' },
              { level: 1, label: 'Part II — Digital Security Agency', type: 'part' },
              { level: 2, label: '§5 Establishment of Agency', type: 'section' },
              { level: 1, label: 'Part V — Crimes and Punishments', type: 'part' },
              { level: 2, label: '§26 Punishment for publishing identity-related information', type: 'section', active: true },
              { level: 3, label: '§26(1) Data localization obligation', type: 'clause' },
              { level: 3, label: '§26(2) Punishment quantum', type: 'clause' },
              { level: 2, label: '§27 Cyber-terrorism', type: 'section' },
              { level: 2, label: '§28 Hurting religious values', type: 'section', rejected: true },
            ].map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0 7px', paddingLeft: node.level * 20, borderBottom: '1px solid var(--cc-ink-100)', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: node.active ? 'var(--cc-teal-600)' : node.rejected ? '#EF4444' : 'var(--cc-ink-300)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: node.active ? 'var(--cc-teal-600)' : node.rejected ? '#EF4444' : 'var(--cc-ink-800)', fontWeight: node.active ? 600 : 400, fontFamily: node.type === 'clause' ? 'var(--cc-font-mono)' : 'inherit' }}>
                  {node.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--cc-ink-400)', background: 'var(--cc-ink-100)', padding: '2px 6px', borderRadius: 4 }}>{node.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}
