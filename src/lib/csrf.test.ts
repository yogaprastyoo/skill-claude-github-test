import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createStatefulRequestHeaders,
  fetchCsrfTokens,
  getSetCookies,
  createCookieHeader,
  createCookieHeaderFromSetCookies,
  uniqueSetCookies,
  readJsonOrNull,
} from './csrf'
import { BACKEND_URL } from './backend'

describe('csrf utility functions', () => {
  describe('createStatefulRequestHeaders', () => {
    it('returns Origin and Referer headers', () => {
      const origin = 'http://localhost:3000'
      const headers = createStatefulRequestHeaders(origin)
      expect(headers).toEqual({
        Origin: origin,
        Referer: `${origin}/`,
      })
    })
  })

  describe('fetchCsrfTokens', () => {
    let mockFetch: any

    beforeEach(() => {
      mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('handles response with XSRF-TOKEN', async () => {
      const mockHeaders = new Headers()
      mockHeaders.append('Set-Cookie', 'XSRF-TOKEN=encoded%3Dtoken; path=/; HttpOnly')
      mockHeaders.append('Set-Cookie', 'laravel_session=session_value; path=/; HttpOnly')

      mockFetch.mockResolvedValueOnce({
        headers: {
          getSetCookie: () => ['XSRF-TOKEN=encoded%3Dtoken; path=/; HttpOnly', 'laravel_session=session_value; path=/; HttpOnly']
        }
      })

      const tokens = await fetchCsrfTokens('http://localhost:3000')

      expect(mockFetch).toHaveBeenCalledWith(`${BACKEND_URL}/sanctum/csrf-cookie`, expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          Origin: 'http://localhost:3000'
        })
      }))

      expect(tokens.xsrfToken).toBe('encoded=token')
      expect(tokens.cookieHeader).toBe('XSRF-TOKEN=encoded%3Dtoken; laravel_session=session_value')
      expect(tokens.setCookies).toHaveLength(2)
    })

    it('handles response without XSRF-TOKEN', async () => {
      mockFetch.mockResolvedValueOnce({
        headers: {
          getSetCookie: () => ['laravel_session=session_value; path=/; HttpOnly']
        }
      })

      const tokens = await fetchCsrfTokens('http://localhost:3000')

      expect(tokens.xsrfToken).toBe('')
      expect(tokens.cookieHeader).toBe('laravel_session=session_value')
      expect(tokens.setCookies).toHaveLength(1)
    })
  })

  describe('getSetCookies', () => {
    it('returns set cookies array', () => {
      const response = {
        headers: {
          getSetCookie: () => ['cookie1=value1', 'cookie2=value2']
        }
      } as unknown as Response
      expect(getSetCookies(response)).toEqual(['cookie1=value1', 'cookie2=value2'])
    })

    it('returns empty array if getSetCookie is undefined', () => {
      const response = { headers: {} } as unknown as Response
      expect(getSetCookies(response)).toEqual([])
    })
  })

  describe('createCookieHeader', () => {
    it('combines multiple cookie sources', () => {
      const header = createCookieHeader('a=1; b=2', 'c=3; d=4')
      expect(header).toBe('a=1; b=2; c=3; d=4')
    })

    it('deduplicates cookies by name, keeping the last one', () => {
      const header = createCookieHeader('a=1; b=2', 'b=3; c=4')
      expect(header).toBe('a=1; b=3; c=4')
    })

    it('handles empty sources', () => {
      const header = createCookieHeader('', 'a=1')
      expect(header).toBe('a=1')
    })

    it('handles semicolon with no spaces', () => {
      const header = createCookieHeader('a=1;b=2;c=3')
      expect(header).toBe('a=1; b=2; c=3')
    })

    it('handles semicolon with multiple spaces', () => {
      const header = createCookieHeader('a=1;   b=2')
      expect(header).toBe('a=1; b=2')
    })
  })

  describe('createCookieHeaderFromSetCookies', () => {
    it('strips attributes from Set-Cookie strings', () => {
      const header = createCookieHeaderFromSetCookies([
        'a=1; path=/; secure',
        'b=2; path=/'
      ])
      expect(header).toBe('a=1; b=2')
    })
  })

  describe('uniqueSetCookies', () => {
    it('deduplicates Set-Cookie strings by name', () => {
      const cookies = uniqueSetCookies([
        'a=1; path=/',
        'b=2; path=/',
        'a=3; path=/; secure'
      ])
      expect(cookies).toEqual(['a=3; path=/; secure', 'b=2; path=/'])
    })
  })

  describe('readJsonOrNull', () => {
    it('parses valid JSON', async () => {
      const response = {
        text: async () => '{"foo": "bar"}'
      } as Response
      const result = await readJsonOrNull(response)
      expect(result).toEqual({ foo: 'bar' })
    })

    it('returns null for empty string', async () => {
      const response = {
        text: async () => ''
      } as Response
      const result = await readJsonOrNull(response)
      expect(result).toBeNull()
    })
  })
})
