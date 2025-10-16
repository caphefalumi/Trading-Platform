<template>
  <div class="trade-view">
    <h1>Place Order</h1>
    <v-form @submit.prevent="handleSubmit">
      <v-select v-model="form.instrumentId" :items="instrumentOptions" label="Instrument" required />
      <v-select v-model="form.sideId" :items="sideOptions" label="Side" required />
      <v-select v-model="form.typeId" :items="typeOptions" label="Order Type" required />
      <v-text-field v-model="form.price" label="Price" type="number" required />
      <v-text-field v-model="form.quantity" label="Quantity" type="number" required />
      <v-select v-model="form.timeInForceId" :items="tifOptions" label="Time In Force" />
      <v-text-field v-model="form.clientOrderId" label="Client Order ID" />
      <v-btn type="submit" color="primary" :loading="loading">Submit Order</v-btn>
    </v-form>
    <v-alert v-if="feedback" :type="feedback.type" class="mt-4">{{ feedback.message }}</v-alert>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { submitOrder } from '../utils/engine'
import { sessionState } from '../stores/session'
import apiClient from '../utils/api'

const form = ref({
  instrumentId: '',
  sideId: 1,
  typeId: 2,
  price: '',
  quantity: '',
  timeInForceId: 3,
  clientOrderId: '',
})
const instrumentOptions = ref([])
const sideOptions = [
  { value: 1, title: 'Buy' },
  { value: 2, title: 'Sell' }
]
const typeOptions = [
  { value: 2, title: 'Limit' }
]
const tifOptions = [
  { value: 3, title: 'GTC' }
]
const loading = ref(false)
const feedback = ref(null)

onMounted(async () => {
  try {
    const res = await apiClient.get('/instruments')
    instrumentOptions.value = res.data.map(instr => ({ value: instr.id, title: `${instr.symbol} - ${instr.name}` }))
  } catch (err) {
    instrumentOptions.value = []
  }
})

const handleSubmit = async () => {
  loading.value = true
  feedback.value = null
  try {
    const orderData = {
      ...form.value,
      accountId: sessionState.account?.id,
      statusId: 1
    }
    const result = await submitOrder(orderData)
    feedback.value = { type: 'success', message: 'Order submitted successfully!' }
  } catch (err) {
    feedback.value = { type: 'error', message: err.error || 'Order failed.' }
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.trade-view {
  max-width: 500px;
  margin: 40px auto;
  padding: 32px;
  background: var(--card-bg);
  border-radius: 16px;
}
</style>
