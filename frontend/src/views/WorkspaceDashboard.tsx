'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Download, Check, X, Cloud, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { KPICard, HashBadge, PillarCoverageStack } from '@/components/clausechain/ui'
import { AddJurisdictionModal, ExportModal } from '@/components/clausechain/modals'
import { JURISDICTIONS, ACTIVITY, PIPELINE_JOBS, REJECTIONS, RDTII_PILLARS } from '@/lib/clausechain/data'
import type { ActivityEvent } from '@/lib/clausechain/data'

const ACTIVITY_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'conflict', label: 'Conflicts' },
  { key: 'ingested', label: 'Ingestion' },
] as const

const FEED_ICON_MAP: Record<ActivityEvent['type'], { icon: React.ReactNode; bg: string; color: string }> = {
  verified: { icon: <Check size={16} />, bg: 'var(--cc-success-bg)', color: 'var(--cc-success)' },
  rejected: { icon: <X size={16} />, bg: 'var(--cc-danger-bg)', color: 'var(--cc-danger)' },
  ingested: { icon: <Cloud size={16} />, bg: 'var(--cc-info-bg)', color: 'var(--cc-info)' },
  conflict: { icon: <AlertTriangle size={16} />, bg: 'var(--cc-warning-bg)', color: 'var(--cc-warning)' },
  crawl:    { icon: <RefreshCw size={16} />, bg: 'var(--cc-ink-100)', color: 'var(--cc-ink-700)' },
}

