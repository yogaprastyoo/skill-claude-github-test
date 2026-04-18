'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import type { LoginInput, RegisterInput, User } from '@/types/api'

export function useLogin() {
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(['user'], user)
      router.push('/dashboard')
    },
  })
}

export function useRegister() {
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(['user'], user)
      router.push('/dashboard')
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      router.push('/login')
    },
    onError: () => {
      clearAuth()
      queryClient.clear()
      router.push('/login')
    },
  })
}

export function useUser() {
  const { clearAuth, setUser } = useAuthStore()

  const query = useQuery<User>({
    queryKey: ['user'],
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  useEffect(() => {
    if (query.isError) {
      clearAuth()
    }
  }, [clearAuth, query.isError])

  return query
}
