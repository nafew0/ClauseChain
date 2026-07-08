'use client'
import { useEffect, useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { CRAWL_STREAM, SEED_REGISTRY, CrawlItem } from '@/lib/clausechain/data'
import { Pause, Play } from 'lucide-react'

const AUTONOMY_LEVELS = [
  { id: 'L0', label: 'L0 — Review all',        desc: 'Every URL requires manual approval',      color: '#EF4444' },
  { id: 'L1', label: 'L1 — Review flagged',     desc: 'Low-confidence results need review',       color: '#F59E0B' },
  { id: 'L2', label: 'L2 — Surface conflicts',  desc: 'Only conflicts & blocks need review',      color: '#3B82F6' },
  { id: 'L3', label: 'L3 — Autonomous',         desc: 'Full auto-triage, human notified on error', color: '#10B981' },
]

const STATUS_COLOR: Record<string, string> = {
  fetched: '#10B981',
  skipped: '#71717A',
  blocked: '#EF4444',
}

const confColor = (c: number | null) =>
  c == null ? '#A1A1AA' : c > 0.8 ? '#10B981' : c > 0.5 ? '#F59E0B' : '#EF4444'

function StatusDot({ status }: { status: string }) {
  return (
    <span className="crawl-status-dot" style={{ color: STATUS_COLOR[status] ?? '#A1A1AA' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {status}
    </span>
  )
}

export default function CrawlConsole() {
  const [autonomy, setAutonomy] = useState('L1')
  const [stream] = useState<CrawlItem[]>(CRAWL_STREAM)
  const [streamIdx, setStreamIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const seedUrls = SEED_REGISTRY['SG'] ?? []
  const visible = stream.slice(0, streamIdx)
  const done = streamIdx >= stream.length

  useEffect(() => {
    if (!running || paused || done) return
    const timer = setTimeout(() => setStreamIdx((value) => value + 1), 650)
    return () => clearTimeout(timer)
  }, [done, paused, running, streamIdx])

  const fetched = visible.filter(r => r.status === 'fetched').length
  const blocked = visible.filter(r => r.status === 'blocked').length
  const official = visible.filter(r => r.authority === 'official').length
  const contextOnly = visible.filter(r => r.authority === 'context').length
  const totalBytes = done ? '18.9 MB' : `${(visible.length * 1.7).toFixed(1)} MB`

  const start = () => {
    if (done) setStreamIdx(0)
    setRunning(true)
    setPaused(false)
  }

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Crawl Console' }]}>
      <PipelineStepper activeId="discover" />

      <div className="cc-page cc-pipeline-page">
        {/* Header */}
        <div className="cc-page-header" style={{ marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 26, color: 'var(--cc-ink-950)', margin: 0 }}>
              Discovery &amp; Crawl Console
            </h1>
            <p style={{ fontSize: 14, color: 'var(--cc-ink-500)', marginTop: 4 }}>
              Singapore primary sources + Bangladesh/Thailand stress sources · run-SG-PDPA-001
            </p>
          </div>
          <div className="cc-actions">
            {!running || done ? (
              <button
                onClick={start}
                className="flex h-9 items-center gap-2 rounded-[10px] bg-cc-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-[#0E9F92]"
              >
                <Play size={14} fill="white" stroke="none" /> Start crawl
              </button>
            ) : (
              <button
                className="flex h-9 items-center gap-2 rounded-[10px] border border-cc-ink-300 bg-white px-4 text-sm font-medium text-cc-ink-900 transition-colors hover:bg-cc-ink-50"
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="cc-kpi-grid-five" style={{ marginBottom: 28 }}>
          {[
            { label: 'Fetched', value: fetched, color: '#10B981' },
            { label: 'Official', value: official, color: '#047857' },
            { label: 'Context only', value: contextOnly, color: '#B45309' },
            { label: 'Blocked', value: blocked, color: '#EF4444' },
            { label: 'Total size', value: totalBytes, color: 'var(--cc-ink-950)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 36, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="cc-crawl-layout">
          {/* Left: Seed URLs + Autonomy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Seed URLs */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>
                Seed registry · SG
              </div>
              {seedUrls.map(s => (
                <div key={s.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 12 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.status === 'ok' ? '#10B981' : s.status === 'warn' ? '#F59E0B' : '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--cc-font-mono)', color: 'var(--cc-ink-800)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.url.replace('https://', '')}
                  </span>
                </div>
              ))}
            </div>

            {/* Autonomy level */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 8 }}>
                Autonomy level
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {AUTONOMY_LEVELS.map(l => (
                  <div
                    key={l.id}
                    className={`autonomy-card ${autonomy === l.id ? 'selected' : ''}`}
                    style={autonomy === l.id ? { borderColor: l.color, color: l.color } : {}}
                    onClick={() => setAutonomy(l.id)}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: autonomy === l.id ? l.color : 'var(--cc-ink-900)', marginBottom: 1 }}>{l.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Crawl stream table */}
          <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--cc-ink-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>Live Crawl Stream</span>
              <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: running && !paused && !done ? '#10B981' : '#A1A1AA', animation: running && !paused && !done ? 'pulse 2s infinite' : undefined }} />
              <span style={{ fontSize: 12, color: running && !paused && !done ? '#10B981' : 'var(--cc-ink-500)', fontWeight: 500 }}>
                {!running ? 'Ready' : paused ? 'Paused' : done ? 'Complete' : 'Running'}
              </span>
            </div>

            <div className="cc-table-scroll">
            {/* Column headers */}
            <div className="cc-crawl-stream-header" style={{ padding: '8px 16px', background: 'var(--cc-ink-50)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', borderBottom: '1px solid var(--cc-ink-100)' }}>
              <span>Time</span>
              <span>URL</span>
              <span>Type</span>
              <span>Status</span>
              <span>Authority</span>
              <span>Resolver</span>
              <span>Conf.</span>
            </div>

            {visible.map(item => (
              <div key={item.id} className="cc-crawl-stream-row crawl-stream-row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--cc-ink-100)', alignItems: 'center', opacity: item.status === 'skipped' ? 0.55 : 1 }}>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-ink-400)' }}>{item.ts}</span>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, color: 'var(--cc-ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.url}>
                  {item.url.replace('https://', '')}
                  {item.note && <span style={{ display: 'block', fontSize: 11, color: '#EF4444', fontFamily: 'inherit' }}>{item.note}</span>}
                </span>
                <span style={{ fontSize: 12, color: 'var(--cc-ink-600)', fontFamily: 'var(--cc-font-mono)' }}>{item.type}</span>
                <span><StatusDot status={item.status} /></span>
                <span style={{ fontSize: 11, color: item.authority === 'official' ? '#047857' : item.authority === 'blocked' ? '#B91C1C' : '#B45309', fontWeight: 700 }}>
                  {item.authority ?? 'unknown'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--cc-ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.resolver ?? item.size}
                </span>
                <span>
                  {item.confidence != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--cc-ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.confidence * 100}%`, background: confColor(item.confidence), borderRadius: 999 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, fontWeight: 600, color: confColor(item.confidence), minWidth: 30, textAlign: 'right' }}>{item.confidence.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--cc-ink-400)' }}>—</span>
                  )}
                </span>
              </div>
            ))}
            </div>
            {visible.length === 0 && (
              <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--cc-ink-400)', fontSize: 13 }}>
                Press <strong style={{ color: 'var(--cc-ink-600)' }}>Start crawl</strong> to stream source discovery.
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
