'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const demoModeEnabled = process.env.NEXT_PUBLIC_CLAUSECHAIN_DEMO_AUTH !== 'false'

  useEffect(() => {
    if (!demoModeEnabled && !loading && !user) router.replace('/login')
  }, [user, loading, router, demoModeEnabled])

  if (loading && !demoModeEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user && !demoModeEnabled) return null

  return <>{children}</>
}
