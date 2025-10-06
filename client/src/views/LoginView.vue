<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../utils/api'
import { setUser } from '../stores/session'

const router = useRouter()

const form = reactive({ 
  email: '', 
  password: '' 
})

const loading = ref(false)
const feedback = reactive({ 
  success: '', 
  error: '' 
})

const errors = reactive({
  email: '',
  password: ''
})

// Email validation rules
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

// Password validation rules
const passwordRules = [
  (v) => !!v || 'Password is required',
]

const clearErrors = () => {
  errors.email = ''
  errors.password = ''
}

const handleLogin = async () => {
  clearErrors()
  feedback.success = ''
  feedback.error = ''
  
  loading.value = true
  try {
    const { data } = await apiClient.post('/api/auth/login', form)
    setUser(data.account, data.sessionToken)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    const errorData = error.response?.data
    feedback.error = errorData?.error || 'Login failed'
    
    // Set field-specific errors
    if (errorData?.fields) {
      if (errorData.fields.email) errors.email = errorData.error
      if (errorData.fields.password) errors.password = errorData.error
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-8 d-flex justify-center align-center" style="min-height: 80vh">
    <v-card color="surface" elevation="4" max-width="500" width="100%">
      <v-card-title class="text-h5 text-center py-6">
        <v-icon size="large" color="primary" class="me-2">mdi-login</v-icon>
        Sign In
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <!-- Success/Error Alert -->
        <v-alert
          v-if="feedback.error || feedback.success"
          :type="feedback.error ? 'error' : 'success'"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="feedback.error = feedback.success = ''"
        >
          {{ feedback.error || feedback.success }}
        </v-alert>

        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="form.email"
            label="Email *"
            type="email"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :rules="emailRules"
            :error-messages="errors.email"
            @input="errors.email = ''"
            prepend-inner-icon="mdi-email"
            required
          />
          <v-text-field
            v-model="form.password"
            label="Password *"
            type="password"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            :rules="passwordRules"
            :error-messages="errors.password"
            @input="errors.password = ''"
            prepend-inner-icon="mdi-lock"
            required
          />
          <v-btn 
            :loading="loading" 
            color="primary" 
            type="submit" 
            block
            size="large"
            class="mb-3"
          >
            Sign In
          </v-btn>
          <div class="text-center">
            <span class="text-body-2">Don't have an account? </span>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'register' }"
            >
              Register
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
