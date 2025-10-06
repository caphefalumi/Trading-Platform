import axios from 'axios'
import { getSessionToken, clearUser } from '../stores/session'
import router from '../router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
})

// Request interceptor to add session token
apiClient.interceptors.request.use(
  (config) => {
    const token = getSessionToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      clearUser()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  }
)

export default apiClient