export default function WorkspaceDashboard() {
  const [addJurOpen, setAddJurOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [actFilter, setActFilter] = useState<string>('all')

  const filteredActivity =
    actFilter === 'all' ? ACTIVITY : ACTIVITY.filter((a) => a.type === actFilter)

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="cc-page">
        {/* Hero header */}
        <div className="cc-page-header mb-8">
          <div>
            <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-cc-ink-500 mb-1.5">
              Sunday · 24 May 2026 · UTC+06
            </p>
            <h1
              className="cc-page-title leading-[1.1] text-cc-ink-950"
              style={{ fontFamily: 'var(--cc-font-display)', fontSize: 40 }}
            >
              Measured legal evidence compiler
            </h1>
            <p className="text-cc-ink-500 mt-1.5">
              P6/P7 demo workspace with benchmarked discovery, authority resolution, predicate mapping, and verified citations.
            </p>
          </div>
          <div className="cc-actions">
            <button
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium bg-white border border-cc-ink-300 text-cc-ink-900 hover:bg-cc-ink-50 hover:border-cc-ink-400 transition-colors"
            >
              <Download size={14} /> Export workspace
            </button>
            <button
              onClick={() => setAddJurOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors"
            >
              <Plus size={14} /> Add jurisdiction
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="cc-dashboard-kpi mb-8">
          <div
            className="flex flex-col gap-2 p-6 border rounded-2xl"
            style={{ background: 'linear-gradient(140deg, #FFFFFF 0%, #F0FDFA 100%)', borderColor: 'var(--cc-teal-100)' }}
          >
            <span className="text-xs font-medium tracking-[0.06em] uppercase text-cc-teal-600">Citation accuracy</span>
            <span
              className="cc-gradient-text font-bold leading-none tracking-[-0.025em] tabular-nums"
              style={{ fontFamily: 'var(--cc-font-display)', fontSize: 56 }}
            >
              97.4
            </span>
            <div className="flex items-center gap-2 text-[13px] text-cc-ink-500">
              <span className="text-cc-success font-medium">measured</span>
              <span>verified URL + section + span hash</span>
            </div>
          </div>
          <KPICard label="Abstentions" value="31" delta={{ value: '+9', dir: 'up' }} sub="blocked before export" color="var(--cc-info)" />
          <KPICard label="Verifier catches" value="77" delta={{ value: '+18', dir: 'up' }} sub="eight-gate safeguards" color="var(--cc-danger)" />
          <KPICard label="Macro-F1" value="84.7" delta={{ value: '+14.2', dir: 'up' }} sub="vs. baseline" />
        </div>

        {/* Two-column body */}
        <div className="cc-dashboard-body">
          {/* Left */}
          <div className="flex flex-col gap-4">
            {/* Jurisdiction heading */}
            <div className="flex items-baseline justify-between">
              <h2
                className="font-semibold text-[22px] leading-snug tracking-[-0.01em] text-cc-ink-950"
                style={{ fontFamily: 'var(--cc-font-display)' }}
              >
                Jurisdictions
              </h2>
              <span className="text-sm text-cc-ink-500">3 active · 28 pillars in scope</span>
            </div>

            {/* Jurisdiction cards grid */}
            <div className="cc-card-grid-2">
              {JURISDICTIONS.map((j) => (
                <Link
                  key={j.code}
                  href={`/jurisdictions/${j.code.toLowerCase()}`}
                  className="group block bg-white border border-cc-ink-200 rounded-2xl p-6 hover:shadow-md hover:border-cc-ink-300 transition-all cursor-pointer"
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl leading-none">{j.flag}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[17px] text-cc-ink-950 leading-snug">{j.name}</h3>
                      <p className="text-sm text-cc-ink-500 mt-0.5">{j.languages.join(' · ')} · synced {j.lastSyncRel}</p>
                    </div>
                    {j.conflicts > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#B91C1C] shrink-0">
                        <AlertTriangle size={10} /> {j.conflicts}
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="cc-mini-stat-grid mb-4">
                    {[
                      { val: j.instruments, label: 'Instruments' },
                      { val: j.clauses, label: 'Clauses' },
                      { val: j.verified, label: 'Verified', color: 'var(--cc-success)' },
                      { val: j.rejected, label: 'Rejected', color: 'var(--cc-danger)' },
                    ].map(({ val, label, color }) => (
                      <div key={label}>
                        <div
                          className="font-semibold text-lg tabular-nums"
                          style={{ fontFamily: 'var(--cc-font-display)', color: color ?? 'var(--cc-ink-950)' }}
                        >
                          {val}
                        </div>
                        <div className="text-[11px] tracking-[0.04em] uppercase text-cc-ink-500">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pillar coverage */}
                  <PillarCoverageStack
                    items={Object.entries(j.coverage).map(([pk, stats]) => ({
                      pillar: pk,
                      label: RDTII_PILLARS[pk as keyof typeof RDTII_PILLARS]?.name ?? pk,
                      verified: stats.verified,
                      total: stats.total,
                      mandatory: RDTII_PILLARS[pk as keyof typeof RDTII_PILLARS]?.mandatory ?? false,
                    }))}
                  />
                </Link>
              ))}

              {/* Add card */}
              <button
                onClick={() => setAddJurOpen(true)}
                className="flex flex-col items-center justify-center gap-2 min-h-[240px] border-[1.5px] border-dashed border-cc-ink-300 rounded-2xl p-6 text-cc-ink-500 hover:border-cc-teal-500 hover:text-cc-teal-600 transition-colors bg-transparent cursor-pointer"
              >
                <span className="w-11 h-11 rounded-full bg-cc-ink-100 grid place-items-center">
                  <Plus size={20} />
                </span>
                <span className="font-medium text-[15px]">Add jurisdiction</span>
                <span className="text-xs">Vietnam · Indonesia · Sri Lanka …</span>
              </button>
            </div>

            {/* Recent activity */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-cc-ink-200">
                <h3 className="font-semibold text-[17px] text-cc-ink-950">Recent activity</h3>
                <div className="ml-auto flex gap-1">
                  {ACTIVITY_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActFilter(key)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        actFilter === key
                          ? 'bg-cc-teal-50 text-cc-teal-600'
                          : 'text-cc-ink-600 hover:text-cc-ink-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-2">
                {filteredActivity.map((a) => {
                  const { icon, bg, color } = FEED_ICON_MAP[a.type]
                  return (
                    <div
                      key={a.id}
                      className="flex gap-3 px-4 py-3.5 rounded-[10px] hover:bg-cc-ink-50 cursor-pointer transition-colors"
                    >
                      <span
                        className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0"
                        style={{ background: bg, color }}
                      >
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
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* Pipeline health */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-semibold text-[17px] text-cc-ink-950">Pipeline health</h3>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Healthy
                  </span>
                </div>
              </div>

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

              <div className="h-px bg-cc-ink-200 my-4" />

              <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-cc-ink-500 mb-3">
                L40S workload (24 GB)
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Qwen2.5 7B', val: '14.8 GB', pct: 62 },
                  { label: 'Qwen3 embed', val: '2.4 GB', pct: 10 },
                  { label: 'Qwen rerank', val: '0.9 GB', pct: 4 },
                  { label: 'Free', val: '4.2 GB', pct: 18, dim: true },
                ].map(({ label, val, pct, dim }) => (
                  <div key={label} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-[110px] shrink-0" style={{ color: dim ? 'var(--cc-ink-500)' : 'var(--cc-ink-700)' }}>
                      {label}
                    </span>
                    <div className="cc-progress flex-1">
                      <div style={{ width: `${pct}%`, background: dim ? 'var(--cc-ink-300)' : 'var(--cc-teal-600)' }} />
                    </div>
                    <span className="font-mono text-cc-ink-900 text-xs min-w-[56px] text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CVR breakdown */}
            <div className="bg-white border border-cc-ink-200 rounded-2xl p-6">
              <div className="flex items-center mb-1">
                <h3 className="font-semibold text-[17px] text-cc-ink-950">Eight-gate distribution</h3>
                <Link href="/ledger" className="ml-auto text-sm text-cc-teal-600 hover:underline flex items-center gap-1">
                  See ledger <ArrowUpRight size={12} />
                </Link>
              </div>
              <p className="text-sm text-cc-ink-500 mb-4">
                Last 24 h · 77 blocked outputs · these are reviewability wins.
              </p>

              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {REJECTIONS.byGate.map((g, i) => (
                  <div
                    key={i}
                    title={`${g.gate}: ${g.count}`}
                    style={{ flex: g.pct, background: g.color }}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                {REJECTIONS.byGate.map((g, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: g.color }} />
                    <span className="flex-1 text-cc-ink-700">{g.gate}</span>
                    <span className="font-mono font-semibold text-cc-ink-900">{g.count}</span>
                    <span className="text-cc-ink-500 min-w-[40px] text-right">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddJurisdictionModal open={addJurOpen} onClose={() => setAddJurOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </WorkspaceShell>
  )
}
