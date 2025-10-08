<template>
  <div class="dashboard-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <nav class="menu">
        <h2>MENU</h2>
        <ul>
          <li class="active" data-page="dashboard"><span class="mdi mdi-view-dashboard"></span> Dashboard</li>
          <li><span class="mdi mdi-currency-usd"></span> Trade</li>
          <li><span class="mdi mdi-chart-line"></span> Market update</li>
          <li><span class="mdi mdi-calculator"></span> Income estimator</li>
          <li><span class="mdi mdi-chart-area"></span> Interactive chart</li>
          <li><span class="mdi mdi-hand-coin"></span> Mutual funds</li>
        </ul>

        <h2>ACCOUNT</h2>
        <ul>
          <li><span class="mdi mdi-folder-open"></span> Portfolio</li>
          <li><span class="mdi mdi-cog"></span> Settings <span class="indicator red"></span></li>
          <li><span class="mdi mdi-history"></span> History</li>
        </ul>

        <h2>EXTRA</h2>
        <ul>
          <li id="news-item"><span class="mdi mdi-newspaper"></span> News <span class="tag new">new</span></li>
          <li><span class="mdi mdi-comment"></span> Feedback</li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="header">
        <h1>Dashboard</h1>
        <div class="search-bar">
          <input type="text" placeholder="Search">
          <span class="mdi mdi-magnify"></span>
        </div>
        <div class="user-actions">
          <span class="mdi mdi-bell-outline"></span>
          <span class="mdi mdi-account-circle user-avatar"></span>
        </div>
      </header>

      <!-- Alert Messages -->
      <div v-if="feedback.error || feedback.success" class="alert-container">
        <div
          :class="['alert', feedback.error ? 'alert-error' : 'alert-success']"
          @click="feedback.error = feedback.success = ''"
        >
          {{ feedback.error || feedback.success }}
          <span class="alert-close">&times;</span>
        </div>
      </div>

      <!-- Market Insights Grid -->
      <section class="top-insights-grid">
        <div v-for="insight in marketInsights" :key="insight.symbol"
             :class="['insight-card', insight.changePercent >= 0 ? 'green-change' : 'red-change']"
             :data-symbol="insight.symbol">
          <div class="title">
            {{ insight.symbol }}
            <span class="change-percent">{{ formatChangePercent(insight.changePercent) }}</span>
          </div>
          <div class="value">{{ formatNumber(insight.price, 2) }}</div>
          <div class="mini-chart"></div>
        </div>
      </section>

      <!-- Main Widgets Grid -->
      <section class="widgets-grid">
        <!-- Main Chart Widget -->
        <div class="widget main-chart-widget">
          <div class="tabs">
            <span v-for="tab in chartTabs" :key="tab"
                  :class="['tab', { active: selectedChartTab === tab }]"
                  @click="selectChartTab(tab)">
              {{ tab }}
            </span>
          </div>
          <div class="chart-area-container">
            <canvas ref="mainChart" id="main-chart-canvas"></canvas>
          </div>
          <div class="chart-footer">
            <p>Total trade</p><p>Total volume</p><p>Total value</p>
          </div>
        </div>

        <!-- Account Summary Widget -->
        <div class="widget account-summary-widget">
          <div class="widget-header">
            <h2>Account Summary</h2>
            <i class="fas fa-info-circle"></i>
          </div>

          <div v-if="account" class="account-info">
            <div class="account-name">{{ account.accountName }}</div>
          </div>

          <div v-if="accountSummary" class="account-balance">
            <div class="balance-title">Available Balance</div>
            <div class="balance-value">
              {{ formatNumber(accountSummary.account.balance.available, 2) }} {{ accountCurrency }}
            </div>
          </div>

          <div v-if="accountSummary" class="key-metrics">
            <div class="metric">
              <p>Portfolio Value</p>
              <p class="value">{{ formatNumber(accountSummary.totals.portfolioValue, 2) }} {{ accountCurrency }}</p>
            </div>
            <div class="metric">
              <p>Equity</p>
              <p class="value">{{ formatNumber(accountSummary.totals.equity, 2) }} {{ accountCurrency }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Trading and Portfolio Section -->
      <section class="trading-section">
        <!-- Order Entry Card -->
        <div class="trading-card order-entry-card">
          <div class="card-header">
            <h3>Order Entry</h3>
            <div class="order-side-toggle">
              <button :class="['side-btn', { active: orderForm.side === 'BUY' }]"
                      @click="orderForm.side = 'BUY'">Buy</button>
              <button :class="['side-btn', { active: orderForm.side === 'SELL' }]"
                      @click="orderForm.side = 'SELL'">Sell</button>
            </div>
          </div>

          <form @submit.prevent="placeOrder" class="order-form">
            <div class="form-group">
              <label>Instrument</label>
              <select v-model="selectedInstrumentId" class="form-select">
                <option v-for="instrument in instruments" :key="instrument.id" :value="instrument.id">
                  {{ instrument.symbol }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Order Type</label>
              <select v-model="orderForm.type" class="form-select">
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity</label>
                <input v-model="orderForm.quantity" type="number" step="0.0001" min="0" class="form-input">
              </div>

              <div class="form-group">
                <label>Price</label>
                <input v-model="orderForm.price" type="number" step="0.01" min="0"
                       :disabled="orderForm.type === 'MARKET'" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label>Time in Force</label>
              <select v-model="orderForm.timeInForce" class="form-select">
                <option value="GTC">GTC</option>
                <option value="IOC">IOC</option>
                <option value="FOK">FOK</option>
              </select>
            </div>

            <button type="submit"
                    :class="['submit-btn', orderForm.side.toLowerCase()]"
                    :disabled="loading.order">
              <span v-if="loading.order" class="loading-spinner"></span>
              {{ orderForm.side }} {{ selectedInstrument?.symbol || '' }}
            </button>
          </form>
        </div>

        <!-- Deposit/Withdraw Card -->
        <div class="trading-card balance-card">
          <div class="balance-actions">
            <div class="action-section">
              <h3>Deposit</h3>
              <form @submit.prevent="submitDeposit" class="balance-form">
                <div class="form-group">
                  <input v-model="depositAmount" type="number" step="0.01" min="0"
                         :placeholder="`Amount in ${accountCurrency}`" class="form-input">
                </div>
                <button type="submit" :disabled="loading.deposit" class="action-btn deposit-btn">
                  <span v-if="loading.deposit" class="loading-spinner"></span>
                  Deposit
                </button>
              </form>
            </div>

            <div class="action-section">
              <h3>Withdraw</h3>
              <form @submit.prevent="submitWithdraw" class="balance-form">
                <div class="form-group">
                  <input v-model="withdrawAmount" type="number" step="0.01" min="0"
                         :placeholder="`Amount in ${accountCurrency}`" class="form-input">
                </div>
                <button type="submit" :disabled="loading.withdraw" class="action-btn withdraw-btn">
                  <span v-if="loading.withdraw" class="loading-spinner"></span>
                  Withdraw
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Order Book and Orders Section -->
      <section class="data-section">
        <!-- Order Book -->
        <div class="data-card order-book-card">
          <h3>Order Book - {{ selectedInstrument?.symbol || 'Select Instrument' }}</h3>

          <div class="order-book">
            <div class="asks-section">
              <div class="section-title">Asks</div>
              <div class="order-book-table">
                <div class="table-header">
                  <span>Price</span>
                  <span>Quantity</span>
                </div>
                <div v-for="ask in orderBook.asks" :key="ask.id" class="table-row ask-row">
                  <span class="price">{{ formatNumber(ask.price, 2) }}</span>
                  <span class="quantity">{{ formatNumber(ask.quantity, 4) }}</span>
                </div>
                <div v-if="!orderBook.asks.length" class="empty-message">No asks available</div>
              </div>
            </div>

            <div class="bids-section">
              <div class="section-title">Bids</div>
              <div class="order-book-table">
                <div class="table-header">
                  <span>Price</span>
                  <span>Quantity</span>
                </div>
                <div v-for="bid in orderBook.bids" :key="bid.id" class="table-row bid-row">
                  <span class="price">{{ formatNumber(bid.price, 2) }}</span>
                  <span class="quantity">{{ formatNumber(bid.quantity, 4) }}</span>
                </div>
                <div v-if="!orderBook.bids.length" class="empty-message">No bids available</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders -->
        <div class="data-card orders-card">
          <h3>My Orders</h3>
          <div class="orders-table">
            <div class="table-header">
              <span>Instrument</span>
              <span>Side</span>
              <span>Type</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Filled</span>
              <span>Status</span>
            </div>
            <div v-for="order in orders" :key="order.id" class="table-row">
              <span>{{ order.instrument?.symbol }}</span>
              <span :class="['side', order.side.code.toLowerCase()]">{{ order.side.code }}</span>
              <span>{{ order.type.code }}</span>
              <span>{{ order.price ? formatNumber(order.price, 2) : '-' }}</span>
              <span>{{ formatNumber(order.quantity, 4) }}</span>
              <span>{{ formatNumber(order.filledQuantity, 4) }}</span>
              <span>{{ order.status.code }}</span>
            </div>
            <div v-if="!orders.length" class="empty-message">No orders yet</div>
          </div>
        </div>
      </section>

      <!-- Portfolio Section -->
      <section class="portfolio-section">
        <div class="data-card portfolio-card">
          <h3>Portfolio</h3>
          <div class="portfolio-table">
            <div class="table-header">
              <span>Symbol</span>
              <span>Quantity</span>
              <span>Average Price</span>
              <span>Mark Price</span>
              <span>Market Value</span>
            </div>
            <div v-for="holding in accountSummary?.portfolio ?? []" :key="holding.instrumentId" class="table-row">
              <span>{{ holding.symbol }}</span>
              <span>{{ formatNumber(holding.quantity, 4) }}</span>
              <span>{{ formatNumber(holding.averagePrice, 2) }}</span>
              <span>{{ formatNumber(holding.markPrice, 2) }}</span>
              <span>{{ formatNumber(holding.marketValue, 2) }}</span>
            </div>
            <div v-if="!accountSummary?.portfolio?.length" class="empty-message">No positions</div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue'
import apiClient from '../utils/api'
import { sessionState } from '../stores/session'

const account = computed(() => sessionState.account)
const accountSummary = ref(null)
const instruments = ref([])
const selectedInstrumentId = ref('')
const orderBook = ref({ bids: [], asks: [] })
const orders = ref([])
const depositAmount = ref('')
const withdrawAmount = ref('')

const orderForm = reactive({
  side: 'BUY',
  type: 'LIMIT',
  quantity: '',
  price: '',
  timeInForce: 'GTC',
})

const feedback = reactive({ success: '', error: '' })
const loading = reactive({ deposit: false, withdraw: false, order: false })

// New dashboard features
const mainChart = ref(null)
const selectedChartTab = ref('DSEX')
const chartTabs = ['DSEX', 'DSES', 'DS30']
let tradingChart = null

// Market insights data
const marketInsights = ref([
  { symbol: 'GOLD', price: 2120.56, changePercent: -0.04 },
  { symbol: 'DOW', price: 32053.74, changePercent: 0.45 },
  { symbol: 'S&P500', price: 43003.06, changePercent: 0.47 },
  { symbol: 'NASDAQ', price: 6355.46, changePercent: 0.64 },
  { symbol: 'BTC', price: 28450.23, changePercent: 0.49 },
  { symbol: 'ETH', price: 1850.74, changePercent: 0.50 }
])

const accountCurrency = computed(() => accountSummary.value?.account?.currency ?? 'USDT')
const selectedInstrument = computed(
  () =>
    instruments.value.find((instrument) => instrument.id === selectedInstrumentId.value) || null,
)
const orderButtonColor = computed(() => (orderForm.side === 'BUY' ? 'success' : 'error'))
const orderButtonLabel = computed(() => (orderForm.side === 'BUY' ? 'Buy' : 'Sell'))

const formatNumber = (value, fractionDigits = 2) => {
  const numeric = Number.parseFloat(value)
  if (Number.isNaN(numeric)) return '0.00'
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

const formatChangePercent = (value) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Chart functionality
const loadChart = async (indexName) => {
  await nextTick()

  if (!mainChart.value) return

  // Destroy existing chart
  if (tradingChart) {
    tradingChart.destroy()
  }

  // Import Chart.js dynamically
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  let chartData, chartBarColor

  if (indexName === 'DSEX') {
    chartData = [6000, 6100, 6050, 6150, 6120, 6200, 6148]
    chartBarColor = '#00b050'
  } else if (indexName === 'DSES') {
    chartData = [550, 580, 560, 590, 575, 610, 595]
    chartBarColor = '#4a90e2'
  } else {
    chartData = [2100, 2150, 2080, 2200, 2180, 2250, 2210]
    chartBarColor = '#ff9900'
  }

  const ctx = mainChart.value.getContext('2d')

  tradingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
      datasets: [{
        label: `${indexName} Price`,
        data: chartData,
        backgroundColor: chartBarColor,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#FFFFFF' }
        },
        y: {
          grid: { color: '#27293d' },
          ticks: { color: '#FFFFFF' }
        }
      }
    }
  })
}

