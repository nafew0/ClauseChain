'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDashed, Gavel, LoaderCircle, Scale, X, XCircle } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { TruthBadge } from '@/components/clausechain/TruthState'
import { SnapshotBanner } from '@/components/workspace/SnapshotBanner'
import { useDecide, useSummary, useZone3Matrix } from '@/hooks/workspace'
import type { Zone3MatrixCell } from '@/services/workspace'
import { cn } from '@/lib/utils'

type Zone3Score = 0 | 0.5 | 1

function scoreLabel(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value) % 1 === 0 ? String(Number(value)) : String(value)
}

function CellButton({ cell, selected, onSelect }: { cell: Zone3MatrixCell; selected: boolean; onSelect: () => void }) {
  const shown = cell.state === 'pending' ? cell.deterministic : cell.effective
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('z3-cell', `is-${cell.state}`, selected && 'is-selected', cell.blocked && 'is-blocked')}
      title={`${cell.economy} · ${cell.indicator} — ${cell.state === 'pending' ? 'engine proposal awaiting reviewer decision' : `${cell.state} by ${cell.reviewer_name}`}`}
    >
      <strong>{scoreLabel(shown)}</strong>
      {cell.state === 'pending' ? <span>proposed</span> : <span>{cell.state === 'overridden' ? 'override' : 'approved'}</span>}
      {cell.flagged || cell.gold_divergence ? <AlertTriangle size={11} /> : null}
    </button>
  )
}

