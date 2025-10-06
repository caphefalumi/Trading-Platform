<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { setUser } from '../stores/session'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
})

const router = useRouter()

const registerForm = reactive({ username: '', email: '', password: '' })
const loginForm = reactive({ username: '', password: '' })

const loading = reactive({ register: false, login: false })
const feedback = reactive({ success: '', error: '' })

const setSuccess = (message) => {
  feedback.success = message
  feedback.error = ''
}

const setError = (message) => {
  feedback.error = message
  feedback.success = ''
}

const handleRegister = async () => {
  loading.register = true
  try {
    await apiClient.post('/api/auth/register', registerForm)
    setSuccess('Registration successful. Please log in.')
    registerForm.username = ''
    registerForm.email = ''
    registerForm.password = ''
  } catch (error) {
    setError(error.response?.data?.error || 'Registration failed')
  } finally {
    loading.register = false
  }
}

const handleLogin = async () => {
  loading.login = true
  try {
    const { data } = await apiClient.post('/api/auth/login', loginForm)
    setUser(data.user)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    setError(error.response?.data?.error || 'Login failed')
  } finally {
    loading.login = false
  }
}
</script>

<template>
  <v-container class="py-8" max-width="1000">
    <v-row v-if="feedback.error || feedback.success" class="mb-4">
      <v-col cols="12">
        <v-alert
          :type="feedback.error ? 'error' : 'success'"
          variant="tonal"
          dismissible
          @click:close="feedback.error = feedback.success = ''"
        >
          {{ feedback.error || feedback.success }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card color="surface" elevation="4">
          <v-card-title class="text-h6">Register</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="registerForm.username"
                label="Username"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                required
              />
              <v-text-field
                v-model="registerForm.email"
                label="Email"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                required
              />
              <v-text-field
                v-model="registerForm.password"
                label="Password"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-6"
                required
              />
              <v-btn :loading="loading.register" color="primary" type="submit" block>Register</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card color="surface" elevation="4">
          <v-card-title class="text-h6">Login</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="loginForm.username"
                label="Username"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                required
              />
              <v-text-field
                v-model="loginForm.password"
                label="Password"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-6"
                required
              />
              <v-btn :loading="loading.login" color="primary" type="submit" block>Login</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
