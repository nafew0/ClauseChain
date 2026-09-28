import api from '@/services/api'
import type {
  ComparisonResponse,
  LocalChangesResponse,
  LocalDecision,
  LocalDecisionInput,
  LocalItem,
  LocalItemDetail,
  LocalItemsResponse,
  LocalLedgerEvent,
  LocalOverview,
  LocalRawFile,
  LocalRawRun,
} from '@/types/local'
import type { RunModeInfo } from '@/types/workspace'

/** Local (open-weights) workspace API: never touches the hybrid snapshot. */

export async function getLocalOverview(): Promise<LocalOverview> {
  const { data } = await api.get<LocalOverview>('/workspace/local/overview/')
  return data
}

export async function getLocalItems(): Promise<LocalItemsResponse> {
  const { data } = await api.get<LocalItemsResponse>('/workspace/local/items/')
  return data
}

export async function getLocalItem(key: string): Promise<LocalItemDetail> {
  const { data } = await api.get<LocalItemDetail>(`/workspace/local/items/${key}/`)
  return data
}

export async function decideLocal(payload: LocalDecisionInput): Promise<{ decision: LocalDecision; item: LocalItem }> {
  const { data } = await api.post('/workspace/local/decisions/', payload)
  return data
}

export async function decideLocalBulk(
  findingKeys: string[],
  expected: Record<string, string | null>,
): Promise<{ decisions: LocalDecision[] }> {
  const { data } = await api.post('/workspace/local/decisions/bulk/', {
    finding_keys: findingKeys,
    expected_latest_ids: expected,
  })
  return data
}

export async function getLocalChanges(): Promise<LocalChangesResponse> {
  const { data } = await api.get<LocalChangesResponse>('/workspace/local/changes/')
  return data
}

export async function getLocalLedger(): Promise<{ count: number; results: LocalLedgerEvent[] }> {
  const { data } = await api.get('/workspace/local/ledger/')
  return data
}

export async function getLocalRaw(): Promise<{ modes: RunModeInfo[]; results: LocalRawRun[] }> {
  const { data } = await api.get('/workspace/local/raw/')
  return data
}

export async function getLocalRawFile(actionId: string, name: string): Promise<LocalRawFile> {
  const { data } = await api.get<{ file: LocalRawFile }>(`/workspace/local/raw/${actionId}/${name}/`)
  return data.file
}

export async function getComparison(economy?: string, pillar?: string): Promise<ComparisonResponse> {
  const { data } = await api.get<ComparisonResponse>('/workspace/comparison/', {
    params: economy && pillar ? { economy, pillar } : {},
  })
  return data
}

async function download(url: string, params: Record<string, string>, fallbackName: string) {
  const response = await api.get<Blob>(url, { params, responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName
  const href = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(href)
}

export const downloadLocalDataset = (params: Record<string, string> = {}) =>
  download('/workspace/local/dataset/export/', params, 'clausechain_local_dataset.csv')

export const downloadComparison = (economy: string, pillar: string) =>
  download('/workspace/comparison/export/', { economy, pillar }, 'clausechain_engine_comparison.csv')

export const downloadLocalRawFile = (actionId: string, name: string) =>
  download(`/workspace/local/raw/${actionId}/${name}/`, { download: '1' }, name)