export default function RDTIIMatrix() {
  const matrix = useZone3Matrix()
  const summary = useSummary()
  const decide = useDecide()
  const roles = summary.data?.reviewer_roles ?? []
  const canDecide = roles.some((role) => ['mapping_reviewer', 'admin'].includes(role))
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [override, setOverride] = useState(false)
  const [score, setScore] = useState<Zone3Score>(0)
  const [note, setNote] = useState('')

  const byKey = useMemo(() => new Map((matrix.data?.cells ?? []).map((cell) => [cell.score_key, cell])), [matrix.data])
  const selected = selectedKey ? byKey.get(selectedKey) ?? null : null

  const openCell = (cell: Zone3MatrixCell) => {
    setSelectedKey(cell.score_key)
    setOverride(false)
    setScore((Number(cell.deterministic ?? 0) as Zone3Score) ?? 0)
    setNote('')
  }

  const submit = async (verdict: 'approved' | 'overridden') => {
    if (!selected) return
    await decide.mutateAsync({
      domain: 'zone3',
      payload: {
        score_key: selected.score_key,
        verdict,
        score: verdict === 'overridden' ? score : (Number(selected.deterministic ?? 0) as Zone3Score),
        reasoning: note,
        expected_latest_decision_id: selected.latest_decision_id,
      },
    })
    setNote('')
    setOverride(false)
  }

  if (matrix.isPending) return <WorkspaceShell breadcrumbs={[{ label: 'RDTII Matrix' }]}><div className="run-page-state"><LoaderCircle size={28} /> Loading indicator scores…</div></WorkspaceShell>
  if (matrix.isError || !matrix.data) return <WorkspaceShell breadcrumbs={[{ label: 'RDTII Matrix' }]}><div className="run-page-state error"><XCircle size={28} /> The score matrix API is unavailable.</div></WorkspaceShell>
  const data = matrix.data

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'RDTII Matrix' }]}>
      <div className="cc-page z3-page">
        <div className="cc-page-header"><div><div className="truth-chiprow"><TruthBadge state="live" /><SnapshotBanner /></div><h1 className="cc-page-title text-[32px] mt-3">RDTII indicator matrix</h1><p className="text-cc-ink-500 mt-1.5">Indicator-level 0 / 0.5 / 1 decisions. The engine proposes; a named reviewer approves or overrides with reasoning. Every cell traces to its evidence rows.</p></div>
          <div className="z3-progress"><span><strong>{data.counts.decided}</strong> decided</span><span><strong>{data.counts.pending}</strong> awaiting reviewer</span></div>
        </div>

        <div className="z3-layout">
          <div className="z3-table-wrap" data-data-card>
            <table className="z3-table">
              <thead><tr><th>Indicator</th>{data.economies.map((economy) => <th key={economy}>{economy}</th>)}</tr></thead>
              <tbody>
                {data.indicators.map((indicator) => (
                  <tr key={indicator}>
                    <th scope="row">{indicator}</th>
                    {data.economies.map((economy) => {
                      const cell = data.cells.find((entry) => entry.economy === economy && entry.indicator === indicator)
                      return <td key={economy}>{cell ? <CellButton cell={cell} selected={selected?.score_key === cell.score_key} onSelect={() => openCell(cell)} /> : <span className="z3-empty">n/a</span>}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <footer className="z3-legend">
              <span className="is-approved">approved</span>
              <span className="is-overridden">override</span>
              <span className="is-pending">proposed — awaiting named reviewer</span>
              <span><AlertTriangle size={11} /> low agreement or gold divergence</span>
            </footer>
          </div>

          {selected ? (
            <aside className="z3-drawer" data-data-card aria-label={`${selected.economy} ${selected.indicator} details`}>
              <header>
                <div><span>{selected.economy} · {selected.indicator}</span><strong>{selected.question || 'Indicator question unavailable'}</strong></div>
                <button type="button" onClick={() => setSelectedKey(null)} aria-label="Close details"><X size={16} /></button>
              </header>

              <section>
                <h3><Scale size={13} /> Engine proposal</h3>
                <p className="z3-det"><b>{scoreLabel(selected.deterministic)}</b> {selected.deterministic_reason}</p>
                {selected.judge_scores ? <p className="z3-judges"><Gavel size={12} /> {selected.judge_scores} · α {String(selected.agreement_alpha ?? 'n/a')} · band {selected.score_band || 'n/a'}</p> : null}
                {selected.gold_divergence ? <p className="z3-divergence"><AlertTriangle size={12} /> {selected.gold_divergence}</p> : null}
              </section>

              <section>
                <h3>{selected.state === 'pending' ? <CircleDashed size={13} /> : <CheckCircle2 size={13} />} Reviewer decision</h3>
                {selected.state === 'pending'
                  ? <p className="z3-pending-note">No named decision yet. The proposed score is not effective until a reviewer records one.</p>
                  : <p className="z3-decision">Effective <b>{scoreLabel(selected.effective)}</b> — {selected.state} by <b>{selected.reviewer_name}</b>{selected.reviewed_at ? ` · ${new Date(selected.reviewed_at).toLocaleString()}` : ''}{selected.reasoning ? <><br /><em>“{selected.reasoning}”</em></> : null}</p>}
              </section>

              <section>
                <h3>Evidence this score rests on</h3>
                {selected.evidence.length ? (
                  <ul className="z3-evidence">
                    {selected.evidence.map((row) => (
                      <li key={row.stable_key}>
                        <div><strong>{row.law || 'Instrument unavailable'}</strong><span>{row.article || '—'}{row.tag ? ` · ${row.tag}` : ''}</span></div>
                        <div className="z3-evidence-links">
                          <Link href={`/match/${row.finding_key}?queue=${row.queue}`}>Source Match <ArrowUpRight size={11} /></Link>
                          <Link href={`/review?queue=${row.queue}&item=${row.stable_key}`}>Review <ArrowUpRight size={11} /></Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="z3-pending-note">No evidence rows in this update for this indicator (absence conclusions live in the Review Absence queue).</p>}
              </section>

              {canDecide ? (
                <section className="z3-decide">
                  <h3>{selected.state === 'pending' ? 'Record decision' : 'Overwrite decision'}</h3>
                  <div className="z3-decide-mode">
                    <button type="button" className={cn(!override && 'selected')} onClick={() => { setOverride(false); setScore(Number(selected.deterministic ?? 0) as Zone3Score) }}>Approve deterministic {scoreLabel(selected.deterministic)}</button>
                    <button type="button" className={cn(override && 'selected')} onClick={() => setOverride(true)}>Override</button>
                  </div>
                  {override ? <div className="z3-scores">{([0, 0.5, 1] as Zone3Score[]).map((value) => <button type="button" key={value} className={cn(score === value && 'selected')} onClick={() => setScore(value)}>{value}</button>)}</div> : null}
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={override ? 'Reasoning (required for an override)…' : 'Reasoning / note (recorded in the immutable ledger)…'} />
                  <button type="button" className="z3-submit" disabled={decide.isPending || (override && !note.trim()) || Boolean(selected.blocked)} onClick={() => void submit(override ? 'overridden' : 'approved')}>
                    {decide.isPending ? 'Saving — waiting for authoritative receipt…' : override ? `Record override ${score}` : `Approve ${scoreLabel(selected.deterministic)}`}
                  </button>
                  {selected.state !== 'pending' ? <p className="z3-pending-note">Overwriting supersedes the previous decision in the append-only ledger; nothing is erased.</p> : null}
                </section>
              ) : <p className="z3-pending-note">Read-only access — scoring requires a mapping reviewer or admin role.</p>}
            </aside>
          ) : (
            <aside className="z3-drawer z3-drawer-empty" data-data-card><Scale size={20} /><p>Select a cell to see the engine proposal, the judge panel, the reviewer decision and the exact evidence rows behind it.</p></aside>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}
