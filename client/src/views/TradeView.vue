<template>
  <div class="trade-view">
    <v-row>
      <!-- Order Form -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <span class="text-h5">Place Order</span>
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleSubmit">
              <v-select
                v-model="form.instrumentId"
                :items="instrumentOptions"
                label="Instrument"
                required
                @update:model-value="onInstrumentChange"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:append>
                      <span class="text-caption text-medium-emphasis">
                        {{ getInstrumentPrice(item.raw.value) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-select>

              <!-- Live Price Display -->
              <v-alert
                v-if="currentPrice"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                <div class="d-flex justify-space-between align-center">
                  <span>Current Market Price:</span>
                  <span class="text-h6 font-weight-bold">${{ currentPrice }}</span>
                </div>
              </v-alert>

              <v-radio-group v-model="form.sideId" inline label="Side">
                <v-radio label="Buy" :value="1" color="success"></v-radio>
                <v-radio label="Sell" :value="2" color="error"></v-radio>
              </v-radio-group>

              <v-select
                v-model="form.typeId"
                :items="typeOptions"
                label="Order Type"
                required
              />

              <v-text-field
                v-model="form.price"
                label="Price (USD)"
                type="number"
                step="0.01"
                required
                :hint="priceHint"
                persistent-hint
              >
                <template v-slot:append>
                  <v-btn
                    v-if="currentPrice"
                    size="x-small"
                    variant="text"
                    @click="useMarketPrice"
                  >
                    Use Market
                  </v-btn>
                </template>
              </v-text-field>

              <v-text-field
                v-model="form.quantity"
                label="Quantity"
                type="number"
                step="0.00000001"
                required
                :hint="totalHint"
                persistent-hint
              />

              <v-select
                v-model="form.timeInForceId"
                :items="tifOptions"
                label="Time In Force"
              />

              <v-text-field
                v-model="form.clientOrderId"
                label="Client Order ID (Optional)"
                placeholder="Auto-generated if empty"
              />

              <v-btn
                type="submit"
                :color="form.sideId === 1 ? 'success' : 'error'"
                block
                size="large"
                :loading="loading"
                class="mt-4"
              >
                {{ form.sideId === 1 ? 'Buy' : 'Sell' }} {{ getInstrumentSymbol() }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Market Info Panel -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Market Information</span>
            <v-chip
              :color="isConnected ? 'success' : 'error'"
              size="small"
              variant="flat"
            >
              {{ isConnected ? 'Live' : 'Offline' }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <div v-if="selectedInstrument">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Symbol</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">{{ selectedInstrument.symbol }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Name</v-list-item-title>
                  <template v-slot:append>
                    <span>{{ selectedInstrument.name }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Current Price</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-h6 font-weight-bold">${{ currentPrice || 'N/A' }}</span>
                  </template>
                </v-list-item>
                <v-list-item v-if="selectedInstrument.change24h">
                  <v-list-item-title>24h Change</v-list-item-title>
                  <template v-slot:append>
                    <span :class="selectedInstrument.change24h >= 0 ? 'text-success' : 'text-error'">
                      {{ formatChange(selectedInstrument.change24h) }}%
                    </span>
                  </template>
                </v-list-item>
                <v-list-item v-if="selectedInstrument.volume24h">
                  <v-list-item-title>24h Volume</v-list-item-title>
                  <template v-slot:append>
                    <span>${{ formatVolume(selectedInstrument.volume24h) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            <div v-else class="text-center text-medium-emphasis pa-4">
              Select an instrument to view market data
            </div>
          </v-card-text>
        </v-card>

        <!-- Recent Executions -->
        <v-card class="mt-4" v-if="recentExecutions.length > 0">
          <v-card-title>Recent Executions</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="execution in recentExecutions"
                :key="execution.id"
                class="execution-item"
              >
                <template v-slot:prepend>
                  <v-icon
                    :icon="execution.side === 'Buy' ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                    :color="execution.side === 'Buy' ? 'success' : 'error'"
                  ></v-icon>
                </template>
                <v-list-item-title>
                  {{ execution.side }} {{ execution.quantity }} @ ${{ execution.price }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatExecutionTime(execution.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Feedback Snackbar -->
    <v-snackbar
      v-model="showFeedback"
      :color="feedback?.type === 'success' ? 'success' : 'error'"
      :timeout="4000"
    >
      {{ feedback?.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showFeedback = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { submitOrder } from '../utils/engine'
import { sessionState } from '../stores/session'
import { api } from '../utils/api'
import { websocketClient } from '../utils/websocket'

const form = ref({
  instrumentId: '',
  sideId: 1,
  typeId: 2,
  price: '',
  quantity: '',
  timeInForceId: 3,
  clientOrderId: '',
})

const instruments = ref([])
const marketData = ref({})
const recentExecutions = ref([])
const loading = ref(false)
const feedback = ref(null)
const showFeedback = ref(false)
const unsubscribeMarketData = ref(null)
const unsubscribeExecution = ref(null)

const instrumentOptions = computed(() =>
  instruments.value.map(instr => ({
    value: instr.id,
    title: `${instr.symbol} - ${instr.name}`
  }))
)

const typeOptions = [
  { value: 2, title: 'Limit' }
]

const tifOptions = [
  { value: 3, title: 'GTC (Good Till Cancel)' },
  { value: 1, title: 'Day' },
  { value: 4, title: 'IOC (Immediate or Cancel)' },
  { value: 5, title: 'FOK (Fill or Kill)' }
]

const isConnected = computed(() => websocketClient.connected.value)

const selectedInstrument = computed(() => {
  if (!form.value.instrumentId) return null
  const instrument = instruments.value.find(i => i.id === form.value.instrumentId)
  if (!instrument) return null

  const market = marketData.value[form.value.instrumentId]
  return market ? { ...instrument, ...market } : instrument
})

const currentPrice = computed(() => {
  const market = marketData.value[form.value.instrumentId]
  return market?.price ? parseFloat(market.price).toFixed(2) : null
})

const priceHint = computed(() => {
  if (!currentPrice.value || !form.value.price) return ''
  const diff = ((form.value.price - currentPrice.value) / currentPrice.value * 100).toFixed(2)
  return diff >= 0 ? `+${diff}% vs market` : `${diff}% vs market`
})

const totalHint = computed(() => {
  if (!form.value.price || !form.value.quantity) return ''
  const total = (form.value.price * form.value.quantity).toFixed(2)
  return `Total: $${total}`
})

// Format functions
const formatChange = (change) => {
  if (!change) return '0.00'
  const num = parseFloat(change)
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

const formatVolume = (volume) => {
  if (!volume) return '0'
  const num = parseFloat(volume)
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(0)
}

const formatExecutionTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString()
}

const getInstrumentPrice = (instrumentId) => {
  const market = marketData.value[instrumentId]
  return market?.price ? `$${parseFloat(market.price).toFixed(2)}` : ''
}

const getInstrumentSymbol = () => {
  const instrument = instruments.value.find(i => i.id === form.value.instrumentId)
  return instrument?.symbol || 'Asset'
}

const onInstrumentChange = (instrumentId) => {
  // Optionally pre-fill price with market price
  const market = marketData.value[instrumentId]
  if (market?.price && !form.value.price) {
    form.value.price = parseFloat(market.price).toFixed(2)
  }
}

const useMarketPrice = () => {
  if (currentPrice.value) {
    form.value.price = currentPrice.value
  }
}

const handleSubmit = async () => {
  loading.value = true
  feedback.value = null
  try {
    const orderData = {
      ...form.value,
      accountId: sessionState.account?.id,
      statusId: 1
    }
    await submitOrder(orderData)
    feedback.value = { type: 'success', message: 'Order submitted successfully!' }
    showFeedback.value = true

    // Reset form
    form.value.price = ''
    form.value.quantity = ''
    form.value.clientOrderId = ''
  } catch (err) {
    feedback.value = {
      type: 'error',
      message: err.response?.data?.error || err.message || 'Order failed.'
    }
    showFeedback.value = true
  } finally {
    loading.value = false
  }
}

// Load instruments
const loadInstruments = async () => {
  try {
    const response = await api.get('/instruments')
    instruments.value = response.data
  } catch (error) {
    console.error('Failed to load instruments:', error)
  }
}

// Load market data
const loadMarketData = async () => {
  try {
    const response = await api.get('/market-data/prices')
    if (response.data.success && response.data.data) {
      // Convert array to map by instrumentId
      const dataMap = {}
      response.data.data.forEach(item => {
        dataMap[item.instrumentId] = item
      })
      marketData.value = dataMap
    }
  } catch (error) {
    console.error('Failed to load market data:', error)
  }
}

onMounted(async () => {
  await loadInstruments()
  await loadMarketData()

  // Subscribe to real-time market data
  unsubscribeMarketData.value = websocketClient.onMarketData((data) => {
    if (Array.isArray(data)) {
      const dataMap = {}
      data.forEach(item => {
        dataMap[item.instrumentId] = item
      })
      marketData.value = dataMap
    } else if (data.instrumentId) {
      marketData.value[data.instrumentId] = data
    }
  })

  // Subscribe to execution notifications
  unsubscribeExecution.value = websocketClient.onExecution((execution) => {
    // Add to recent executions
    recentExecutions.value.unshift({
      id: execution.id,
      side: execution.sideId === 1 ? 'Buy' : 'Sell',
      quantity: execution.quantity,
      price: execution.price,
      createdAt: execution.createdAt
    })

    // Keep only last 5
    if (recentExecutions.value.length > 5) {
      recentExecutions.value.pop()
    }

    // Show notification
    feedback.value = {
      type: 'success',
      message: `Execution: ${execution.sideId === 1 ? 'Bought' : 'Sold'} ${execution.quantity} @ $${execution.price}`
    }
    showFeedback.value = true
  })
})

onUnmounted(() => {
  if (unsubscribeMarketData.value) {
    unsubscribeMarketData.value()
  }
  if (unsubscribeExecution.value) {
    unsubscribeExecution.value()
  }
})
</script>
<style scoped>
.trade-view {
  padding: 32px;
  background: #0f1117;
  min-height: 100vh;
}

.trade-view :deep(.v-card) {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border: 1px solid #2d3142;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.trade-view :deep(.v-card-title) {
  color: #e5e7eb;
  font-weight: 700;
}

.trade-view :deep(.v-card-text) {
  color: #9ca3af;
}

.trade-view :deep(.v-field) {
  background: rgba(15, 17, 23, 0.6);
  border: 1px solid #2d3142;
}

.trade-view :deep(.v-field--focused) {
  border-color: #3b82f6;
}

.trade-view :deep(.v-label) {
  color: #e5e7eb;
}

.trade-view :deep(.v-field__input) {
  color: #e5e7eb;
}

.trade-view :deep(.v-text-field input) {
  color: #e5e7eb;
}

.trade-view :deep(.v-select__selection-text) {
  color: #e5e7eb;
}

.trade-view :deep(.v-list-item) {
  color: #e5e7eb;
}

.trade-view :deep(.v-list-item:hover) {
  background: rgba(59, 130, 246, 0.1);
}

.trade-view :deep(.v-btn) {
  text-transform: none;
  font-weight: 600;
}

.trade-view :deep(.v-alert) {
  background: rgba(59, 130, 246, 0.15) !important;
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #e5e7eb;
}

.trade-view :deep(.v-table) {
  background: transparent;
}

.trade-view :deep(.v-table thead) {
  background: rgba(59, 130, 246, 0.1);
}

.trade-view :deep(.v-table th) {
  color: #9ca3af !important;
  font-weight: 600;
}

.trade-view :deep(.v-table td) {
  color: #e5e7eb;
  border-bottom: 1px solid #2d3142 !important;
}

.trade-view :deep(.v-table tbody tr:hover) {
  background: rgba(59, 130, 246, 0.05);
}

.execution-item {
  border-left: 3px solid transparent;
  transition: border-color 0.3s ease;
}

.execution-item:hover {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.trade-view :deep(.v-radio .v-label) {
  color: #e5e7eb;
}

.trade-view :deep(.v-messages__message) {
  color: #9ca3af;
}
</style>
