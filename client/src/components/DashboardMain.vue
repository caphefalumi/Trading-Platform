<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <nav class="menu">
        <h2>MENU</h2>
        <ul>
          <li class="active" data-page="dashboard"><span class="mdi mdi-view-dashboard"></span> Dashboard</li>
          <li><span class="mdi mdi-currency-usd"></span> Trade</li>
          <li><span class="mdi mdi-chart-line"></span> Market update</li>
          <li><span class="mdi mdi-calculator"></span> Income estimator</li>
          <li><span class="mdi mdi-chart-bar"></span> Interactive chart</li>
          <li><span class="mdi mdi-hand-coin"></span> Mutual funds</li>
          <li><span class="mdi mdi-robot"></span> Vocer</li>
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

    <main class="dashboard-main-wrapper">
      <!-- Dashboard Header -->
      <header class="header">
        <h1>Dashboard</h1>
        <div class="search-bar">
          <input type="text" placeholder="Search..." />
          <span class="mdi mdi-magnify"></span>
        </div>
        <div class="user-actions">
          <span class="mdi mdi-bell-outline"></span>
          <span class="mdi mdi-account-circle user-avatar"></span>
        </div>
      </header>

      <!-- Chart Section -->
      <section class="widgets-grid">
        <div class="widget main-chart-widget">
          <div class="tabs">
            <span v-for="tab in chartTabs" :key="tab"
                  :class="['tab', { active: selectedChartTab === tab }]"
                  @click="selectChartTab(tab)">
              {{ tab }}
            </span>
          </div>
          <div class="chart-area-container">
            <canvas ref="mainChart"></canvas>
          </div>
          <div class="chart-footer">
            <p>Total trade</p><p>Total volume</p><p>Total value</p>
          </div>
        </div>

        <div class="widget">
          <h2>Market Overview</h2>
          <div class="top-insights-grid">
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
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'

// Biểu đồ chính
const mainChart = ref(null)
let tradingChart = null
const chartTabs = ['BTC', 'ETH', 'GOLD']
const selectedChartTab = ref('BTC')

// API setup
const API_KEY = import.meta.env.VITE_CMC_API_KEY
const BASE_URL = import.meta.env.VITE_CMC_BASE_URL || 'https://pro-api.coinmarketcap.com'

// Market data
const marketInsights = ref([
  { symbol: 'BTC', price: 0, changePercent: 0 },
  { symbol: 'ETH', price: 0, changePercent: 0 },
  { symbol: 'GOLD', price: 0, changePercent: 0 },
])

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

// Fetch giá thật từ CoinMarketCap
const fetchRealPrice = async (symbol) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/v1/cryptocurrency/quotes/latest`, {
      params: { symbol, convert: 'USD' },
      headers: { 'X-CMC_PRO_API_KEY': API_KEY },
    })
    return data.data[symbol].quote.USD.price
  } catch (err) {
    console.error(`Failed to fetch ${symbol}:`, err.message)
    return null
  }
}

// Cập nhật dữ liệu biểu đồ chính
const loadChart = async (symbol) => {
  await nextTick()
  if (!mainChart.value) return

  if (tradingChart) tradingChart.destroy()

  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  const price = await fetchRealPrice(symbol)
  if (!price) return

  const chartData = Array.from({ length: 7 }, () => {
    const change = (Math.random() - 0.5) * 0.03
    return +(price * (1 + change)).toFixed(2)
  })
  const chartColor =
    symbol === 'BTC' ? '#00b050' :
    symbol === 'ETH' ? '#4a90e2' :
    '#ff9900'

  const ctx = mainChart.value.getContext('2d')
  tradingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
      datasets: [{
        label: `${symbol} Price`,
        data: chartData,
        backgroundColor: chartColor,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#FFF' } },
        y: { grid: { color: '#333' }, ticks: { color: '#FFF' } },
      },
    },
  })
}

const selectChartTab = (tab) => {
  selectedChartTab.value = tab
  loadChart(tab)
}

// Mini chart ngẫu nhiên
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
    const existing = Chart.getChart(canvas)
    if (existing) existing.destroy()
  }

  const data = Array.from({ length: 15 }, () => 100 + Math.random() * 10)
  const chartColor = isPositive ? '#00b050' : '#e53935'

  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: Array(15).fill(''),
      datasets: [{
        data,
        borderColor: chartColor,
        borderWidth: 2,
        tension: 0.6,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: { point: { radius: 0 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  })
}

// Cập nhật liên tục Market Data + Mini chart
const updateMarketData = async () => {
  for (const item of marketInsights.value) {
    const newPrice = await fetchRealPrice(item.symbol)
    if (newPrice) {
      const changePercent = ((newPrice - item.price) / (item.price || newPrice)) * 100
      item.price = newPrice
      item.changePercent = isNaN(changePercent) ? 0 : changePercent
    }
  }

  nextTick(() => {
    marketInsights.value.forEach((insight) => {
      const el = document.querySelector(`[data-symbol="${insight.symbol}"] .mini-chart`)
      if (el) drawMiniChart(el, insight.changePercent >= 0)
    })
  })
}

onMounted(async () => {
  await loadChart(selectedChartTab.value)
  await updateMarketData()

  // ⏱ Cập nhật mỗi 1.5 giây
  setInterval(() => {
    loadChart(selectedChartTab.value)
    updateMarketData()
  }, 1500)
})
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

.search-bar:focus-within {
  border: #a0a0b0 1px solid;
}

.search-bar:hover {
  border: #a0a0b0 1px solid;
}

.search-bar i {
  color: var(--text-color-faded);
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
  color: var (--green-color);
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
