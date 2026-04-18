import { describe, it, expect } from 'vitest'
import api from './axios'

describe('axios instance', () => {
  it('has correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('does not set withCredentials (same-origin BFF)', () => {
    expect(api.defaults.withCredentials).toBeFalsy()
  })

  it('has correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
    expect(api.defaults.headers['Accept']).toBe('application/json')
  })
})
