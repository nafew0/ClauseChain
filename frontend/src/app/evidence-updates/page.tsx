import ProtectedRoute from '@/components/ProtectedRoute'
import EvidenceUpdates from '@/views/EvidenceUpdates'

export default function EvidenceUpdatesPage() {
  return <ProtectedRoute><EvidenceUpdates /></ProtectedRoute>
}
