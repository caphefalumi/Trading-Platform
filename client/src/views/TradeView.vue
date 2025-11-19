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
                label="Price (USDT)"
                type="number"
                step="0.01"
                :required="form.typeId === 2"
                :disabled="form.typeId === 1"
                :hint="priceHint"
                persistent-hint
              >
                <template v-slot:append>
                  <v-btn
                    v-if="currentPrice && form.typeId === 2"
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

              <!-- Prediction Button -->
              <v-btn
                v-if="form.instrumentId"
                :to="{ name: 'predictions' }"
                color="primary"
                variant="outlined"
                block
                size="large"
                class="mt-2"
              >
                <v-icon left class="mr-2">mdi-chart-line</v-icon>
                View Price Predictions
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

    <!-- Predictions Dialog -->
    <v-dialog v-model="predictionsDialog" max-width="900px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Price Predictions - {{ selectedInstrument?.symbol }}
          </span>
          <v-btn icon variant="text" @click="predictionsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div v-if="loadingPredictions" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-medium-emphasis">Generating predictions...</p>
          </div>

          <div v-else-if="predictionError" class="text-center pa-8">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <p class="mt-4 text-error">{{ predictionError }}</p>
            <v-btn @click="loadPredictions" color="primary" class="mt-4">Retry</v-btn>
          </div>

          <div v-else-if="predictions">
            <!-- Prediction Summary -->
            <v-alert type="info" variant="tonal" class="mb-4">
              <div class="d-flex justify-space-between">
                <div>
                  <strong>Current Price:</strong> ${{ predictions.current_price?.toFixed(8) }}
                </div>
                <div>
                  <strong>Model:</strong> {{ predictions.model }}
                </div>
                <div>
                  <strong>Generated:</strong> {{ formatPredictionTime(predictions.generated_at) }}
                </div>
              </div>
            </v-alert>

            <!-- Prediction Chart -->
            <div class="prediction-chart mb-4">
              <v-card variant="outlined">
                <v-card-text>
                  <canvas ref="predictionChartCanvas"></canvas>
                </v-card-text>
              </v-card>
            </div>

            <!-- Predictions Table -->
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Time Ahead</th>
                  <th>Predicted Price</th>
                  <th>Confidence</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pred in predictions.predictions?.slice(0, 24)" :key="pred.period_ahead">
                  <td>{{ pred.period_ahead }}h</td>
                  <td class="font-weight-bold">${{ pred.predicted_price?.toFixed(8) }}</td>
                  <td>
                    <v-chip :color="getConfidenceColor(pred.confidence)" size="small">
                      {{ (pred.confidence * 100).toFixed(0) }}%
                    </v-chip>
                  </td>
                  <td :class="getPriceChangeClass(pred.predicted_price, predictions.current_price)">
                    {{ calculatePriceChange(pred.predicted_price, predictions.current_price) }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="predictionsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { submitOrder } from '../utils/engine'
import { sessionState } from '../stores/session'
import { api } from '../utils/api'
import { getPredictions } from '../services/predictions'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

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
let marketDataPollingInterval = null

// Predictions state
const predictionsDialog = ref(false)
const loadingPredictions = ref(false)
const predictions = ref(null)
const predictionError = ref(null)
const predictionChartCanvas = ref(null)
let predictionChart = null

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

const isConnected = computed(() => true) // Always connected with polling

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

const formatPredictionTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'error'
}

const getPriceChangeClass = (predictedPrice, currentPrice) => {
  if (!predictedPrice || !currentPrice) return ''
  return predictedPrice > currentPrice ? 'text-success' : 'text-error'
}

