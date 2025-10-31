import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import router from './router/router.js'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          background: '#0b0e11',
          surface: '#131722',
          primary: '#f0b90b',
          secondary: '#1e2329',
          success: '#0ecb81',
          error: '#f6465d',
        },
      },
    },
  },
})
const app = createApp(App)
app.use(vuetify)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
})
app.use(router)
app.mount('#app')
