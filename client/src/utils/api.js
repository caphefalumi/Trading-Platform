import axios from 'axios'
import { clearUser } from '../stores/session'
import router from '../router/router'

// 1. Client cho Backend của bạn (giữ nguyên)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true, // Include cookies in requests
})

// Response interceptor cho apiClient (giữ nguyên)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      clearUser()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

// -----------------------------------------------------------
// 2. Client MỚI cho CoinMarketCap Sandbox API
// -----------------------------------------------------------
const cmcClient = axios.create({
  // CMC_BASE_URL: "https://sandbox-api.coinmarketcap.com"
  baseURL: import.meta.env.VITE_CMC_BASE_URL || 'https://sandbox-api.coinmarketcap.com',
  headers: {
    // API Key được đặt trong Header
    'X-CMC-Pro-API-Key': import.meta.env.VITE_COINMARKETCAP_API_KEY || '',
    'Accept': 'application/json',
  },
  // CMC không cần withCredentials: true
})

// CMC Client không cần interceptor 401 vì nó là API công cộng

// -----------------------------------------------------------

export default apiClient
// Named exports for convenience
export { apiClient as api, cmcClient }
