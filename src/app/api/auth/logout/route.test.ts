import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { BACKEND_URL } from '@/lib/backend'

function getSetCookies(res: Response): string[] {
  return res.headers.getSetCookie?.() ?? []
}

describe('POST /api/auth/logout', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('logs out and clears app_session on successful backend response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        getSetCookie: () => ['laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; HttpOnly'],
      },
    })

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: new Headers({
        cookie: 'XSRF-TOKEN=encoded%3Dtoken; laravel_session=session_value',
      }),
    })

    const res = await POST(req)

    expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/auth/logout`, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'X-XSRF-TOKEN': 'encoded=token',
        Cookie: 'XSRF-TOKEN=encoded%3Dtoken; laravel_session=session_value',
      }),
    }))

    expect(res.status).toBe(200)

    const cookies = getSetCookies(res as unknown as Response)

    const appSession = cookies.find(c => c.startsWith('app_session='))
    expect(appSession).toBeDefined()
    expect(appSession).toContain('app_session=;')
    expect(appSession).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')

    const laravelSession = cookies.find(c => c.startsWith('laravel_session='))
    expect(laravelSession).toBeDefined()
    expect(laravelSession).toContain('laravel_session=;')
  })

  it('returns 200 and clears app_session even if backend is unreachable', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const res = await POST(req)

    expect(res.status).toBe(200)

    const cookies = getSetCookies(res as unknown as Response)
    const appSession = cookies.find(c => c.startsWith('app_session='))
    expect(appSession).toBeDefined()
    expect(appSession).toContain('app_session=;')
    expect(appSession).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')

    consoleSpy.mockRestore()
  })

  it('returns 504 when backend times out', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout')
    timeoutError.name = 'TimeoutError'
    mockFetch.mockRejectedValueOnce(timeoutError)

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const res = await POST(req)

    expect(res.status).toBe(504)
    const data = await res.json()
    expect(data).toEqual({ message: 'Backend timeout' })
  })
})
