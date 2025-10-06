import axios from 'axios'
import { clearUser } from '../stores/session'
import router from '../router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true, // Include cookies in requests
})

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
  },
)

export default apiClient
