import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => {
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
        // max-age matches backend SESSION_LIFETIME (120 minutes)
        document.cookie = `is_authenticated=1; path=/; SameSite=Lax; max-age=7200${secure}`
        set({ user, isAuthenticated: true })
      },

      clearAuth: () => {
        document.cookie = 'is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
