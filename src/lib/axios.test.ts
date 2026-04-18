import { describe, it, expect } from 'vitest'
import api from './axios'

describe('axios instance', () => {
  it('has correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8000/api')
  })

  it('has withCredentials enabled', () => {
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('has correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
    expect(api.defaults.headers['Accept']).toBe('application/json')
  })
})
