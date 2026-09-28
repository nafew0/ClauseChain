'use client'

import { BookOpenCheck, FileClock } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { PageUnavailable } from '@/components/clausechain/TruthState'
import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalLedger } from '@/hooks/local'
import { cn } from '@/lib/utils'

export default function LocalLedger() {
  const query = useLocalLedger()
  return <WorkspaceShell breadcrumbs={[{ label: 'Audit Ledger' }]}><div className="cc-page ledger-live local-page">
    <PageModeTabs />
    <div className="cc-page-header"><div><LocalChip /><h1 className="cc-page-title text-[32px] mt-3">Audit ledger · Local</h1><p className="text-cc-ink-500 mt-1.5">Append-only Local review decisions and the Local run record: who queued each run, when the worker started and finished it, and the SHA-256 of the output it wrote.</p></div><div className="ops-total"><BookOpenCheck size={20} /><strong>{query.data?.count ?? '—'}</strong><span>local events</span></div></div>
    {query.isError || !query.data ? <PageUnavailable title={query.isPending ? 'Loading the Local ledger…' : 'Local ledger is unavailable'} /> : <div className="ops-table-wrap"><table><thead><tr>{['Time', 'Event', 'Subject', 'Actor', 'Action', 'Hash', 'Note / supersedes'].map((value) => <th key={value}>{value}</th>)}</tr></thead><tbody>{query.data.results.map((event) => <tr key={event.id}><td>{new Date(event.occurred_at).toLocaleString()}</td><td><span className={cn('ledger-event-type', event.event_type === 'local_decision' && 'local-decision-event')}><FileClock size={13} />{event.event_type.replaceAll('_', ' ')}</span></td><td><b>{event.subject}</b><code title={event.key}>{event.key.slice(0, 18)}{event.key.length > 18 ? '…' : ''}</code></td><td><b>{event.actor || '—'}</b><small>{event.actor_role}</small></td><td><b>{event.action}</b></td><td>{event.hash ? <code title={event.hash}>{event.hash.slice(0, 16)}…</code> : <span className="muted">—</span>}</td><td>{event.note ? <span className="local-ledger-note">{event.note}</span> : null}{event.supersedes_id ? <code>supersedes {event.supersedes_id.slice(0, 8)}…</code> : null}{!event.note && !event.supersedes_id ? '—' : null}</td></tr>)}</tbody></table></div>}
  </div></WorkspaceShell>
}
