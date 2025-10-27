import express from 'express'
import axios from 'axios'

const router = express.Router()

router.get('/api/latest-quotes', async (req, res) => {
  const symbols = req.query.symbols
  if (!symbols) return res.status(400).json({ error: 'Missing required symbols query parameter.' })

  const apiKey = process.env.COINMARKETCAP_API_KEY || process.env.CMC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'CoinMarketCap API key not configured on server.' })

  const CMC_BASE = process.env.CMC_BASE_URL || 'https://pro-api.coinmarketcap.com'
  const url = `${CMC_BASE}/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbols)}`

  try {
    const data = await marketCache.getOrFetch(symbols, async () => {
      const resp = await axios.get(url, { headers: { 'X-CMC_PRO_API_KEY': apiKey, Accept: 'application/json' } })
      return resp.data
    })
    res.json(data)
  } catch (err) {
    console.error('Proxy /api/latest-quotes error:', err.response?.status, err.response?.data || err.message)
    const status = err.response?.status || 500
    const message = err.response?.data || { error: 'Failed to fetch data from CoinMarketCap' }
    res.status(status).json(message)
  }
})

export default router
