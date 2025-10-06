import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'
import { sessionState } from '../stores/session'

const routes = [
  {
    path: '/',
    redirect: { name: 'dashboard' },
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
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

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !sessionState.user) {
    return { name: 'auth' }
  }

  if (to.meta.requiresGuest && sessionState.user) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
