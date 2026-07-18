export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export type WorkspaceQueue = 'new' | 'absence' | 'recall' | 'zone3' | 'known'
export type FindingQueue = Extract<WorkspaceQueue, 'new' | 'absence' | 'known'>
export type ReviewStage = 'citation' | 'mapping' | 'status'
export type FindingVerdict = 'approved' | 'rejected'
export type RecallVerdict =
  | 'REAL_MISS'
  | 'GOLD_WRONG'
  | 'GOLD_AMBIGUOUS'
  | 'CORRECT_ABSTENTION'
  | 'NEEDS_CORRECTION'
export type Zone3Verdict = 'approved' | 'overridden'
export type Zone3Score = 0 | 0.5 | 1
export type DecisionDomain = 'findings' | 'recall' | 'zone3'
export type FindingWriteOutcome = 'stage_recorded' | 'engine_decision_written'

export interface SnapshotIdentity {
  id: string
  schema_version: string
  generated_at: string
  imported_at: string
  source_hash: string
  bundle_hash: string
  engine_git_sha: string
  stale: boolean
}

export interface ReviewProgress {
  decided: number
  total: number
}

export interface WorkspaceSummary {
  snapshot: SnapshotIdentity
  counts: Record<string, number>
  refuter_status: string
  champion: JsonObject
  progress: Record<WorkspaceQueue, ReviewProgress>
  reviewer_roles: string[]
}

export interface FindingStageState {
  id: string
  decision: FindingVerdict
  reviewer_name: string
  reviewer_user_id: string
  reviewed_at: string
}

export interface FindingReviewState {
  decision: FindingVerdict | null
  correction_pending: boolean
  citation_checked: boolean
  mapping_checked: boolean
  status_checked: boolean
  citation_reviewer_name: string
  mapping_reviewer_name: string
  status_reviewer_name: string
  stages: Partial<Record<ReviewStage, FindingStageState>>
}

export interface LatestCorrection {
  id: string
  explanation: string
  requested_by: string
  requested_at: string
}

export interface DomainDecision {
  id: string
  verdict: RecallVerdict | Zone3Verdict
  reviewer_name: string
  reviewer_role: string
  reviewed_at: string
  authoritative_file_hash: string
  supersedes_id: string | null
  reasoning?: string
  official_source_url?: string
  score?: string
}

