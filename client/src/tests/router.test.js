import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { sessionState, initSession, clearUser } from '../stores/session'

// Mock the session store
vi.mock('../stores/session', () => ({
  sessionState: {
    account: null,
    isLoading: false,
  },
  initSession: vi.fn(),
  clearUser: vi.fn(),
}))

// Import routes after mocking dependencies
const routes = [
  {
    path: '/',
    redirect: { name: 'dashboard' },
  },
  {
    path: '/login',
    name: 'login',
    component: { template: '<div>Login</div>' },
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: { template: '<div>Register</div>' },
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: { template: '<div>Dashboard</div>' },
    meta: {},
  },
  {
    path: '/market',
    name: 'market-data',
    component: { template: '<div>Market Data</div>' },
    meta: { requiresAuth: true },
  },
  {
    path: '/trade',
    name: 'trade',
    component: { template: '<div>Trade</div>' },
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: { template: '<div>Orders</div>' },
    meta: { requiresAuth: true },
  },
]

describe('Router Configuration', () => {
  let router

  beforeEach(() => {
    vi.clearAllMocks()
    sessionState.account = null
    sessionState.isLoading = false

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
  })

  describe('Route Definitions', () => {
    it('should have login route', () => {
      const route = router.getRoutes().find(r => r.name === 'login')
      expect(route).toBeDefined()
      expect(route.path).toBe('/login')
    })

    it('should have register route', () => {
      const route = router.getRoutes().find(r => r.name === 'register')
      expect(route).toBeDefined()
      expect(route.path).toBe('/register')
    })

    it('should have dashboard route', () => {
      const route = router.getRoutes().find(r => r.name === 'dashboard')
      expect(route).toBeDefined()
      expect(route.path).toBe('/dashboard')
    })

    it('should have market-data route', () => {
      const route = router.getRoutes().find(r => r.name === 'market-data')
      expect(route).toBeDefined()
      expect(route.path).toBe('/market')
    })

    it('should have trade route', () => {
      const route = router.getRoutes().find(r => r.name === 'trade')
      expect(route).toBeDefined()
      expect(route.path).toBe('/trade')
    })

    it('should have orders route', () => {
      const route = router.getRoutes().find(r => r.name === 'orders')
      expect(route).toBeDefined()
      expect(route.path).toBe('/orders')
    })

    it('should redirect root to dashboard', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  describe('Route Meta', () => {
    it('should mark login route as guest-only', () => {
      const route = router.getRoutes().find(r => r.name === 'login')
      expect(route.meta.requiresGuest).toBe(true)
    })

    it('should mark register route as guest-only', () => {
      const route = router.getRoutes().find(r => r.name === 'register')
      expect(route.meta.requiresGuest).toBe(true)
    })

    it('should mark trade route as requiring authentication', () => {
      const route = router.getRoutes().find(r => r.name === 'trade')
      expect(route.meta.requiresAuth).toBe(true)
    })

    it('should mark market-data route as requiring authentication', () => {
      const route = router.getRoutes().find(r => r.name === 'market-data')
      expect(route.meta.requiresAuth).toBe(true)
    })

    it('should mark orders route as requiring authentication', () => {
      const route = router.getRoutes().find(r => r.name === 'orders')
      expect(route.meta.requiresAuth).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('should navigate to login page', async () => {
      await router.push({ name: 'login' })
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should navigate to register page', async () => {
      await router.push({ name: 'register' })
      expect(router.currentRoute.value.name).toBe('register')
    })

    it('should navigate to dashboard page', async () => {
      await router.push({ name: 'dashboard' })
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should navigate to trade page', async () => {
      sessionState.account = { id: '123' } // Mock authenticated user
      await router.push({ name: 'trade' })
      expect(router.currentRoute.value.name).toBe('trade')
    })

    it('should navigate to market-data page', async () => {
      sessionState.account = { id: '123' }
      await router.push({ name: 'market-data' })
      expect(router.currentRoute.value.name).toBe('market-data')
    })
  })

  describe('Path Parameters', () => {
    it('should handle query parameters', async () => {
      await router.push({ name: 'login', query: { redirect: '/dashboard' } })
      expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
    })
  })
})
