<template>
  <div class="market-chart-widget card">
    <div class="widget-header">
      <h2>Market Overview</h2>
      <div class="chart-tabs">
        <button
          v-for="symbol in availableSymbols"
          :key="symbol"
          :class="['tab', { active: selectedSymbol === symbol }]"
          @click="selectedSymbol = symbol"
        >
          {{ symbol }}
        </button>
      </div>
    </div>

    <div class="chart-info" v-if="currentData">
      <div class="price-info">
        <div class="current-price">
          <span class="price">${{ formatPrice(currentData.price) }}</span>
          <span :class="['change', currentData.change24h >= 0 ? 'positive' : 'negative']">
            <v-icon size="small">
              {{ currentData.change24h >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
            {{ formatChange(currentData.change24h) }}%
          </span>
        </div>
        <div class="price-details">
          <span>24h Volume: ${{ formatVolume(currentData.volume24h) }}</span>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div class="mini-chart" ref="chartRef">
        <!-- Placeholder for chart visualization -->
        <div class="chart-placeholder">
          <v-icon size="64" color="primary">mdi-chart-line</v-icon>
          <p>Market chart visualization</p>
          <p class="text-caption">Real-time price updates active</p>
        </div>
      </div>
    </div>

    <div class="market-stats" v-if="currentData">
      <div class="stat-item">
        <span class="stat-label">Last Updated</span>
        <span class="stat-value">{{ formatTime(currentData.updatedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { websocketClient } from '../utils/websocket'

const props = defineProps({
  instruments: {
    type: Array,
    default: () => []
  }
})

const selectedSymbol = ref('BTC/USDT')
const marketData = ref({})
const unsubscribeMarketData = ref(null)

const availableSymbols = computed(() => {
  if (props.instruments.length > 0) {
    return props.instruments.map(i => i.symbol)
    }
    return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
})

const currentData = computed(() => {
  const instrument = props.instruments.find(i => i.symbol === selectedSymbol.value)
  if (instrument && marketData.value[instrument.id]) {
    return marketData.value[instrument.id]
  }
  return null
})

const formatPrice = (price) => {
  if (!price) return '0.00'
  const num = parseFloat(price)
  if (num >= 1000) return num.toFixed(2)
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

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

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString()
}

onMounted(() => {
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
})

onUnmounted(() => {
  if (unsubscribeMarketData.value) {
    unsubscribeMarketData.value()
  }
})
</script>

<style scoped>
.market-chart-widget {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.market-chart-widget:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.widget-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  background: #f8f9fa;
  padding: 4px;
  border-radius: 10px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #666;
  transition: all 0.3s ease;
}

.tab:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.chart-info {
  margin-bottom: 16px;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-price {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.25rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 8px;
}

.change.positive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.change.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.price-details {
  font-size: 0.9375rem;
  color: #666;
  font-weight: 500;
}

.chart-container {
  margin: 28px 0;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 16px;
  border: 2px dashed #e0e0e0;
  transition: all 0.3s ease;
}

.chart-placeholder:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
}

.chart-placeholder p {
  margin: 12px 0;
  color: #666;
  font-weight: 500;
  font-size: 1.125rem;
}

.chart-placeholder .text-caption {
  font-size: 0.875rem;
  color: #999;
}

.market-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  font-weight: 500;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
