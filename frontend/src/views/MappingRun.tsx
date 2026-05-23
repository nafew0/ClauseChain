'use client'
import { useState, useEffect } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { MAPPING_STREAM } from '@/lib/clausechain/data'
import { Play, Pause, Cpu, Cloud, X } from 'lucide-react'

const LLM_ROUTES = [
  { stage: 'Embedding',      model: 'BGE-M3',         type: 'local', detail: 'Multilingual · 512-dim' },
  { stage: 'Classification', model: 'llama-3.1-8b',   type: 'local', detail: 'Default classifier · Q4_K_M' },
  { stage: 'NLI Gate 2',     model: 'DeBERTa-v3-NLI', type: 'local', detail: 'Entailment · threshold 0.70' },
  { stage: 'Low-confidence', model: 'gpt-4o',         type: 'cloud', detail: 'Escalation only · budget $2.00' },
  { stage: 'Struct. check',  model: 'rule-engine',    type: 'local', detail: 'Predicate matching · no LLM' },
]

export default function MappingRun() {
  const [streamIdx, setStreamIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [autonomy, setAutonomy] = useState<'L0' | 'L1' | 'L2' | 'L3'>('L1')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const visible = MAPPING_STREAM.slice(0, streamIdx)
  const isDone = streamIdx >= MAPPING_STREAM.length

  // Streaming simulation — one clause every ~1.1–1.7s
  useEffect(() => {
    if (!running || paused || streamIdx >= MAPPING_STREAM.length) return
    const delay = 1100 + Math.random() * 600
    const t = setTimeout(() => setStreamIdx(i => i + 1), delay)
    return () => clearTimeout(t)
  }, [running, paused, streamIdx])

  const verified  = visible.filter(r => r.status === 'verified').length
  const rejected  = visible.filter(r => r.status === 'rejected').length
  const escalated = visible.filter(r => r.escalated).length
  const processing = running && !paused && !isDone ? 1 : 0

  const g1pass = visible.filter(r => r.gates[0] === 'pass' || r.gates[0] === 'warn').length
  const g2pass = visible.filter(r => r.gates[1] === 'pass' || r.gates[1] === 'warn').length
  const g3pass = visible.filter(r => r.gates[2] === 'pass' || r.gates[2] === 'warn').length

  const rejections = visible.filter(r => r.status === 'rejected')

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Mapping Run' }]}>
      <PipelineStepper activeId="map" />

      <div style={{ padding: '24px 32px 80px', maxWidth: 1440 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 32, color: 'var(--cc-ink-950)', margin: 0, letterSpacing: '-0.02em' }}>
              Mapping Run
            </h1>
            <div style={{ fontSize: 14, color: 'var(--cc-ink-500)', marginTop: 6 }}>
              BD-DSA-2018 → RDTII Pillars 6 &amp; 7 ·{' '}
              <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12 }}>run-BD-001</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Autonomy pill selector */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--cc-ink-100)', borderRadius: 10, padding: 3 }}>
              {(['L0', 'L1', 'L2', 'L3'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setAutonomy(l)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: autonomy === l ? 'white' : 'transparent',
                    color: autonomy === l ? 'var(--cc-ink-900)' : 'var(--cc-ink-500)',
                    boxShadow: autonomy === l ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {!running && !isDone && (
              <button
                onClick={() => setRunning(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40, borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, background: 'var(--cc-teal-600)', color: 'white', cursor: 'pointer', transition: 'background 150ms' }}
                onMouseOver={e => (e.currentTarget.style.background = '#0E9F92')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--cc-teal-600)')}
              >
                <Play size={14} fill="white" stroke="none" /> Start mapping
              </button>
            )}
            {running && !isDone && !paused && (
              <button
                onClick={() => setPaused(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40, borderRadius: 10, border: '1px solid var(--cc-ink-300)', fontSize: 14, fontWeight: 500, background: 'white', color: 'var(--cc-ink-900)', cursor: 'pointer' }}
              >
                <Pause size={14} /> Pause
              </button>
            )}
            {running && paused && (
              <button
                onClick={() => setPaused(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40, borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, background: 'var(--cc-teal-600)', color: 'white', cursor: 'pointer' }}
              >
                <Play size={14} fill="white" stroke="none" /> Resume
              </button>
            )}
            {isDone && (
              <a
                href="/pipeline/trace"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 40, borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'var(--cc-teal-600)', color: 'white', textDecoration: 'none' }}
              >
                View source trace →
              </a>
            )}
          </div>
        </div>

        {/* ── Progress strip ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--cc-ink-700)', marginBottom: 6 }}>
            <span>
              {!running ? 'Ready' : paused ? 'Paused' : isDone ? 'Complete' : 'Processing clauses…'}
            </span>
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontWeight: 600 }}>
              {streamIdx} / {MAPPING_STREAM.length}
            </span>
          </div>
          <div style={{ height: 7, background: 'var(--cc-ink-200)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: isDone ? '#10B981' : 'var(--cc-teal-600)',
              borderRadius: 999,
              width: `${(streamIdx / MAPPING_STREAM.length) * 100}%`,
              transition: 'width 600ms ease',
            }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ── Left: stream + KPI cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 4 KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Verified',   val: verified,   color: '#047857', bg: '#ECFDF5', border: '#10B98140' },
                { label: 'Rejected',   val: rejected,   color: '#B91C1C', bg: '#FEF2F2', border: '#EF444440' },
                { label: 'Escalated',  val: escalated,  color: '#1D4ED8', bg: '#EFF6FF', border: '#3B82F640' },
                { label: 'Processing', val: processing, color: '#B45309', bg: '#FFFBEB', border: '#F59E0B40' },
              ].map(c => (
                <div key={c.label} style={{ padding: '14px 16px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.color, marginBottom: 6 }}>
                    {c.label}
                  </div>
                  <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {c.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Clause stream table */}
            <div className="mapping-stream">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 16, margin: 0 }}>Clause stream</h3>
                {running && !isDone && !paused && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--cc-teal-600)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cc-teal-600)' }} />
                    Live
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--cc-ink-500)' }}>{streamIdx} / {MAPPING_STREAM.length} processed</span>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 80px', gap: 12, padding: '8px 16px', background: 'var(--cc-ink-50)', borderBottom: '1px solid var(--cc-ink-200)' }}>
                {['Clause', 'Text snippet', 'Pillar', 'CVR Gates', 'Status'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>{h}</div>
                ))}
              </div>

              {visible.map(row => (
                <div
                  key={row.id}
                  className={`mapping-row ${row.status === 'rejected' ? 'mr-rejected' : ''}`}
                  style={{ background: selectedRow === row.id ? 'var(--cc-teal-50)' : undefined }}
                  onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--cc-ink-900)' }}>{row.ref}</span>
                    {row.escalated && (
                      <div style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 600, marginTop: 1 }}>↑ escalated</div>
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, color: 'var(--cc-ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.text}
                    </div>
                  </div>
                  <div>
                    {row.status !== 'rejected' ? (
                      <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, background: 'var(--cc-ink-100)', padding: '2px 6px', borderRadius: 4, color: 'var(--cc-ink-800)' }}>
                        {row.pillar}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>Rejected</span>
                    )}
                  </div>
                  <div>
                    <div className="gate-dots" style={{ marginBottom: 3 }}>
                      {row.gates.map((g, i) => (
                        <span key={i} className={`gate-dot ${g}`} title={`Gate ${i + 1}: ${g}`} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {row.scores.map((s, i) => {
                        const g = row.gates[i]
                        const col = g === 'pass' ? '#10B981' : g === 'warn' ? '#F59E0B' : '#EF4444'
                        return (
                          <span key={i} style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 9, color: col, background: col + '20', padding: '1px 4px', borderRadius: 3 }}>{s}</span>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: row.status === 'verified' ? '#ECFDF5' : '#FEF2F2',
                      color: row.status === 'verified' ? '#047857' : '#B91C1C',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}

              {visible.length === 0 && (
                <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--cc-ink-400)', fontSize: 13 }}>
                  Press <strong style={{ color: 'var(--cc-ink-600)' }}>Start mapping</strong> to begin CVR classification
                </div>
              )}
            </div>

            {/* Rejection inspector — appears dynamically */}
            {rejections.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden', animation: 'cc-fade-in 300ms ease' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 14, margin: 0 }}>Rejection inspector</h3>
                  <span style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                    {rejections.length}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cc-ink-500)' }}>Anti-hallucination catches</span>
                </div>
                {rejections.map(r => (
                  <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--cc-font-mono)', fontWeight: 700, color: 'var(--cc-ink-900)' }}>{r.ref}</span>
                      <span style={{ color: '#B91C1C', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <X size={12} /> {r.rejectedGate ?? 'Gate 2'} failed
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--cc-ink-500)' }}>
                        → proposed{' '}
                        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, background: 'var(--cc-ink-100)', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>
                          {r.pillar}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cc-ink-600)', paddingLeft: 8, borderLeft: '2px solid #FEE2E2' }}>
                      {r.text.slice(0, 100)}…
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: routing + gate throughput + cost ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* CVR gate throughput */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-200)' }}>
                <h3 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 14, margin: 0 }}>CVR gate throughput</h3>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Gate 1 — Span Match',           passed: g1pass, color: '#3B82F6' },
                  { label: 'Gate 2 — NLI Entailment',        passed: g2pass, color: '#F59E0B' },
                  { label: 'Gate 3 — Struct. Plausibility',   passed: g3pass, color: '#10B981' },
                ].map(g => (
                  <div key={g.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--cc-ink-700)' }}>{g.label}</span>
                      <span style={{ fontFamily: 'var(--cc-font-mono)', fontWeight: 600, color: 'var(--cc-ink-900)' }}>
                        {streamIdx > 0 ? `${g.passed}/${streamIdx}` : '—'}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--cc-ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: g.color, borderRadius: 999, width: streamIdx > 0 ? `${(g.passed / streamIdx) * 100}%` : '0%', transition: 'width 600ms ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model routing */}
            <div className="routing-panel">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 14, margin: 0 }}>Model routing</h3>
                <span style={{ marginLeft: 'auto', background: '#ECFDF5', color: '#047857', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>All local</span>
              </div>
              {LLM_ROUTES.map((r, i) => (
                <div key={i} className="routing-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cc-ink-700)' }}>{r.stage}</div>
                    <div style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{r.detail}</div>
                  </div>
                  <span className={`model-badge ${r.type === 'local' ? 'model-local' : 'model-cloud'}`}>
                    {r.type === 'cloud' ? <Cloud size={10} /> : <Cpu size={10} />}
                    {r.model}
                  </span>
                </div>
              ))}
              {escalated > 0 && (
                <div style={{ padding: '10px 16px', background: '#EFF6FF', borderTop: '1px solid var(--cc-ink-200)', fontSize: 12, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cloud size={13} />
                  {escalated} clause{escalated > 1 ? 's' : ''} escalated to gpt-4o · cloud invoked
                </div>
              )}
            </div>

            {/* Cloud budget meter */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: 'var(--cc-ink-700)', fontWeight: 500 }}>Cloud token budget</span>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontWeight: 700, color: 'var(--cc-ink-900)' }}>
                  ${(escalated * 0.004).toFixed(3)} / $2.00
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--cc-ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#3B82F6', borderRadius: 999, width: `${Math.min(100, (escalated * 0.004 / 2) * 100)}%`, transition: 'width 600ms ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--cc-ink-500)', marginTop: 5 }}>
                {escalated > 0
                  ? `${escalated} escalation${escalated > 1 ? 's' : ''} to cloud model`
                  : 'All processing local — $0.00 spent'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
