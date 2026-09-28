'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ClipboardCheck, Download, ExternalLink, Filter, LoaderCircle, Search, ShieldAlert, X } from 'lucide-react'

import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalItems } from '@/hooks/local'
import { cn } from '@/lib/utils'
import { downloadLocalDataset } from '@/services/local'
import type { LocalItem } from '@/types/local'

const PAGE_SIZE = 25
const MATCH_LABEL = { exact: 'VERBATIM · exact', anchor: 'VERBATIM · anchor', blocked: 'blocked', unavailable: 'no proof' }

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function Drawer({ item, close }: { item: LocalItem; close: () => void }) {
  return <><button className="submission-scrim" aria-label="Close row details" onClick={close} /><aside className="submission-drawer"><header><div><span>LOCAL PROVENANCE RECORD</span><h2>{text(item.law)}</h2><p>{text(item.article)} · {text(item.indicator)}</p></div><button onClick={close} aria-label="Close"><X size={18} /></button></header><div className="submission-drawer-body">
    <section className="submission-quote"><span>Exact exported snippet</span><p>{text(item.snippet)}</p></section>
    <section><h3>Mapping rationale</h3><p>{text(item.rationale)}</p></section>
    <dl><div><dt>Match</dt><dd>{MATCH_LABEL[item.proof.match_mode]}</dd></div><div><dt>Page / anchor</dt><dd>{text(item.proof.page ?? item.proof.anchor)}</dd></div><div><dt>Access date</dt><dd>{text(item.access_date)}</dd></div><div><dt>Status</dt><dd>{text(item.status)}</dd></div><div><dt>Local review</dt><dd>{item.review.state}</dd></div><div><dt>Model</dt><dd>{text(item.model_version)}</dd></div></dl>
    <section><h3>Source SHA-256</h3><code className="submission-full-hash">{text(item.proof.source_sha256)}</code></section>
    <section><h3>Deterministic gates</h3><div className="submission-gates">{item.proof.gates_total ? (item.proof.gates_pass ? <span className="pass">all {item.proof.gates_total} pass</span> : item.proof.failing_gates.map((gate) => <span className="fail" key={gate}>{gate} · not passing</span>)) : <span className="na">No gates attached</span>}</div></section>
    <div className="submission-drawer-actions"><Link href={`/review?mode=local&queue=${item.queue}&item=${item.stable_key}`}><ClipboardCheck size={15} /> Open in Local review</Link>{item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">Official source <ExternalLink size={14} /></a> : null}</div>
  </div></aside></>
}

export default function LocalDataset() {
  const search = useSearchParams()
  const pathname = usePathname()
  const query = useLocalItems()
  const [draft, setDraft] = useState(search.get('q') ?? '')
  const [exporting, setExporting] = useState(false)
  const params = {
    q: search.get('q') ?? '',
    economy: search.get('economy') ?? '',
    pillar: search.get('pillar') ?? '',
    tag: search.get('tag') ?? '',
    review: search.get('review') ?? '',
    page: Math.max(1, Number(search.get('page') ?? 1)),
  }
  const update = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(search.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    next.set('mode', 'local')
    window.history.replaceState(null, '', `${pathname}?${next.toString()}`)
  }
  const items = useMemo(() => query.data?.results ?? [], [query.data])
  const economies = useMemo(() => [...new Set(items.map((item) => text(item.economy, '')).filter(Boolean))], [items])
  const rows = useMemo(() => {
    const needle = params.q.trim().toLocaleLowerCase()
    return items.filter((item) => (!params.economy || item.economy === params.economy)
      && (!params.pillar || item.pillar === params.pillar)
      && (!params.tag || (params.tag === 'ABSENCE' ? item.absence : !item.absence && item.tag === params.tag))
      && (!params.review || item.review.state === params.review)
      && (!needle || [item.law, item.article, item.snippet, item.indicator, item.economy].join(' ').toLocaleLowerCase().includes(needle)))
  }, [items, params.economy, params.pillar, params.q, params.review, params.tag])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const page = Math.min(params.page, pages)
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = items.find((item) => item.stable_key === search.get('row')) ?? null
  const columns = query.data?.template_columns ?? []
  const fields = query.data?.template_fields ?? {}
  const exportCsv = async () => {
    setExporting(true)
    try { await downloadLocalDataset({ ...(params.economy ? { economy: params.economy } : {}), ...(params.pillar ? { pillar: params.pillar } : {}) }) } finally { setExporting(false) }
  }

  return <div className="submission-explorer local-dataset">
    <PageModeTabs modes={query.data?.modes} />
    <header className="submission-header"><div><div className="truth-chiprow"><LocalChip label="Local dataset · open weights" /></div><h1>RDTII dataset · Local</h1><p>Every row of the latest Local run per economy and pillar, in the template&apos;s 13 columns, with its proof, gates and Local review state. Separate from the signed hybrid dataset.</p></div><button onClick={() => void exportCsv()} disabled={exporting || !items.length}><Download size={15} /> {exporting ? 'Exporting…' : `Export CSV${params.economy || params.pillar ? ' (filtered)' : ''}`}</button></header>
    <section className="submission-filters"><label className="submission-search"><Search size={15} /><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') update({ q: draft, page: 1 }) }} placeholder="Law, citation, indicator or quote…" /><button onClick={() => update({ q: draft, page: 1 })}>Search</button></label><label><Filter size={14} /><select value={params.economy} onChange={(event) => update({ economy: event.target.value, page: 1 })}><option value="">All economies</option>{economies.map((value) => <option key={value}>{value}</option>)}</select></label><label><select value={params.pillar} onChange={(event) => update({ pillar: event.target.value, page: 1 })}><option value="">All pillars</option><option value="6">Pillar 6</option><option value="7">Pillar 7</option></select></label><label><select value={params.tag} onChange={(event) => update({ tag: event.target.value, page: 1 })}><option value="">NEW + KNOWN + absence</option><option value="NEW">NEW</option><option value="KNOWN">KNOWN</option><option value="ABSENCE">Absence rows</option></select></label><label><select value={params.review} onChange={(event) => update({ review: event.target.value, page: 1 })}><option value="">All review states</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="stale">changed by rerun</option></select></label></section>
    {query.isPending ? <div className="submission-page-state"><LoaderCircle size={25} /> Loading Local rows…</div> : query.isError || !query.data ? <div className="submission-page-state error"><ShieldAlert size={25} /> The Local items API is unavailable.</div> : <>
      <div className="submission-table-meta"><span>{rows.length} Local rows</span><span>13 required template fields + proof + Local review</span></div>
      <div className="submission-table-wrap"><table><thead><tr><th className="sticky-col">Review</th>{columns.map((column) => <th key={column}>{column}</th>)}<th>Pillar</th><th>Match</th><th>Page / anchor</th><th>Gates</th><th>Model</th><th>Run</th></tr></thead><tbody>{visible.map((item) => <tr key={item.stable_key} className={cn(item.proof.match_mode === 'blocked' && 'blocked')} onClick={() => update({ row: item.stable_key })}><td className="sticky-col"><span className={cn('submission-review-chip', item.review.state === 'stale' ? 'pending' : item.review.state)}>{item.review.state === 'stale' ? 'changed' : item.review.state}</span></td>{columns.map((column) => { const value = item[fields[column]]; return <td key={column} title={text(value, '')}>{column === 'Discovery Tag' ? <b className={text(value).toLowerCase()}>{text(value)}</b> : text(value)}</td> })}<td>{item.pillar}</td><td><span className={cn('submission-match', item.proof.match_mode)}>{MATCH_LABEL[item.proof.match_mode]}</span></td><td>{text(item.proof.page ?? item.proof.anchor)}</td><td><span className={item.proof.gates_pass ? 'gate-pass' : 'gate-warn'} title={item.proof.gates_pass ? 'All gates pass' : `Not passing: ${item.proof.failing_gates.join(', ') || 'no gates attached'}`}>{item.proof.gates_pass ? '●●●' : '●○○'}</span></td><td>{text(item.model_version)}</td><td><code>{text(item.run.run_id)}</code></td></tr>)}</tbody></table></div>
      <nav className="submission-pagination"><button disabled={page <= 1} onClick={() => update({ page: page - 1 })}><ChevronLeft size={15} /> Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => update({ page: page + 1 })}>Next <ChevronRight size={15} /></button></nav>
    </>}
    {selected ? <Drawer item={selected} close={() => update({ row: undefined })} /> : null}
  </div>
}
