import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCryptoPrices } from '../utils/crypto'
import apiClient from '../utils/api'

// Mock the API client
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('Crypto Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCryptoPrices', () => {
    it('should fetch crypto prices with default symbols', async () => {
      const mockResponse = {
        data: {
          data: {
            BTC: {
              symbol: 'BTC',
              name: 'Bitcoin',
              quote: {
                USD: {
                  price: 50000,
                  percent_change_24h: 2.5,
                  volume_24h: 1000000000,
                },
              },
            },
            ETH: {
              symbol: 'ETH',
              name: 'Ethereum',
              quote: {
                USD: {
                  price: 3000,
                  percent_change_24h: -1.2,
                  volume_24h: 500000000,
                },
              },
            },
          },
        },
      }

      apiClient.get.mockResolvedValue(mockResponse)

      const result = await getCryptoPrices()

      expect(apiClient.get).toHaveBeenCalledWith('/api/latest-quotes', {
        params: { symbols: 'BTC,ETH' },
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change: 2.5,
        volume: 1000000000,
      })
    })

    it('should fetch crypto prices with custom symbols', async () => {
      const customSymbols = ['BTC', 'ETH', 'ADA']
      const mockResponse = {
        data: {
          data: {
            BTC: {
              symbol: 'BTC',
              name: 'Bitcoin',
              quote: { USD: { price: 50000, percent_change_24h: 2.5, volume_24h: 1000000000 } },
            },
            ETH: {
              symbol: 'ETH',
              name: 'Ethereum',
              quote: { USD: { price: 3000, percent_change_24h: -1.2, volume_24h: 500000000 } },
            },
            ADA: {
              symbol: 'ADA',
              name: 'Cardano',
              quote: { USD: { price: 1.5, percent_change_24h: 5.0, volume_24h: 100000000 } },
            },
          },
        },
      }

      apiClient.get.mockResolvedValue(mockResponse)

      const result = await getCryptoPrices(customSymbols)

      expect(apiClient.get).toHaveBeenCalledWith('/api/latest-quotes', {
        params: { symbols: 'BTC,ETH,ADA' },
      })
      expect(result).toHaveLength(3)
    })

    it('should handle missing quote data gracefully', async () => {
      const mockResponse = {
        data: {
          data: {
            BTC: {
              symbol: 'BTC',
              name: 'Bitcoin',
              quote: {},
            },
          },
        },
      }

      apiClient.get.mockResolvedValue(mockResponse)

      const result = await getCryptoPrices(['BTC'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 0,
        change: 0,
        volume: 0,
      })
    })

    it('should handle API errors and return empty array', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getCryptoPrices()

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching crypto prices:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should handle empty response data', async () => {
      apiClient.get.mockResolvedValue({ data: {} })

      const result = await getCryptoPrices()

      expect(result).toEqual([])
    })

    it('should handle null response data', async () => {
      apiClient.get.mockResolvedValue({ data: { data: null } })

      const result = await getCryptoPrices()

      expect(result).toEqual([])
    })

    it('should map data correctly', async () => {
      const mockResponse = {
        data: {
          data: {
            BTC: {
              symbol: 'BTC',
              name: 'Bitcoin',
              quote: {
                USD: {
                  price: 50000.123456,
                  percent_change_24h: 2.5678,
                  volume_24h: 1234567890,
                },
              },
            },
          },
        },
      }

      apiClient.get.mockResolvedValue(mockResponse)

      const result = await getCryptoPrices(['BTC'])

      expect(result[0].symbol).toBe('BTC')
      expect(result[0].name).toBe('Bitcoin')
      expect(result[0].price).toBe(50000.123456)
      expect(result[0].change).toBe(2.5678)
      expect(result[0].volume).toBe(1234567890)
    })
  })
})