const selectChartTab = (tab) => {
  selectedChartTab.value = tab
  loadChart(tab)
}

const drawMiniChart = async (element, isPositive) => {
  if (!element) return

  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  let canvas = element.querySelector('canvas')

  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 30
    element.appendChild(canvas)
  } else {
    const existingChart = Chart.getChart(canvas)
    if (existingChart) {
      existingChart.destroy()
    }
  }

  const data = Array.from({ length: 15 }, () => (Math.random() * 10) + 80)
  const chartColor = isPositive ? '#00b050' : '#FF3B30'

  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: Array(15).fill(''),
      datasets: [{
        data: data,
        borderColor: chartColor,
        borderWidth: 2,
        tension: 0.6,
        fill: false,
        backgroundColor: 'transparent',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: { point: { radius: 0 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  })
}

const updateMarketData = () => {
  marketInsights.value.forEach((insight, index) => {
    const changePercent = (Math.random() - 0.5) * 1.5
    const newPrice = insight.price * (1 + changePercent / 100)

    marketInsights.value[index] = {
      ...insight,
      price: newPrice,
      changePercent
    }
  })

  // Update mini charts
  nextTick(() => {
    marketInsights.value.forEach((insight) => {
      const element = document.querySelector(`[data-symbol="${insight.symbol}"] .mini-chart`)
      if (element) {
        drawMiniChart(element, insight.changePercent >= 0)
      }
    })
  })
}

const setSuccess = (message) => {
  feedback.success = message
  feedback.error = ''
}

const setError = (message) => {
  feedback.error = message
  feedback.success = ''
}

const resetOrderForm = () => {
  orderForm.quantity = ''
  orderForm.price = ''
}

const resetDashboardState = () => {
  accountSummary.value = null
  orders.value = []
  depositAmount.value = ''
  withdrawAmount.value = ''
  orderBook.value = { bids: [], asks: [] }
  feedback.success = ''
  feedback.error = ''
  resetOrderForm()
}

const fetchInstruments = async () => {
  try {
    const { data } = await apiClient.get('/api/instruments')
    instruments.value = data
    if (!selectedInstrumentId.value && data.length) {
      selectedInstrumentId.value = data[0].id
    }
  } catch (error) {
    setError(error.response?.data?.error || 'Unable to load instruments')
  }
}

const fetchAccountSummary = async () => {
  if (!account.value?.id) return
  try {
    const { data } = await apiClient.get(`/api/accounts/${account.value.id}/summary`)
    accountSummary.value = data
  } catch (error) {
    setError(error.response?.data?.error || 'Unable to load account summary')
  }
}

const fetchOrders = async () => {
  if (!account.value?.id) return
  try {
    const { data } = await apiClient.get(`/api/orders/account/${account.value.id}`)
    orders.value = data
  } catch (error) {
    setError(error.response?.data?.error || 'Unable to load orders')
  }
}

const fetchOrderBook = async () => {
  if (!selectedInstrumentId.value) return
  try {
    const { data } = await apiClient.get(`/api/orders/book/${selectedInstrumentId.value}`)
    orderBook.value = data
  } catch (error) {
    setError(error.response?.data?.error || 'Unable to load order book')
  }
}

const submitDeposit = async () => {
  if (!account.value?.id) return setError('Account not found')
  const amount = Number.parseFloat(depositAmount.value)
  if (!amount || amount <= 0) {
    setError('Enter a valid deposit amount')
    return
  }
  loading.deposit = true
  try {
    await apiClient.post(`/api/accounts/${account.value.id}/deposit`, { amount })
    setSuccess('Deposit completed')
    depositAmount.value = ''
    await Promise.all([fetchAccountSummary(), fetchOrders()])
  } catch (error) {
    setError(error.response?.data?.error || 'Deposit failed')
  } finally {
    loading.deposit = false
  }
}

const submitWithdraw = async () => {
  if (!account.value?.id) return setError('Account not found')
  const amount = Number.parseFloat(withdrawAmount.value)
  if (!amount || amount <= 0) {
    setError('Enter a valid withdrawal amount')
    return
  }
  loading.withdraw = true
  try {
    await apiClient.post(`/api/accounts/${account.value.id}/withdraw`, { amount })
    setSuccess('Withdrawal completed')
    withdrawAmount.value = ''
    await Promise.all([fetchAccountSummary(), fetchOrders()])
  } catch (error) {
    setError(error.response?.data?.error || 'Withdrawal failed')
  } finally {
    loading.withdraw = false
  }
}

const placeOrder = async () => {
  if (!account.value?.id || !selectedInstrumentId.value) {
    setError('Select instrument first')
    return
  }
  const quantity = Number.parseFloat(orderForm.quantity)
  if (!quantity || quantity <= 0) {
    setError('Enter a valid quantity')
    return
  }
  const payload = {
    accountId: account.value.id,
    instrumentId: selectedInstrumentId.value,
    side: orderForm.side,
    type: orderForm.type,
    quantity,
    timeInForce: orderForm.timeInForce,
  }
  if (orderForm.type === 'LIMIT') {
    const price = Number.parseFloat(orderForm.price)
    if (!price || price <= 0) {
      setError('Enter a valid limit price')
      return
    }
    payload.price = price
  }

  loading.order = true
  try {
    await apiClient.post('/api/orders', payload)
    setSuccess('Order submitted')
    resetOrderForm()
    await Promise.all([fetchAccountSummary(), fetchOrders(), fetchOrderBook()])
  } catch (error) {
    setError(error.response?.data?.error || 'Order placement failed')
  } finally {
    loading.order = false
  }
}

watch(
  () => account.value?.id,
  async (accountId) => {
    if (accountId) {
      await Promise.all([fetchAccountSummary(), fetchOrders()])
    } else {
      resetDashboardState()
    }
  },
  { immediate: true },
)

watch(selectedInstrumentId, async (instrumentId) => {
  if (!instrumentId) {
    orderBook.value = { bids: [], asks: [] }
    return
  }
  await fetchOrderBook()
})

onMounted(async () => {
  await fetchInstruments()
  if (selectedInstrumentId.value) {
    await fetchOrderBook()
  }

  // Initialize dashboard features
  await nextTick()
  await loadChart(selectedChartTab.value)
  updateMarketData()

  // Update market data periodically
  setInterval(updateMarketData, 5000)

  // Initialize menu interactivity
  initializeMenuInteractivity()
})

const initializeMenuInteractivity = () => {
  const menuItems = document.querySelectorAll('.menu li')
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.menu li.active').forEach(i => i.classList.remove('active'))
      this.classList.add('active')

      const page = this.getAttribute('data-page')
      console.log(`Navigating to: ${page}`)
    })
  })
}
</script>

