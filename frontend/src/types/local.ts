import type { EngineAction, JsonValue, RunModeInfo } from '@/types/workspace'

/** Local (open-weights) workspace: separate from the hybrid snapshot and registry. */
export type LocalQueue = 'new' | 'known' | 'absence'
export type LocalReviewStateName = 'pending' | 'approved' | 'rejected' | 'stale'

export interface LocalRunSummary {
  action_id: string
  run_id: string | null
  economy: string
  pillar: string
  country: string | null
  generated_at: string | null
  started_at: string | null
  finished_at: string | null
  requested_by: string
  elapsed_seconds: number | null
  rows: number
  evidence: number
  absences: number
  models: string[]
  calls: number
  input_tokens: number
  output_tokens: number
  total_usd: number | null
  corpus_fingerprint: string | null
  corpus_provisions: number | null
  warning_count: number
  output_sha256: string
}

export interface LocalProgress { total: number; decided: number; approved: number; rejected: number; stale: number }

export interface LocalOverview {
  mode: 'local'
  modes: RunModeInfo[]
  models: string
  runs: LocalRunSummary[]
  coverage: { economy: string; pillar: string; run: LocalRunSummary | null }[]
  progress: Record<LocalQueue, LocalProgress>
  counts: { runs: number; scopes: number; rows: number; evidence: number; absences: number; comparable: number }
  totals: { calls: number; input_tokens: number; output_tokens: number; elapsed_seconds: number; total_usd: number }
  active: EngineAction[]
}

export interface LocalGate { gate_id: string | null; status: string | null; reason?: string | null }

export interface LocalProof {
  available: boolean
  match_mode: 'exact' | 'anchor' | 'blocked' | 'unavailable'
  page: number | null
  anchor: string | null
  gates_pass: boolean
  gates_total: number
  failing_gates: (string | null)[]
  source_sha256: string
  gates?: LocalGate[]
  article_path?: string[]
  alignment_score?: number | null
}

export interface LocalDecision {
  id: string
  decision: 'approved' | 'rejected'
  citation_checked: boolean
  mapping_checked: boolean
  status_checked: boolean
  note: string
  reviewer_name: string
  reviewer_role: string
  reviewed_at: string
  review_subject_hash: string
  supersedes_id: string | null
}

export interface LocalItem {
  key: string
  stable_key: string
  queue: LocalQueue
  pillar: string
  economy: string | null
  indicator: string | null
  law: string | null
  law_ref: string | null
  last_amended: string | null
  article: string | null
  tag: string | null
  location: string | null
  snippet: string | null
  snippet_en: string | null
  rationale: string | null
  source_url: string | null
  confidence: number | string | null
  notes: string | null
  coverage: string | null
  status: string | null
  absence: boolean
  status_evidence: string | null
  citation_tier: string | null
  access_date: string | null
  model_version: string | null
  proof: LocalProof
  run: { action_id: string; run_id: string | null; economy: string; generated_at: string | null; index: number }
  subject_hash: string
  review: { state: LocalReviewStateName; decision: 'approved' | 'rejected' | null; latest: LocalDecision | null }
  status_record?: JsonValue
  coverage_manifest?: JsonValue
}

export interface LocalItemsResponse {
  mode: 'local'
  modes: RunModeInfo[]
  template_columns: string[]
  template_fields: Record<string, keyof LocalItem>
  progress: Record<LocalQueue, LocalProgress>
  runs: LocalRunSummary[]
  reviewer_roles: string[]
  results: LocalItem[]
}

export interface LocalItemDetail { item: LocalItem; history: LocalDecision[] }

export interface LocalDecisionInput {
  finding_key: string
  decision: 'approved' | 'rejected'
  citation_checked: boolean
  mapping_checked: boolean
  status_checked: boolean
  note: string
  expected_latest_id: string | null
}

export type LocalChangeKind = 'unchanged' | 'revised' | 'new' | 'not_reproduced'

export interface LocalChange {
  kind: LocalChangeKind
  economy: string | null
  indicator: string | null
  law: string | null
  article: string | null
  absence: boolean
  queue: LocalQueue
  finding_key: string | null
  changed_stages: string[]
  snippet: string
  previous_snippet: string | null
}

export interface LocalChangeScope {
  economy: string
  pillar: string
  baseline: boolean
  current_run: LocalRunSummary
  previous_run: LocalRunSummary | null
  counts: Partial<Record<LocalChangeKind, number>>
  changes: LocalChange[]
}

export interface LocalChangesResponse {
  mode: 'local'
  modes: RunModeInfo[]
  counts: Partial<Record<LocalChangeKind, number>>
  scopes: LocalChangeScope[]
}

export interface LocalLedgerEvent {
  id: string
  event_type: string
  occurred_at: string
  actor: string
  actor_role: string
  action: string
  subject: string
  key: string
  hash: string
  note: string
  supersedes_id: string | null
}

export interface LocalRawFileMeta {
  name: string
  exists: boolean
  size: number
  sha256: string | null
  recorded_sha256: string | null
  verified: boolean | null
  location: string
}

export interface LocalRawRun {
  action_id: string
  economy: string
  pillar: string
  run_id: string | null
  finished_at: string | null
  files: LocalRawFileMeta[]
}

export interface LocalRawFile extends LocalRawFileMeta {
  raw_text: string
  truncated: boolean
  parsed: JsonValue
}

export interface ComparisonScope { economy: string; pillar: string; model_a: boolean; model_b: boolean }

export interface EngineCard {
  label: string
  source: string
  name: string
  run_id: string | null
  models: string[]
  started_at: string | null
  finished_at: string | null
  elapsed_seconds: number | null
  total_usd: number | null
  documents_fetched: number
  corpus_fingerprint: string | null
  rows: number
  evidence: number
  absences: number
  calls: number
}

export interface ComparisonSide {
  indicator: string | null
  article: string | null
  snippet: string
  rationale: string
  confidence: number | string | null
  tag: string | null
  source_url: string | null
  finding_key: string
}

export interface ComparisonRow {
  number: number
  law: string | null
  article: string | null
  indicator: string | null
  found_by: 'Both' | 'Model A only' | 'Model B only'
  indicator_differs: boolean
  citation_differs: boolean
  quote_differs: boolean
  how: string
  model_a: ComparisonSide | null
  model_b: ComparisonSide | null
}

export interface ComparisonDetail {
  economy: string
  pillar: string
  model_a: EngineCard | null
  model_b: EngineCard | null
  same_corpus: boolean
  counts: {
    provisions: number
    both: number
    model_a_only: number
    model_b_only: number
    indicator_differs: number
    citation_differs: number
    quote_differs: number
    agreement_pct: number | null
  }
  rows: ComparisonRow[]
  by_indicator: { indicator: string; model_a: number; model_b: number; agreement: string }[]
}

export interface ComparisonResponse {
  scopes: ComparisonScope[]
  selected: ComparisonDetail | null
  models: Record<string, string>
}
