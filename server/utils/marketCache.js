const cache = new Map()
const DEFAULT_TTL_MS = process.env.MARKET_CACHE_TTL_MS ? parseInt(process.env.MARKET_CACHE_TTL_MS, 10) : 5000 // 5s

function makeKey(symbols) {
  return Array.isArray(symbols) ? symbols.join(',').toUpperCase() : String(symbols).toUpperCase()
}

export async function getOrFetch(symbols, fetcher, ttl = DEFAULT_TTL_MS) {
  const key = makeKey(symbols)
  const now = Date.now()
  const entry = cache.get(key)
  if (entry && entry.expiresAt > now) {
    return entry.data
  }

  // fetch and cache
  const data = await fetcher()
  cache.set(key, { data, expiresAt: Date.now() + ttl })
  return data
}

export function clearCache() {
  cache.clear()
}

export default { getOrFetch, clearCache }
