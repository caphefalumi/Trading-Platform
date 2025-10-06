import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import { sessionState, initSession, clearUser } from '../stores/session'
import apiClient from '../utils/api'

// Initialize session from localStorage
initSession()

const routes = [
  {
    path: '/',
    redirect: { name: 'dashboard' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Validate session with server on protected routes
router.beforeEach(async (to) => {
  // If route requires authentication
  if (to.meta.requiresAuth) {
    if (!sessionState.account || !sessionState.sessionToken) {
      return { name: 'login' }
    }

    // Validate session with server (only on first load or if needed)
    if (to.name === 'dashboard' && !sessionState.validated) {
      try {
        const { data } = await apiClient.get('/api/auth/me')
        sessionState.validated = true
        // Update account info in case it changed
        sessionState.account = data.account
      } catch (error) {
        // Session is invalid
        clearUser()
        return { name: 'login' }
      }
    }
  }

  // If route requires guest (login/register pages)
  if (to.meta.requiresGuest && sessionState.account) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
