'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Download, FileJson2, Search, ShieldAlert } from 'lucide-react'

import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { PageUnavailable } from '@/components/clausechain/TruthState'
import { LocalChip, PageModeTabs } from '@/components/workspace/RunModeTabs'
import { useLocalRaw, useLocalRawFile } from '@/hooks/local'
import { downloadLocalRawFile } from '@/services/local'
import type { LocalRawFileMeta } from '@/types/local'
import { StructuredPreview, VirtualRawText, formatBytes } from '@/views/RawDataExplorer'

function Verified({ file }: { file: LocalRawFileMeta }) {
  if (file.verified === true) return <span className="local-verified ok" title="SHA-256 matches the hash the worker recorded when the run finished"><CheckCircle2 size={12} /> matches run</span>
  if (file.verified === false) return <span className="local-verified bad" title="The file on disk differs from what the run wrote"><ShieldAlert size={12} /> changed</span>
  return null
}

export default function LocalRawData() {
  const list = useLocalRaw()
  const [picked, setPicked] = useState<{ actionId: string; name: string } | null>(null)
  const [filter, setFilter] = useState('')
  const firstRun = list.data?.results[0]
  const selection = picked ?? (firstRun ? { actionId: firstRun.action_id, name: 'output.json' } : null)
  const detail = useLocalRawFile(selection?.actionId ?? null, selection?.name ?? null)
  const lines = useMemo(() => {
    const all = (detail.data?.raw_text ?? '').split('\n')
    const needle = filter.trim().toLocaleLowerCase()
    return needle ? all.filter((line) => line.toLocaleLowerCase().includes(needle)) : all
  }, [detail.data, filter])
  const run = list.data?.results.find((entry) => entry.action_id === selection?.actionId)

  return <WorkspaceShell breadcrumbs={[{ label: 'Raw Data' }]}><div className="cc-page raw-explorer local-page">
    <PageModeTabs modes={list.data?.modes} />
    <div className="cc-page-header"><div><div className="truth-chiprow"><LocalChip /></div><h1 className="cc-page-title text-[32px] mt-3">Raw data · Local</h1><p className="text-cc-ink-500 mt-1.5">The files each latest Local run wrote to disk, checked against the SHA-256 the worker recorded, plus the copy stored in the app database. Read-only.</p></div></div>
    {list.isError || !list.data ? <PageUnavailable title={list.isPending ? 'Loading Local run files…' : 'Local run files are unavailable'} /> : !list.data.results.length ? <section className="run-empty-state"><FileJson2 size={22} /><strong>No Local runs yet</strong><p>Finished Local runs list their files here.</p></section> : <div className="raw-layout">
      <aside>{list.data.results.map((entry) => <section key={entry.action_id}><h2>{entry.economy} · Pillar {entry.pillar}</h2>{entry.files.map((file) => <button key={file.name} disabled={!file.exists} className={selection?.actionId === entry.action_id && selection.name === file.name ? 'active' : ''} onClick={() => { setPicked({ actionId: entry.action_id, name: file.name }); setFilter('') }}><FileJson2 size={14} /><span><strong>{file.name}</strong><small>{file.exists ? `${formatBytes(file.size)} · ${file.sha256?.slice(0, 8)}…` : 'not on disk'}</small></span><Verified file={file} /></button>)}</section>)}</aside>
      <main>{detail.isError || !detail.data ? <PageUnavailable title={detail.isPending ? 'Loading the selected file…' : 'The selected file is unavailable'} /> : <>
        <header className="raw-artifact-header"><div><span>{run ? `${run.economy} · Pillar ${run.pillar} · ${run.run_id}` : 'Local run'}</span><h2>{detail.data.name}</h2><p>{detail.data.location}</p></div><div><button onClick={() => selection && void downloadLocalRawFile(selection.actionId, selection.name)}><Download size={14} />Download exact file</button></div></header>
        <dl className="raw-meta"><div><dt>SHA-256</dt><dd><code>{detail.data.sha256}</code></dd></div><div><dt>Recorded at run end</dt><dd>{detail.data.recorded_sha256 ? <code>{detail.data.recorded_sha256}</code> : 'not recorded for this file'}</dd></div><div><dt>Size</dt><dd>{formatBytes(detail.data.size)}{detail.data.truncated ? ' · preview truncated' : ''}</dd></div></dl>
        <label className="raw-search"><Search size={15} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter raw lines…" /><span>{lines.length.toLocaleString()} lines</span></label>
        <section className="raw-structured"><h3>Structured preview</h3><StructuredPreview value={detail.data.parsed} /></section>
        <section className="raw-source"><h3>Exact source{filter ? ' · filtered lines' : ''}</h3><VirtualRawText key={`${selection?.actionId}:${selection?.name}:${filter}`} lines={lines} /></section>
      </>}</main>
    </div>}
  </div></WorkspaceShell>
}
