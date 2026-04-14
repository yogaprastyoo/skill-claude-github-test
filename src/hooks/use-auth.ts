'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import type { LoginInput, RegisterInput } from '@/types/api'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      router.push('/dashboard')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      router.push('/dashboard')
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth()
      router.push('/login')
    },
    onError: () => {
      clearAuth()
      router.push('/login')
    },
  })
}
