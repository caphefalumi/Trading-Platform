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
    const response = await apiClient.get('/api/instruments')
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
      `/api/orders/account/${sessionState.account.id}`,
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
    await apiClient.delete(`/api/orders/${order.id}`, {
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
  background: #0f1117;
  min-height: 100vh;
}

h1 {
  margin-bottom: 24px;
  color: #e5e7eb;
  font-weight: 700;
}

.card {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d3142;
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
  color: #9ca3af;
  font-weight: 600;
}

.filter-group select {
  padding: 8px 12px;
  border: 2px solid #2d3142;
  border-radius: 6px;
  background: rgba(15, 17, 23, 0.6);
  color: #e5e7eb;
  min-width: 150px;
  transition: all 0.2s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(15, 17, 23, 0.8);
}

.btn-refresh {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.btn-refresh:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.icon {
  font-size: 1.2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 48px;
  color: #9ca3af;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #2d3142;
}

.orders-table thead {
  background: rgba(59, 130, 246, 0.1);
}

.orders-table th {
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orders-table td {
  color: #e5e7eb;
}

.orders-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.time {
  font-size: 0.875rem;
  color: #9ca3af;
}

.symbol {
  font-weight: 600;
  color: #3b82f6;
}

.side {
  font-weight: 600;
  text-transform: uppercase;
}

.side.buy {
  color: #10b981;
}

.side.sell {
  color: #ef4444;
}

.price {
  font-family: 'Courier New', monospace;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-open {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-partial {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-filled {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-cancelled {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.filled-partial {
  color: #fbbf24;
}

.filled-complete {
  color: #10b981;
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
  font-weight: 600;
}

.btn-cancel {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-cancel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-details {
  background: transparent;
  border: 1px solid #2d3142;
  color: #e5e7eb;
}

.btn-details:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.executions-row {
  background: rgba(15, 17, 23, 0.6);
}

.executions-detail {
  padding: 16px;
}

.executions-detail h4 {
  margin: 0 0 12px 0;
  color: #e5e7eb;
}

.executions-table {
  width: 100%;
  font-size: 0.875rem;
  border-collapse: collapse;
}

.executions-table th {
  color: #9ca3af;
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #2d3142;
}

.executions-table td {
  padding: 8px;
  color: #e5e7eb;
  border-bottom: 1px solid #2d3142;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback-toast.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
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