export interface ReviewItem {
  id: number
  position: number
  row: JsonValue[] | JsonObject
  stable_key: string
  finding_key: string | null
  blocked: boolean
  block_reason: string
  source_hash: string
  review_state?: FindingReviewState
  latest_correction?: LatestCorrection | null
  latest_decision?: DomainDecision | null
  approval_eligibility?: { eligible: boolean; reason: string }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ReviewQueueResponse extends PaginatedResponse<ReviewItem> {
  queue: WorkspaceQueue
  headers: string[]
  snapshot_id: string
  snapshot_hash: string
}

export interface ReviewQueueParams {
  page?: number
  page_size?: number
  undecided?: boolean
}

export interface EvidenceRow {
  finding_key: string
  row: JsonObject
  blocked: boolean
  proof_asset_url: string | null
  source_hash: string
}

export interface EvidenceDetail extends EvidenceRow {
  review_state: FindingReviewState
}

export interface RelatedEvidence extends Omit<EvidenceRow, 'source_hash'> {
  same_law: boolean
  same_indicator: boolean
}

export interface ReviewContext {
  queue: WorkspaceQueue
  stable_key: string
  snapshot: { id: string; source_hash: string; stale: boolean }
  indicator_criteria: JsonObject | null
  master_known: JsonObject[]
  related_evidence: RelatedEvidence[]
  zone3: {
    score_key: string
    deterministic_score: number | null
    effective_score: number | null
    source: 'deterministic' | 'reviewer'
    reviewer_name: string | null
    reviewed_at: string | null
  } | null
  approval_eligibility: { eligible: boolean; reason: string }
  score_semantics: {
    level: 'indicator'
    finding_has_independent_score: false
    allowed_scores: Zone3Score[]
    explanation: string
  }
}

export interface EvidenceParams {
  page?: number
  page_size?: number
  economy?: string
  indicator?: string
  pillar?: string | number
  tag?: string
  status?: string
}

export interface RunRecord {
  run_name: string
  envelope: JsonObject
  cost: JsonObject
  source_hash: string
}

export interface RunsResponse {
  results: RunRecord[]
}

export interface FindingDecisionInput {
  finding_key: string
  queue: FindingQueue
  review_stage: ReviewStage
  decision: FindingVerdict
  citation_checked?: boolean
  mapping_checked?: boolean
  status_checked?: boolean
  note?: string
  expected_latest_decision_id: string | null
}

export interface FindingDecisionResponse {
  decision_id: string
  authoritative_file_hash: string
  review_state: FindingReviewState
  reviewer_id: string
  outcome: FindingWriteOutcome
  engine_exported: boolean
}

export interface BulkFindingDecisionInput {
  finding_keys: string[]
  review_stage: ReviewStage
  citation_checked?: boolean
  mapping_checked?: boolean
  status_checked?: boolean
  note?: string
  expected_latest_decision_ids: Record<string, string | null>
}

export interface BulkFindingDecisionResponse {
  decision_ids: string[]
  authoritative_file_hash: string
  reviewer_id: string
  outcome: FindingWriteOutcome
  engine_exported: boolean
  review_states: Record<string, FindingReviewState>
}

export interface RecallDecisionInput {
  recall_key: string
  verdict: RecallVerdict
  reasoning?: string
  official_source_url?: string
  expected_latest_decision_id: string | null
}

export interface Zone3DecisionInput {
  score_key: string
  verdict: Zone3Verdict
  score: Zone3Score
  reasoning?: string
  expected_latest_decision_id: string | null
}

export interface DecisionWriteResponse {
  decision_id: string
  authoritative_file_hash: string
  reviewer_id: string
}

export interface CorrectionRequestInput {
  finding_key: string
  queue: FindingQueue
  explanation: string
  expected_latest_correction_id: string | null
}

export interface CorrectionRequestResponse {
  correction_request_id: string
  finding_key: string
  authoritative_file_hash: string
}

export interface FindingHistoryEntry {
  id: string
  stage: ReviewStage
  decision: FindingVerdict
  checks: { citation: boolean; mapping: boolean; status: boolean }
  note: string
  reviewer_name: string
  reviewer_role: string
  reviewed_at: string
  supersedes_id: string | null
  authoritative_file_hash: string
}

export interface CorrectionHistoryEntry {
  id: string
  explanation: string
  reviewer_name: string
  reviewed_at: string
  supersedes_id: string | null
  authoritative_file_hash: string
}

export interface FindingDecisionHistory {
  domain: 'findings'
  key: string
  results: FindingHistoryEntry[]
  corrections: CorrectionHistoryEntry[]
  effective_review: FindingReviewState
}

export interface DomainDecisionHistory {
  domain: 'recall' | 'zone3'
  key: string
  results: DomainDecision[]
}

export type DecisionHistory = FindingDecisionHistory | DomainDecisionHistory

export interface WorkspaceFixture {
  summary: WorkspaceSummary
  queues: Record<WorkspaceQueue, ReviewQueueResponse>
  evidence: EvidenceRow[]
  runs: RunsResponse
  references: {
    indicator_criteria: { headers: string[]; rows: (JsonValue[] | JsonObject)[] }
    master_known: { headers: string[]; rows: (JsonValue[] | JsonObject)[] }
  }
}

export type DecideRequest =
  | { domain: 'findings'; payload: FindingDecisionInput }
  | { domain: 'findings-bulk'; payload: BulkFindingDecisionInput }
  | { domain: 'recall'; payload: RecallDecisionInput }
  | { domain: 'zone3'; payload: Zone3DecisionInput }
  | { domain: 'correction'; payload: CorrectionRequestInput }

export type DecideResponse =
  | FindingDecisionResponse
  | BulkFindingDecisionResponse
  | DecisionWriteResponse
  | CorrectionRequestResponse

export function rowRecord(headers: string[], row: JsonValue[] | JsonObject): JsonObject {
  if (!Array.isArray(row)) return row
  return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]))
}
