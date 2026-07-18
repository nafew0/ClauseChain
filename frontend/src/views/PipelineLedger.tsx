'use client'
import { useState } from 'react'
import { Check, X, Cloud, AlertTriangle, RefreshCw, Pause, Play, Download, Filter } from 'lucide-react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { HashBadge } from '@/components/clausechain/ui'
import { LedgerEntryModal } from '@/components/clausechain/modals'
import { ACTIVITY, PIPELINE_JOBS, LIVE_LOG, LEDGER_ENTRIES, REJECTIONS, SOURCE_STATUS_EDGES } from '@/lib/clausechain/data'
import type { ActivityEvent, LedgerEntry } from '@/lib/clausechain/data'

type Tab = 'live' | 'ledger' | 'graph' | 'rejections'

const FEED_ICON: Record<ActivityEvent['type'], { icon: React.ReactNode; bg: string; color: string }> = {
  verified: { icon: <Check size={16} />,        bg: 'var(--cc-success-bg)',  color: 'var(--cc-success)' },
  rejected: { icon: <X size={16} />,            bg: 'var(--cc-danger-bg)',   color: 'var(--cc-danger)' },
  ingested: { icon: <Cloud size={16} />,         bg: 'var(--cc-info-bg)',     color: 'var(--cc-info)' },
  conflict: { icon: <AlertTriangle size={16} />, bg: 'var(--cc-warning-bg)', color: 'var(--cc-warning)' },
  crawl:    { icon: <RefreshCw size={16} />,     bg: 'var(--cc-ink-100)',     color: 'var(--cc-ink-700)' },
}

const LOG_COLOR: Record<string, string> = {
  ok:   'var(--cc-success)',
  err:  'var(--cc-danger)',
  warn: 'var(--cc-warning)',
  info: '#93C5FD',
  ok_:  'var(--cc-success)', // alias
}

