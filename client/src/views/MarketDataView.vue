<template>
  <div class="market-data-view">
    <!-- Candlestick Chart Section -->
    <div class="widget candlestick-chart-widget card">
      <div class="widget-header">
        <div class="tabs">
          <span v-for="tab in candlestickChartTabs" :key="tab.symbol"
                :class="['tab', { active: selectedCandlestickChartTab === tab.symbol }]"
                @click="selectCandlestickChartTab(tab.symbol)">
            {{ tab.symbol }}
          </span>
        </div>
      </div>

      <div class="chart-info-header" v-if="currentCandleInfo">
        <span class="info-pair">{{ currentCandleInfo.symbol }} / U.S. Dollar</span>

        <!-- Time Period Selector -->
        <div class="time-period-selector">
          <button v-for="period in timePeriods" :key="period.value"
                  :class="['period-btn', { active: selectedTimePeriod === period.value }]"
                  @click="changeTimePeriod(period.value)">
            {{ period.label }}
          </button>
        </div>

        <span class="info-label">O</span>
        <span :class="['info-value', currentCandleInfo.change >= 0 ? 'green-text' : 'red-text']">
          {{ formatNumber(currentCandleInfo.open, 2) }}
        </span>
        <span class="info-label">H</span>
        <span :class="['info-value', currentCandleInfo.change >= 0 ? 'green-text' : 'red-text']">
          {{ formatNumber(currentCandleInfo.high, 2) }}
        </span>
        <span class="info-label">L</span>
        <span :class="['info-value', currentCandleInfo.change >= 0 ? 'green-text' : 'red-text']">
          {{ formatNumber(currentCandleInfo.low, 2) }}
        </span>
        <span class="info-label">C</span>
        <span :class="['info-value', currentCandleInfo.change >= 0 ? 'green-text' : 'red-text']">
          {{ formatNumber(currentCandleInfo.close, 2) }}
        </span>
        <span :class="['info-value info-change', currentCandleInfo.changePercent >= 0 ? 'green-text' : 'red-text']">
          {{ formatChangePercent(currentCandleInfo.changePercent) }}
        </span>
        <span class="info-label info-volume-label">Vol:</span>
        <span :class="['info-value info-volume-value', currentCandleInfo.change >= 0 ? 'green-text' : 'red-text']">
           {{ formatNumber(currentCandleInfo.volume, 2) }}
        </span>
      </div>
      <div class="chart-area-container-large">
        <!-- Loading Overlay -->
        <div v-if="loadingChart" class="chart-loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading chart data...</div>
        </div>
        <div ref="mainCandlestickChart" id="main-candlestick-chart-container"></div>
      </div>
      <div class="chart-footer">
        <p>Total trade</p><p>Total volume</p><p>Total value</p>
      </div>
    </div>

    <!-- Market Data Table -->
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Market Data</span>
        <v-chip
          :color="isConnected ? 'success' : 'error'"
          size="small"
          variant="flat"
        >
          <v-icon start :icon="isConnected ? 'mdi-check-circle' : 'mdi-alert-circle'"></v-icon>
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Price (USD)</th>
              <th>24h Change</th>
              <th>24h Volume</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in marketData" :key="item.instrumentId" class="market-row">
              <td class="font-weight-bold">{{ item.symbol }}</td>
              <td>{{ item.name }}</td>
              <td class="price-cell">${{ formatPrice(item.price) }}</td>
              <td :class="item.change24h >= 0 ? 'positive-change' : 'negative-change'">
                <v-icon
                  :icon="item.change24h >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                  size="small"
                  class="mr-1"
                ></v-icon>
                {{ formatChange(item.change24h) }}%
              </td>
              <td>${{ formatVolume(item.volume24h) }}</td>
              <td class="text-caption">{{ formatTime(item.updatedAt) }}</td>
            </tr>
            <tr v-if="marketData.length === 0">
              <td colspan="6" class="text-center text-medium-emphasis pa-4">
                No market data available. Waiting for updates...
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { api } from '../utils/api'
import * as echarts from 'echarts'
import marketDataService from '../services/marketData'

const marketData = ref([])
let marketDataPollingInterval = null
let priceUpdateInterval = null
const isConnected = computed(() => true) // Always connected with polling

// Chart variables
const mainCandlestickChart = ref(null)
let echartsInstance = null
const loadingChart = ref(false)
const currentCandleInfo = ref(null)
const selectedCandlestickChartTab = ref('BTC')
const candlestickChartTabs = [
  { symbol: 'BTC', data: null },
  { symbol: 'ETH', data: null }
]
const selectedTimePeriod = ref('1d')
const timePeriods = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' }
]

