import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setUser, clearUser, initSession, sessionState } from '../stores/session'
import apiClient from '../utils/api'

// Mock the API client
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('Session Store', () => {
  beforeEach(() => {
    // Reset session state before each test
    clearUser()
    vi.clearAllMocks()
  })

  describe('setUser', () => {
    it('should set user account in session state', () => {
      const mockAccount = {
        id: '123',
        email: 'test@example.com',
      }

      setUser(mockAccount)

      expect(sessionState.account).toEqual(mockAccount)
    })

    it('should update existing user account', () => {
      const firstAccount = { id: '1', email: 'first@example.com' }
      const secondAccount = { id: '2', email: 'second@example.com' }

      setUser(firstAccount)
      expect(sessionState.account).toEqual(firstAccount)

      setUser(secondAccount)
      expect(sessionState.account).toEqual(secondAccount)
    })
  })

  describe('clearUser', () => {
    it('should clear user account from session state', () => {
      const mockAccount = { id: '123', email: 'test@example.com' }
      setUser(mockAccount)

      clearUser()

      expect(sessionState.account).toBeNull()
    })

    it('should work when no user is set', () => {
      clearUser()
      expect(sessionState.account).toBeNull()
    })
  })

  describe('initSession', () => {
    it('should fetch and set user account on successful API call', async () => {
      const mockAccount = { id: '123', email: 'test@example.com' }
      apiClient.get.mockResolvedValue({ data: { account: mockAccount } })

      await initSession()

      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me')
      expect(sessionState.account).toEqual(mockAccount)
      expect(sessionState.isLoading).toBe(false)
    })

    it('should clear account on failed API call', async () => {
      apiClient.get.mockRejectedValue(new Error('Unauthorized'))

      await initSession()

      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me')
      expect(sessionState.account).toBeNull()
      expect(sessionState.isLoading).toBe(false)
    })

    it('should not make duplicate calls when already loading', async () => {
      apiClient.get.mockImplementation(() => new Promise(() => {})) // Never resolves

      const promise1 = initSession()
      const promise2 = initSession()

      await Promise.race([promise1, promise2, new Promise(resolve => setTimeout(resolve, 100))])

      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    it('should handle isLoading flag', () => {
      // Test that the sessionState has an isLoading property
      expect(sessionState).toHaveProperty('isLoading')
      expect(typeof sessionState.isLoading).toBe('boolean')
    })
  })

  describe('sessionState reactivity', () => {
    it('should be reactive when account changes', () => {
      expect(sessionState.account).toBeNull()

      const account = { id: '1', email: 'test@example.com' }
      setUser(account)

      expect(sessionState.account).toEqual(account)

      clearUser()

      expect(sessionState.account).toBeNull()
    })
  })
})
