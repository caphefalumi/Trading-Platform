import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitOrder } from '../utils/engine'
import apiClient from '../utils/api'

// Mock the API client
vi.mock('../utils/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Engine Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitOrder', () => {
    it('should submit order successfully', async () => {
      const mockOrderData = {
        accountId: 'account-123',
        instrumentId: 'instrument-1',
        sideId: 1,
        typeId: 2,
        price: 50000,
        quantity: 0.5,
        timeInForceId: 3,
      }

      const mockResponse = {
        data: {
          success: true,
          order: { id: 'order-123', ...mockOrderData },
        },
      }

      apiClient.post.mockResolvedValue(mockResponse)

      const result = await submitOrder(mockOrderData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/orders', mockOrderData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on API failure', async () => {
      const mockOrderData = {
        accountId: 'account-123',
        instrumentId: 'instrument-1',
        sideId: 1,
        typeId: 2,
        price: 50000,
        quantity: 0.5,
      }

      const mockError = {
        response: {
          data: {
            error: 'Insufficient balance',
          },
        },
      }

      apiClient.post.mockRejectedValue(mockError)

      await expect(submitOrder(mockOrderData)).rejects.toEqual(mockError.response.data)
      expect(apiClient.post).toHaveBeenCalledWith('/api/orders', mockOrderData)
    })

    it('should handle network errors', async () => {
      const mockOrderData = {
        accountId: 'account-123',
        instrumentId: 'instrument-1',
      }

      const networkError = new Error('Network Error')
      apiClient.post.mockRejectedValue(networkError)

      await expect(submitOrder(mockOrderData)).rejects.toEqual(networkError)
    })

    it('should call correct API endpoint', async () => {
      const mockOrderData = { accountId: 'test' }
      apiClient.post.mockResolvedValue({ data: { success: true } })

      await submitOrder(mockOrderData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/orders', mockOrderData)
    })

    it('should pass through all order data fields', async () => {
      const completeOrderData = {
        accountId: 'account-123',
        instrumentId: 'instrument-1',
        sideId: 1,
        typeId: 2,
        price: 50000,
        quantity: 0.5,
        timeInForceId: 3,
        clientOrderId: 'custom-id-123',
        statusId: 1,
      }

      apiClient.post.mockResolvedValue({ data: { success: true } })

      await submitOrder(completeOrderData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/orders', completeOrderData)
    })

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = { response: { data: { error: 'Test error' } } }

      apiClient.post.mockRejectedValue(mockError)

      try {
        await submitOrder({ accountId: 'test' })
      } catch (e) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
