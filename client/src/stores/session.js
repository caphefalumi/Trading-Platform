import { reactive } from 'vue'

const SESSION_KEY = 'trading_session'

export const sessionState = reactive({
  account: null,
  sessionToken: null,
})

export const setUser = (account, sessionToken) => {
  sessionState.account = account
  sessionState.sessionToken = sessionToken
  
  // Store in localStorage for persistence
  if (account && sessionToken) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ account, sessionToken }))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export const clearUser = () => {
  sessionState.account = null
  sessionState.sessionToken = null
  localStorage.removeItem(SESSION_KEY)
}

// Initialize from localStorage on app load
export const initSession = () => {
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) {
    try {
      const { account, sessionToken } = JSON.parse(stored)
      sessionState.account = account
      sessionState.sessionToken = sessionToken
    } catch (e) {
      console.error('Failed to restore session:', e)
      localStorage.removeItem(SESSION_KEY)
    }
  }
}

// Get session token for API requests
export const getSessionToken = () => {
  return sessionState.sessionToken
}