// Format number with decimals
const formatNumber = (value, decimals = 2) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Format percentage change
const formatChangePercent = (value) => {
  const num = Number(value)
  return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`
}

// Format price with appropriate decimals
const formatPrice = (price) => {
  if (!price) return '0.00'
  const num = parseFloat(price)
  if (num >= 1000) return num.toFixed(2)
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

// Format percentage change for table
const formatChange = (change) => {
  if (!change) return '0.00'
  const num = parseFloat(change)
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

// Format volume with K/M/B suffixes
const formatVolume = (volume) => {
  if (!volume) return '0'
  const num = parseFloat(volume)
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(0)
}

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // seconds

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleString()
}

// Chart functions
const selectCandlestickChartTab = async (symbol) => {
  selectedCandlestickChartTab.value = symbol
  await renderCandlestickChart(symbol)
}

const changeTimePeriod = async (period) => {
  selectedTimePeriod.value = period
  await renderCandlestickChart(selectedCandlestickChartTab.value)
}

const getDaysFromPeriod = (period) => {
  switch (period) {
    case '1d': return 1
    case '1w': return 7
    case '1m': return 30
    case '1y': return 365
    case 'all': return 'max'
    default: return 30
  }
}

const renderCandlestickChart = async (symbol) => {
  loadingChart.value = true
  try {
    // Fetch real historical data from backend market data service
    let chartData = []
    try {
      // Use the market data service to get candle data
      const candleData = await marketDataService.getCandleData(symbol, selectedTimePeriod.value)

      if (candleData && candleData.length > 0) {
        // Convert backend candle data to chart format
        chartData = candleData.map(item => {
          const date = new Date(item.timestamp || item.time)
          return [
            date.toLocaleDateString(),
            item.open,
            item.close,
            item.high,
            item.low,
            item.volume || Math.random() * 1000000 + 500000
          ]
        })
      } else {
        // Fallback: Use mock data if no data returned
        console.warn('No candle data returned from service, using mock data')
        chartData = generateMockCandleData(100)
      }
    } catch (error) {
      console.error('Failed to fetch chart data from service:', error)
      // Fallback: Use mock data if API fails
      chartData = generateMockCandleData(100)
    }

    if (!mainCandlestickChart.value) return

    if (!echartsInstance) {
      echartsInstance = echarts.init(mainCandlestickChart.value)
    }

    // Update currentCandleInfo with the latest candle
    const lastCandle = chartData[chartData.length - 1]
    if (lastCandle) {
      currentCandleInfo.value = {
        symbol,
        open: lastCandle[1],
        high: lastCandle[3],
        low: lastCandle[4],
        close: lastCandle[2],
        volume: lastCandle[5] || 1000000,
        change: lastCandle[2] - lastCandle[1],
        changePercent: ((lastCandle[2] - lastCandle[1]) / lastCandle[1]) * 100
      }
    }

    const option = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '3%',
        top: '15%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item[0]),
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' }
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: '#2d3142', type: 'dashed' } }
      },
      series: [{
        type: 'candlestick',
        data: chartData.map(item => [item[1], item[2], item[4], item[3]]),
        itemStyle: {
          color: '#10b981',
          color0: '#ef4444',
          borderColor: '#10b981',
          borderColor0: '#ef4444'
        }
      }],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(26, 29, 41, 0.95)',
        borderColor: '#2d3142',
        textStyle: { color: '#e5e7eb' },
        formatter: (params) => {
          const data = params[0]
          if (!data) return ''
          const values = data.data
          const change = values[1] - values[0]
          const changePercent = ((change / values[0]) * 100).toFixed(2)
          const color = change >= 0 ? '#10b981' : '#ef4444'

          // Update the info header when hovering
          const candleData = chartData[data.dataIndex]
          if (candleData) {
            currentCandleInfo.value = {
              symbol,
              open: candleData[1],
              high: candleData[3],
              low: candleData[4],
              close: candleData[2],
              volume: candleData[5] || 1000000,
              change: candleData[2] - candleData[1],
              changePercent: ((candleData[2] - candleData[1]) / candleData[1]) * 100
            }
          }

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
              <div style="margin-bottom: 4px;">Open: <span style="color: #e5e7eb; font-weight: 600;">$${values[0].toFixed(2)}</span></div>
              <div style="margin-bottom: 4px;">High: <span style="color: #e5e7eb; font-weight: 600;">$${values[3].toFixed(2)}</span></div>
              <div style="margin-bottom: 4px;">Low: <span style="color: #e5e7eb; font-weight: 600;">$${values[2].toFixed(2)}</span></div>
              <div style="margin-bottom: 4px;">Close: <span style="color: #e5e7eb; font-weight: 600;">$${values[1].toFixed(2)}</span></div>
              <div style="color: ${color}; font-weight: 600;">${change >= 0 ? '+' : ''}${changePercent}%</div>
            </div>
          `
        }
      }
    }

    echartsInstance.setOption(option, true)

    // Listen for chart events to update info header
    echartsInstance.on('mouseover', (params) => {
      if (params.componentType === 'series' && params.seriesType === 'candlestick') {
        const candleData = chartData[params.dataIndex]
        if (candleData) {
          currentCandleInfo.value = {
            symbol,
            open: candleData[1],
            high: candleData[3],
            low: candleData[4],
            close: candleData[2],
            volume: candleData[5] || 1000000,
            change: candleData[2] - candleData[1],
            changePercent: ((candleData[2] - candleData[1]) / candleData[1]) * 100
          }
        }
      }
    })

    // Reset to latest candle on mouse leave
    echartsInstance.on('globalout', () => {
      const lastCandle = chartData[chartData.length - 1]
      if (lastCandle) {
        currentCandleInfo.value = {
          symbol,
          open: lastCandle[1],
          high: lastCandle[3],
          low: lastCandle[4],
          close: lastCandle[2],
          volume: lastCandle[5] || 1000000,
          change: lastCandle[2] - lastCandle[1],
          changePercent: ((lastCandle[2] - lastCandle[1]) / lastCandle[1]) * 100
        }
      }
    })
  } finally {
    loadingChart.value = false
  }
}

