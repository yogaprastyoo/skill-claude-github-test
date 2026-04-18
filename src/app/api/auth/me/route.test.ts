import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { BACKEND_URL } from '@/lib/backend'

describe('GET /api/auth/me', () => {
  let mockFetch: any

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
        cookie: 'laravel_session=session_value'
      })
    })

    const res = await GET(req)

    expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/user`, expect.objectContaining({
      headers: expect.objectContaining({
        Cookie: 'laravel_session=session_value',
      })
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
    
    // Check if app_session is cleared
    const setCookieHeader = res.headers.get('Set-Cookie')
    expect(setCookieHeader).toContain('app_session=;')
    expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  })
})
