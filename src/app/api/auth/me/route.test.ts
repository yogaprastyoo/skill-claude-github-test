import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { BACKEND_URL } from '@/lib/backend'

describe('GET /api/auth/me', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns user data on successful authentication', async () => {
    const mockUser = { id: 1, name: 'Test User' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: new Headers({
        cookie: 'laravel_session=session_value',
      }),
    })

    const res = await GET(req)

    expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/user`, expect.objectContaining({
      headers: expect.objectContaining({
        Cookie: 'laravel_session=session_value',
      }),
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockUser)
  })

  it('returns 401 and clears app_session on unauthenticated response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const res = await GET(req)

    expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/user`, expect.any(Object))
    expect(res.status).toBe(401)

    const setCookieHeader = res.headers.get('Set-Cookie')
    expect(setCookieHeader).toContain('app_session=;')
    expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  })

  it('returns 504 when backend times out', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout')
    timeoutError.name = 'TimeoutError'
    mockFetch.mockRejectedValueOnce(timeoutError)

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const res = await GET(req)

    expect(res.status).toBe(504)
    const data = await res.json()
    expect(data).toEqual({ message: 'Backend timeout' })
  })

  it('returns 500 on unexpected error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const res = await GET(req)

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toEqual({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
