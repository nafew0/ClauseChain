'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { useToast } from '@/hooks/useToast'
import {
  decideLocal,
  decideLocalBulk,
  getComparison,
  getLocalChanges,
  getLocalItem,
  getLocalItems,
  getLocalLedger,
  getLocalOverview,
  getLocalRaw,
  getLocalRawFile,
} from '@/services/local'
import type { LocalDecisionInput } from '@/types/local'

export const localKeys = {
  all: ['workspace', 'local'] as const,
  overview: () => [...localKeys.all, 'overview'] as const,
  items: () => [...localKeys.all, 'items'] as const,
  item: (key: string) => [...localKeys.all, 'item', key] as const,
  changes: () => [...localKeys.all, 'changes'] as const,
  ledger: () => [...localKeys.all, 'ledger'] as const,
  raw: () => [...localKeys.all, 'raw'] as const,
  rawFile: (actionId: string, name: string) => [...localKeys.all, 'raw', actionId, name] as const,
  comparison: (economy?: string, pillar?: string) => ['workspace', 'comparison', economy ?? '', pillar ?? ''] as const,
}

export const useLocalOverview = () => useQuery({ queryKey: localKeys.overview(), queryFn: getLocalOverview })
export const useLocalItems = () => useQuery({ queryKey: localKeys.items(), queryFn: getLocalItems })
export const useLocalChanges = () => useQuery({ queryKey: localKeys.changes(), queryFn: getLocalChanges })
export const useLocalLedger = () => useQuery({ queryKey: localKeys.ledger(), queryFn: getLocalLedger })
export const useLocalRaw = () => useQuery({ queryKey: localKeys.raw(), queryFn: getLocalRaw })

export function useLocalItem(key: string | null) {
  return useQuery({ queryKey: localKeys.item(key ?? ''), queryFn: () => getLocalItem(key!), enabled: Boolean(key) })
}

export function useLocalRawFile(actionId: string | null, name: string | null) {
  return useQuery({
    queryKey: localKeys.rawFile(actionId ?? '', name ?? ''),
    queryFn: () => getLocalRawFile(actionId!, name!),
    enabled: Boolean(actionId && name),
  })
}

export function useComparison(economy?: string, pillar?: string) {
  return useQuery({ queryKey: localKeys.comparison(economy, pillar), queryFn: () => getComparison(economy, pillar) })
}

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    const first = data && Object.values(data)[0]
    if (typeof first === 'string') return first
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    if (error.response?.status === 409) return 'Someone recorded a newer decision. Reload and decide again.'
  }
  return 'The decision was not saved.'
}

export function useLocalDecide() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (payload: LocalDecisionInput) => decideLocal(payload),
    onSuccess: async (result) => {
      toast({ title: `Local finding ${result.decision.decision}`, description: 'Recorded in the Local ledger.', variant: 'success', duration: 4_000 })
      await queryClient.invalidateQueries({ queryKey: localKeys.all })
    },
    onError: (error) => toast({ title: 'Decision not saved', description: errorText(error), variant: 'error' }),
  })
}

export function useLocalBulkDecide() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ keys, expected }: { keys: string[]; expected: Record<string, string | null> }) =>
      decideLocalBulk(keys, expected),
    onSuccess: async (result) => {
      toast({ title: `${result.decisions.length} KNOWN rows approved`, variant: 'success', duration: 4_000 })
      await queryClient.invalidateQueries({ queryKey: localKeys.all })
    },
    onError: (error) => toast({ title: 'Bulk approval not saved', description: errorText(error), variant: 'error' }),
  })
}
