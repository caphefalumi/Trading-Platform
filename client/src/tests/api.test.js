import { describe, it, expect } from 'vitest'
import axios from 'axios'

describe('API Client', () => {
  it('should have axios available for creating API clients', () => {
    expect(axios).toBeDefined()
    expect(axios.create).toBeDefined()
  })

  it('should be able to create axios instance', () => {
    const instance = axios.create({
      baseURL: 'http://localhost:3001',
      withCredentials: true,
    })
    
    expect(instance).toBeDefined()
  })

  it('should configure instance with baseURL', () => {
    const config = {
      baseURL: 'http://localhost:3001',
      withCredentials: true,
    }
    const instance = axios.create(config)
    
    expect(instance.defaults.baseURL).toBe('http://localhost:3001')
  })

  it('should configure instance with credentials', () => {
    const instance = axios.create({
      baseURL: 'http://localhost:3001',
      withCredentials: true,
    })
    
    expect(instance.defaults.withCredentials).toBe(true)
  })

  it('should be able to setup interceptors', () => {
    const instance = axios.create()
    
    expect(instance.interceptors).toBeDefined()
    expect(instance.interceptors.request).toBeDefined()
    expect(instance.interceptors.response).toBeDefined()
  })

  it('should have HTTP methods available', () => {
    const instance = axios.create()
    
    expect(instance.get).toBeDefined()
    expect(instance.post).toBeDefined()
    expect(instance.put).toBeDefined()
    expect(instance.delete).toBeDefined()
  })
})
