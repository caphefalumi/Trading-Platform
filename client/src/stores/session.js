import { reactive } from 'vue'
import apiClient from '../utils/api'

export const sessionState = reactive({
  account: null,
  isLoading: false,
})

export const setUser = (account) => {
  sessionState.account = account
}

export const clearUser = () => {
  sessionState.account = null
}

// Initialize session by checking with backend
export const initSession = async () => {
  if (sessionState.isLoading) return

  sessionState.isLoading = true
  try {
    const response = await apiClient.get('/api/auth/me')
    sessionState.account = response.data.account
  } catch (error) {
    // No valid session, clear any account data
    sessionState.account = null
  } finally {
    sessionState.isLoading = false
  }
}