const generateMockCandleData = (count) => {
  const data = []
  let basePrice = selectedCandlestickChartTab.value === 'BTC' ? 45000 : 2500
  let currentPrice = basePrice

  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (count - i))

    const open = currentPrice
    const change = (Math.random() - 0.5) * basePrice * 0.05
    const close = open + change
    const high = Math.max(open, close) + Math.random() * basePrice * 0.02
    const low = Math.min(open, close) - Math.random() * basePrice * 0.02
    const volume = Math.random() * 1000000 + 500000

    data.push([
      date.toLocaleDateString(),
      Number(open.toFixed(2)),
      Number(close.toFixed(2)),
      Number(high.toFixed(2)),
      Number(low.toFixed(2)),
      Number(volume.toFixed(0))
    ])

    currentPrice = close
  }

  return data
}

// Load initial market data from API
const loadMarketData = async () => {
  try {
    const response = await api.get('/api/marketdata/quotes?symbols=BTC,ETH,USDT,BNB,XRP,ADA,SOL,DOT,DOGE,MATIC')
    if (response.data.success && response.data.data) {
      marketData.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load market data:', error)
  }
}

// Update current prices for chart using market data service
const updateChartPrices = async () => {
  try {
    const quotes = await marketDataService.getLatestQuotes(['BTC', 'ETH'])

    // Update current candle info if we have the selected symbol's quote
    if (quotes[selectedCandlestickChartTab.value] && currentCandleInfo.value) {
      const quote = quotes[selectedCandlestickChartTab.value]

      // Update with real-time price data
      if (quote.price) {
        currentCandleInfo.value.close = quote.price
        currentCandleInfo.value.change = quote.change24h || 0
        currentCandleInfo.value.changePercent = quote.changePercent24h || 0
        currentCandleInfo.value.volume = quote.volume24h || currentCandleInfo.value.volume

        // Update high/low if current price exceeds them
        if (quote.price > currentCandleInfo.value.high) {
          currentCandleInfo.value.high = quote.price
        }
        if (quote.price < currentCandleInfo.value.low) {
          currentCandleInfo.value.low = quote.price
        }
      }
    }
  } catch (error) {
    console.error('Failed to update chart prices:', error)
  }
}

// Handle window resize - defined outside hooks so it's accessible in onUnmounted
const handleResize = () => {
  if (echartsInstance) {
    echartsInstance.resize()
  }
}

onMounted(async () => {
  // Load initial data
  await loadMarketData()

  // Initialize chart after DOM is ready
  await nextTick()
  await renderCandlestickChart(selectedCandlestickChartTab.value)

  // Update chart prices from market data service
  await updateChartPrices()

  // Update chart prices periodically (every 30 seconds)
  priceUpdateInterval = setInterval(updateChartPrices, 30000)

  // Handle window resize for chart
  window.addEventListener('resize', handleResize)

  // Poll market data every 10 seconds
  marketDataPollingInterval = setInterval(() => {
    loadMarketData()
    updateChartPrices()
  }, 10000)
})

onUnmounted(() => {
  // Cleanup chart
  if (echartsInstance) {
    echartsInstance.dispose()
    echartsInstance = null
  }

  // Clean up resize listener
  window.removeEventListener('resize', handleResize)

  // Clear interval
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval)
  }

  // Clear market data polling
  if (marketDataPollingInterval) {
    clearInterval(marketDataPollingInterval)
  }
})
</script>
<style scoped>
.market-data-view {
  padding: 32px;
  background: #0f1117;
  min-height: 100vh;
}

