import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock Vuetify
config.global.stubs = {
  VApp: true,
  VAppBar: true,
  VAppBarTitle: true,
  VBtn: true,
  VCard: true,
  VCardTitle: true,
  VCardText: true,
  VTextField: true,
  VSelect: true,
  VRadioGroup: true,
  VRadio: true,
  VAlert: true,
  VSnackbar: true,
  VIcon: true,
  VList: true,
  VListItem: true,
  VListItemTitle: true,
  VDivider: true,
  VForm: true,
  VContainer: true,
  VRow: true,
  VCol: true,
  VChip: true,
  VMain: true,
  VLayout: true,
  RouterView: true,
  RouterLink: true,
}

// Mock router
config.global.mocks = {
  $route: {
    name: 'dashboard',
    params: {},
    query: {},
  },
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
  },
}

// Mock import.meta.env
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001',
      VITE_GOOGLE_CLIENT_ID: 'test-client-id',
      VITE_CMC_BASE_URL: 'https://sandbox-api.coinmarketcap.com',
      VITE_COINMARKETCAP_API_KEY: 'test-api-key',
    },
  },
}