<style scoped>
/* Import Font Awesome */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');

/* CSS Variables */
:root {
  --dark-bg: #1e1e2d;
  --card-bg: #27293d;
  --sidebar-active: #3a3b50;
  --text-color-light: #f0f0f0;
  --text-color-faded: #a0a0b0;
  --accent-color: #ff9900;
  --green-color: #00b050;
  --red-color: #e53935;
  --blue-tag: #00b0ff;
  --blue-chart: #4a90e2;
  --font-stack: Arial, sans-serif;
  --base-font-size: 14px;
}

/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: var(--font-stack);
}

/* Dashboard Layout */
.dashboard-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  background-color: var(--dark-bg);
  color: var(--text-color-light);
  font-size: var(--base-font-size);
}

/* Sidebar Styles */
.sidebar {
  background-color: var(--card-bg);
  padding: 20px;
  overflow-y: auto;
}

.branding {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sidebar-active);
}

.team-logo {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.team-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
}

.menu h2 {
  font-size: 12px;
  color: var(--text-color-faded);
  margin: 25px 0 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu ul {
  list-style: none;
  margin-bottom: 20px;
}

.menu li {
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
}

.menu li:hover {
  background-color: var(--sidebar-active);
}

.menu li.active {
  background-color: var(--sidebar-active);
  color: var(--accent-color);
}

.menu li i {
  margin-right: 12px;
  width: 16px;
  text-align: center;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}

.indicator.red {
  background-color: var(--red-color);
}

.tag {
  background-color: var(--blue-tag);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  margin-left: auto;
}

/* Main Content */
.main-content {
  padding: 20px 30px;
  overflow-y: auto;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 30px;
}

.header h1 {
  font-size: 24px;
  font-weight: 400;
}

.search-bar {
  background-color: var(--card-bg);
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  width: 300px;
  margin-left: auto;
}

.search-bar input {
  background: none;
  border: none;
  color: var(--text-color-light);
  outline: none;
  width: 100%;
  padding-right: 10px;
}

.search-bar i {
  color: var(--text-color-faded);
}

.search-bar:hover {
  border: #a0a0b0 1px solid;
}

.user-actions {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.user-actions i {
  font-size: 20px;
  margin-left: 15px;
  cursor: pointer;
  color: var(--text-color-faded);
  transition: all 0.3s ease;
}

.user-avatar {
  font-size: 30px !important;
  color: var(--green-color) !important;
  margin-left: 2%;
}

.user-avatar:hover {
  /* box-shadow: 0 0 0 4px white;
  border-radius: 50%; */
  cursor: pointer;
}

/* Alert Messages */
.alert-container {
  margin-bottom: 20px;
}

.alert {
  padding: 15px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-success {
  background-color: rgba(0, 176, 80, 0.1);
  border: 1px solid var(--green-color);
  color: var(--green-color);
}

.alert-error {
  background-color: rgba(229, 57, 53, 0.1);
  border: 1px solid var(--red-color);
  color: var(--red-color);
}

.alert-close {
  font-size: 18px;
  cursor: pointer;
}

/* Market Insights Grid */
.top-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.insight-card {
  background-color: var(--card-bg);
  padding: 20px;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.insight-card.green-change {
  border-left: 4px solid var(--green-color);
}

.insight-card.red-change {
  border-left: 4px solid var(--red-color);
}

.insight-card .title {
  font-size: 14px;
  color: var(--text-color-faded);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-card .value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.change-percent {
  font-size: 12px;
  font-weight: bold;
}

.green-change .change-percent {
  color: var(--green-color);
}

.red-change .change-percent {
  color: var(--red-color);
}

.mini-chart {
  height: 30px;
  width: 100%;
}

/* Widgets Grid */
.widgets-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.widget {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.widget-header h2 {
  font-size: 18px;
  font-weight: 500;
}

/* Chart Widget */
.main-chart-widget .tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  padding: 8px 16px;
  background-color: var(--dark-bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab.active {
  background-color: var(--accent-color);
  color: white;
}

.chart-area-container {
  height: 300px;
  margin-bottom: 15px;
}

.chart-footer {
  display: flex;
  justify-content: space-around;
  color: var(--text-color-faded);
  font-size: 12px;
}

/* Account Summary Widget */
.account-info {
  margin-bottom: 15px;
}

.account-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-light);
}

.balance-title {
  font-size: 12px;
  color: var(--text-color-faded);
  text-transform: uppercase;
  margin-bottom: 5px;
}

.balance-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--green-color);
  margin-bottom: 20px;
}

.key-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric p:first-child {
  font-size: 12px;
  color: var(--text-color-faded);
  text-transform: uppercase;
}

.metric .value {
  font-weight: 500;
  color: var(--text-color-light);
}

/* Trading Section */
.trading-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.trading-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 500;
}

.order-side-toggle {
  display: flex;
  gap: 5px;
}

.side-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--dark-bg);
  color: var(--text-color-light);
}

