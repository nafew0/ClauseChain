import ProtectedRoute from '@/components/ProtectedRoute'
import ReviewWorkbench from '@/components/review/ReviewWorkbench'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <WorkspaceShell breadcrumbs={[{ label: 'Review & approve' }]} contentMode="contained">
        <Suspense fallback={<div className="review-canvas-loading" aria-label="Loading review workspace" />}>
          <ReviewWorkbench />
        </Suspense>
      </WorkspaceShell>
    </ProtectedRoute>
  )
}
import { Suspense } from 'react'
