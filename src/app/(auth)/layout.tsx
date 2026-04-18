'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser } = useAuthStore()
  const router = useRouter()
  const checked = useRef(false)

  useEffect(() => {
    // Only verify with backend if store thinks user is still authenticated
    // (handles case: laravel_session valid but is_authenticated cookie lost)
    if (!isAuthenticated || checked.current) return
    checked.current = true

    authService.me()
      .then((user) => {
        setUser(user)
        router.replace('/dashboard')
      })
      .catch(() => {
        // Session expired — show form normally
      })
  }, [isAuthenticated])

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      {children}
    </main>
  )
}
