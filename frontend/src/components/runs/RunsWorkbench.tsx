'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coins,
  Gauge,
  LoaderCircle,
  Play,
  RotateCcw,
  Server,
  TerminalSquare,
  XCircle,
} from 'lucide-react'
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'

import { useAuth } from '@/contexts/AuthContext'
import { LiveConsole } from '@/components/runs/LiveConsole'
import { RunModeTabs, useRunMode } from '@/components/workspace/RunModeTabs'
import { SnapshotBanner } from '@/components/workspace/SnapshotBanner'
import { useCancelEngineActions, useLaunchEngineAction, useRuns } from '@/hooks/workspace'
import { cn } from '@/lib/utils'
import type { EngineAction, EngineWorkerStatus, JsonValue, RunRecord } from '@/types/workspace'

const COUNTRY_NAMES: Record<string, string> = { SG: 'Singapore', MY: 'Malaysia', MA: 'Malaysia', AU: 'Australia', TH: 'Thailand', IN: 'India', ID: 'Indonesia' }

function duration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return 'not recorded'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${Math.round(seconds % 60)}s`
}

function warningText(value: JsonValue) {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function WorkerPill({ worker }: { worker: EngineWorkerStatus | undefined }) {
  if (!worker) return null
  const label = worker.alive
    ? worker.current_action_id ? 'Worker busy' : 'Worker online'
    : worker.autostart ? 'Worker offline · starts on queue' : 'Worker offline'
  const title = worker.alive
    ? `Engine worker ${worker.hostname ?? ''} (pid ${worker.pid ?? '?'}) last seen ${worker.last_seen ? new Date(worker.last_seen).toLocaleTimeString() : 'now'}`
    : worker.autostart
      ? 'No worker is running. Queueing a run starts one automatically.'
      : 'No worker is running. Start the clausechain-engine service on the server.'
  return <span className={cn('run-worker-pill', worker.alive ? 'is-online' : worker.autostart ? 'is-standby' : 'is-offline')} title={title}><i />{label}</span>
}

function actionTitle(action: EngineAction) {
  const args = action.arguments as Record<string, unknown>
  return action.kind === 'run' && args.economy ? `run · ${String(args.economy)} P${String(args.pillar)}` : action.kind
}

function ActionState({ action, onCancel, cancelling }: { action: EngineAction; onCancel?: () => void; cancelling?: boolean }) {
  const stopping = action.status === 'running' && Boolean(action.cancel_requested_at)
  const Icon = action.status === 'succeeded' ? CheckCircle2 : action.status === 'failed' ? XCircle : action.status === 'cancelled' ? Ban : action.status === 'running' ? LoaderCircle : Clock3
  const active = action.status === 'queued' || action.status === 'running'
  const [logOpen, setLogOpen] = useState(false)
  const showLog = action.kind === 'run' && (active || logOpen)
  return (
    <article className={cn('run-action', `state-${action.status}`)}>
      <Icon size={17} />
      <div><strong>{actionTitle(action)}</strong><span>{action.requested_by} · {new Date(action.requested_at).toLocaleString()}{action.cancelled_by ? ` · cancelled by ${action.cancelled_by}` : ''}</span></div>
      <em>{stopping ? 'stopping…' : action.status}{action.kind === 'run' && !active ? <button type="button" className="run-log-toggle" onClick={() => setLogOpen((open) => !open)}>{logOpen ? 'Hide log' : 'Show log'}</button> : null}{onCancel && active && !stopping ? <button type="button" className="run-cancel" onClick={onCancel} disabled={cancelling}><Ban size={12} /> Cancel</button> : null}</em>
      {showLog ? <LiveConsole actionId={action.id} live={active} /> : null}
      {(action.stdout || action.error) && !active ? <pre>{action.error || action.stdout}</pre> : null}
    </article>
  )
}

function RunCard({ run, index }: { run: RunRecord; index: number }) {
  const [warningsOpen, setWarningsOpen] = useState(false)
  const pipeline = run.pipeline_stats
  return (
    <m.article className="run-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045 }}>
      <header><div><span>{COUNTRY_NAMES[run.country] ?? run.country}</span><h2>Pillar {run.pillar}</h2></div><code>{run.run_id ?? run.run_name}</code></header>
      <div className="run-metrics">
        <div><strong>{run.rows_produced}</strong><span>rows</span></div>
        <div><strong>{run.discovery_counts.NEW}</strong><span>NEW</span></div>
        <div><strong>{run.discovery_counts.KNOWN}</strong><span>KNOWN</span></div>
        <div className={cn(run.warning_count && 'warn')}><strong>{(run.warnings || []).filter((w) => String(w).includes('REJECTED')).length}</strong><span>review signals</span></div>
        <div className={cn((run.warnings || []).some((w) => !String(w).includes('REJECTED')) && 'warn')}><strong>{(run.warnings || []).filter((w) => !String(w).includes('REJECTED')).length}</strong><span>blocking failures</span></div>
      </div>
      <dl>
        <div><dt><Coins size={13} /> Measured cost</dt><dd>{run.total_usd === null || run.total_usd === undefined ? 'not recorded' : run.provider_profile === 'local_openweights' ? '$0 API · self-hosted' : `$${run.total_usd.toFixed(4)}`}</dd></div>
        <div><dt><Clock3 size={13} /> Elapsed</dt><dd>{duration(run.elapsed_seconds)}</dd></div>
        <div><dt><Gauge size={13} /> Screened / mapped</dt><dd>{String(pipeline.screened_in ?? '—')} / {String(pipeline.mapped ?? '—')}</dd></div>
      </dl>
      <section className="run-model"><span>Model route{run.provider_profile ? ` · ${run.provider_profile}` : ''}</span><code>{run.model_version || 'not recorded in findings'}</code></section>
      <button className="run-warning-toggle" onClick={() => setWarningsOpen((open) => !open)} disabled={!run.warning_count}>
        <AlertTriangle size={14} /> All signals ({run.warning_count}) {warningsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {warningsOpen ? <div className="run-warning-list">{run.warnings.map((warning, warningIndex) => <p key={warningIndex}>{warningText(warning)}</p>)}</div> : null}
      <footer><span>{run.generated_at ? new Date(run.generated_at).toLocaleString() : 'time unavailable'}</span><code>{run.source_hash.slice(0, 10)}…</code></footer>
    </m.article>
  )
}

const MODE_COPY = {
  hybrid: {
    title: 'Run history',
    intro: 'Imported run envelopes across all covered economies. These are completed records—not simulated live progress.',
    launch: 'Queued for the dedicated allowlisted worker; one run executes at a time.',
    confirm: 'This may incur commercial model cost.',
  },
  local: {
    title: 'Local run history',
    intro: 'The same pipeline, gates and output schema, run on the self-hosted open-weights model. Local runs are unreviewed engine output kept separate from the reviewed snapshot, so they can be compared with the hybrid runs.',
    launch: 'Runs on the open-weights model only (no commercial API). Queued for the same worker; one run executes at a time.',
    confirm: 'It runs on the self-hosted open-weights model (no API cost).',
  },
} as const

export default function RunsWorkbench() {
  const [mode, setMode] = useRunMode()
  const query = useRuns(mode)
  const launch = useLaunchEngineAction()
  const cancel = useCancelEngineActions()
  const { user } = useAuth()
  const [economy, setEconomy] = useState('Singapore')
  const [pillar, setPillar] = useState<6 | 7>(6)
  const copy = MODE_COPY[mode]

  const cancelOne = (action: EngineAction) => {
    if (!window.confirm(`Cancel ${actionTitle(action)}? ${action.status === 'running' ? 'The running pipeline process will be stopped.' : 'It will not run.'}`)) return
    cancel.mutate({ actionId: action.id, mode })
  }
  const cancelAll = () => {
    if (!window.confirm(`Cancel every queued or running ${mode} action and clear finished ${mode} actions from this list? Finished runs stay in run history and the matrix; the records are kept in the audit log.`)) return
    cancel.mutate({ mode })
  }

  const queueRun = () => {
    if (!window.confirm(`Queue a real ${economy} Pillar ${pillar} ${mode} engine run? ${copy.confirm}`)) return
    launch.mutate({ kind: 'run', payload: { economy, pillar, mode } })
  }

  const tabs = <RunModeTabs mode={mode} onChange={setMode} modes={query.data?.modes} />
  if (query.isPending) return <div className="runs-workbench">{tabs}<div className="run-page-state"><LoaderCircle size={28} /> Loading immutable run history…</div></div>
  if (query.isError || !query.data) return <div className="runs-workbench">{tabs}<div className="run-page-state error"><XCircle size={28} /> Run history API is unavailable.</div></div>

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div className="runs-workbench">
          {tabs}
          <header className="runs-header"><div><div className="truth-chiprow"><span>{mode === 'local' ? <Server size={14} /> : <Activity size={14} />} Recorded engine execution</span>{mode === 'hybrid' ? <SnapshotBanner /> : null}</div><h1>{copy.title}</h1><p>{copy.intro}</p></div></header>
          {user?.is_superuser ? <section className="run-launch"><div><Play size={18} /><span><strong>Launch a real {mode === 'local' ? 'local' : 'hybrid'} pipeline run</strong><small>{copy.launch}</small></span></div><WorkerPill worker={query.data.worker} /><select value={economy} onChange={(event) => setEconomy(event.target.value)}><option>Singapore</option><option>Malaysia</option><option>Australia</option><option>Thailand</option><option>India</option><option>Indonesia</option></select><select value={pillar} onChange={(event) => setPillar(Number(event.target.value) as 6 | 7)}><option value={6}>Pillar 6</option><option value={7}>Pillar 7</option></select><button onClick={queueRun} disabled={launch.isPending}><Play size={14} /> Queue run</button></section> : null}
          {query.data.results.length
            ? <section className="run-grid">{query.data.results.map((run, index) => <RunCard key={run.run_name} run={run} index={index} />)}</section>
            : <section className="run-empty-state"><Server size={22} /><strong>No {mode} runs yet</strong><p>{mode === 'local' ? 'Launch a run above to process an economy and pillar on the open-weights model. Finished runs appear here and on the RDTII Matrix Local tab.' : 'No run envelopes in the active snapshot.'}</p></section>}
          <section className="run-actions"><header><div><TerminalSquare size={18} /><span><strong>Engine worker actions</strong><small>Authoritative queued/running/done states with captured output{mode === 'local' ? ' · local runs only' : ''}.</small></span></div><div className="run-actions-buttons">{user?.is_superuser && query.data.actions.length ? <button className="run-cancel-all" onClick={cancelAll} disabled={cancel.isPending}><Ban size={14} /> Cancel &amp; clear all</button> : null}{user?.is_superuser && mode === 'hybrid' ? <button onClick={() => launch.mutate({ kind: 'refresh' })} disabled={launch.isPending}><RotateCcw size={14} /> Refresh snapshot</button> : null}</div></header>{query.data.actions.length ? query.data.actions.map((action) => <ActionState action={action} key={action.id} onCancel={user?.is_superuser ? () => cancelOne(action) : undefined} cancelling={cancel.isPending} />) : <p className="run-empty">No {mode} engine actions in the list.</p>}</section>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
