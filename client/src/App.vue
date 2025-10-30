<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { clearUser, sessionState } from './stores/session'
import apiClient from './utils/api'
import websocketClient from './utils/websocket'
import Sidebar from './components/Sidebar.vue'

const router = useRouter()
const route = useRoute()
const account = computed(() => sessionState.account)

// Show sidebar on authenticated pages (not login/register)
const showSidebar = computed(() => {
  return route.name !== 'login' && route.name !== 'register'
})

// Initialize WebSocket connection when app mounts
onMounted(() => {
  websocketClient.connect()
})

// Subscribe to account updates when user logs in
watch(() => sessionState.account, (newAccount, oldAccount) => {
  if (oldAccount?.id) {
    websocketClient.unsubscribeFromAccount(oldAccount.id)
  }
  if (newAccount?.id) {
    websocketClient.subscribeToAccount(newAccount.id)
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (sessionState.account?.id) {
    websocketClient.unsubscribeFromAccount(sessionState.account.id)
  }
  websocketClient.disconnect()
})

const signOut = async () => {
  try {
    // Call logout endpoint to invalidate session on server
    await apiClient.post('/api/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear local session regardless of API call success
    clearUser()
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <v-app>
    <v-app-bar flat color="transparent" v-if="!showSidebar">
      <v-app-bar-title class="text-h5 font-weight-bold">
        <v-icon class="me-2" color="primary">mdi-currency-btc</v-icon>
        Trading Platform
      </v-app-bar-title>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" color="primary" :to="{ name: 'dashboard' }">Dashboard</v-btn>
        <template v-if="account">
          <span class="text-subtitle-2 me-2">{{ account.email }}</span>
          <v-btn variant="text" color="primary" @click="signOut">Sign out</v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" color="primary" :to="{ name: 'login' }">Sign in</v-btn>
        </template>
      </div>
    </v-app-bar>

    <v-layout v-if="showSidebar">
      <Sidebar />
      <v-main>
        <div class="app-header">
          <h1 class="page-title">{{ getPageTitle() }}</h1>
          <div class="user-actions">
            <span class="user-info">{{ account?.email }}</span>
            <v-btn variant="text" size="small" @click="signOut">
              <v-icon>mdi-logout</v-icon>
              Sign out
            </v-btn>
          </div>
        </div>
        <div class="main-content">
          <RouterView />
        </div>
      </v-main>
    </v-layout>

    <v-main v-else>
      <RouterView />
    </v-main>
  </v-app>
</template>

<script>
export default {
  methods: {
    getPageTitle() {
      const titles = {
        'dashboard': 'Dashboard',
        'market-data': 'Market Data',
        'trade': 'Trade',
        'orders': 'Order History',
        'profile': 'Profile'
      }
      return titles[this.$route.name] || 'Trading Platform'
    }
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 40px;
  border-bottom: 1px solid #2d3142;
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #e5e7eb;
  letter-spacing: -0.5px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  font-size: 0.9375rem;
  color: #e5e7eb;
  font-weight: 500;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.main-content {
  background: #0f1117;
  min-height: calc(100vh - 64px - 85px);
  padding: 32px 40px;
}
</style>
