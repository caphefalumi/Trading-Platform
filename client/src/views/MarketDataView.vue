<template>
  <div class="market-data-view">
    <h1>Market Data</h1>
    <v-table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Name</th>
          <th>Price</th>
          <th>Change</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in marketData" :key="item.symbol">
          <td>Here</td>
          <td>{{ item.symbol }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.price }}</td>
          <td :class="item.change >= 0 ? 'green' : 'red'">{{ item.change }}</td>
          <td>{{ item.volume }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getCryptoPrices } from '../utils/crypto'

const marketData = ref([])

onMounted(async () => {
  try {
    const data = await getCryptoPrices(['BTC','ETH'])
    marketData.value = data
  } catch (err) {
    marketData.value = []
  }
})
</script>
<style scoped>
.market-data-view {
  padding: 32px;
}
.green { color: #2ecc40; }
.red { color: #e74c3c; }
</style>
