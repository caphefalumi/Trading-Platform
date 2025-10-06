<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearUser, sessionState } from './stores/session'
import apiClient from './utils/api'

const router = useRouter()
const account = computed(() => sessionState.account)

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
    <v-app-bar flat color="transparent">
      <v-app-bar-title class="text-h5 font-weight-bold">
        <v-icon class="me-2" color="primary">mdi-currency-btc</v-icon>
        Trading Platform
      </v-app-bar-title>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" color="primary" :to="{ name: 'dashboard' }">Dashboard</v-btn>
        <template v-if="account">
          <span class="text-subtitle-2 me-2">{{ account.accountName }}</span>
          <v-btn variant="text" color="primary" @click="signOut">Sign out</v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" color="primary" :to="{ name: 'login' }">Sign in</v-btn>
        </template>
      </div>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