.side-btn.active {
  background-color: var(--green-color);
  color: white;
}

.side-btn:nth-child(2).active {
  background-color: var(--red-color);
}

/* Form Styles */
.order-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  font-size: 12px;
  color: var(--text-color-faded);
  text-transform: uppercase;
}

.form-input, .form-select {
  padding: 10px;
  border: 1px solid var(--sidebar-active);
  border-radius: 6px;
  background-color: var(--dark-bg);
  color: var(--text-color-light);
  outline: none;
}

.form-input:focus, .form-select:focus {
  border-color: var(--accent-color);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn.buy {
  background-color: var(--green-color);
  color: white;
}

.submit-btn.sell {
  background-color: var(--red-color);
  color: white;
}

.submit-btn:hover {
  opacity: 0.8;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Balance Actions */
.balance-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.balance-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.deposit-btn {
  background-color: var (--green-color);
  color: white;
}

.withdraw-btn {
  background-color: var(--red-color);
  color: white;
}

.action-btn:hover {
  opacity: 0.8;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Data Section */
.data-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.portfolio-section {
  margin-bottom: 30px;
}

.data-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.data-card h3 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
}

/* Order Book */
.order-book {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 14px;
  color: var(--text-color-faded);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.order-book-table, .orders-table, .portfolio-table {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--sidebar-active);
  font-size: 12px;
  color: var(--text-color-faded);
  text-transform: uppercase;
}

.orders-table .table-header {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
}

.portfolio-table .table-header {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(58, 59, 80, 0.3);
  font-size: 14px;
}

.orders-table .table-row {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
}

.portfolio-table .table-row {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
}

.ask-row .price {
  color: var(--red-color);
}

.bid-row .price {
  color: var(--green-color);
}

.side.buy {
  color: var(--green-color);
}

.side.sell {
  color: var(--red-color);
}

.empty-message {
  text-align: center;
  color: var(--text-color-faded);
  padding: 20px;
  font-style: italic;
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .trading-section {
    grid-template-columns: 1fr;
  }

  .data-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .top-insights-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