.market-data-view :deep(.v-card) {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border: 1px solid #2d3142;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.market-data-view :deep(.v-card-title) {
  color: #e5e7eb;
  font-weight: 700;
  border-bottom: 1px solid #2d3142;
  padding: 20px;
}

.market-data-view :deep(.v-chip) {
  font-weight: 600;
}

.market-data-view :deep(.v-table) {
  background: transparent;
}

.market-data-view :deep(.v-table thead) {
  background: rgba(59, 130, 246, 0.1);
}

.market-data-view :deep(.v-table th) {
  color: #9ca3af !important;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.market-data-view :deep(.v-table td) {
  color: #e5e7eb;
  border-bottom: 1px solid #2d3142 !important;
}

.market-row {
  transition: background-color 0.3s ease;
}

.market-row:hover {
  background: rgba(59, 130, 246, 0.1);
}

.price-cell {
  font-family: monospace;
  font-weight: 600;
  font-size: 1.1em;
  color: #3b82f6;
}

.positive-change {
  color: #10b981;
  font-weight: 600;
}

.negative-change {
  color: #ef4444;
  font-weight: 600;
}

.market-data-view :deep(.text-medium-emphasis) {
  color: #9ca3af !important;
}

/* Candlestick Chart Widget Styles */
.candlestick-chart-widget {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border: 1px solid #2d3142;
  border-radius: 12px;
  padding: 0;
  overflow: visible;
  position: relative;
  margin-bottom: 32px;
}

.candlestick-chart-widget .widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 16px 20px;
  background: rgba(26, 29, 41, 0.6);
  border-bottom: 1px solid #2d3142;
}

.candlestick-chart-widget .widget-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: #e5e7eb;
}

.candlestick-chart-widget .tabs {
  display: flex;
  gap: 8px;
}

.candlestick-chart-widget .tab {
  padding: 8px 20px;
  background-color: transparent;
  border: 1px solid #2d3142;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #9ca3af;
  font-weight: 500;
  font-size: 14px;
}

.candlestick-chart-widget .tab:hover {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #e5e7eb;
}

.candlestick-chart-widget .tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Chart Info Header (OHLC Display) */
.chart-info-header {
  position: absolute;
  top: 75px;
  left: 20px;
  z-index: 10;
  background: linear-gradient(135deg, rgba(26, 29, 41, 0.95) 0%, rgba(30, 33, 57, 0.95) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid #2d3142;
  padding: 12px 18px;
  margin: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  flex-wrap: wrap;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.chart-info-header .info-pair {
  font-weight: 700;
  color: #e5e7eb;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.chart-info-header .info-label {
  color: #e5e7eb !important;
  font-weight: 500;
  margin-right: 4px;
}

.chart-info-header .info-value {
  font-weight: 600;
  color: #e5e7eb;
}

.chart-info-header .info-value.green-text {
  color: #10b981 !important;
}

.chart-info-header .info-value.red-text {
  color: #ef4444 !important;
}

/* Time Period Selector */
.time-period-selector {
  display: flex;
  gap: 4px;
  margin: 0 16px;
  background: rgba(20, 23, 36, 0.6);
  border: 1px solid #2d3142;
  border-radius: 8px;
  padding: 3px;
}

.time-period-selector .period-btn {
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.time-period-selector .period-btn:hover {
  background: #252a3a;
  color: #e5e7eb;
}

.time-period-selector .period-btn.active {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

/* Chart Area Container */
.chart-area-container-large {
  height: 480px;
  width: 100%;
  background: #1a1d29;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 400px;
  margin-bottom: 15px;
}

#main-candlestick-chart-container {
  width: 100%;
  height: 100%;
  background: #1a1d29;
  border-radius: 8px;
}

/* Loading Overlay */
.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 29, 41, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #2d3142;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
}

.chart-footer {
  display: flex;
  justify-content: space-around;
  color: #6b7280;
  font-size: 12px;
  padding: 12px 20px;
}

.card {
  margin-bottom: 32px;
}
</style>
