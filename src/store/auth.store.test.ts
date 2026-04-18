import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

describe('auth store — setUser', () => {
  it('sets user and marks as authenticated', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()

    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })
})

describe('auth store — clearAuth', () => {
  it('clears user and marks as unauthenticated', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
