'use client'
import { useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { CRAWL_STREAM, SEED_REGISTRY, CrawlItem } from '@/lib/clausechain/data'

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
  const seedUrls = SEED_REGISTRY['BD'] ?? []

  const fetched = stream.filter(r => r.status === 'fetched').length
  const blocked = stream.filter(r => r.status === 'blocked').length
  const skipped = stream.filter(r => r.status === 'skipped').length
  const totalBytes = '52.3 MB'

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Crawl Console' }]}>
      <PipelineStepper activeId="discover" />

      <div style={{ padding: '24px 32px 80px', maxWidth: 1440 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 26, color: 'var(--cc-ink-950)', margin: 0 }}>
              Discovery &amp; Crawl Console
            </h1>
            <p style={{ fontSize: 14, color: 'var(--cc-ink-500)', marginTop: 4 }}>
              Bangladesh · run-BD-001 · 🇧🇩 bdlaws.minlaw.gov.bd seed registry
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-sm font-medium border border-cc-ink-300 bg-white text-cc-ink-900 hover:bg-cc-ink-50 transition-colors"
              onClick={() => alert('Crawl paused')}
            >
              Pause
            </button>
            <button
              className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-sm font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors"
            >
              Re-crawl
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Fetched', value: fetched, color: '#10B981' },
            { label: 'Blocked', value: blocked, color: '#EF4444' },
            { label: 'Skipped', value: skipped, color: '#71717A' },
            { label: 'Total size', value: totalBytes, color: 'var(--cc-ink-950)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 36, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Seed URLs + Autonomy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Seed URLs */}
            <div style={{ background: 'white', border: '1px solid var(--cc-ink-200)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cc-ink-100)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>
                Seed registry · BD
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
              <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>Running</span>
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 90px 90px 70px 80px', gap: 12, padding: '8px 16px', background: 'var(--cc-ink-50)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', borderBottom: '1px solid var(--cc-ink-100)' }}>
              <span>Time</span>
              <span>URL</span>
              <span>Type</span>
              <span>Status</span>
              <span>Size</span>
              <span>Conf.</span>
            </div>

            {stream.map(item => (
              <div key={item.id} className="crawl-stream-row" style={{ display: 'grid', gridTemplateColumns: '56px 1fr 90px 90px 70px 80px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--cc-ink-100)', alignItems: 'center', opacity: item.status === 'skipped' ? 0.55 : 1 }}>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-ink-400)' }}>{item.ts}</span>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, color: 'var(--cc-ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.url}>
                  {item.url.replace('https://', '')}
                  {item.note && <span style={{ display: 'block', fontSize: 11, color: '#EF4444', fontFamily: 'inherit' }}>{item.note}</span>}
                </span>
                <span style={{ fontSize: 12, color: 'var(--cc-ink-600)', fontFamily: 'var(--cc-font-mono)' }}>{item.type}</span>
                <span><StatusDot status={item.status} /></span>
                <span style={{ fontSize: 12, color: 'var(--cc-ink-500)', fontFamily: 'var(--cc-font-mono)' }}>{item.size}</span>
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
        </div>
      </div>
    </WorkspaceShell>
  )
}
