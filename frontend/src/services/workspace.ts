import api from '@/services/api'
import {
  WORKSPACE_FIXTURE_MODE,
  fixtureDecisionHistory,
  fixtureEvidence,
  fixtureEvidenceRow,
  fixtureReviewQueue,
  loadWorkspaceFixture,
  rejectFixtureWrite,
} from '@/lib/workspace/fixture'
import type {
  BulkFindingDecisionInput,
  BulkFindingDecisionResponse,
  CorrectionRequestInput,
  CorrectionRequestResponse,
  DecisionHistory,
  DecisionWriteResponse,
  EvidenceDetail,
  EvidenceParams,
  EvidenceRow,
  FindingDecisionInput,
  FindingDecisionResponse,
  PaginatedResponse,
  RecallDecisionInput,
  ReviewQueueParams,
  ReviewQueueResponse,
  RunsResponse,
  WorkspaceQueue,
  WorkspaceSummary,
  Zone3DecisionInput,
} from '@/types/workspace'

function queryParams<T extends object>(values: T) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, typeof value === 'boolean' ? (value ? '1' : '0') : value])
  )
}

export async function getSummary(): Promise<WorkspaceSummary> {
  if (WORKSPACE_FIXTURE_MODE) return (await loadWorkspaceFixture()).summary
  const { data } = await api.get<WorkspaceSummary>('/workspace/summary/')
  return data
}

export async function getReviewQueue(
  queue: WorkspaceQueue,
  params: ReviewQueueParams = {}
): Promise<ReviewQueueResponse> {
  if (WORKSPACE_FIXTURE_MODE) return fixtureReviewQueue(queue, params)
  const { data } = await api.get<ReviewQueueResponse>(`/workspace/review/${queue}/`, {
    params: queryParams(params),
  })
  return data
}

export async function getEvidence(
  params: EvidenceParams = {}
): Promise<PaginatedResponse<EvidenceRow>> {
  if (WORKSPACE_FIXTURE_MODE) return fixtureEvidence(params)
  const { data } = await api.get<PaginatedResponse<EvidenceRow>>('/workspace/evidence/', {
    params: queryParams(params),
  })
  return data
}

export async function getEvidenceRow(findingKey: string): Promise<EvidenceDetail> {
  if (WORKSPACE_FIXTURE_MODE) return fixtureEvidenceRow(findingKey)
  const { data } = await api.get<EvidenceDetail>(`/workspace/evidence/${findingKey}/`)
  return data
}

export async function getRuns(): Promise<RunsResponse> {
  if (WORKSPACE_FIXTURE_MODE) return (await loadWorkspaceFixture()).runs
  const { data } = await api.get<RunsResponse>('/workspace/runs/')
  return data
}

export async function getDecisionHistory(
  domain: 'findings' | 'recall' | 'zone3',
  key: string
): Promise<DecisionHistory> {
  if (WORKSPACE_FIXTURE_MODE) return fixtureDecisionHistory(domain, key)
  const { data } = await api.get<DecisionHistory>(
    `/workspace/decisions/${domain}/${key}/history/`
  )
  return data
}

export async function decideFinding(
  payload: FindingDecisionInput
): Promise<FindingDecisionResponse> {
  if (WORKSPACE_FIXTURE_MODE) return rejectFixtureWrite()
  const { data } = await api.post<FindingDecisionResponse>(
    '/workspace/decisions/findings/',
    payload
  )
  return data
}

export async function decideFindingsBulk(
  payload: BulkFindingDecisionInput
): Promise<BulkFindingDecisionResponse> {
  if (WORKSPACE_FIXTURE_MODE) return rejectFixtureWrite()
  const { data } = await api.post<BulkFindingDecisionResponse>(
    '/workspace/decisions/findings/bulk/',
    payload
  )
  return data
}

export async function decideRecall(
  payload: RecallDecisionInput
): Promise<DecisionWriteResponse> {
  if (WORKSPACE_FIXTURE_MODE) return rejectFixtureWrite()
  const { data } = await api.post<DecisionWriteResponse>(
    '/workspace/decisions/recall/',
    payload
  )
  return data
}

export async function decideZone3(
  payload: Zone3DecisionInput
): Promise<DecisionWriteResponse> {
  if (WORKSPACE_FIXTURE_MODE) return rejectFixtureWrite()
  const { data } = await api.post<DecisionWriteResponse>(
    '/workspace/decisions/zone3/',
    payload
  )
  return data
}

export async function requestCorrection(
  payload: CorrectionRequestInput
): Promise<CorrectionRequestResponse> {
  if (WORKSPACE_FIXTURE_MODE) return rejectFixtureWrite()
  const { data } = await api.post<CorrectionRequestResponse>(
    '/workspace/corrections/',
    payload
  )
  return data
}
