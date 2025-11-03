<template>
  <div class="portfolio-view">
    <h1>Portfolio</h1>

    <!-- Account Summary Card -->
    <div class="summary-card card">
      <div class="summary-header">
        <h2>Account Summary</h2>
        <button @click="loadData" class="btn-refresh" :disabled="loading">
          <span class="mdi mdi-refresh" :class="{ rotating: loading }"></span>
          Refresh
        </button>
      </div>

      <div v-if="loading && !portfolioSummary" class="loading">Loading...</div>
      <div v-else-if="portfolioSummary" class="summary-grid">
        <div class="summary-item highlight">
          <div class="label">Total Account Value</div>
          <div class="value">{{ formatCurrency(totalAccountValue) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Cash Available</div>
          <div class="value">{{ formatCurrency(portfolioSummary.cashAvailable) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Portfolio Value</div>
          <div class="value">{{ formatCurrency(portfolioSummary.portfolioValue || 0) }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Cash Reserved</div>
          <div class="value">{{ formatCurrency(portfolioSummary.cashReserved || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- Currency Holdings Card -->
    <div class="holdings-card card">
      <h2>
        <span class="mdi mdi-wallet"></span>
        Currency Holdings
      </h2>

      <div v-if="loadingBalances" class="loading">Loading balances...</div>
      <div v-else-if="balances.length === 0" class="empty-state">
        <span class="mdi mdi-alert-circle-outline"></span>
        <p>No currency holdings</p>
        <p class="subtext">Add funds to start trading</p>
      </div>
      <table v-else class="portfolio-table">
        <thead>
          <tr>
            <th>Currency</th>
            <th>Available</th>
            <th>Reserved</th>
            <th>Total</th>
            <th>USD Value</th>
            <th>% of Portfolio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="balance in balances" :key="balance.currency">
            <td class="currency-cell">
              <span v-if="balance.currency === 'BTC'" class="mdi mdi-bitcoin icon btc"></span>
              <span v-else-if="balance.currency === 'ETH'" class="mdi mdi-ethereum icon eth"></span>
              <span v-else class="mdi mdi-currency-usd icon usd"></span>
              <span class="currency-name">{{ getCurrencyName(balance.currency) }}</span>
              <span class="currency-code">{{ balance.currency }}</span>
            </td>
            <td>{{ formatNumber(balance.available, 8) }}</td>
            <td>{{ formatNumber(balance.reserved, 8) }}</td>
            <td class="font-bold">{{ formatNumber(balance.total, 8) }}</td>
            <td class="usd-value">{{ formatCurrency(getUSDValue(balance.currency, balance.total)) }}</td>
            <td>
              <div class="percentage-bar">
                <div class="bar" :style="{ width: getPercentage(balance) + '%' }"></div>
                <span class="percentage-text">{{ getPercentage(balance).toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Trading Positions Card -->
    <div class="positions-card card">
      <h2>
        <span class="mdi mdi-chart-line"></span>
        Trading Positions
      </h2>

      <div v-if="loadingPositions" class="loading">Loading positions...</div>
      <div v-else-if="portfolio.length === 0" class="empty-state">
        <span class="mdi mdi-chart-box-outline"></span>
        <p>No open positions</p>
        <p class="subtext">Place trades to build your portfolio</p>
      </div>
      <table v-else class="portfolio-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Avg Price</th>
            <th>Current Price</th>
            <th>Market Value</th>
            <th>P&L</th>
            <th>P&L %</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="position in portfolio" :key="position.instrumentId">
            <td class="symbol-cell">
              <span class="symbol">{{ position.symbol }}</span>
              <span class="name">{{ position.name }}</span>
            </td>
            <td>{{ formatNumber(position.quantity, 8) }}</td>
            <td>{{ formatCurrency(position.averagePrice) }}</td>
            <td>{{ formatCurrency(position.markPrice) }}</td>
            <td class="font-bold">{{ formatCurrency(position.marketValue) }}</td>
            <td :class="getPnLClass(position)">
              {{ formatCurrency(position.pnl) }}
            </td>
            <td :class="getPnLClass(position)">
              {{ formatPercent(position.pnlPercent) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Performance Chart Placeholder -->
    <div class="chart-card card">
      <h2>
        <span class="mdi mdi-chart-areaspline"></span>
        Portfolio Performance
      </h2>
      <div class="chart-placeholder">
        <span class="mdi mdi-chart-line-variant"></span>
        <p>Performance chart coming soon</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { sessionState } from '../stores/session'
import apiClient from '../utils/api'

const loading = ref(false)
const loadingBalances = ref(false)
const loadingPositions = ref(false)
const balances = ref([])
const portfolio = ref([])
const portfolioSummary = ref(null)
const cryptoPrices = ref({
  BTC: 0,
  ETH: 0,
  USD: 1
})

const totalAccountValue = computed(() => {
  let total = 0
  balances.value.forEach(balance => {
    const usdValue = getUSDValue(balance.currency, balance.total)
    total += usdValue
  })
  return total
})

const formatNumber = (value, decimals = 2) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const formatCurrency = (value) => {
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatPercent = (value) => {
  const num = Number(value)
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%'
}

const getCurrencyName = (code) => {
  const names = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USD: 'US Dollar'
  }
  return names[code] || code
}

const getUSDValue = (currency, amount) => {
  if (currency === 'USD') return parseFloat(amount || 0)
  const price = cryptoPrices.value[currency] || 0
  return price * parseFloat(amount || 0)
}

const getPercentage = (balance) => {
  if (totalAccountValue.value === 0) return 0
  const usdValue = getUSDValue(balance.currency, balance.total)
  return (usdValue / totalAccountValue.value) * 100
}

const getPnLClass = (position) => {
  const pnl = position.pnl || 0
  if (pnl > 0) return 'pnl-positive'
  if (pnl < 0) return 'pnl-negative'
  return ''
}

const loadBalances = async () => {
  if (!sessionState.account?.id) return

  loadingBalances.value = true
  try {
    const response = await apiClient.get(`/api/accounts/${sessionState.account.id}/balance`)
    balances.value = response.data.balances || []

    // Fetch latest crypto prices
    await fetchCryptoPrices()
  } catch (error) {
    console.error('Failed to load balances:', error)
    balances.value = []
  } finally {
    loadingBalances.value = false
  }
}

const fetchCryptoPrices = async () => {
  try {
    const response = await apiClient.get('/api/marketdata/quotes?symbols=BTC,ETH')
    if (response.data.success && response.data.data) {
      const prices = response.data.data
      prices.forEach(priceData => {
        if (priceData.symbol === 'BTC' || priceData.symbol === 'ETH') {
          cryptoPrices.value[priceData.symbol] = parseFloat(priceData.price)
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error)
  }
}

const loadPortfolio = async () => {
  if (!sessionState.account?.id) return

  loadingPositions.value = true
  try {
    const response = await apiClient.get(`/api/accounts/${sessionState.account.id}/summary`)
    portfolio.value = response.data.portfolio || []
    portfolioSummary.value = response.data.totals || null

    // Calculate P&L and P&L% for each position
    portfolio.value = portfolio.value.map(pos => ({
      ...pos,
      pnl: (pos.markPrice - pos.averagePrice) * pos.quantity,
      pnlPercent: ((pos.markPrice - pos.averagePrice) / pos.averagePrice) * 100
    }))
  } catch (error) {
    console.error('Failed to load portfolio:', error)
    portfolio.value = []
  } finally {
    loadingPositions.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadBalances(), loadPortfolio()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.portfolio-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #0f1117;
  min-height: 100vh;
}

h1 {
  margin-bottom: 32px;
  color: #e5e7eb;
  font-weight: 700;
  font-size: 2rem;
}

h2 {
  margin: 0 0 24px 0;
  color: #e5e7eb;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

h2 .mdi {
  font-size: 1.75rem;
  color: #3b82f6;
}

.card {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3142;
}

.summary-card .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.btn-refresh {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  font-weight: 600;
  font-size: 0.9375rem;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.summary-item {
  text-align: center;
  padding: 24px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  border: 1px solid #2d3142;
}

.summary-item.highlight {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%);
  border-color: rgba(16, 185, 129, 0.3);
}

.summary-item .label {
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  font-weight: 600;
}

.summary-item .value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e5e7eb;
}

.summary-item.highlight .value {
  color: #10b981;
  font-size: 2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 48px;
  color: #9ca3af;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state .mdi {
  font-size: 64px;
  color: #3b82f6;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1.125rem;
}

.empty-state .subtext {
  font-size: 0.875rem;
  color: #6b7280;
}

.portfolio-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.portfolio-table th,
.portfolio-table td {
  padding: 16px 12px;
  text-align: left;
}

.portfolio-table thead {
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

.currency-cell, .symbol-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: 28px;
}

.icon.btc {
  color: #f7931a;
}

.icon.eth {
  color: #627eea;
}

.icon.usd {
  color: #26a17b;
}

.currency-name {
  font-weight: 600;
  color: #e5e7eb;
}

.currency-code {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.symbol {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.name {
  font-size: 0.75rem;
  color: #9ca3af;
}

.font-bold {
  font-weight: 700;
}

.usd-value {
  color: #10b981;
  font-weight: 600;
}

.percentage-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.bar {
  height: 8px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.percentage-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
  min-width: 45px;
}

.pnl-positive {
  color: #10b981;
  font-weight: 700;
}

.pnl-negative {
  color: #ef4444;
  font-weight: 700;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: #6b7280;
}

.chart-placeholder .mdi {
  font-size: 96px;
  color: #3b82f6;
  opacity: 0.3;
  margin-bottom: 16px;
}

.chart-placeholder p {
  font-size: 1.125rem;
}
</style>
