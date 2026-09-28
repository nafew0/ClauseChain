import { Suspense } from 'react'

import ProtectedRoute from '@/components/ProtectedRoute'
import LocalReviewWorkbench from '@/components/local/LocalReviewWorkbench'
import ReviewWorkbench from '@/components/review/ReviewWorkbench'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import { ModeRoute } from '@/components/workspace/RunModeTabs'

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <WorkspaceShell breadcrumbs={[{ label: 'Review & approve' }]} contentMode="contained">
        <Suspense fallback={<div className="review-canvas-loading" aria-label="Loading review workspace" />}>
          <ModeRoute hybrid={<ReviewWorkbench />} local={<LocalReviewWorkbench />} />
        </Suspense>
      </WorkspaceShell>
    </ProtectedRoute>
  )
}
