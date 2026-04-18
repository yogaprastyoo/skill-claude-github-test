import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { BACKEND_URL } from '@/lib/backend'

describe('POST /api/auth/logout', () => {
  let mockFetch: any

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
        getSetCookie: () => ['laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; HttpOnly']
      }
    })

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: new Headers({
        cookie: 'XSRF-TOKEN=encoded%3Dtoken; laravel_session=session_value'
      })
    })

    const res = await POST(req)

    expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/auth/logout`, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'X-XSRF-TOKEN': 'encoded=token',
        Cookie: 'XSRF-TOKEN=encoded%3Dtoken; laravel_session=session_value'
      })
    }))

    expect(res.status).toBe(200)
    
    // Check if app_session is cleared
    const setCookiesArray = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('Set-Cookie')]
    const setCookieString = setCookiesArray.join('; ')
    
    expect(setCookieString).toContain('app_session=;')
    expect(setCookieString).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')

    // Check if laravel_session clearing is forwarded
    expect(setCookieString).toContain('laravel_session=;')
  })

  it('returns 200 and clears app_session even if backend is unreachable', async () => {
    // Silence expected console.error for this specific test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    
    // Check if app_session is cleared despite backend error
    const setCookieHeader = res.headers.get('Set-Cookie')
    expect(setCookieHeader).toContain('app_session=;')
    expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')

    consoleSpy.mockRestore()
  })
})
