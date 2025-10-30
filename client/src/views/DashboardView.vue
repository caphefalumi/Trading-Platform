<template>
  <div class="dashboard-view">
    <h1>Dashboard</h1>

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
import { ref, onMounted, computed } from 'vue'
import { sessionState } from '../stores/session'
import apiClient from '../utils/api'

const loading = ref(false)
const loadingPortfolio = ref(false)
const balances = ref([])
const portfolio = ref([])
const portfolioSummary = ref(null)

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

const formatNumber = (value) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })
}

const formatCurrency = (value) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
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

onMounted(() => {
  loadBalance()
  loadPortfolio()
})
</script>

<style scoped>
.dashboard-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 24px;
  color: var(--text-primary, #fff);
}

.card {
  background: var(--card-bg, #1a1a2e);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-primary, #fff);
  font-size: 1.5rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary, #aaa);
}

.balances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.balance-item {
  background: var(--bg-secondary, #16213e);
  padding: 16px;
  border-radius: 8px;
}

.currency-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #aaa);
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 8px;
}

.balance-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary, #999);
}

.balance-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-demo {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #f44336;
  color: white;
}

.btn-secondary:hover {
  background: #da190b;
}

.btn-demo {
  background: #2196F3;
  color: white;
}

.btn-demo:hover {
  background: #0b7dda;
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.portfolio-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.portfolio-table th,
.portfolio-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #333);
}

.portfolio-table th {
  color: var(--text-secondary, #aaa);
  font-weight: 500;
  font-size: 0.875rem;
}

.portfolio-table td {
  color: var(--text-primary, #fff);
}

.portfolio-table .symbol {
  font-weight: 600;
  color: #2196F3;
}

.pnl-positive {
  color: #4CAF50;
}

.pnl-negative {
  color: #f44336;
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
  color: var(--text-secondary, #aaa);
}

.summary-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg, #1a1a2e);
  padding: 32px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 24px;
  color: var(--text-primary, #fff);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary, #fff);
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color, #333);
  border-radius: 6px;
  background: var(--bg-secondary, #16213e);
  color: var(--text-primary, #fff);
  font-size: 1rem;
}

.feedback {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.feedback.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.feedback.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
