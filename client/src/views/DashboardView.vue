<template>
  <v-container class="py-8" max-width="1400">
    <v-row v-if="feedback.error || feedback.success" class="mb-4">
      <v-col cols="12">
        <v-alert
          :type="feedback.error ? 'error' : 'success'"
          variant="tonal"
          dismissible
          @click:close="feedback.error = feedback.success = ''"
        >
          {{ feedback.error || feedback.success }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row class="mb-6" align="stretch">
      <v-col cols="12" md="4">
        <v-card color="surface" elevation="6">
          <v-card-title class="text-h6">Account Summary</v-card-title>
          <v-card-text>
            <div v-if="account" class="mb-4">
              <div class="text-caption text-uppercase text-medium-emphasis">Account Name</div>
              <div class="text-body-1 font-weight-medium">{{ account.accountName }}</div>
            </div>
            <div v-if="accountSummary" class="mt-4">
              <div class="text-caption text-uppercase text-medium-emphasis">Available Balance</div>
              <div class="text-h5 font-weight-bold">
                {{ formatNumber(accountSummary.account.balance.available, 2) }}
                {{ accountCurrency }}
              </div>
              <div class="text-caption text-uppercase text-medium-emphasis mt-4">
                Portfolio Value
              </div>
              <div class="text-h6 font-weight-medium">
                {{ formatNumber(accountSummary.totals.portfolioValue, 2) }} {{ accountCurrency }}
              </div>
              <div class="text-caption text-uppercase text-medium-emphasis mt-4">Equity</div>
              <div class="text-h6 font-weight-medium">
                {{ formatNumber(accountSummary.totals.equity, 2) }} {{ accountCurrency }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card color="surface" elevation="6" class="h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">Instruments</span>
            <v-select
              v-model="selectedInstrumentId"
              :items="instruments"
              item-title="symbol"
              item-value="id"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 180px"
            />
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-table density="compact" class="text-body-2">
              <thead>
                <tr>
                  <th class="text-left">Symbol</th>
                  <th class="text-left">Name</th>
                  <th class="text-right">Lot Size</th>
                  <th class="text-right">Tick Size</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="instrument in instruments" :key="instrument.id">
                  <td>{{ instrument.symbol }}</td>
                  <td>{{ instrument.name }}</td>
                  <td class="text-right">{{ formatNumber(instrument.lotSize, 4) }}</td>
                  <td class="text-right">{{ formatNumber(instrument.tickSize, 4) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6" align="stretch">
      <v-col cols="12" md="4">
        <v-card color="surface" elevation="6" class="mb-6">
          <v-card-title class="text-h6">Deposit</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitDeposit">
              <v-text-field
                v-model="depositAmount"
                :suffix="accountCurrency"
                type="number"
                label="Amount"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                min="0"
                step="0.01"
              />
              <v-btn :loading="loading.deposit" color="primary" type="submit" block>Deposit</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card color="surface" elevation="6">
          <v-card-title class="text-h6">Withdraw</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitWithdraw">
              <v-text-field
                v-model="withdrawAmount"
                :suffix="accountCurrency"
                type="number"
                label="Amount"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                min="0"
                step="0.01"
              />
              <v-btn :loading="loading.withdraw" color="primary" type="submit" block
                >Withdraw</v-btn
              >
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card color="surface" elevation="6">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">Order Entry</span>
            <v-btn-toggle v-model="orderForm.side" rounded="xl" divided>
              <v-btn value="BUY" color="success">Buy</v-btn>
              <v-btn value="SELL" color="error">Sell</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-form @submit.prevent="placeOrder">
              <v-select
                v-model="orderForm.type"
                :items="['MARKET', 'LIMIT']"
                label="Order Type"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="orderForm.quantity"
                label="Quantity"
                type="number"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                min="0"
                step="0.0001"
              />
              <v-text-field
                v-model="orderForm.price"
                :disabled="orderForm.type === 'MARKET'"
                label="Price"
                type="number"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                min="0"
                step="0.01"
              />
              <v-select
                v-model="orderForm.timeInForce"
                :items="['GTC', 'IOC', 'FOK']"
                label="Time in Force"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-btn
                :color="orderButtonColor"
                :loading="loading.order"
                class="mt-4"
                size="large"
                block
                type="submit"
              >
                {{ orderButtonLabel }} {{ selectedInstrument?.symbol || '' }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6" align="stretch">
      <v-col cols="12" md="6">
        <v-card color="surface" elevation="6" class="h-100">
          <v-card-title class="text-h6">Order Book</v-card-title>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">Asks</div>
            <v-table density="compact" class="mb-4">
              <thead>
                <tr>
                  <th class="text-left">Price</th>
                  <th class="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ask in orderBook.asks" :key="ask.id">
                  <td class="text-down">{{ formatNumber(ask.price, 2) }}</td>
                  <td class="text-right">{{ formatNumber(ask.quantity, 4) }}</td>
                </tr>
                <tr v-if="!orderBook.asks.length">
                  <td colspan="2" class="text-center text-medium-emphasis py-4">
                    No asks available
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="text-caption text-medium-emphasis mb-2">Bids</div>
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Price</th>
                  <th class="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bid in orderBook.bids" :key="bid.id">
                  <td class="text-up">{{ formatNumber(bid.price, 2) }}</td>
                  <td class="text-right">{{ formatNumber(bid.quantity, 4) }}</td>
                </tr>
                <tr v-if="!orderBook.bids.length">
                  <td colspan="2" class="text-center text-medium-emphasis py-4">
                    No bids available
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card color="surface" elevation="6" class="h-100">
          <v-card-title class="text-h6">Orders</v-card-title>
          <v-card-text>
            <v-table density="compact" class="text-body-2">
              <thead>
                <tr>
                  <th class="text-left">Instrument</th>
                  <th class="text-left">Side</th>
                  <th class="text-left">Type</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Filled</th>
                  <th class="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td>{{ order.instrument?.symbol }}</td>
                  <td :class="order.side.code === 'BUY' ? 'text-up' : 'text-down'">
                    {{ order.side.code }}
                  </td>
                  <td>{{ order.type.code }}</td>
                  <td class="text-right">{{ order.price ? formatNumber(order.price, 2) : '-' }}</td>
                  <td class="text-right">{{ formatNumber(order.quantity, 4) }}</td>
                  <td class="text-right">{{ formatNumber(order.filledQuantity, 4) }}</td>
                  <td class="text-right">{{ order.status.code }}</td>
                </tr>
                <tr v-if="!orders.length">
                  <td colspan="7" class="text-center text-medium-emphasis py-4">No orders yet</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card color="surface" elevation="6">
          <v-card-title class="text-h6">Portfolio</v-card-title>
          <v-card-text>
            <v-table density="compact" class="text-body-2">
              <thead>
                <tr>
                  <th class="text-left">Symbol</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Average Price</th>
                  <th class="text-right">Mark Price</th>
                  <th class="text-right">Market Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="holding in accountSummary?.portfolio ?? []" :key="holding.instrumentId">
                  <td>{{ holding.symbol }}</td>
                  <td class="text-right">{{ formatNumber(holding.quantity, 4) }}</td>
                  <td class="text-right">{{ formatNumber(holding.averagePrice, 2) }}</td>
                  <td class="text-right">{{ formatNumber(holding.markPrice, 2) }}</td>
                  <td class="text-right">{{ formatNumber(holding.marketValue, 2) }}</td>
                </tr>
                <tr v-if="!accountSummary?.portfolio?.length">
                  <td colspan="5" class="text-center text-medium-emphasis py-4">No positions</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
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
})
</script>
