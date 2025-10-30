<template>
  <div class="order-history-view">
    <h1>Order History</h1>

    <!-- Filters -->
    <div class="filters card">
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filters.status" @change="loadOrders">
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="PARTIALLY_FILLED">Partially Filled</option>
          <option value="FILLED">Filled</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Instrument</label>
        <select v-model="filters.instrumentId" @change="loadOrders">
          <option value="">All</option>
          <option v-for="inst in instruments" :key="inst.id" :value="inst.id">
            {{ inst.symbol }}
          </option>
        </select>
      </div>

      <button @click="loadOrders" class="btn-refresh">
        <span class="icon">↻</span> Refresh
      </button>
    </div>

    <!-- Orders Table -->
    <div class="orders-section card">
      <div v-if="loading" class="loading">Loading orders...</div>
      <div v-else-if="orders.length === 0" class="empty-state">
        <p>No orders found</p>
      </div>
      <table v-else class="orders-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Type</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Filled</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" :class="getOrderRowClass(order)">
            <td class="time">{{ formatTime(order.createdAt) }}</td>
            <td class="symbol">{{ order.symbol }}</td>
            <td :class="['side', order.side.toLowerCase()]">
              {{ order.side }}
            </td>
            <td>{{ order.type }}</td>
            <td class="price">{{ formatPrice(order.price) }}</td>
            <td>{{ formatQuantity(order.quantity) }}</td>
            <td>
              <span :class="getFilledClass(order)">
                {{ formatQuantity(order.filledQuantity) }} / {{ formatQuantity(order.quantity) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(order.status)]">
                {{ order.status }}
              </span>
            </td>
            <td class="actions">
              <button 
                v-if="canCancel(order)" 
                @click="cancelOrder(order)"
                class="btn-cancel"
                :disabled="cancelling[order.id]"
              >
                {{ cancelling[order.id] ? 'Cancelling...' : 'Cancel' }}
              </button>
              <button 
                v-if="order.executions && order.executions.length > 0"
                @click="toggleExecutions(order.id)"
                class="btn-details"
              >
                {{ expandedOrders[order.id] ? 'Hide' : 'Show' }} Fills
              </button>
            </td>
          </tr>
          <!-- Execution Details Row -->
          <tr v-if="expandedOrders[order.id]" v-for="order in orders" :key="`${order.id}-executions`" class="executions-row">
            <td colspan="9">
              <div class="executions-detail">
                <h4>Executions ({{ order.executions.length }})</h4>
                <table class="executions-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="exec in order.executions" :key="exec.id">
                      <td>{{ formatTime(exec.executedAt) }}</td>
                      <td>{{ formatPrice(exec.price) }}</td>
                      <td>{{ formatQuantity(exec.quantity) }}</td>
                      <td>{{ formatPrice(exec.price * exec.quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Feedback Modal -->
    <div v-if="feedback" class="feedback-toast" :class="feedback.type">
      {{ feedback.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { sessionState } from '../stores/session'
import apiClient from '../utils/api'

const loading = ref(false)
const orders = ref([])
const instruments = ref([])
const expandedOrders = reactive({})
const cancelling = reactive({})
const feedback = ref(null)

const filters = reactive({
  status: '',
  instrumentId: '',
})

const formatTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatPrice = (price) => {
  if (!price) return 'Market'
  return Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })
}

const formatQuantity = (qty) => {
  return Number(qty).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })
}

const getOrderRowClass = (order) => {
  return {
    'order-cancelled': order.status === 'CANCELLED',
    'order-filled': order.status === 'FILLED',
  }
}

const getStatusClass = (status) => {
  const map = {
    'OPEN': 'status-open',
    'PARTIALLY_FILLED': 'status-partial',
    'FILLED': 'status-filled',
    'CANCELLED': 'status-cancelled',
  }
  return map[status] || ''
}

const getFilledClass = (order) => {
  if (order.filledQuantity === 0) return ''
  if (order.filledQuantity >= order.quantity) return 'filled-complete'
  return 'filled-partial'
}

const canCancel = (order) => {
  return order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED'
}

const toggleExecutions = (orderId) => {
  expandedOrders[orderId] = !expandedOrders[orderId]
}

const loadInstruments = async () => {
  try {
    const response = await apiClient.get('/instruments')
    instruments.value = response.data
  } catch (error) {
    console.error('Failed to load instruments:', error)
  }
}

const loadOrders = async () => {
  if (!sessionState.account?.id) return

  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.instrumentId) params.instrumentId = filters.instrumentId

    const response = await apiClient.get(
      `/orders/account/${sessionState.account.id}`,
      { params }
    )
    orders.value = response.data
  } catch (error) {
    console.error('Failed to load orders:', error)
    showFeedback('Failed to load orders', 'error')
  } finally {
    loading.value = false
  }
}

