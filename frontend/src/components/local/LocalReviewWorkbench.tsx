'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ExternalLink,
  History,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react'

import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalBulkDecide, useLocalDecide, useLocalItem, useLocalItems } from '@/hooks/local'
import { cn } from '@/lib/utils'
import type { LocalItem, LocalQueue } from '@/types/local'

const QUEUES: { key: LocalQueue; label: string }[] = [
  { key: 'new', label: 'New evidence' },
  { key: 'known', label: 'Known evidence' },
  { key: 'absence', label: 'Absence checks' },
]

const MATCH_LABEL = { exact: 'VERBATIM · exact', anchor: 'VERBATIM · anchor', blocked: 'Proof blocked', unavailable: 'No proof stored' }

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function isTyping(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]'))
}

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details className="review-evidence-section" open={open}><summary><span>{title}</span><ChevronDown size={16} /></summary><div className="review-evidence-body">{children}</div></details>
}

function StateMark({ item }: { item: LocalItem }) {
  const state = item.review.state
  return <div className={cn('review-status-mark', state === 'approved' && 'approved', state === 'rejected' && 'blocked')}>
    {state === 'approved' ? <CheckCircle2 size={18} /> : state === 'rejected' ? <XCircle size={18} /> : state === 'stale' ? <RotateCcw size={18} /> : <CircleDashed size={18} />}
    <span>{state === 'stale' ? 'Changed by rerun' : state}</span>
  </div>
}

function DecisionPanel({ item, canReview }: { item: LocalItem; canReview: boolean }) {
  const decide = useLocalDecide()
  const [checks, setChecks] = useState({ citation_checked: false, mapping_checked: false, status_checked: false })
  const [note, setNote] = useState('')
  const labels = item.absence
    ? { citation_checked: 'Coverage checked — the governing instruments were searched', mapping_checked: 'Mapping checked — no provision answers this indicator', status_checked: 'Status checked — the governing law is in force' }
    : { citation_checked: 'Citation checked — quote and section match the official source', mapping_checked: 'Mapping checked — the provision answers this indicator', status_checked: 'Status checked — in force and current' }
  const allChecked = Object.values(checks).every(Boolean)
  const submit = (decision: 'approved' | 'rejected') => decide.mutate({
    finding_key: item.key, decision, note: note.trim(), ...checks,
    expected_latest_id: item.review.latest?.id ?? null,
  }, { onSuccess: () => { setNote(''); setChecks({ citation_checked: false, mapping_checked: false, status_checked: false }) } })

  if (!canReview) return <div className="review-decision-panel"><p className="local-muted">Local review needs a reviewer role.</p></div>
  return (
    <div className="review-decision-panel">
      <div className="review-decision-heading"><div><span className="review-eyebrow">Local decision</span><h3>{item.review.decision ? 'Record a new decision' : 'Approve or reject'}</h3></div><span>Local ledger only</span></div>
      <div className="local-checks">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((name) => <label key={name}><input type="checkbox" checked={checks[name]} onChange={(event) => setChecks((current) => ({ ...current, [name]: event.target.checked }))} /><span>{labels[name]}</span></label>)}
      </div>
      <textarea id="local-review-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reviewer note (required to reject)…" />
      <div className="local-decision-buttons">
        <button className="review-primary" disabled={!allChecked || decide.isPending} onClick={() => submit('approved')}>{decide.isPending ? 'Saving…' : 'Approve'}</button>
        <button className="local-reject" disabled={note.trim().length < 3 || decide.isPending} onClick={() => submit('rejected')}>Reject</button>
      </div>
      {!allChecked ? <p className="local-muted">Approval needs all three checks.</p> : null}
    </div>
  )
}

