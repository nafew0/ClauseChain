'use client'

import { useState } from 'react'
import { AlertTriangle, Database, ShieldCheck } from 'lucide-react'

import { useSummary } from '@/hooks/workspace'
import { cn } from '@/lib/utils'

function snapshotTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(parsed)
}

export function SnapshotBanner({ className, compact = false }: { className?: string; compact?: boolean }) {
  const summary = useSummary()
  const [open, setOpen] = useState(false)

  if (summary.isPending) {
    if (compact) return <span className={cn('snapshot-chip is-loading', className)} aria-label="Loading snapshot status"><Database size={15} /></span>
    return (
      <div className={cn('h-10 animate-pulse border-b border-slate-200 bg-slate-100', className)} />
    )
  }
  if (summary.isError || !summary.data) {
    const unavailable = 'Snapshot status unavailable. Do not make review decisions until the API reconnects.'
    if (compact) {
      return (
        <span className={cn('snapshot-chip-wrap', className)}>
          <button type="button" className="snapshot-chip is-error" aria-expanded={open} title="Snapshot status" onClick={() => setOpen(value => !value)}><AlertTriangle size={15} /></button>
          {open ? <span role="alert" className="snapshot-pop">{unavailable}</span> : null}
        </span>
      )
    }
    return (
      <div
        role="alert"
        className={cn(
          'flex min-h-10 items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-800',
          className
        )}
      >
        <AlertTriangle size={14} aria-hidden="true" />
        {unavailable}
      </div>
    )
  }

  const { snapshot, champion } = summary.data
  const championStatus = String(champion.status ?? 'UNKNOWN').toUpperCase()
  const warning = snapshot.stale || championStatus === 'FAIL'
  const Icon = warning ? AlertTriangle : championStatus === 'PASS' ? ShieldCheck : Database
  const warningReason = snapshot.stale
    ? 'This snapshot is stale.'
    : championStatus === 'FAIL'
      ? 'Reviewer sign-offs are still in progress.'
      : ''

  if (compact) {
    return (
      <span className={cn('snapshot-chip-wrap', className)}>
        <button
          type="button"
          className={cn('snapshot-chip', warning ? 'is-warning' : 'is-ok')}
          aria-expanded={open}
          title="Data snapshot status"
          onClick={() => setOpen(value => !value)}
        >
          <Icon size={15} />
        </button>
        {open ? (
          <span role="status" className="snapshot-pop">
            <span>Data as of {snapshotTime(snapshot.generated_at)}</span>
            <span className="font-mono">bundle {snapshot.bundle_hash.slice(0, 8)}</span>
            {warningReason ? <span>{warningReason}</span> : null}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <div
      role={warning ? 'alert' : 'status'}
      className={cn(
        'flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2 text-xs font-medium',
        warning
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900',
        className
      )}
    >
      <Icon size={14} aria-hidden="true" />
      <span>Data as of {snapshotTime(snapshot.generated_at)}</span>
      <span aria-hidden="true">·</span>
      <span className="font-mono">bundle {snapshot.bundle_hash.slice(0, 8)}</span>
      {warningReason ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{warningReason}</span>
        </>
      ) : null}
    </div>
  )
}
