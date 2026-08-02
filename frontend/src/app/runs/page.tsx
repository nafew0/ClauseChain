import ProtectedRoute from '@/components/ProtectedRoute'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import RunsWorkbench from '@/components/runs/RunsWorkbench'

export default function RunsPage() {
  return <ProtectedRoute><WorkspaceShell breadcrumbs={[{ label: 'Runs' }]}><RunsWorkbench /></WorkspaceShell></ProtectedRoute>
}
