'use client'

import Link from 'next/link'
import { Activity, ArrowRight, Braces, CheckCircle2, CircleDashed, Cpu, FileCheck2, GitCompareArrows, LoaderCircle, Server, ShieldAlert } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { PageUnavailable } from '@/components/clausechain/TruthState'
import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalOverview } from '@/hooks/local'
import { cn } from '@/lib/utils'
import type { LocalQueue, LocalRunSummary } from '@/types/local'

const QUEUES: { key: LocalQueue; label: string }[] = [
  { key: 'new', label: 'New evidence' },
  { key: 'known', label: 'Known evidence' },
  { key: 'absence', label: 'Absence checks' },
]

export function minutes(seconds: number | null | undefined) {
  if (seconds == null) return 'n/a'
  return seconds >= 90 ? `${(seconds / 60).toFixed(1)} min` : `${Math.round(seconds)} s`
}

export function when(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—'
}

function CoverageCell({ run }: { run: LocalRunSummary | null }) {
  if (!run) return <Link href="/runs?mode=local" className="local-coverage-cell empty"><CircleDashed size={14} /><span>not run</span></Link>
  return (
    <Link href={`/review?mode=local&economy=${encodeURIComponent(run.economy)}&pillar=${run.pillar}`} className="local-coverage-cell done" title={`Run ${run.run_id} · ${when(run.finished_at)}`}>
      <CheckCircle2 size={14} />
      <span><strong>{run.evidence}</strong> evidence · {run.absences} absence</span>
      <small>{run.finished_at ? new Date(run.finished_at).toLocaleDateString() : ''} · {minutes(run.elapsed_seconds)}</small>
    </Link>
  )
}

export default function LocalDashboard() {
  const query = useLocalOverview()
  const data = query.data
  const economies = [...new Set((data?.coverage ?? []).map((cell) => cell.economy))]

  return <WorkspaceShell breadcrumbs={[{ label: 'Dashboard' }]}><div className="cc-page live-dashboard local-page">
    <PageModeTabs modes={data?.modes} />
    <div className="cc-page-header"><div><div className="truth-chiprow"><LocalChip />{data?.active.length ? <span className="local-running"><LoaderCircle size={13} /> {data.active.length} local run{data.active.length > 1 ? 's' : ''} in progress</span> : null}</div><h1 className="cc-page-title text-[36px] mt-3">Local model workspace</h1><p className="text-cc-ink-500 mt-1.5">Evidence from the open-weights model, with its own runs, review and ledger. Nothing here touches the signed ESCAP registry; the two models meet only on Model comparison.</p></div><div className="cc-actions"><Link className="truth-primary-link" href="/review?mode=local">Open local review <ArrowRight size={15} /></Link></div></div>
    {query.isError || !data ? <PageUnavailable title={query.isPending ? 'Loading the local workspace…' : 'Local workspace data is unavailable'} /> : <>
      <section className="registry-overview" data-data-card>
        <div className="registry-overview-title"><Server /><div><span>Local runs</span><strong>{data.counts.runs} of {data.counts.scopes} economy × pillar pairs</strong><small>latest run per pair · {data.counts.comparable} comparable with the hybrid model</small></div></div>
        <dl>
          <div><dt>Evidence rows</dt><dd>{data.counts.evidence}</dd></div>
          <div><dt>Absence conclusions</dt><dd>{data.counts.absences}</dd></div>
          <div><dt>Model calls</dt><dd>{data.totals.calls.toLocaleString()}</dd></div>
          <div><dt>API cost</dt><dd>${data.totals.total_usd.toFixed(2)}</dd></div>
        </dl>
      </section>

      <section><div className="truth-section-heading"><div><span>Coverage</span><h2>Where the open-weights model has run</h2><p>Each cell is the latest Local run. Click one to review it, or an empty cell to launch a run.</p></div><Link href="/runs?mode=local">Run console <ArrowRight size={14} /></Link></div>
        <div className="local-coverage" data-data-card>
          <div className="local-coverage-head"><span>Economy</span><span>Pillar 6</span><span>Pillar 7</span></div>
          {economies.map((economy) => <div className="local-coverage-row" key={economy}><strong>{economy}</strong>{['6', '7'].map((pillar) => <CoverageCell key={pillar} run={data.coverage.find((cell) => cell.economy === economy && cell.pillar === pillar)?.run ?? null} />)}</div>)}
        </div>
      </section>

      <section><div className="truth-section-heading"><div><span>Local review</span><h2>Review queues</h2><p>Decisions here are recorded in the Local ledger only. They never reach the signed decisions file.</p></div><Link href="/review?mode=local">Review workbench <ArrowRight size={14} /></Link></div><div className="local-queue-grid">{QUEUES.map(({ key, label }) => { const progress = data.progress[key]; const pct = progress.total ? Math.round(progress.decided / progress.total * 100) : 0; return <Link href={`/review?mode=local&queue=${key}`} key={key} className="truth-stat-card" data-data-card><span>{label}</span><strong>{progress.decided}<small> / {progress.total}</small></strong><div><i style={{ width: `${pct}%` }} /></div><em>{pct}% decided{progress.stale ? ` · ${progress.stale} changed by a rerun` : ''}</em></Link> })}</div></section>

      <section><div className="truth-section-heading"><div><span>Engine activity</span><h2>Latest local runs</h2></div><Link href="/runs?mode=local">Run console <ArrowRight size={14} /></Link></div><div className="dashboard-run-grid">{data.runs.map((run) => <article key={run.action_id} className="truth-data-card" data-data-card><header><div><span>{run.economy} · Pillar {run.pillar}</span><strong>{run.run_id}</strong></div>{run.warning_count ? <ShieldAlert size={17} /> : <CheckCircle2 size={17} />}</header><dl><div><dt>Rows</dt><dd>{run.rows}</dd></div><div><dt>Evidence</dt><dd>{run.evidence}</dd></div><div><dt>Absence</dt><dd>{run.absences}</dd></div><div><dt>Calls</dt><dd>{run.calls}</dd></div></dl><footer><Activity size={13} />{minutes(run.elapsed_seconds)}<span className={cn(run.total_usd ? '' : 'local-free')}>{run.total_usd ? `$${run.total_usd.toFixed(4)}` : '$0 API · self-hosted'}</span></footer></article>)}</div>{!data.runs.length ? <section className="run-empty-state"><Server size={22} /><strong>No local runs yet</strong><p>Launch one on the <Link href="/runs?mode=local">Runs page</Link>.</p></section> : null}</section>

      <section className="dashboard-links"><Link href="/comparison"><GitCompareArrows /> <span><strong>Model comparison</strong><small>Model A vs Model B, provision by provision</small></span><ArrowRight /></Link><Link href="/submission?mode=local"><FileCheck2 /><span><strong>Local dataset</strong><small>Template rows from the open-weights model</small></span><ArrowRight /></Link><Link href="/raw-data?mode=local"><Braces /><span><strong>Local raw data</strong><small>Each run&apos;s files, hash-checked</small></span><ArrowRight /></Link></section>
      <p className="local-footnote"><Cpu size={13} /> {data.totals.input_tokens.toLocaleString()} input and {data.totals.output_tokens.toLocaleString()} output tokens across {data.counts.runs} runs · {minutes(data.totals.elapsed_seconds)} of model time.</p>
    </>}
  </div></WorkspaceShell>
}
