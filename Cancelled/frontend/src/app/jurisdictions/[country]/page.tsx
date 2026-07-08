import ProtectedRoute from '@/components/ProtectedRoute'
import JurisdictionDetail from '@/views/JurisdictionDetail'

interface Props {
  params: Promise<{ country: string }>
}

export default async function JurisdictionPage({ params }: Props) {
  const { country } = await params
  return (
    <ProtectedRoute>
      <JurisdictionDetail country={country} />
    </ProtectedRoute>
  )
}
