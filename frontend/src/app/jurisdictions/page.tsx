import ProtectedRoute from '@/components/ProtectedRoute'
import SourceLibrary from '@/views/SourceLibrary'

export default function JurisdictionsIndexPage() {
  return (
    <ProtectedRoute>
      <SourceLibrary />
    </ProtectedRoute>
  )
}
