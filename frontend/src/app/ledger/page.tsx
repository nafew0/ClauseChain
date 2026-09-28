import { Suspense } from 'react'

import ProtectedRoute from '@/components/ProtectedRoute'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { ModeRoute } from '@/components/workspace/RunModeTabs'
import PipelineLedger from '@/views/PipelineLedger'
import LocalLedger from '@/views/local/LocalLedger'

export default function LedgerPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<WorkspaceShell breadcrumbs={[{ label: 'Audit Ledger' }]}><div className="run-page-state">Loading…</div></WorkspaceShell>}>
        <ModeRoute hybrid={<PipelineLedger />} local={<LocalLedger />} />
      </Suspense>
    </ProtectedRoute>
  )
}
