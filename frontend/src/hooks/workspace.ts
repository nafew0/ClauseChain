'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { useToast } from '@/hooks/useToast'
import {
  decideFinding,
  decideFindingsBulk,
  decideRecall,
  decideZone3,
  getDecisionHistory,
  getEvidence,
  getEvidenceRow,
  getReviewQueue,
  getReviewContext,
  getRuns,
  getSummary,
  requestCorrection,
} from '@/services/workspace'
import type {
  DecideRequest,
  DecideResponse,
  EvidenceParams,
  FindingDecisionResponse,
  ReviewQueueParams,
  WorkspaceQueue,
} from '@/types/workspace'

export const workspaceKeys = {
  all: ['workspace'] as const,
  summary: () => [...workspaceKeys.all, 'summary'] as const,
  review: (queue: WorkspaceQueue, params: ReviewQueueParams) =>
    [...workspaceKeys.all, 'review', queue, params] as const,
  evidence: (params: EvidenceParams) => [...workspaceKeys.all, 'evidence', params] as const,
  evidenceRow: (findingKey: string) =>
    [...workspaceKeys.all, 'evidence-row', findingKey] as const,
  runs: () => [...workspaceKeys.all, 'runs'] as const,
  history: (domain: 'findings' | 'recall' | 'zone3', key: string) =>
    [...workspaceKeys.all, 'history', domain, key] as const,
  reviewContext: (queue: WorkspaceQueue, stableKey: string) =>
    [...workspaceKeys.all, 'review-context', queue, stableKey] as const,
}

export function useReviewContext(
  queue: WorkspaceQueue,
  stableKey: string | null | undefined
) {
  return useQuery({
    queryKey: workspaceKeys.reviewContext(queue, stableKey ?? ''),
    queryFn: () => getReviewContext(queue, stableKey!),
    enabled: Boolean(stableKey),
  })
}

export function useSummary() {
  return useQuery({ queryKey: workspaceKeys.summary(), queryFn: getSummary })
}

export function useReviewQueue(queue: WorkspaceQueue, params: ReviewQueueParams = {}) {
  return useQuery({
    queryKey: workspaceKeys.review(queue, params),
    queryFn: () => getReviewQueue(queue, params),
  })
}

export function useEvidence(params: EvidenceParams = {}) {
  return useQuery({
    queryKey: workspaceKeys.evidence(params),
    queryFn: () => getEvidence(params),
  })
}

export function useEvidenceRow(findingKey: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.evidenceRow(findingKey ?? ''),
    queryFn: () => getEvidenceRow(findingKey!),
    enabled: Boolean(findingKey),
  })
}

export function useRuns() {
  return useQuery({ queryKey: workspaceKeys.runs(), queryFn: getRuns })
}

export function useDecisionHistory(
  domain: 'findings' | 'recall' | 'zone3',
  key: string | null | undefined
) {
  return useQuery({
    queryKey: workspaceKeys.history(domain, key ?? ''),
    queryFn: () => getDecisionHistory(domain, key!),
    enabled: Boolean(key),
  })
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data
    if (typeof payload === 'string') return payload
    if (payload && typeof payload === 'object') {
      const detail = (payload as { detail?: unknown }).detail
      if (typeof detail === 'string') return detail
      return JSON.stringify(payload)
    }
  }
  return error instanceof Error ? error.message : 'The decision could not be saved.'
}

function isFindingResponse(response: DecideResponse): response is FindingDecisionResponse {
  return 'outcome' in response && 'review_state' in response
}

async function submitDecision(request: DecideRequest): Promise<DecideResponse> {
  switch (request.domain) {
    case 'findings':
      return decideFinding(request.payload)
    case 'findings-bulk':
      return decideFindingsBulk(request.payload)
    case 'recall':
      return decideRecall(request.payload)
    case 'zone3':
      return decideZone3(request.payload)
    case 'correction':
      return requestCorrection(request.payload)
  }
}

export function useDecide() {
  const queryClient = useQueryClient()
  const { toast, update } = useToast()

  return useMutation({
    mutationFn: submitDecision,
    onMutate: () => ({
      toastId: toast({
        title: 'Saving review…',
        description: 'Waiting for the authoritative writer receipt.',
        variant: 'info',
        duration: 0,
      }),
    }),
    onSuccess: async (response, request, context) => {
      let title = 'Authoritative decision saved'
      let description = `Engine receipt ${response.authoritative_file_hash.slice(0, 8)}.`

      if (isFindingResponse(response) && response.outcome === 'stage_recorded') {
        title = 'Review stage recorded'
        description = 'Awaiting the required second reviewer; no final decision was exported to the engine.'
      } else if (
        request.domain === 'findings-bulk' &&
        'outcome' in response &&
        response.outcome === 'stage_recorded'
      ) {
        title = 'Review stages recorded'
        description = 'Awaiting the required second reviewer; no final decisions were exported to the engine.'
      } else if (request.domain === 'correction') {
        title = 'Correction requested'
        description = 'The prior finding approval is blocked until corrected evidence is reviewed again.'
      }

      update(context.toastId, {
        title,
        description,
        variant: 'success',
        duration: 5_000,
      })
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
    },
    onError: async (error, _request, context) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
      }
      if (!context?.toastId) return
      update(context.toastId, {
        title: axios.isAxiosError(error) && error.response?.status === 409 ? 'Review changed—reconsider required' : 'Review not saved',
        description: axios.isAxiosError(error) && error.response?.status === 409
          ? `${errorMessage(error)} Your draft note has been preserved; authoritative history was refreshed.`
          : errorMessage(error),
        variant: 'error',
        duration: 7_000,
      })
    },
  })
}