const cancelOrder = async (order) => {
  if (!confirm(`Cancel order for ${order.quantity} ${order.symbol}?`)) {
    return
  }

  cancelling[order.id] = true
  try {
    await apiClient.delete(`/orders/${order.id}`, {
      data: { accountId: sessionState.account.id }
    })
    showFeedback('Order cancelled successfully', 'success')
    await loadOrders()
  } catch (error) {
    console.error('Failed to cancel order:', error)
    showFeedback(
      error.response?.data?.error || 'Failed to cancel order',
      'error'
    )
  } finally {
    cancelling[order.id] = false
  }
}

const showFeedback = (message, type) => {
  feedback.value = { message, type }
  setTimeout(() => {
    feedback.value = null
  }, 3000)
}

onMounted(() => {
  loadInstruments()
  loadOrders()
})
</script>

<style scoped>
.order-history-view {
  padding: 24px;
  max-width: 1400px;
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

.filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.875rem;
  color: var(--text-secondary, #aaa);
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #333);
  border-radius: 6px;
  background: var(--bg-secondary, #16213e);
  color: var(--text-primary, #fff);
  min-width: 150px;
}

.btn-refresh {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #2196F3;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.btn-refresh:hover {
  background: #0b7dda;
}

.icon {
  font-size: 1.2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary, #aaa);
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #333);
}

.orders-table th {
  color: var(--text-secondary, #aaa);
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.orders-table td {
  color: var(--text-primary, #fff);
}

.time {
  font-size: 0.875rem;
  color: var(--text-secondary, #aaa);
}

.symbol {
  font-weight: 600;
  color: #2196F3;
}

.side {
  font-weight: 600;
  text-transform: uppercase;
}

.side.buy {
  color: #4CAF50;
}

.side.sell {
  color: #f44336;
}

.price {
  font-family: 'Courier New', monospace;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-open {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
}

.status-partial {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
}

.status-filled {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.status-cancelled {
  background: rgba(158, 158, 158, 0.2);
  color: #9E9E9E;
}

.filled-partial {
  color: #FFC107;
}

.filled-complete {
  color: #4CAF50;
}

.order-cancelled {
  opacity: 0.6;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-cancel, .btn-details {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f44336;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #da190b;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-details {
  background: transparent;
  border: 1px solid var(--border-color, #333);
  color: var(--text-primary, #fff);
}

.btn-details:hover {
  background: var(--bg-secondary, #16213e);
}

.executions-row {
  background: var(--bg-secondary, #16213e);
}

.executions-detail {
  padding: 16px;
}

.executions-detail h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary, #fff);
}

.executions-table {
  width: 100%;
  font-size: 0.875rem;
}

.executions-table th {
  color: var(--text-secondary, #aaa);
  padding: 8px;
}

.executions-table td {
  padding: 8px;
  color: var(--text-primary, #fff);
}

.feedback-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.feedback-toast.success {
  background: #4CAF50;
  color: white;
}

.feedback-toast.error {
  background: #f44336;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
