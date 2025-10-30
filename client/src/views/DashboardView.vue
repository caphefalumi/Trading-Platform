<template>
  <div class="dashboard-view">
    <!-- Market Insights Section -->
    <section class="top-insights-grid">
      <div v-for="insight in marketInsights" :key="insight.symbol"
           :class="['insight-card', insight.changePercent >= 0 ? 'green-change' : 'red-change']">
        <div class="title">
          {{ insight.symbol }}
          <span class="change-percent">{{ formatChangePercent(insight.changePercent) }}</span>
        </div>
        <div class="value">${{ formatNumber(insight.price, 2) }}</div>
        <div class="mini-chart"></div>
      </div>
    </section>

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

    <!-- Account Balance Section -->
    <div class="balance-section card">
      <h2>Account Balance</h2>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="balances.length === 0" class="empty-state">
        <p>No balances found. Click below to add demo funds.</p>
        <button @click="showDemoCredit = true" class="btn-primary">Add Demo Funds</button>
      </div>
      <div v-else class="balances-grid">
        <div v-for="balance in balances" :key="balance.currency" class="balance-item">
          <div class="currency-label">{{ balance.currency }}</div>
          <div class="balance-amount">{{ formatNumber(balance.total) }}</div>
          <div class="balance-details">
            <span>Available: {{ formatNumber(balance.available) }}</span>
            <span>Reserved: {{ formatNumber(balance.reserved) }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="balance-actions">
        <button @click="showDeposit = true" class="btn-primary">Deposit</button>
        <button @click="showWithdraw = true" class="btn-secondary">Withdraw</button>
        <button @click="showDemoCredit = true" class="btn-demo">Demo Credit</button>
      </div>
    </div>

    <!-- Portfolio Section -->
    <div class="portfolio-section card">
      <h2>Portfolio</h2>
      <div v-if="loadingPortfolio" class="loading">Loading positions...</div>
      <div v-else-if="portfolio.length === 0" class="empty-state">
        <p>No open positions</p>
      </div>
      <table v-else class="portfolio-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Avg Price</th>
            <th>Mark Price</th>
            <th>Market Value</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="position in portfolio" :key="position.instrumentId">
            <td class="symbol">{{ position.symbol }}</td>
            <td>{{ formatNumber(position.quantity) }}</td>
            <td>{{ formatCurrency(position.averagePrice) }}</td>
            <td>{{ formatCurrency(position.markPrice) }}</td>
            <td>{{ formatCurrency(position.marketValue) }}</td>
            <td :class="getPnLClass(position)">{{ formatCurrency(position.pnl) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="portfolioSummary" class="portfolio-summary">
        <div class="summary-item">
          <span class="label">Total Portfolio Value:</span>
          <span class="value">{{ formatCurrency(portfolioSummary.portfolioValue) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Equity:</span>
          <span class="value">{{ formatCurrency(portfolioSummary.equity) }}</span>
        </div>
      </div>
    </div>

    <!-- Deposit Modal -->
    <div v-if="showDeposit" class="modal-overlay" @click="showDeposit = false">
      <div class="modal-content" @click.stop>
        <h3>Deposit Funds</h3>
        <form @submit.prevent="handleDeposit">
          <div class="form-group">
            <label>Amount</label>
            <input v-model="depositAmount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Currency (optional)</label>
            <input v-model="depositCurrency" type="text" placeholder="e.g., USDT" />
          </div>
          <div v-if="feedback" :class="['feedback', feedback.type]">{{ feedback.message }}</div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Processing...' : 'Deposit' }}
            </button>
            <button type="button" @click="showDeposit = false" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Withdraw Modal -->
    <div v-if="showWithdraw" class="modal-overlay" @click="showWithdraw = false">
      <div class="modal-content" @click.stop>
        <h3>Withdraw Funds</h3>
        <form @submit.prevent="handleWithdraw">
          <div class="form-group">
            <label>Amount</label>
            <input v-model="withdrawAmount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Currency (optional)</label>
            <input v-model="withdrawCurrency" type="text" placeholder="e.g., USDT" />
          </div>
          <div v-if="feedback" :class="['feedback', feedback.type]">{{ feedback.message }}</div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Processing...' : 'Withdraw' }}
            </button>
            <button type="button" @click="showWithdraw = false" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Demo Credit Modal -->
    <div v-if="showDemoCredit" class="modal-overlay" @click="showDemoCredit = false">
      <div class="modal-content" @click.stop>
        <h3>Add Demo Credit</h3>
        <form @submit.prevent="handleDemoCredit">
          <div class="form-group">
            <label>Amount</label>
            <input v-model="demoCreditAmount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Currency</label>
            <input v-model="demoCreditCurrency" type="text" placeholder="USDT" />
          </div>
          <div v-if="feedback" :class="['feedback', feedback.type]">{{ feedback.message }}</div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Processing...' : 'Add Funds' }}
            </button>
            <button type="button" @click="showDemoCredit = false" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { sessionState } from '../stores/session'
import apiClient from '../utils/api'
import websocketClient from '../utils/websocket'
import * as echarts from 'echarts'

const loading = ref(false)
const loadingPortfolio = ref(false)
const loadingChart = ref(false)
const balances = ref([])
const portfolio = ref([])
const portfolioSummary = ref(null)
const marketInsights = ref([
  { symbol: 'BTC/USD', price: 0, changePercent: 0 },
  { symbol: 'ETH/USD', price: 0, changePercent: 0 },
])

// Chart variables
const mainCandlestickChart = ref(null)
let echartsInstance = null
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

// WebSocket unsubscribe functions
let unsubscribeBalance = null
let unsubscribeOrder = null
let unsubscribeExecution = null

const showDeposit = ref(false)
const showWithdraw = ref(false)
const showDemoCredit = ref(false)

const depositAmount = ref('')
const depositCurrency = ref('')
const withdrawAmount = ref('')
const withdrawCurrency = ref('')
const demoCreditAmount = ref('10000')
const demoCreditCurrency = ref('USDT')

const submitting = ref(false)
const feedback = ref(null)

const formatNumber = (value, decimals = 2) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatChangePercent = (value) => {
  const num = Number(value)
  return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`
}

const getPnLClass = (position) => {
  const pnl = position.pnl || 0
  if (pnl > 0) return 'pnl-positive'
  if (pnl < 0) return 'pnl-negative'
  return ''
}

const loadBalance = async () => {
  if (!sessionState.account?.id) return

  loading.value = true
  try {
    const response = await apiClient.get(`/accounts/${sessionState.account.id}/balance`)
    balances.value = response.data.balances || []
  } catch (error) {
    console.error('Failed to load balance:', error)
    balances.value = []
  } finally {
    loading.value = false
  }
}

const loadMarketInsights = async () => {
  try {
    const response = await apiClient.get('/market-data/prices')
    if (response.data.success && response.data.data) {
      const prices = response.data.data
      marketInsights.value = marketInsights.value.map(insight => {
        const priceData = prices.find(p => p.symbol === insight.symbol.split('/')[0] + '/USD')
        if (priceData) {
          return {
            symbol: insight.symbol,
            price: parseFloat(priceData.price),
            changePercent: parseFloat(priceData.change24h || 0)
          }
        }
        return insight
      })
    }
  } catch (error) {
    console.error('Failed to load market insights:', error)
  }
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

const renderCandlestickChart = async (symbol) => {
  loadingChart.value = true
  try {
    // Fetch real historical data from CoinGecko
    const coinId = symbol === 'BTC' ? 'bitcoin' : 'ethereum'
    const days = getDaysFromPeriod(selectedTimePeriod.value)

    let chartData = []
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
      )
      const ohlcData = await response.json()

      // Convert CoinGecko OHLC data to chart format
      // CoinGecko returns: [timestamp, open, high, low, close]
      chartData = ohlcData.map(item => {
        const date = new Date(item[0])
        return [
          date.toLocaleDateString(),
          item[1], // open
          item[4], // close
          item[2], // high
          item[3], // low
          Math.random() * 1000000 + 500000 // volume (CoinGecko free tier doesn't provide volume in OHLC)
        ]
      })
    } catch (error) {
      console.error('Failed to fetch chart data, using mock data:', error)
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

const loadPortfolio = async () => {
  if (!sessionState.account?.id) return

  loadingPortfolio.value = true
  try {
    const response = await apiClient.get(`/accounts/${sessionState.account.id}/summary`)
    portfolio.value = response.data.portfolio || []
    portfolioSummary.value = response.data.totals || null

    // Calculate P&L for each position
    portfolio.value = portfolio.value.map(pos => ({
      ...pos,
      pnl: (pos.markPrice - pos.averagePrice) * pos.quantity
    }))
  } catch (error) {
    console.error('Failed to load portfolio:', error)
    portfolio.value = []
  } finally {
    loadingPortfolio.value = false
  }
}

const handleDeposit = async () => {
  feedback.value = null
  submitting.value = true

  try {
    const payload = { amount: depositAmount.value }
    if (depositCurrency.value) {
      payload.currencyCode = depositCurrency.value
    }

    await apiClient.post(`/accounts/${sessionState.account.id}/deposit`, payload)
    feedback.value = { type: 'success', message: 'Deposit successful!' }
    depositAmount.value = ''
    depositCurrency.value = ''

    setTimeout(() => {
      showDeposit.value = false
      feedback.value = null
      loadBalance()
      loadPortfolio()
    }, 1500)
  } catch (error) {
    feedback.value = {
      type: 'error',
      message: error.response?.data?.error || 'Deposit failed'
    }
  } finally {
    submitting.value = false
  }
}

const handleWithdraw = async () => {
  feedback.value = null
  submitting.value = true

  try {
    const payload = { amount: withdrawAmount.value }
    if (withdrawCurrency.value) {
      payload.currencyCode = withdrawCurrency.value
    }

    await apiClient.post(`/accounts/${sessionState.account.id}/withdraw`, payload)
    feedback.value = { type: 'success', message: 'Withdrawal successful!' }
    withdrawAmount.value = ''
    withdrawCurrency.value = ''

    setTimeout(() => {
      showWithdraw.value = false
      feedback.value = null
      loadBalance()
      loadPortfolio()
    }, 1500)
  } catch (error) {
    feedback.value = {
      type: 'error',
      message: error.response?.data?.error || 'Withdrawal failed'
    }
  } finally {
    submitting.value = false
  }
}

const handleDemoCredit = async () => {
  feedback.value = null
  submitting.value = true

  try {
    await apiClient.post(`/accounts/${sessionState.account.id}/demo-credit`, {
      amount: demoCreditAmount.value,
      currencyCode: demoCreditCurrency.value
    })
    feedback.value = { type: 'success', message: 'Demo funds added successfully!' }

    setTimeout(() => {
      showDemoCredit.value = false
      feedback.value = null
      loadBalance()
      loadPortfolio()
    }, 1500)
  } catch (error) {
    feedback.value = {
      type: 'error',
      message: error.response?.data?.error || 'Failed to add demo funds'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadBalance()
  loadPortfolio()
  loadMarketInsights()

  // Initialize chart after DOM is ready
  await nextTick()
  await renderCandlestickChart(selectedCandlestickChartTab.value)

  // Handle window resize
  const handleResize = () => {
    if (echartsInstance) {
      echartsInstance.resize()
    }
  }
  window.addEventListener('resize', handleResize)

  // Subscribe to real-time balance updates
  unsubscribeBalance = websocketClient.onBalanceUpdate((data) => {
    console.log('Balance update received in dashboard:', data)
    loadBalance() // Reload balance when updated
  })

  // Subscribe to order updates
  unsubscribeOrder = websocketClient.onOrderUpdate((data) => {
    console.log('Order update received in dashboard:', data)
    loadPortfolio() // Reload portfolio when orders are filled
  })

  // Subscribe to execution notifications
  unsubscribeExecution = websocketClient.onExecution((data) => {
    console.log('Execution received in dashboard:', data)
    showFeedback(`Order executed: ${data.quantity} @ ${data.price}`, 'success')
    loadBalance()
    loadPortfolio()
  })

  // Clean up resize listener on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  // Cleanup chart
  if (echartsInstance) {
    echartsInstance.dispose()
    echartsInstance = null
  }

  // Cleanup WebSocket subscriptions
  if (unsubscribeBalance) unsubscribeBalance()
  if (unsubscribeOrder) unsubscribeOrder()
  if (unsubscribeExecution) unsubscribeExecution()
})
</script>

<style scoped>
.dashboard-view {
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
  background: #0f1117;
  min-height: 100vh;
}

/* Market Insights Grid */
.top-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.insight-card {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  padding: 24px;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid #2d3142;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.insight-card.green-change {
  border-left: 4px solid #10b981;
}

.insight-card.red-change {
  border-left: 4px solid #ef4444;
}

.insight-card .title {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.insight-card .value {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #e5e7eb;
}

.change-percent {
  font-size: 0.875rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.green-change .change-percent {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.red-change .change-percent {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.mini-chart {
  height: 40px;
  width: 100%;
  background: linear-gradient(to right, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
  border-radius: 4px;
}

.card {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3142;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

h2 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #e5e7eb;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.loading, .empty-state {
  text-align: center;
  padding: 48px 32px;
  color: #9ca3af;
}

.empty-state p {
  font-size: 1rem;
  margin-bottom: 20px;
  color: #9ca3af;
}

.balances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.balance-item {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  padding: 24px;
  border-radius: 12px;
  color: white;
  transition: transform 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.balance-item::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.balance-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
}

.currency-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.balance-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  position: relative;
  z-index: 1;
}

.balance-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-demo {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  border-color: rgba(16, 185, 129, 0.5);
}

.btn-demo {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.btn-demo:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  border-color: rgba(139, 92, 246, 0.5);
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.portfolio-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 24px;
}

.portfolio-table th,
.portfolio-table td {
  padding: 16px 12px;
  text-align: left;
}

.portfolio-table thead tr {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
}

.portfolio-table th {
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.portfolio-table tbody tr {
  border-bottom: 1px solid #2d3142;
  transition: background 0.2s ease;
}

.portfolio-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.portfolio-table td {
  color: #e5e7eb;
  font-size: 0.9375rem;
}

.portfolio-table .symbol {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.pnl-positive {
  color: #10b981;
  font-weight: 600;
}

.pnl-negative {
  color: #ef4444;
  font-weight: 600;
}

.portfolio-summary {
  border-top: 2px solid var(--border-color, #333);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 0.875rem;
  color: #9ca3af;
}

.summary-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e5e7eb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  padding: 40px;
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #2d3142;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 28px;
  color: #e5e7eb;
  font-size: 1.5rem;
  font-weight: 700;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #e5e7eb;
  font-size: 0.9375rem;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #2d3142;
  border-radius: 8px;
  background: rgba(15, 17, 23, 0.6);
  color: #e5e7eb;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(15, 17, 23, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.feedback {
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.feedback.success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

/* Candlestick Chart Widget Styles */
.candlestick-chart-widget {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border: 1px solid #2d3142;
  border-radius: 12px;
  padding: 0;
  overflow: visible;
  position: relative;
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
</style>