export default function PipelineLedger({ initialTab = 'live' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [paused, setPaused] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null)

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline & Ledger' }]}>
      <div className="cc-page">
        {/* Header */}
        <div className="cc-page-header">
          <div>
            <h1
              className="cc-page-title leading-[1.15] text-cc-ink-950"
              style={{ fontFamily: 'var(--cc-font-display)', fontSize: 32 }}
            >
              Pipeline & Provenance Ledger
            </h1>
            <p className="text-cc-ink-500 mt-1.5">
              Append-only, hash-chained audit trail. Every event recorded. Tamper-evident.
            </p>
          </div>
          <div className="cc-actions">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium bg-white border border-cc-ink-300 text-cc-ink-900 hover:bg-cc-ink-50 transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium bg-white border border-cc-ink-300 text-cc-ink-900 hover:bg-cc-ink-50 transition-colors">
              <Download size={14} /> Export ledger
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="cc-tabs-scroll mb-6">
          {([['live', 'Live activity'], ['ledger', 'Provenance ledger'], ['graph', 'Evidence graph'], ['rejections', 'Verification catches']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3.5 py-2.5 text-sm font-medium border-b-2 mb-[-1px] transition-colors ${
                tab === k
                  ? 'text-cc-teal-600 border-cc-teal-600'
                  : 'text-cc-ink-600 border-transparent hover:text-cc-ink-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Live activity ─── */}
        {tab === 'live' && (
          <div className="cc-two-col-wide">
            {/* Activity stream */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-cc-ink-200">
                <h3 className="font-semibold text-[17px] text-cc-ink-950">Live activity stream</h3>
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857]">
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${paused ? '' : 'animate-pulse'}`} />
                  {paused ? 'Paused' : 'Live'}
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="p-2 rounded-lg text-cc-ink-600 hover:bg-cc-ink-100 hover:text-cc-ink-900 transition-colors"
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {ACTIVITY.map((a) => {
                  const { icon, bg, color } = FEED_ICON[a.type]
                  return (
                    <div key={a.id} className="flex gap-3 px-4 py-3.5 rounded-[10px] hover:bg-cc-ink-50 cursor-pointer transition-colors">
                      <span className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0" style={{ background: bg, color }}>
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cc-ink-900 mb-1">{a.desc}</p>
                        <div className="flex items-center gap-2 text-xs text-cc-ink-500">
                          <span>{a.ts}</span>
                          <span>·</span>
                          <HashBadge hash={a.hash} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Running jobs */}
              <div className="bg-white border border-cc-ink-200 rounded-2xl p-5">
                <h3 className="font-semibold text-[17px] text-cc-ink-950 mb-4">Running jobs</h3>
                <div className="flex flex-col gap-3">
                  {PIPELINE_JOBS.map((j) => (
                    <div key={j.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-cc-ink-700">
                          <span className="font-mono text-cc-ink-500 mr-2">{j.stage}</span>
                          {j.name}
                        </span>
                        <span className="font-mono font-semibold text-cc-ink-900">{j.progress}%</span>
                      </div>
                      <div className="cc-progress">
                        <div style={{ width: `${j.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live log */}
              <div className="bg-white border border-cc-ink-200 rounded-2xl p-5">
                <h3 className="font-semibold text-[17px] text-cc-ink-950 mb-3">Live log</h3>
                <div className="cc-live-log">
                  {LIVE_LOG.map((line, i) => (
                    <div key={i}>
                      <span style={{ color: 'var(--cc-ink-500)' }}>{line.ts} </span>
                      <span style={{ color: LOG_COLOR[line.lvl] ?? 'inherit' }}>[{line.lvl.toUpperCase()}] </span>
                      <span>{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Provenance ledger ─── */}
        {tab === 'ledger' && (
          <div className="cc-table-scroll bg-white border border-cc-ink-200 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="cc-ledger-row border-b-2 border-cc-ink-200 bg-cc-ink-50">
              {['Entry #', 'Description', 'Own hash', 'Prev hash', 'Timestamp'].map((h) => (
                <span key={h} className="text-[11px] font-semibold tracking-[0.06em] uppercase text-cc-ink-500">{h}</span>
              ))}
            </div>
            {LEDGER_ENTRIES.map((e) => (
              <div
                key={e.entryNo}
                className="cc-ledger-row hover:bg-cc-ink-50"
                onClick={() => setSelectedEntry(e)}
              >
                <span className="font-mono text-[12px] text-cc-ink-500 font-medium">{e.entryNo}</span>
                <div>
                  <p className="text-sm text-cc-ink-900">{e.desc}</p>
                  <p className="text-xs text-cc-ink-500 mt-0.5">{e.actor}</p>
                </div>
                <HashBadge hash={e.ownHash} />
                <HashBadge hash={e.prevHash} />
                <span className="text-xs text-cc-ink-500 font-mono">{e.ts}</span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Tab: Evidence graph ─── */}
        {tab === 'graph' && (
          <div className="cc-two-col">
            <div className="cc-table-scroll bg-white border border-cc-ink-200 rounded-2xl overflow-hidden">
              <div className="cc-graph-edge-row grid grid-cols-[1fr_150px_1fr_110px_120px] gap-3 border-b border-cc-ink-200 bg-cc-ink-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-cc-ink-500">
                <span>From</span>
                <span>Relation</span>
                <span>To</span>
                <span>Status</span>
                <span>Hash</span>
              </div>
              {SOURCE_STATUS_EDGES.map((edge) => (
                <div key={edge.id} className="cc-graph-edge-row grid grid-cols-[1fr_150px_1fr_110px_120px] gap-3 border-b border-cc-ink-100 px-5 py-4 text-sm hover:bg-cc-ink-50">
                  <span className="font-mono text-xs font-semibold text-cc-ink-900">{edge.from}</span>
                  <span className="w-fit rounded bg-cc-teal-50 px-2 py-1 font-mono text-[10px] font-semibold text-cc-teal-600">{edge.relation}</span>
                  <span className="font-mono text-xs font-semibold text-cc-ink-900">{edge.to}</span>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    edge.status === 'accepted' ? 'bg-[#ECFDF5] text-[#047857]' : edge.status === 'review' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#FEF2F2] text-[#B91C1C]'
                  }`}>
                    {edge.status}
                  </span>
                  <HashBadge hash={edge.hash} />
                  <p className="col-span-5 text-xs leading-relaxed text-cc-ink-500">{edge.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-cc-ink-200 bg-white p-5">
                <h3 className="mb-3 text-[17px] font-semibold text-cc-ink-950">Graph semantics</h3>
                <div className="flex flex-col gap-2 text-sm text-cc-ink-700">
                  {['supports', 'qualifies', 'amends', 'supersedes', 'conflicts_with', 'non_binding_context_for', 'requires_review'].map((relation) => (
                    <div key={relation} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cc-teal-600" />
                      <span className="font-mono text-xs">{relation}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
                <h3 className="mb-2 text-[17px] font-semibold text-cc-ink-950">Why this matters</h3>
                <p className="text-sm leading-relaxed text-cc-ink-700">
                  The ledger proves what happened. The graph proves why a source was treated as controlling, contextual, superseded, or blocked from export.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: CVR rejections ─── */}
        {tab === 'rejections' && (
          <div className="cc-card-grid-2">
            {/* Summary card */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl p-6">
              <h3 className="font-semibold text-[17px] text-cc-ink-950 mb-1">Gate distribution</h3>
              <p className="text-sm text-cc-ink-500 mb-4">Last 24 hours · 77 total rejections</p>

              <div className="flex h-3 rounded-full overflow-hidden mb-5">
                {REJECTIONS.byGate.map((g, i) => (
                  <div key={i} title={`${g.gate}: ${g.count}`} style={{ flex: g.pct, background: g.color }} />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {REJECTIONS.byGate.map((g, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-2 h-2 rounded-sm" style={{ background: g.color }} />
                    <span className="flex-1 text-cc-ink-700">{g.gate}</span>
                    <span className="font-mono font-semibold text-cc-ink-900">{g.count}</span>
                    <span className="text-cc-ink-500 min-w-[40px] text-right">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl p-6">
              <h3 className="font-semibold text-[17px] text-cc-ink-950 mb-3">Eight-gate verifier</h3>
              <div className="flex flex-col gap-3">
                {REJECTIONS.byGate.map((gate, index) => {
                  const descriptions = [
                    'Official source must be authoritative for the jurisdiction.',
                    'Historical, draft, and superseded sources cannot control the output.',
                    'OCR/text integrity must preserve legally decisive terms.',
                    'Section and exception boundaries must survive parsing.',
                    'Retrieved evidence must support the claim in top-k context.',
                    'Predicate tuple must contain the rule, condition, exception, and effect.',
                    'RDTII classification must match the predicate.',
                    'Counter-evidence and conflicts must be resolved or abstained.',
                  ]
                  return (
                    <div key={gate.gate} className="flex gap-3">
                      <div className="cc-chain-step w-full">
                        <span className="cc-chain-bullet shrink-0">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-cc-ink-900">{gate.gate}</p>
                            <span className="font-mono text-xs font-semibold" style={{ color: gate.color }}>{gate.count} caught</span>
                          </div>
                          <p className="text-xs text-cc-ink-500 mt-1">{descriptions[index]}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rejected items list */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl overflow-hidden" style={{ gridColumn: '1 / -1' }}>
              <div className="px-5 py-4 border-b border-cc-ink-200">
                <h3 className="font-semibold text-[17px] text-cc-ink-950">Recent rejections</h3>
              </div>
              <div className="cc-table-scroll">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cc-ink-50 border-b border-cc-ink-200">
                    {['Clause', 'Proposed pillar', 'Failed gate', 'Score', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.06em] uppercase text-cc-ink-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REJECTIONS.recent.map((r) => (
                    <tr key={r.clauseId} className="border-b border-cc-ink-100 hover:bg-cc-ink-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-cc-ink-900">{r.clauseId}</td>
                      <td className="px-4 py-3 text-sm text-cc-ink-700">{r.proposedPillar}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#B91C1C]">
                          <X size={10} /> {r.failedGate}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-cc-danger tabular-nums">{r.score}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="h-7 px-2.5 text-xs font-medium rounded-lg bg-white border border-cc-ink-300 text-cc-ink-700 hover:bg-cc-ink-50 transition-colors">
                            Re-verify
                          </button>
                          <button className="h-7 px-2.5 text-xs font-medium rounded-lg text-cc-ink-500 hover:text-cc-ink-900 transition-colors">
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <LedgerEntryModal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </WorkspaceShell>
  )
}
