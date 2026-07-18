import type {
  DecisionHistory,
  EvidenceDetail,
  EvidenceParams,
  EvidenceRow,
  PaginatedResponse,
  ReviewQueueParams,
  ReviewQueueResponse,
  WorkspaceFixture,
  WorkspaceQueue,
} from '@/types/workspace'

export const WORKSPACE_FIXTURE_MODE =
  process.env.NEXT_PUBLIC_WORKSPACE_FIXTURE_MODE?.trim() === '1'

function assertDevelopmentFixtureMode() {
  if (!WORKSPACE_FIXTURE_MODE) {
    throw new Error('Workspace fixture mode is not enabled.')
  }
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Workspace fixtures are forbidden outside development.')
  }
}

let fixturePromise: Promise<WorkspaceFixture> | null = null

export async function loadWorkspaceFixture(): Promise<WorkspaceFixture> {
  assertDevelopmentFixtureMode()
  fixturePromise ??= import('./fixtures/current.json').then(
    (module) => module.default as unknown as WorkspaceFixture
  )
  return fixturePromise
}

function pageSlice<T>(rows: T[], page = 1, pageSize = 50): PaginatedResponse<T> {
  const safeSize = Math.min(Math.max(pageSize, 1), 200)
  const safePage = Math.max(page, 1)
  const start = (safePage - 1) * safeSize
  return {
    count: rows.length,
    next: start + safeSize < rows.length ? `fixture:page:${safePage + 1}` : null,
    previous: safePage > 1 ? `fixture:page:${safePage - 1}` : null,
    results: rows.slice(start, start + safeSize),
  }
}

export async function fixtureReviewQueue(
  queue: WorkspaceQueue,
  params: ReviewQueueParams = {}
): Promise<ReviewQueueResponse> {
  const fixture = await loadWorkspaceFixture()
  const source = fixture.queues[queue]
  let results = [...source.results]
  if (params.undecided) {
    results = results.filter((item) => {
      if (item.review_state) return item.review_state.decision === null
      return !item.latest_decision
    })
  }
  if (queue === 'new') {
    const verdictIndex = source.headers.indexOf('Refuter verdict')
    const rank: Record<string, number> = { SPLIT: 0, KEEP: 1, REJECT: 2 }
    if (verdictIndex >= 0) {
      results.sort((left, right) => {
        const leftRow = Array.isArray(left.row) ? left.row : []
        const rightRow = Array.isArray(right.row) ? right.row : []
        return (
          (rank[String(leftRow[verdictIndex] ?? '').toUpperCase()] ?? 3) -
            (rank[String(rightRow[verdictIndex] ?? '').toUpperCase()] ?? 3) ||
          left.position - right.position
        )
      })
    }
  }
  const page = pageSlice(results, params.page, params.page_size)
  return { ...source, ...page }
}

function equalFilter(actual: unknown, expected: string | undefined) {
  return !expected || String(actual ?? '').toLocaleLowerCase() === expected.toLocaleLowerCase()
}

export async function fixtureEvidence(
  params: EvidenceParams = {}
): Promise<PaginatedResponse<EvidenceRow>> {
  const fixture = await loadWorkspaceFixture()
  const rows = fixture.evidence.filter(({ row }) => {
    const pillar = params.pillar === undefined ? '' : String(params.pillar)
    return (
      equalFilter(row['Economy'], params.economy) &&
      equalFilter(row['Indicator ID'], params.indicator) &&
      equalFilter(row['Discovery Tag'], params.tag) &&
      equalFilter(row['Status'], params.status) &&
      (!pillar || String(row['Indicator ID'] ?? '').startsWith(`P${pillar}-`))
    )
  })
  return pageSlice(rows, params.page, params.page_size)
}

export async function fixtureEvidenceRow(findingKey: string): Promise<EvidenceDetail> {
  const fixture = await loadWorkspaceFixture()
  const evidence = fixture.evidence.find((row) => row.finding_key === findingKey)
  if (!evidence) throw new Error(`Fixture evidence row not found: ${findingKey}`)
  const reviewItem = Object.values(fixture.queues)
    .flatMap((queue) => queue.results)
    .find((item) => item.finding_key === findingKey)
  return {
    ...evidence,
    review_state: reviewItem?.review_state ?? {
      decision: null,
      correction_pending: false,
      citation_checked: false,
      mapping_checked: false,
      status_checked: false,
      citation_reviewer_name: '',
      mapping_reviewer_name: '',
      status_reviewer_name: '',
      stages: {},
    },
  }
}

export async function fixtureDecisionHistory(
  domain: 'findings' | 'recall' | 'zone3',
  key: string
): Promise<DecisionHistory> {
  if (domain === 'findings') {
    const evidence = await fixtureEvidenceRow(key)
    return {
      domain,
      key,
      results: [],
      corrections: [],
      effective_review: evidence.review_state,
    }
  }
  await loadWorkspaceFixture()
  return { domain, key, results: [] }
}

export function rejectFixtureWrite(): never {
  throw new Error(
    'Development fixture mode is read-only. Disable NEXT_PUBLIC_WORKSPACE_FIXTURE_MODE and use the API to record a review.'
  )
}