export default function LocalReviewWorkbench() {
  const search = useSearchParams()
  const pathname = usePathname()
  const query = useLocalItems()
  const bulk = useLocalBulkDecide()
  const requested = search.get('queue') as LocalQueue | null
  const queue: LocalQueue = requested && QUEUES.some((entry) => entry.key === requested) ? requested : 'new'
  const economy = search.get('economy') ?? ''
  const pillar = search.get('pillar') ?? ''
  const [filter, setFilter] = useState(search.get('q') ?? '')
  const [selectedKnown, setSelectedKnown] = useState<Set<string>>(new Set())

  const setUrl = useCallback((changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(search.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.set('mode', 'local')
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`)
  }, [pathname, search])

  const items = useMemo(() => query.data?.results ?? [], [query.data])
  const economies = useMemo(() => [...new Set(items.map((item) => text(item.economy, '')).filter(Boolean))], [items])
  const filtered = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase()
    return items.filter((item) => item.queue === queue
      && (!economy || item.economy === economy)
      && (!pillar || item.pillar === pillar)
      && (!needle || [item.law, item.article, item.indicator, item.snippet, item.rationale].join(' ').toLocaleLowerCase().includes(needle)))
  }, [economy, filter, items, pillar, queue])
  const itemKey = search.get('item')
  const selectedIndex = Math.max(0, filtered.findIndex((item) => item.stable_key === itemKey))
  const selected = filtered[selectedIndex] ?? null
  const detail = useLocalItem(selected?.key ?? null)
  const focus = detail.data && selected && detail.data.item.key === selected.key ? detail.data.item : selected

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key !== 'j' && event.key !== 'k') return
      event.preventDefault()
      const next = filtered[Math.min(filtered.length - 1, Math.max(0, selectedIndex + (event.key === 'j' ? 1 : -1)))]
      if (next) setUrl({ item: next.stable_key })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filtered, selectedIndex, setUrl])

  const bulkEligible = filtered.filter((item) => item.queue === 'known' && item.proof.gates_pass && item.review.state !== 'approved')
  const canReview = (query.data?.reviewer_roles.length ?? 0) > 0
  const submitBulk = () => {
    const keys = [...selectedKnown]
    if (!keys.length || !window.confirm(`Approve ${keys.length} KNOWN rows whose proof resolved and every gate passed?`)) return
    const expected = Object.fromEntries(keys.map((key) => [key, items.find((item) => item.key === key)?.review.latest?.id ?? null]))
    bulk.mutate({ keys, expected }, { onSuccess: () => setSelectedKnown(new Set()) })
  }

  return (
    <div className="review-workbench local-review">
      <PageModeTabs modes={query.data?.modes} />
      <header className="review-page-header">
        <div>
          <div className="truth-chiprow"><LocalChip label="Local review · separate from the signed registry" /></div>
          <h1>Review & approve · Local</h1>
          <p>Findings from the latest open-weights run of each economy and pillar. Decisions are recorded in the Local ledger and never written to the signed decisions file.</p>
        </div>
        <div className="review-shortcuts" aria-label="Keyboard shortcuts"><kbd>J</kbd><kbd>K</kbd><span>navigate</span></div>
      </header>

      <nav className="review-queue-tabs" aria-label="Local review queues">
        {QUEUES.map((entry) => {
          const progress = query.data?.progress[entry.key]
          return <button key={entry.key} className={cn(queue === entry.key && 'active')} onClick={() => { setSelectedKnown(new Set()); setUrl({ queue: entry.key, item: undefined }) }}>
            {queue === entry.key ? <span className="review-tab-indicator" /> : null}
            <span>{entry.label}</span><small>{progress?.decided ?? 0}/{progress?.total ?? 0}</small>
          </button>
        })}
      </nav>

      {query.isError ? <section className="review-load-error" role="alert"><AlertTriangle size={22} /><div><strong>Local review data is unavailable</strong><p>The Local items API did not answer.</p></div><button onClick={() => void query.refetch()}>Try again</button></section>
        : !query.isPending && !items.length ? <section className="run-empty-state"><ShieldAlert size={22} /><strong>No local runs to review</strong><p>Launch a Local run on the Runs page. Its findings appear here.</p></section>
        : <div className="review-layout">
          <aside className="review-rail" aria-label={`${queue} local review queue`}>
            <div className="review-rail-tools">
              <div className="review-search-control"><Search size={15} /><input value={filter} onChange={(event) => { setFilter(event.target.value); setUrl({ q: event.target.value || undefined, item: undefined }) }} placeholder="Search this queue…" /></div>
              <div className="local-rail-filters">
                <select value={economy} onChange={(event) => setUrl({ economy: event.target.value || undefined, item: undefined })}><option value="">All economies</option>{economies.map((value) => <option key={value}>{value}</option>)}</select>
                <select value={pillar} onChange={(event) => setUrl({ pillar: event.target.value || undefined, item: undefined })}><option value="">All pillars</option><option value="6">Pillar 6</option><option value="7">Pillar 7</option></select>
              </div>
              <div className="review-filter-summary"><span>{filtered.length} rows</span></div>
            </div>
            {queue === 'known' && canReview ? <div className="review-bulk-bar"><label><input type="checkbox" checked={bulkEligible.length > 0 && selectedKnown.size === bulkEligible.length} onChange={(event) => setSelectedKnown(event.target.checked ? new Set(bulkEligible.map((item) => item.key)) : new Set())} /> Select rows with all gates passing</label><button disabled={!selectedKnown.size || bulk.isPending} onClick={submitBulk}>Approve {selectedKnown.size || ''}</button></div> : null}
            <div className="review-rail-list">
              {filtered.map((item) => <article key={item.stable_key} className={cn('review-rail-card', selected?.stable_key === item.stable_key && 'active')}>
                {queue === 'known' && canReview ? <input aria-label={`Select ${item.law} ${item.article}`} type="checkbox" disabled={!bulkEligible.includes(item)} checked={selectedKnown.has(item.key)} onChange={(event) => { const next = new Set(selectedKnown); if (event.target.checked) next.add(item.key); else next.delete(item.key); setSelectedKnown(next) }} /> : null}
                <button onClick={() => setUrl({ item: item.stable_key })}>
                  <span className="review-rail-meta"><strong>{text(item.indicator)}</strong><em>{text(item.economy)} · P{item.pillar}</em>{item.review.state === 'approved' ? <CheckCircle2 size={14} /> : item.review.state === 'rejected' ? <XCircle size={14} /> : item.review.state === 'stale' ? <RotateCcw size={14} /> : <CircleDashed size={14} />}</span>
                  <h3>{text(item.law)}</h3>
                  <p>{item.absence ? 'No qualifying provision found' : `${text(item.article)} · ${text(item.snippet, '').slice(0, 110)}`}</p>
                  {!item.absence ? <span className={cn('review-chip', item.proof.gates_pass ? 'tone-success' : 'tone-warning')}>{MATCH_LABEL[item.proof.match_mode]}</span> : null}
                </button>
              </article>)}
              {!filtered.length && !query.isPending ? <p className="local-muted">No rows in this queue for these filters.</p> : null}
            </div>
          </aside>

          <main className="review-canvas">
            {focus ? <div key={focus.stable_key}>
              <div className="review-canvas-toolbar"><div className="review-toolbar-meta"><span>{text(focus.indicator)} · {text(focus.economy)}</span><span>{selectedIndex + 1} of {filtered.length}</span></div><div className="review-toolbar-actions">{focus.source_url ? <a className="review-reference-button" href={focus.source_url} target="_blank" rel="noreferrer">Official source <ExternalLink size={14} /></a> : null}</div></div>
              <article className={cn('review-focus-card', focus.review.state === 'rejected' && 'blocked')}>
                <header>
                  <div><span className="review-eyebrow">{text(focus.economy)} · {text(focus.indicator)} · Pillar {focus.pillar} · {text(focus.tag)}</span><h2>{text(focus.law)}</h2><p>{focus.absence ? 'Absence conclusion' : `${text(focus.article)}${focus.location && focus.location !== focus.article ? ` · ${focus.location}` : ''}`}</p></div>
                  <StateMark item={focus} />
                </header>
                {focus.review.state === 'stale' && focus.review.latest ? <div className="review-warning"><RotateCcw size={17} /><span>A newer Local run changed this finding after {focus.review.latest.reviewer_name} {focus.review.latest.decision} it. Decide again.</span></div> : null}
                {focus.review.latest && focus.review.state !== 'stale' ? <div className="local-latest"><History size={15} /><span>{focus.review.latest.decision} by {focus.review.latest.reviewer_name} · {new Date(focus.review.latest.reviewed_at).toLocaleString()}{focus.review.latest.note ? ` · “${focus.review.latest.note}”` : ''}</span></div> : null}
                {focus.absence ? <>
                  <div className="review-caution"><ShieldAlert size={18} /><div><strong>No evidence found is not proof of nonexistence.</strong><span>Approve only after the governing instruments and the searches in the coverage manifest have been checked.</span></div></div>
                  <Section title="Engine reasoning"><p>{text(focus.rationale)}</p></Section>
                  <Section title="Search coverage manifest" open={false}><pre className="review-json">{detail.isPending ? 'Loading…' : JSON.stringify(focus.coverage_manifest ?? null, null, 2)}</pre></Section>
                </> : <>
                  <div className="review-fact-grid four">
                    <div><span>Match</span><strong>{MATCH_LABEL[focus.proof.match_mode]}</strong></div>
                    <div><span>Page / anchor</span><strong>{text(focus.proof.page ?? focus.proof.anchor)}</strong></div>
                    <div><span>Gates</span><strong>{focus.proof.gates_total ? (focus.proof.gates_pass ? `all ${focus.proof.gates_total} pass` : `${focus.proof.failing_gates.length} not passing`) : 'none attached'}</strong></div>
                    <div><span>Confidence</span><strong>{text(focus.confidence)}</strong></div>
                  </div>
                  <Section title="Exact source quote"><blockquote className="cc-verbatim">{text(focus.snippet)}</blockquote>{focus.snippet_en ? <p className="local-translation"><b>English:</b> {focus.snippet_en}</p> : null}</Section>
                  <Section title="Mapping analysis"><p>{text(focus.rationale)}</p></Section>
                  <Section title="Status & currentness"><p><b>{text(focus.status)}</b>{focus.status_evidence ? ` — ${focus.status_evidence}` : ''}</p></Section>
                  <Section title="Deterministic gates" open={!focus.proof.gates_pass}>
                    {focus.proof.gates?.length ? <ul className="local-gates">{focus.proof.gates.map((gate, index) => <li key={index} className={gate.status === 'PASS' ? 'pass' : 'fail'}><b>{text(gate.gate_id)}</b><span>{text(gate.status)}</span><em>{text(gate.reason, '')}</em></li>)}</ul> : <p className="local-muted">{detail.isPending ? 'Loading gates…' : 'No gates attached to this row.'}</p>}
                  </Section>
                </>}
                <p className="local-provenance">Run {text(focus.run.run_id)} · model {text(focus.model_version)} · source {focus.proof.source_sha256 ? `${focus.proof.source_sha256.slice(0, 12)}…` : '—'}</p>
              </article>
              <DecisionPanel key={`${focus.key}:${focus.review.latest?.id ?? 'none'}`} item={focus} canReview={canReview} />
              {detail.data?.history.length ? <section className="review-history"><h3><History size={16} /> Append-only history</h3>{detail.data.history.slice().reverse().map((entry) => <article key={entry.id}><strong>{entry.decision}</strong><span>{entry.reviewer_name} · {new Date(entry.reviewed_at).toLocaleString()}{entry.note ? ` · ${entry.note}` : ''}</span></article>)}</section> : null}
            </div> : query.isPending ? <div className="review-canvas-loading" /> : <div className="review-empty"><CircleDashed size={24} /><h2>Nothing selected</h2></div>}
          </main>
        </div>}
    </div>
  )
}
