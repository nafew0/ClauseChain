'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, GitCompareArrows, History } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { PageUnavailable } from '@/components/clausechain/TruthState'
import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalChanges } from '@/hooks/local'
import type { LocalChangeKind } from '@/types/local'
import { when } from '@/views/local/LocalDashboard'

type Filter = 'attention' | LocalChangeKind
const FILTERS: Filter[] = ['attention', 'new', 'revised', 'not_reproduced', 'unchanged']
const label = (value: string) => value.replace('_', ' ')

export default function LocalEvidenceUpdates() {
  const query = useLocalChanges()
  const [filter, setFilter] = useState<Filter>('attention')
  const scopes = useMemo(() => (query.data?.scopes ?? []).map((scope) => ({
    ...scope,
    visible: scope.changes.filter((change) => filter === 'attention' ? change.kind !== 'unchanged' : change.kind === filter),
  })), [filter, query.data])

  return <WorkspaceShell breadcrumbs={[{ label: 'Evidence Updates' }]}><div className="cc-page evidence-updates local-page">
    <PageModeTabs modes={query.data?.modes} />
    <div className="cc-page-header"><div><div className="truth-chiprow"><LocalChip /></div><h1 className="cc-page-title text-[34px] mt-3">Evidence updates · Local</h1><p className="text-cc-ink-500 mt-1.5">Each Local rerun compared with the Local run before it, per economy and pillar. The hybrid registry is not involved; Model comparison sets the two models side by side.</p></div><Link className="truth-primary-link" href="/comparison">Model comparison <ArrowRight size={15} /></Link></div>
    {query.isError || !query.data ? <PageUnavailable title={query.isPending ? 'Comparing Local runs…' : 'Local run history is unavailable'} /> : <>
      <section className="registry-update draft" data-data-card><header><div><GitCompareArrows /><span><small>Local run history</small><strong>Latest Local run vs the previous one</strong></span></div><b>LOCAL</b></header><div className="registry-update-grid">{(['unchanged', 'revised', 'new', 'not_reproduced'] as LocalChangeKind[]).map((kind) => <span key={kind}><strong>{query.data.counts[kind] ?? 0}</strong>{label(kind)}</span>)}</div><footer><History size={14} />A pair&apos;s first Local run is its baseline: every record shows as new until it is rerun.</footer></section>
      <nav className="evidence-update-tabs">{FILTERS.map((value) => <button className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{label(value)}</button>)}</nav>
      {scopes.map((scope) => <section className="local-change-scope" key={`${scope.economy}-${scope.pillar}`}>
        <header><h2>{scope.economy} · Pillar {scope.pillar}</h2><p>{scope.baseline ? `Baseline: first Local run (${scope.current_run.run_id}, ${when(scope.current_run.finished_at)})` : `${scope.current_run.run_id} (${when(scope.current_run.finished_at)}) vs ${scope.previous_run?.run_id} (${when(scope.previous_run?.finished_at)})`}</p></header>
        <div className="evidence-update-list">{scope.visible.map((change, index) => <article className={`evidence-update-card ${change.kind}`} key={`${change.finding_key ?? change.law}-${index}`} data-data-card>
          <header><div><span>{change.economy} · {change.indicator}</span><h2>{change.law}</h2><p>{change.absence ? 'Absence conclusion' : change.article}</p></div><b>{label(change.kind)}</b></header>
          {change.kind === 'revised' ? <p className="evidence-update-impact"><AlertTriangle size={15} /> Changed: {change.changed_stages.join(', ')}</p> : null}
          {change.kind === 'unchanged' ? <p className="evidence-update-impact retained"><CheckCircle2 size={15} /> Same citation, mapping and status as the previous Local run.</p> : null}
          {change.kind === 'not_reproduced' ? <p className="evidence-update-impact"><AlertTriangle size={15} /> The previous Local run had this; the latest did not produce it.</p> : null}
          {!change.absence && change.snippet ? <blockquote className="local-change-quote">{change.snippet}</blockquote> : null}
          {change.kind === 'revised' && change.previous_snippet && change.previous_snippet !== change.snippet ? <p className="local-muted">Before: {change.previous_snippet}</p> : null}
          {change.finding_key ? <Link href={`/review?mode=local&queue=${change.queue}&item=${change.finding_key}`}>Open in Local review <ArrowRight size={14} /></Link> : null}
        </article>)}</div>
        {!scope.visible.length ? <p className="local-muted">Nothing in this view for {scope.economy} · Pillar {scope.pillar}.</p> : null}
      </section>)}
      {!scopes.length ? <div className="review-empty"><CheckCircle2 /><h2>No Local runs yet</h2></div> : null}
    </>}
  </div></WorkspaceShell>
}
