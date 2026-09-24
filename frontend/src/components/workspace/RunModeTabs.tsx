'use client'

import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Cloud, Server } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { RunMode, RunModeInfo } from '@/types/workspace'

const MODE_ICON = { hybrid: Cloud, local: Server } as const

const FALLBACK_MODES: RunModeInfo[] = [
  { id: 'hybrid', label: 'Hybrid', models: '' },
  { id: 'local', label: 'Local', models: '' },
]

/** The run mode lives in the URL (?mode=local) so a tab is linkable and survives reloads. */
export function useRunMode(): [RunMode, (mode: RunMode) => void] {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mode: RunMode = searchParams.get('mode') === 'local' ? 'local' : 'hybrid'
  const setMode = useCallback((next: RunMode) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'hybrid') params.delete('mode')
    else params.set('mode', next)
    const query = params.toString()
    // Same-page searchParams update: the History API integrates with
    // useSearchParams; router.replace no-ops for query-only changes in prod builds.
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])
  return [mode, setMode]
}

export function RunModeTabs({ mode, onChange, modes }: {
  mode: RunMode
  onChange: (mode: RunMode) => void
  modes?: RunModeInfo[]
}) {
  const options = modes?.length ? modes : FALLBACK_MODES
  const active = options.find((option) => option.id === mode)
  return (
    <div className="run-mode-bar">
      <div className="run-mode-tabs" role="tablist" aria-label="Model backend">
        {options.map((option) => {
          const Icon = MODE_ICON[option.id]
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={mode === option.id}
              className={cn(mode === option.id && 'active')}
              onClick={() => onChange(option.id)}
            >
              <Icon size={14} />
              <span>{option.label}</span>
              <small>{option.id === 'hybrid' ? 'cloud' : 'open weights'}</small>
            </button>
          )
        })}
      </div>
      {active?.models ? <p className="run-mode-models">{active.models}</p> : null}
    </div>
  )
}
