'use client'
import { useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { MAPPING_STREAM, MappingClause } from '@/lib/clausechain/data'
import { CheckCircle, XCircle, AlertCircle, Cpu, Cloud } from 'lucide-react'

type GateState = 'pass' | 'warn' | 'fail'

function GateDot({ g }: { g: GateState }) {
  return <span className={`gate-dot ${g}`} />
}

function StatusChip({ status }: { status: 'verified' | 'rejected' }) {
  return status === 'verified'
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#047857' }}>
        <CheckCircle size={11} /> verified
      </span>
    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#FEF2F2', color: '#B91C1C' }}>
        <XCircle size={11} /> rejected
      </span>
}

const LLM_ROUTING = [
  { role: 'Retrieval',   model: 'BGE-M3',         kind: 'local',  info: 'k=12, cosine sim' },
  { role: 'Classifier',  model: 'llama-3.1-8b',   kind: 'local',  info: 'q4 quantized, 8 t/s' },
  { role: 'NLI Gate',    model: 'DeBERTa-v3',     kind: 'local',  info: 'threshold 0.70' },
  { role: 'Escalation',  model: 'gpt-4o',         kind: 'cloud',  info: 'NLI < 0.45 or ambiguous' },
]

export default function MappingRun() {
  const [clauses] = useState<MappingClause[]>(MAPPING_STREAM)
  const [selected, setSelected] = useState<MappingClause | null>(null)

  const verified = clauses.filter(c => c.status === 'verified').length
  const rejected = clauses.filter(c => c.status === 'rejected').length
  const escalated = clauses.filter(c => c.escalated).length

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Mapping Run' }]}>
      <PipelineStepper activeId="map" />

      <div style={{ padding: '24px 32px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cc-ink-950)', margin: 0 }}>Mapping Run</h1>
            <p style={{ fontSize: 13, color: 'var(--cc-ink-500)', marginTop: 4 }}>run-BD-001 · CVR loop · {clauses.length} clauses processed</p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Verified', v: verified, color: '#10B981' },
              { label: 'Rejected', v: rejected, color: '#EF4444' },
              { label: 'Escalated', v: escalated, color: '#3B82F6' },
            ].map(k => (
              <div key={k.label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 24, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left: Live clause stream */}
          <div>
            <div className="mapping-stream">
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 80px', gap: 12, padding: '10px 16px', background: 'var(--cc-ink-50)', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>
                <span>Ref</span>
                <span>Clause text</span>
                <span>Gates</span>
                <span>Pillar</span>
                <span>Status</span>
              </div>
              {clauses.map(c => (
                <div
                  key={c.id}
                  className={`mapping-row ${c.status === 'rejected' ? 'mr-rejected' : ''}`}
                  style={{ background: selected?.id === c.id ? 'var(--cc-teal-50)' : undefined }}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                >
                  <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--cc-ink-700)' }}>{c.ref}</span>
                  <span style={{ fontSize: 13, color: 'var(--cc-ink-800)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {c.text}
                  </span>
                  <div className="gate-dots">
                    {c.gates.map((g, i) => <GateDot key={i} g={g} />)}
                    <span style={{ marginLeft: 4, fontFamily: 'var(--cc-font-mono)', fontSize: 10, color: 'var(--cc-ink-400)' }}>
                      {c.scores[1]}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--cc-ink-800)' }}>{c.pillar}</span>
                    <div style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{c.pillarLabel}</div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Routing panel + CVR tally */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* CVR tally */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 8 }}>CVR tally</div>
              <div className="cvr-tally">
                <div className="cvr-tally-cell">
                  <div className="cvr-tally-num" style={{ color: '#10B981' }}>{verified}</div>
                  <div style={{ fontSize: 11, color: 'var(--cc-ink-500)', marginTop: 4 }}>Verified</div>
                </div>
                <div className="cvr-tally-cell">
                  <div className="cvr-tally-num" style={{ color: '#EF4444' }}>{rejected}</div>
                  <div style={{ fontSize: 11, color: 'var(--cc-ink-500)', marginTop: 4 }}>Rejected</div>
                </div>
                <div className="cvr-tally-cell">
                  <div className="cvr-tally-num" style={{ color: '#3B82F6' }}>{escalated}</div>
                  <div style={{ fontSize: 11, color: 'var(--cc-ink-500)', marginTop: 4 }}>Escalated</div>
                </div>
              </div>
            </div>

            {/* LLM routing */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 8 }}>LLM routing</div>
              <div className="routing-panel">
                {LLM_ROUTING.map(r => (
                  <div key={r.role} className="routing-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cc-ink-800)', marginBottom: 2 }}>{r.role}</div>
                      <div style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{r.info}</div>
                    </div>
                    <span className={`model-badge ${r.kind === 'local' ? 'model-local' : 'model-cloud'}`}>
                      {r.kind === 'local' ? <Cpu size={10} /> : <Cloud size={10} />}
                      {r.model}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost meter */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 12 }}>Cost meter</div>
              {[
                { label: 'Local inference', cost: '$0.00', note: 'On-device GPU', pct: 0 },
                { label: 'GPT-4o (1 call)', cost: '$0.02', note: '§42(3) escalation', pct: 100 },
                { label: 'Total run cost', cost: '$0.02', note: '12 clauses', pct: null },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cc-ink-800)' }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{row.note}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 14, fontWeight: 700, color: row.pct === 0 ? '#10B981' : 'var(--cc-ink-900)' }}>{row.cost}</div>
                </div>
              ))}
            </div>

            {/* Selected clause detail */}
            {selected && (
              <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 10 }}>
                  Clause detail · {selected.ref}
                </div>
                <div style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--cc-ink-800)', background: 'var(--cc-ink-50)', padding: '10px 12px', borderRadius: 8, marginBottom: 10 }}>
                  {selected.text}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {selected.gates.map((g, i) => (
                    <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: g === 'pass' ? '#ECFDF5' : g === 'warn' ? '#FFFBEB' : '#FEF2F2', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: g === 'pass' ? '#047857' : g === 'warn' ? '#B45309' : '#B91C1C', marginBottom: 2 }}>
                        Gate {i + 1}
                      </div>
                      <div style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 700, color: g === 'pass' ? '#047857' : g === 'warn' ? '#B45309' : '#B91C1C' }}>
                        {selected.scores[i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                  <StatusChip status={selected.status} />
                  <span className={`model-badge ${selected.escalated ? 'model-cloud' : 'model-local'}`}>
                    {selected.escalated ? <Cloud size={10} /> : <Cpu size={10} />}
                    {selected.model}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proceed bar */}
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--cc-ink-500)' }}>{verified} verified · {rejected} rejected · ready to commit</span>
          <a href="/pipeline/trace" className="flex items-center gap-2 px-5 h-10 rounded-[10px] text-sm font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors" style={{ textDecoration: 'none' }}>
            View source trace →
          </a>
        </div>
      </div>
    </WorkspaceShell>
  )
}
