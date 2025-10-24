import apiClient from "./api";

export async function getCryptoPrices(symbols = ["BTC", "ETH"]) {
  try {
    const symbolsParam = symbols.join(",")
    const res = await apiClient.get('/api/latest-quotes', { params: { symbols: symbolsParam } })
    const data = res.data?.data || {}
    // Map to array of { symbol, name, price, change, volume }
    return Object.keys(data).map((k) => {
      const item = data[k]
      const usd = item.quote?.USD || {}
      return {
        symbol: item.symbol || k,
        name: item.name || '',
        price: usd.price || 0,
        change: usd.percent_change_24h || 0,
        volume: usd.volume_24h || 0,
      }
    })
  } catch (error) {
    console.error("Error fetching crypto prices:", error)
    return []
  }
}
