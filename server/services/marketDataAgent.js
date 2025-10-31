import prisma from '../utils/prisma.js'
import axios from 'axios'

/**
 * Market Data Agent
 *
 * Fetches real-time cryptocurrency prices from external APIs
 * and updates the market_quotes table.
 *
 * Supports multiple data sources:
 * - CoinGecko (free, no API key required)
 * - CoinMarketCap (requires API key)
 */

class MarketDataAgent {
  constructor() {
    this.isRunning = false
    this.updateInterval = 30000 // 30 seconds
    this.intervalId = null
    this.coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3'
    this.coinMarketCapBaseUrl = 'https://pro-api.coinmarketcap.com/v1'
    this.coinMarketCapApiKey = process.env.COINMARKETCAP_API_KEY

    // Map instrument symbols to CoinGecko IDs
    this.coinGeckoMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
    }
  }

  /**
   * Start the market data agent
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    // Initial fetch
    this.updateMarketData().catch(err => {
      console.error('Initial market data fetch failed:', err.message)
    })

    // Set up periodic updates
    this.intervalId = setInterval(() => {
      this.updateMarketData().catch(err => {
        console.error('Market data update failed:', err.message)
      })
    }, this.updateInterval)

  }

  /**
   * Stop the market data agent
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
  }

  /**
   * Fetch market data from CoinGecko (free tier)
   */
  async fetchFromCoinGecko() {
    try {
      // Get all instruments from database
      const instruments = await prisma.instrument.findMany({
        select: {
          id: true,
          symbol: true,
        },
      })

      if (instruments.length === 0) {
        console.log('No instruments found in database')
        return []
      }

      // Map symbols to CoinGecko IDs
      const coinIds = instruments
        .map(inst => {
          const symbol = inst.symbol.replace(/USDT$/, '') // Remove USDT suffix if present
          return {
            instrumentId: inst.id,
            symbol: inst.symbol,
            coinGeckoId: this.coinGeckoMap[symbol],
          }
        })
        .filter(item => item.coinGeckoId)

      if (coinIds.length === 0) {
        console.log('No supported instruments for CoinGecko')
        return []
      }

      const ids = coinIds.map(c => c.coinGeckoId).join(',')

      // Fetch prices from CoinGecko
      const response = await axios.get(`${this.coinGeckoBaseUrl}/simple/price`, {
        params: {
          ids,
          vs_currencies: 'usd',
          include_24hr_vol: true,
          include_24hr_change: true,
        },
        timeout: 10000,
      })

      const quotes = []
      const timestamp = new Date()

      for (const item of coinIds) {
        const data = response.data[item.coinGeckoId]
        if (data && data.usd) {
          quotes.push({
            instrumentId: item.instrumentId,
            symbol: item.symbol,
            lastPrice: data.usd,
            bidPrice: data.usd * 0.9995, // Simulated bid (0.05% below)
            askPrice: data.usd * 1.0005, // Simulated ask (0.05% above)
            volume: data.usd_24h_vol || 0,
            change24h: data.usd_24h_change || 0,
            timestamp,
          })
        }
      }

      return quotes
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn('CoinGecko rate limit reached. Waiting...')
      } else {
        console.error('CoinGecko fetch error:', error.message)
      }
      return []
    }
  }

  /**
   * Fetch market data from CoinMarketCap (requires API key)
   */
  async fetchFromCoinMarketCap() {
    if (!this.coinMarketCapApiKey) {
      return []
    }

    try {
      const instruments = await prisma.instrument.findMany({
        select: {
          id: true,
          symbol: true,
        },
      })

      if (instruments.length === 0) {
        return []
      }

      const symbols = instruments
        .map(inst => inst.symbol.replace(/USDT$/, ''))
        .join(',')

      const response = await axios.get(`${this.coinMarketCapBaseUrl}/cryptocurrency/quotes/latest`, {
        params: {
          symbol: symbols,
          convert: 'USD',
        },
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey,
        },
        timeout: 10000,
      })

      const quotes = []
      const timestamp = new Date()

      for (const inst of instruments) {
        const symbol = inst.symbol.replace(/USDT$/, '')
        const data = response.data.data[symbol]

        if (data && data.quote && data.quote.USD) {
          const quote = data.quote.USD
          quotes.push({
            instrumentId: inst.id,
            symbol: inst.symbol,
            lastPrice: quote.price,
            bidPrice: quote.price * 0.9995,
            askPrice: quote.price * 1.0005,
            volume: quote.volume_24h || 0,
            change24h: quote.percent_change_24h || 0,
            timestamp,
          })
        }
      }

      return quotes
    } catch (error) {
      console.error('CoinMarketCap fetch error:', error.message)
      return []
    }
  }

  /**
   * Update market data in database
   */
  async updateMarketData() {
    try {

      // Try CoinMarketCap first (if API key available), fall back to CoinGecko
      let quotes = []

      if (this.coinMarketCapApiKey) {
        quotes = await this.fetchFromCoinMarketCap()
      }

      if (quotes.length === 0) {
        quotes = await this.fetchFromCoinGecko()
      }

      if (quotes.length === 0) {
        console.log('No market data fetched')
        return
      }

      // Save to database
      const results = await Promise.allSettled(
        quotes.map(quote =>
          prisma.marketQuote.create({
            data: {
              instrumentId: quote.instrumentId,
              lastPrice: quote.lastPrice,
              bidPrice: quote.bidPrice,
              askPrice: quote.askPrice,
              volume: quote.volume,
              timestamp: quote.timestamp,
            },
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length


      return quotes
    } catch (error) {
      console.error('Market data update error:', error.message)
      throw error
    }
  }

  /**
   * Get latest market quotes from database
   */
  async getLatestQuotes() {
    try {
      const instruments = await prisma.instrument.findMany({
        include: {
          marketQuotes: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      })

      return instruments.map(inst => {
        const quote = inst.marketQuotes[0]
        return {
          instrumentId: inst.id,
          symbol: inst.symbol,
          name: inst.name,
          lastPrice: quote?.lastPrice ? parseFloat(quote.lastPrice.toString()) : null,
          bidPrice: quote?.bidPrice ? parseFloat(quote.bidPrice.toString()) : null,
          askPrice: quote?.askPrice ? parseFloat(quote.askPrice.toString()) : null,
          volume: quote?.volume ? parseFloat(quote.volume.toString()) : null,
          timestamp: quote?.timestamp || null,
        }
      })
    } catch (error) {
      console.error('Get latest quotes error:', error.message)
      return []
    }
  }
}

// Create singleton instance
const marketDataAgent = new MarketDataAgent()

export default marketDataAgent
