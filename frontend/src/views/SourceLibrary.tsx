'use client'
import Link from 'next/link'
import { AlertTriangle, ExternalLink, FileText, Globe, RefreshCw, ShieldCheck } from 'lucide-react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { HashBadge, PillarCoverageStack, TrustBadge } from '@/components/clausechain/ui'
import { DOCUMENTS, JURISDICTIONS, RDTII_PILLARS, SEED_REGISTRY } from '@/lib/clausechain/data'

export default function SourceLibrary() {
  const allDocuments = JURISDICTIONS.flatMap((jurisdiction) =>
    (DOCUMENTS[jurisdiction.code] ?? []).map((document) => ({ jurisdiction, document })),
  )
  const officialCount = allDocuments.filter(({ document }) => document.authority === 'Primary').length
  const nonBindingCount = allDocuments.filter(({ document }) => document.binding === false || document.type === 'Guideline').length
  const conflictCount = JURISDICTIONS.reduce((sum, jurisdiction) => sum + jurisdiction.conflicts, 0)

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Source Library' }]}>
      <div className="cc-page">
        <div className="cc-page-header">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-cc-ink-500">
              Demo source inventory
            </p>
            <h1 className="cc-page-title text-[32px]">Source Library</h1>
            <p className="mt-1.5 max-w-3xl text-cc-ink-500">
              Jurisdiction-level source coverage with official portals, document types, authority status, and review risk in one screen.
            </p>
          </div>
          <div className="cc-actions">
            <Link
              href="/pipeline/crawl"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-cc-ink-300 bg-white px-4 text-sm font-medium text-cc-ink-900 transition-colors hover:bg-cc-ink-50"
            >
              <RefreshCw size={14} /> Re-crawl sources
            </Link>
            <Link
              href="/source-status"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-cc-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-[#0E9F92]"
            >
              <ShieldCheck size={14} /> Resolve authority
            </Link>
          </div>
        </div>

        <div className="cc-kpi-grid mb-6">
          {[
            { label: 'Jurisdictions', value: JURISDICTIONS.length, color: 'var(--cc-ink-950)', sub: 'SG, BD, TH demo scope' },
            { label: 'Documents', value: allDocuments.length, color: '#047857', sub: `${officialCount} primary sources` },
            { label: 'Context-only', value: nonBindingCount, color: '#B45309', sub: 'guidelines, drafts, translations' },
            { label: 'Conflicts', value: conflictCount, color: conflictCount ? '#B91C1C' : 'var(--cc-ink-400)', sub: 'require reviewer attention' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-cc-ink-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-cc-ink-500">{item.label}</p>
              <p className="mt-1 text-[34px] font-bold leading-none tabular-nums" style={{ color: item.color, fontFamily: 'var(--cc-font-display)' }}>
                {item.value}
              </p>
              <p className="mt-1 text-xs text-cc-ink-500">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="cc-card-grid-2 mb-6">
          {JURISDICTIONS.map((jurisdiction) => {
            const docs = DOCUMENTS[jurisdiction.code] ?? []
            const seeds = SEED_REGISTRY[jurisdiction.code] ?? []
            return (
              <Link
                key={jurisdiction.code}
                href={`/jurisdictions/${jurisdiction.code.toLowerCase()}`}
                className="block rounded-2xl border border-cc-ink-200 bg-white p-6 transition-all hover:border-cc-ink-300 hover:shadow-md"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="text-3xl leading-none">{jurisdiction.flag}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[18px] font-semibold text-cc-ink-950">{jurisdiction.name}</h2>
                    <p className="mt-0.5 text-sm text-cc-ink-500">
                      {jurisdiction.languages.join(' · ')} · {docs.length} source records · synced {jurisdiction.lastSyncRel}
                    </p>
                  </div>
                  {jurisdiction.conflicts > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-medium text-[#B91C1C]">
                      <AlertTriangle size={10} /> {jurisdiction.conflicts}
                    </span>
                  ) : (
                    <TrustBadge label="Clean" tone="pass" />
                  )}
                </div>

                <PillarCoverageStack
                  items={Object.entries(jurisdiction.coverage).map(([pillar, stats]) => ({
                    pillar,
                    label: RDTII_PILLARS[pillar]?.name ?? pillar,
                    verified: stats.verified,
                    total: stats.total,
                    mandatory: RDTII_PILLARS[pillar]?.mandatory ?? false,
                  }))}
                />

                <div className="mt-4 rounded-xl border border-cc-ink-200 bg-cc-ink-50 p-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-cc-ink-500">Seed portals</p>
                  <div className="flex flex-col gap-1.5">
                    {seeds.slice(0, 3).map((seed) => (
                      <div key={seed.url} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: seed.status === 'ok' ? '#10B981' : seed.status === 'warn' ? '#F59E0B' : '#EF4444' }}
                        />
                        <span className="truncate font-mono text-cc-ink-700">{seed.url.replace('https://', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="rounded-2xl border border-cc-ink-200 bg-white">
          <div className="flex items-center gap-3 border-b border-cc-ink-200 px-5 py-4">
            <FileText size={17} className="text-cc-teal-600" />
            <h2 className="text-[17px] font-semibold text-cc-ink-950">Recent source records</h2>
            <span className="ml-auto text-xs text-cc-ink-500">wide table scrolls inside this panel</span>
          </div>
          <div className="cc-table-scroll">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-cc-ink-200 bg-cc-ink-50">
                  {['Jurisdiction', 'Document', 'Type', 'Authority', 'Status', 'Hash', 'Source'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-cc-ink-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDocuments.slice(0, 10).map(({ jurisdiction, document }) => {
                  const binding = document.binding !== false && document.type !== 'Guideline'
                  return (
                    <tr key={`${jurisdiction.code}-${document.id}`} className="border-b border-cc-ink-100 hover:bg-cc-ink-50">
                      <td className="px-4 py-3 text-sm text-cc-ink-800">
                        <span className="mr-2">{jurisdiction.flag}</span>
                        {jurisdiction.code}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/jurisdictions/${jurisdiction.code.toLowerCase()}/documents/${document.id}`} className="text-sm font-medium text-cc-ink-950 hover:text-cc-teal-600">
                          {document.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-cc-ink-500">{document.id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-cc-ink-700">{document.type}</td>
                      <td className="px-4 py-3 text-sm text-cc-ink-700">{document.authority}</td>
                      <td className="px-4 py-3">
                        <TrustBadge label={binding ? 'Binding candidate' : 'Context only'} tone={binding ? 'pass' : 'warn'} />
                      </td>
                      <td className="px-4 py-3">
                        <HashBadge hash={document.sourceHash} />
                      </td>
                      <td className="px-4 py-3">
                        <a href={document.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-cc-teal-600 hover:underline">
                          <Globe size={13} /> Open <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
