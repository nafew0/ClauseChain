import { Suspense } from 'react'

import ProtectedRoute from '@/components/ProtectedRoute'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import LocalDataset from '@/components/local/LocalDataset'
import SubmissionExplorer from '@/components/submission/SubmissionExplorer'
import { ModeRoute } from '@/components/workspace/RunModeTabs'

export default function SubmissionPage() {
  return <ProtectedRoute><WorkspaceShell breadcrumbs={[{ label: 'RDTII Dataset' }]}><Suspense fallback={<div className="submission-page-state" />}><ModeRoute hybrid={<SubmissionExplorer />} local={<LocalDataset />} /></Suspense></WorkspaceShell></ProtectedRoute>
}