const calculatePriceChange = (predictedPrice, currentPrice) => {
  if (!predictedPrice || !currentPrice) return 'N/A'
  const change = ((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2)
  return change >= 0 ? `+${change}%` : `${change}%`
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

// When user selects MARKET order type, lock the price input to current market price
// and disable editing (UI-level). We still omit the price when submitting so the
// server/matching engine treats it as a market order.
watch(() => form.value.typeId, (newVal) => {
  // typeId === 1 maps to MARKET in this UI
  if (newVal === 1) {
    if (currentPrice.value) {
      form.value.price = currentPrice.value
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  feedback.value = null
  try {
    // Map form data to backend expected format
    const sideMap = { 1: 'BUY', 2: 'SELL' }
    const typeMap = { 2: 'LIMIT', 1: 'MARKET' }
    const tifMap = { 1: 'DAY', 3: 'GTC', 4: 'IOC', 5: 'FOK' }

    const orderData = {
      accountId: sessionState.account?.id,
      instrumentId: form.value.instrumentId,
      side: sideMap[form.value.sideId],
      type: typeMap[form.value.typeId],
      quantity: parseFloat(form.value.quantity),
      // Only include price for LIMIT orders. MARKET orders will not send a price.
      ...(typeMap[form.value.typeId] === 'LIMIT' ? { price: parseFloat(form.value.price) } : {}),
      timeInForce: tifMap[form.value.timeInForceId],
      clientOrderId: form.value.clientOrderId || undefined
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

// Prediction functions
const showPredictions = async () => {
  predictionsDialog.value = true
  await loadPredictions()
}

const loadPredictions = async () => {
  if (!form.value.instrumentId) return

  loadingPredictions.value = true
  predictionError.value = null
  predictions.value = null

  try {
    const result = await getPredictions(form.value.instrumentId, 24)

    if (result.success) {
      predictions.value = result
      // Wait for next tick to ensure canvas is rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      renderPredictionChart()
    } else {
      predictionError.value = result.error || 'Failed to generate predictions'
    }
  } catch (error) {
    console.error('Failed to load predictions:', error)
    predictionError.value = error.message || 'Failed to load predictions'
  } finally {
    loadingPredictions.value = false
  }
}

const renderPredictionChart = () => {
  if (!predictionChartCanvas.value || !predictions.value) return

  // Destroy existing chart
  if (predictionChart) {
    predictionChart.destroy()
  }

  const ctx = predictionChartCanvas.value.getContext('2d')
  const predictionsData = predictions.value.predictions || []

  // Prepare data
  const labels = ['Now', ...predictionsData.map(p => `+${p.period_ahead}h`)]
  const prices = [predictions.value.current_price, ...predictionsData.map(p => p.predicted_price)]
  const confidences = [1, ...predictionsData.map(p => p.confidence)]

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')

  predictionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Predicted Price',
        data: prices,
        borderColor: '#3b82f6',
        backgroundColor: gradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const index = context.dataIndex
              const price = context.parsed.y.toFixed(8)
              const confidence = index > 0 ? ` (${(confidences[index] * 100).toFixed(0)}% confidence)` : ''
              return `$${price}${confidence}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `$${value.toFixed(2)}`
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  })
}


// Load instruments
const loadInstruments = async () => {
  try {
    const response = await api.get('/api/instruments')
    instruments.value = response.data
  } catch (error) {
    console.error('Failed to load instruments:', error)
  }
}

// Load market data
const loadMarketData = async () => {
  try {
    const response = await api.get('/api/marketdata/quotes?symbols=BTC,ETH')
    if (response.data.success && response.data.data) {
      // Convert array to map by instrumentId (match symbol to instrument)
      const dataMap = {}
      response.data.data.forEach(item => {
        // Find instrument by matching the base symbol
        // For example: BTCUSDT should match BTC market data, ETHUSDT should match ETH
        const instrument = instruments.value.find(inst => {
          const instSymbol = inst.symbol.toUpperCase()
          const marketSymbol = item.symbol.toUpperCase()
          // Check if instrument symbol starts with or contains market symbol
          // e.g., "BTCUSDT" starts with "BTC", "ETHUSDT" starts with "ETH"
          return instSymbol.startsWith(marketSymbol) ||
                 instSymbol.includes(marketSymbol) ||
                 instSymbol === marketSymbol
        })
        if (instrument) {
          dataMap[instrument.id] = item
          console.log(`✅ Mapped ${item.symbol} data to instrument ${instrument.symbol} (${instrument.id})`)
        } else {
          console.warn(`⚠️ No instrument found for market symbol: ${item.symbol}`)
          console.log('Available instruments:', instruments.value.map(i => i.symbol))
        }
      })
      marketData.value = dataMap
      console.log('Market data loaded:', Object.keys(dataMap).length, 'instruments')
    }
  } catch (error) {
    console.error('Failed to load market data:', error)
  }
}

onMounted(async () => {
  await loadInstruments()
  // Wait for instruments to load before loading market data
  await loadMarketData()

  // Poll market data every 5 seconds
  marketDataPollingInterval = setInterval(() => {
    loadMarketData()
  }, 5000)
})

onUnmounted(() => {
  if (marketDataPollingInterval) {
    clearInterval(marketDataPollingInterval)
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
