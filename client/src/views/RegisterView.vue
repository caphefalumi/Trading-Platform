<template>
  <v-container class="py-8 d-flex justify-center align-center" style="min-height: 80vh">
    <v-card color="surface" elevation="4" max-width="500" width="100%">
      <v-card-title class="text-h5 text-center py-6">
        <v-icon size="large" color="primary" class="me-2">mdi-account-plus</v-icon>
        Create Account
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

        <v-form @submit.prevent="handleRegister">
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
            hint="At least 8 characters"
            persistent-hint
            required
          />
          <v-btn :loading="loading" color="primary" type="submit" block size="large" class="mb-3">
            Register
          </v-btn>
          <div class="text-center">
            <span class="text-body-2">Already have an account? </span>
            <v-btn variant="text" color="primary" size="small" :to="{ name: 'login' }">
              Sign in
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../utils/api'

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const loading = ref(false)
const feedback = reactive({
  success: '',
  error: '',
})

const errors = reactive({
  email: '',
  password: '',
})

// Email validation rules
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

// Password validation rules
const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
]

const clearErrors = () => {
  errors.email = ''
  errors.password = ''
}

const handleRegister = async () => {
  clearErrors()
  feedback.success = ''
  feedback.error = ''

  loading.value = true
  try {
    const response = await apiClient.post('/api/auth/register', form)
    feedback.success = response.data.success || 'Registration successful!'

    // Clear form
    form.email = ''
    form.password = ''

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 2000)
  } catch (error) {
    const errorData = error.response?.data
    feedback.error = errorData?.error || 'Registration failed'

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

<style scoped>
.v-container {
  background: #0f1117;
  min-height: 100vh;
}

:deep(.v-card) {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%) !important;
  border: 1px solid #2d3142;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

:deep(.v-card-title) {
  color: #e5e7eb;
  font-weight: 700;
}

:deep(.v-divider) {
  border-color: #2d3142;
}

:deep(.v-field) {
  background: rgba(15, 17, 23, 0.6);
  border: 1px solid #2d3142;
}

:deep(.v-field--focused) {
  border-color: #3b82f6;
}

:deep(.v-label) {
  color: #e5e7eb;
}

:deep(.v-field__input) {
  color: #e5e7eb;
}

:deep(.v-text-field input) {
  color: #e5e7eb;
}

:deep(.v-icon) {
  color: #9ca3af;
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 600;
}

:deep(.text-body-2) {
  color: #9ca3af;
}

:deep(.v-messages__message) {
  color: #9ca3af;
}

:deep(.v-alert) {
  background: rgba(59, 130, 246, 0.15) !important;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
</style>
