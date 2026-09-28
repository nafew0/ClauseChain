'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, ChevronDown, Cloud, Download, GitCompareArrows, Server, ShieldAlert } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { PageUnavailable } from '@/components/clausechain/TruthState'
import { useComparison } from '@/hooks/local'
import { cn } from '@/lib/utils'
import { downloadComparison } from '@/services/local'
import type { ComparisonRow, EngineCard } from '@/types/local'

type Found = 'all' | ComparisonRow['found_by'] | 'differs'

function time(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function minutes(seconds: number | null | undefined) {
  return seconds == null ? '—' : (seconds / 60).toFixed(1)
}

const yesNo = (row: ComparisonRow, flag: boolean) => row.found_by === 'Both' ? (flag ? 'Yes' : 'No') : '—'

export default function ModelComparison() {
  const search = useSearchParams()
  const pathname = usePathname()
  const economy = search.get('economy') ?? undefined
  const pillar = search.get('pillar') ?? undefined
  const query = useComparison(economy, pillar)
  const [found, setFound] = useState<Found>('all')
  const [open, setOpen] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const selected = query.data?.selected
  const choose = (next: { economy: string; pillar: string }) => {
    setOpen(null)
    window.history.replaceState(null, '', `${pathname}?economy=${encodeURIComponent(next.economy)}&pillar=${next.pillar}`)
  }
  const rows = (selected?.rows ?? []).filter((row) => found === 'all' ? true
    : found === 'differs' ? row.found_by === 'Both' && (row.indicator_differs || row.citation_differs || row.quote_differs)
      : row.found_by === found)
  const cards: [string, EngineCard | null | undefined, typeof Cloud][] = [
    ['Model A — commercial (hybrid)', selected?.model_a, Cloud],
    ['Model B — open weights (local)', selected?.model_b, Server],
  ]
  const field = (label: string, get: (card: EngineCard) => React.ReactNode) => <tr><th>{label}</th>{cards.map(([title, card]) => <td key={title}>{card ? get(card) : <span className="local-muted">no run</span>}</td>)}</tr>
  const exportCsv = async () => {
    if (!selected) return
    setExporting(true)
    try { await downloadComparison(selected.economy, selected.pillar) } finally { setExporting(false) }
  }

  return <WorkspaceShell breadcrumbs={[{ label: 'Model Comparison' }]}><div className="cc-page comparison-page">
    <div className="cc-page-header"><div><div className="truth-chiprow"><span className="comparison-chip"><GitCompareArrows size={13} /> Model A vs Model B · one engine</span></div><h1 className="cc-page-title text-[34px] mt-3">Model comparison</h1><p className="text-cc-ink-500 mt-1.5">The same pipeline, corpus and gates, run on two model backends. Provision by provision, in the final template&apos;s &ldquo;Engine Comparison&rdquo; shape. Hybrid and Local stay separate everywhere else.</p></div>{selected ? <button className="truth-primary-link" onClick={() => void exportCsv()} disabled={exporting}><Download size={15} /> {exporting ? 'Exporting…' : 'Export CSV'}</button> : null}</div>
    {query.isError || !query.data ? <PageUnavailable title={query.isPending ? 'Pairing the two models’ findings…' : 'The comparison is unavailable'} /> : <>
      <nav className="comparison-scopes" aria-label="Economy and pillar">{query.data.scopes.map((scope) => {
        const both = scope.model_a && scope.model_b
        const active = selected?.economy === scope.economy && selected?.pillar === scope.pillar
        return <button key={`${scope.economy}-${scope.pillar}`} disabled={!both} className={cn(active && 'active')} onClick={() => choose(scope)} title={both ? 'Both models have a run' : `Missing: ${!scope.model_a ? 'Model A (hybrid)' : ''}${!scope.model_a && !scope.model_b ? ' and ' : ''}${!scope.model_b ? 'Model B (local)' : ''}`}>
          <strong>{scope.economy} · P{scope.pillar}</strong><small><Cloud size={11} className={scope.model_a ? 'on' : 'off'} /><Server size={11} className={scope.model_b ? 'on' : 'off'} /></small>
        </button>
      })}</nav>

      {!selected ? <section className="run-empty-state"><GitCompareArrows size={22} /><strong>No economy and pillar has runs on both models yet</strong><p>Run the same economy and pillar on <Link href="/runs">Hybrid</Link> and on <Link href="/runs?mode=local">Local</Link>; the comparison appears here.</p></section> : <>
        <section className="comparison-summary" data-data-card>
          <header><h2>1 · Per-engine summary</h2><span className={cn('comparison-corpus', selected.same_corpus ? 'same' : 'differs')}>{selected.same_corpus ? <><CheckCircle2 size={13} /> Same archived corpus</> : <><ShieldAlert size={13} /> Different corpus fingerprints</>}</span></header>
          <table><thead><tr><th>Field</th>{cards.map(([title, , Icon]) => <th key={title}><Icon size={13} /> {title}</th>)}</tr></thead><tbody>
            {field('Provider and model name', (card) => card.models.join(' + ') || '—')}
            {field('Start time', (card) => time(card.started_at))}
            {field('End time', (card) => time(card.finished_at))}
            {field('Elapsed (minutes)', (card) => minutes(card.elapsed_seconds))}
            {field('Documents fetched during this pass', (card) => <span title="The run reads the archived corpus only; no document is downloaded">{card.documents_fetched}</span>)}
            {field('Cost of this pass (US$)', (card) => card.total_usd == null || (card.source === 'local run' && !card.total_usd) ? '$0 · self-hosted, no API spend' : `$${Number(card.total_usd).toFixed(4)}`)}
            {field('Rows · evidence · absence', (card) => `${card.rows} · ${card.evidence} · ${card.absences}`)}
            {field('Run', (card) => <code>{card.run_id ?? card.name}</code>)}
            {field('Archived corpus fingerprint', (card) => <code title={card.corpus_fingerprint ?? ''}>{card.corpus_fingerprint ? `${card.corpus_fingerprint.slice(0, 16)}…` : '—'}</code>)}
          </tbody></table>
        </section>

        <div className="z3-kpis comparison-kpis">
          <article data-data-card><span>Agreement</span><strong className="info">{selected.counts.agreement_pct ?? '—'}{selected.counts.agreement_pct != null ? <small>%</small> : null}</strong><p>provisions found by both</p></article>
          <article data-data-card><span>Found by both</span><strong className="ok">{selected.counts.both}<small> of {selected.counts.provisions}</small></strong><p>{selected.counts.indicator_differs} indicator · {selected.counts.citation_differs} citation · {selected.counts.quote_differs} quote differences</p></article>
          <article data-data-card><span>Model A only</span><strong className="warn">{selected.counts.model_a_only}</strong><p>commercial model found, open weights did not</p></article>
          <article data-data-card><span>Model B only</span><strong className="warn">{selected.counts.model_b_only}</strong><p>open weights found, commercial model did not</p></article>
        </div>

        <section className="comparison-indicators" data-data-card><h2>By indicator</h2><div>{selected.by_indicator.map((entry) => <span key={entry.indicator} className={cn('comparison-indicator', entry.agreement.replace(/\s/g, '-').toLowerCase())}><b>{entry.indicator}</b><em>A {entry.model_a} · B {entry.model_b}</em><small>{entry.agreement}</small></span>)}</div></section>

        <section className="comparison-table" data-data-card>
          <header><h2>2 · Provision-by-provision comparison</h2><nav>{(['all', 'Both', 'differs', 'Model A only', 'Model B only'] as Found[]).map((value) => <button key={value} className={cn(found === value && 'active')} onClick={() => setFound(value)}>{value === 'all' ? 'All' : value === 'differs' ? 'Both, with differences' : value}</button>)}</nav></header>
          <div className="ops-table-wrap"><table><thead><tr>{['#', 'Law Name', 'Article / Section', 'Indicator ID', 'Found by', 'Indicator differs?', 'Citation differs?', 'Quoted words differ?', 'How they differ — one line', ''].map((value) => <th key={value}>{value}</th>)}</tr></thead><tbody>{rows.map((row) => <Fragment key={row.number}>
            <tr className={cn('comparison-row', open === row.number && 'open')} onClick={() => setOpen(open === row.number ? null : row.number)}>
              <td>{row.number}</td><td>{row.law}</td><td>{row.article}</td><td>{row.indicator}</td>
              <td><span className={cn('comparison-found', row.found_by === 'Both' ? 'both' : row.found_by === 'Model A only' ? 'a' : 'b')}>{row.found_by}</span></td>
              <td>{yesNo(row, row.indicator_differs)}</td><td>{yesNo(row, row.citation_differs)}</td><td>{yesNo(row, row.quote_differs)}</td>
              <td className="comparison-how">{row.how}</td><td><ChevronDown size={14} /></td>
            </tr>
            {open === row.number ? <tr className="comparison-detail"><td colSpan={10}><div>{([['Model A — commercial', row.model_a], ['Model B — open weights', row.model_b]] as const).map(([title, side]) => <article key={title}><h3>{title}</h3>{side ? <><p className="comparison-cite">{side.indicator} · {side.article} · {side.tag} · confidence {side.confidence ?? '—'}</p><blockquote className="cc-verbatim">{side.snippet}</blockquote><p>{side.rationale}</p>{title.startsWith('Model A')
  ? <Link href={`/match/${side.finding_key}`}>Open Hybrid source match <ArrowRight size={13} /></Link>
  : <Link href={`/review?mode=local&queue=${String(side.tag).toUpperCase() === 'NEW' ? 'new' : 'known'}&item=${side.finding_key}`}>Open in Local review <ArrowRight size={13} /></Link>}</> : <p className="local-muted">Not found by this model.</p>}</article>)}</div></td></tr> : null}
          </Fragment>)}</tbody></table></div>
          {!rows.length ? <p className="local-muted">No provisions in this view.</p> : null}
        </section>
      </>}
    </>}
  </div></WorkspaceShell>
}
