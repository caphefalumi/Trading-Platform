<template>
  <main class="main-content">
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

    <div v-if="feedback.error || feedback.success" class="alert-container">
      <div
        :class="['alert', feedback.error ? 'alert-error' : 'alert-success']"
        @click="feedback.error = feedback.success = ''"
      >
        {{ feedback.error || feedback.success }}
        <span class="alert-close">&times;</span>
      </div>
    </div>

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

    <section class="widgets-grid-new">
      <div class="widget candlestick-chart-widget">
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
          <span class="info-time">1D</span>
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
          <div ref="mainCandlestickChart" id="main-candlestick-chart-container"></div>
        </div>
        <div class="chart-footer">
          <p>Total trade</p><p>Total volume</p><p>Total value</p>
        </div>
<<<<<<< HEAD:client/src/components/DashboardMain.vue
      </div>      
     </section>
=======
      </div>

      <div class="trading-summary-group">
        
        <div class="trading-card order-entry-card summary-card">
          <div class="card-header">
            <h3>Summary (Order Entry)</h3>
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

            <button type="submit"
                    :class="['submit-btn', orderForm.side.toLowerCase()]"
                    :disabled="loading.order">
              <span v-if="loading.order" class="loading-spinner"></span>
              {{ orderForm.side }} {{ selectedInstrument?.symbol || '' }}
            </button>
          </form>
        </div>

        <div class="widget account-summary-widget">
          <div class="widget-header">
            <h2>Account Summary</h2>
            <span class="mdi mdi-information-outline"></span>
          </div>

          <div v-if="account" class="account-info">
            <div class="account-name">{{ account.email }}</div>
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
      </div>
    </section>
>>>>>>> dev-giahieu:client/src/components/Dashboard.vue

    <section class="trading-section">
<<<<<<< HEAD:client/src/components/DashboardMain.vue
      <!-- Order Entry Card -->
      <div class="trading-card order-entry-card">
        <div class="card-header">
          <h3>Order Entry</h3>
          <div class="order-side-toggle">
                <button :class="['side-btn', 'buy', { active: orderForm.side === 'BUY' }]"
            @click="orderForm.side = 'BUY'">Buy</button>
               <button :class="['side-btn', 'sell', { active: orderForm.side === 'SELL' }]"
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
=======
>>>>>>> dev-giahieu:client/src/components/Dashboard.vue
      <div class="trading-card balance-card">
        <div class="balance-actions">
          <div class="action-section">
            <h3>Deposit</h3>
            <form @submit.prevent="submitDeposit" class="balance-form">
              <div class="form-group">
                <input v-model="depositAmount" type="number" step="0.01" min="0"
                       :placeholder="`Amount in ${accountCurrency}`" class="form-input">
              </div>
              <button type="submit"
                :class="['submit-btn', orderForm.side.toLowerCase()]"
                :disabled="loading.order">
                <span v-if="loading.order" class="loading-spinner"></span>
                    {{ orderForm.side }} {{ selectedInstrument?.symbol || '' }}
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

    <section class="data-section-bottom">
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
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue'
import apiClient from '../utils/api' 
import { sessionState } from '../stores/session' 
import * as echarts from 'echarts' 

const account = computed(() => sessionState.account)
const instruments = ref([])
const selectedInstrumentId = ref('')
const orderBook = ref({ bids: [], asks: [] })
const orders = ref([])
const accountCurrency = ref('USDT')
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
const loading = reactive({ deposit: false, withdraw: false, order: false, chart: false }) 

const mainCandlestickChart = ref(null)
let echartsInstance = null 

<<<<<<< HEAD:client/src/components/DashboardMain.vue
// Market insights data
const marketInsights = ref([
  { symbol: 'BTC', price: 28450.23, changePercent: 0.49 },
  { symbol: 'ETH', price: 1850.74, changePercent: 0.50 }
])
=======
// BIẾN QUAN TRỌNG: Biến lưu thông tin nến hiện tại (Đã được cập nhật real-time)
const currentCandleInfo = ref(null)

const selectedCandlestickChartTab = ref('BTC')
const candlestickChartTabs = reactive([
  // Cần thêm volume vào dữ liệu mock nếu muốn hiển thị Vol
  { symbol: 'BTC', data: null }, 
  { symbol: 'ETH', data: null }
]) 

const marketInsights = ref([]) 
>>>>>>> dev-giahieu:client/src/components/Dashboard.vue

const selectedInstrument = computed(
  () =>
    instruments.value.find((instrument) => instrument.id === selectedInstrumentId.value) || null,
)

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

// Hàm chuyển đổi dữ liệu nến thô sang format hiển thị trên thanh info
const convertCandleDataToInfo = (symbol, rawCandleData, rawVolumeData) => {
    // Dữ liệu nến trong ECharts là [open, close, low, high]
    const open = rawCandleData[0]
    const close = rawCandleData[1]
    const high = rawCandleData[3] 
    const low = rawCandleData[2]

    const change = close - open
    const changePercent = (change / open) * 100
    
    // Lấy volume 
    const volume = rawVolumeData ? rawVolumeData[1] : 1.364 * 1000 

    return {
        symbol: symbol,
        open: open,
        high: high,
        low: low,
        close: close,
        change: change, 
        changePercent: changePercent,
        volume: volume
    }
}


// =======================================================
// ⭐ HÀM FETCH DỮ LIỆU BIỂU ĐỒ NẾN (MOCK) ⭐
// =======================================================
const fetchCandlestickData = (symbol) => {
  const generateCandlestickData = (basePrice, numDays = 60) => {
    const data = []
    let currentPrice = basePrice
    // Tính toán thời gian bắt đầu (60 ngày trước)
    let currentTime = Date.now() - (numDays * 24 * 60 * 60 * 1000) 

    for (let i = 0; i < numDays; i++) {
      const time = Math.floor(currentTime / 1000)
      const open = currentPrice
      const high = open * (1 + (Math.random() * 0.03)) 
      const low = open * (1 - (Math.random() * 0.03)) 
      const close = low + (Math.random() * (high - low))
      const volume = Math.random() * 100000 + 50000 

      currentPrice = close + (Math.random() - 0.5) * basePrice * 0.02 

      data.push({
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)) 
      })
      currentTime += (24 * 60 * 60 * 1000) 
    }
    return data
  }
  const basePrice = symbol === 'BTC' ? 40000 : 2500
  return new Promise(resolve => {
    setTimeout(() => { 
      resolve(generateCandlestickData(basePrice))
    }, 500)
  })
}

// =======================================================
// ⭐ HÀM CẬP NHẬT DỮ LIỆU THỊ TRƯỜNG VÀ NẾN CUỐI CÙNG (REAL-TIME MOCK) ⭐
// =======================================================
const updateMarketData = () => {
    // 1. Cập nhật Market Insight Cards (giữ nguyên)
    marketInsights.value.forEach((insight, index) => {
        if (insight.price && insight.symbol) {
            const changePercent = (Math.random() - 0.5) * 1.5
            const newPrice = insight.price * (1 + changePercent / 100)

            marketInsights.value[index] = {
                ...insight,
                price: newPrice,
                changePercent
            }
        }
    })

    // 2. BỔ SUNG: Cập nhật nến cuối cùng của Tab đang hiển thị
    const currentSymbol = selectedCandlestickChartTab.value
    let tab = candlestickChartTabs.find(t => t.symbol === currentSymbol)

    if (tab && tab.data && tab.data.length > 0) {
        let lastCandle = tab.data[tab.data.length - 1]

        // Mô phỏng sự thay đổi nhỏ của giá (factor 0.001 = 0.1% thay đổi tối đa)
        const priceChangeFactor = 1 + (Math.random() - 0.5) * 0.001 

        const newClose = parseFloat((lastCandle.close * priceChangeFactor).toFixed(2))
        const newOpen = lastCandle.open // Giữ Open không đổi trong suốt ngày
        
        // Cập nhật High và Low
        const newHigh = Math.max(lastCandle.high, newClose, newOpen)
        const newLow = Math.min(lastCandle.low, newClose, newOpen)
        const newVolume = lastCandle.volume + Math.random() * 5000 // Tăng nhẹ Volume

        // Cập nhật dữ liệu nến (Chỉ cập nhật nến cuối cùng trong tab.data)
        tab.data[tab.data.length - 1] = {
            ...lastCandle,
            close: newClose,
            high: parseFloat(newHigh.toFixed(2)),
            low: parseFloat(newLow.toFixed(2)),
            volume: parseFloat(newVolume.toFixed(2))
        }
        
        // CẬP NHẬT currentCandleInfo VỚI DỮ LIỆU NẾN MỚI
        const newCandleData = [newOpen, newClose, newLow, newHigh] 
        const newVolumeData = [Date.now(), newVolume, newOpen > newClose ? 1 : -1]

        currentCandleInfo.value = convertCandleDataToInfo(
            currentSymbol, 
            newCandleData, 
            newVolumeData
        )
        
        // CẬP NHẬT BIỂU ĐỒ ECHARTS VỚI DỮ LIỆU NẾN MỚI
        if (echartsInstance) {
            // Chuẩn bị dữ liệu mới cho ECharts
            const updatedCandleData = tab.data.map(item => [
                item.time * 1000, 
                item.open, 
                item.close, 
                item.low, 
                item.high
            ]);

            echartsInstance.setOption({
                series: [
                    { data: updatedCandleData }
                    // Có thể cần thêm series volume nếu có
                ]
            });
        }
    }

    // 3. Cập nhật Mini Charts (giữ nguyên)
    nextTick(() => {
        marketInsights.value.forEach((insight) => {
            const element = document.querySelector(`[data-symbol="${insight.symbol}"] .mini-chart`)
            if (element) {
                drawMiniChart(element, insight.changePercent >= 0)
            }
        })
    })
}


const loadEChart = async (symbol) => {
  const container = mainCandlestickChart.value
  if (!container) return

  loading.chart = true 
  
  let tab = candlestickChartTabs.find(t => t.symbol === symbol)
  
  if (!tab.data) {
    tab.data = await fetchCandlestickData(symbol) 
  }
  
  const fetchedData = tab.data;

  if (!fetchedData || fetchedData.length === 0) {
    loading.chart = false
    if (echartsInstance) echartsInstance.setOption({ series: [] });
    return
  }
  
  // CHUYỂN ĐỔI DỮ LIỆU SANG FORMAT ECHARTS
  // THAY ĐỔI 1: Cấu trúc dữ liệu nến cho type: 'time' -> [Timestamp, Open, Close, Low, High]
  const candlestickDataWithTime = fetchedData.map(item => [
      item.time * 1000, 
      item.open, 
      item.close, 
      item.low, 
      item.high
  ]); 
  
  // Volume Data: [Timestamp, Volume, colorTag]
  const volumeData = fetchedData.map(item => [
      item.time * 1000, 
      item.volume, 
      item.open > item.close ? 1 : -1
  ]); 
  
  // Lấy dữ liệu OHLC thuần để tính min/max price
  const ohlcData = fetchedData.map(item => [item.open, item.close, item.low, item.high]);

  const allPrices = ohlcData.flatMap(d => d)
  const minPrice = Math.min(...allPrices) * 0.99
  const maxPrice = Math.max(...allPrices) * 1.01


  if (!echartsInstance) {
      echartsInstance = echarts.init(container) 
  }
  
  // Cập nhật currentCandleInfo với nến cuối cùng (Lần đầu load)
  const lastCandleIndex = fetchedData.length - 1;
  if (fetchedData.length > 0) {
      const lastCandle = fetchedData[lastCandleIndex];
      // Dữ liệu nến trong convertCandleDataToInfo là [open, close, low, high]
      const lastCandleDataForInfo = [lastCandle.open, lastCandle.close, lastCandle.low, lastCandle.high]; 
      // Dữ liệu volume [time, volume, colorTag]
      const lastVolumeData = volumeData[lastCandleIndex]; 
      
      currentCandleInfo.value = convertCandleDataToInfo(symbol, lastCandleDataForInfo, lastVolumeData);
  } else {
      currentCandleInfo.value = null;
  }
  
  // THAY ĐỔI QUAN TRỌNG: Loại bỏ listeners 'mousemove' và 'mouseout'
  echartsInstance.off('mousemove'); 
  echartsInstance.off('mouseout'); 


  // Cấu hình Options (Candlestick)
  const option = {
      backgroundColor: '#27293d',
      tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          textStyle: { color: '#f0f0f0' },
          borderColor: '#3a3b50',
          backgroundColor: 'rgba(39, 41, 61, 0.85)',
          // Giữ lại tooltip để người dùng vẫn có thể xem chi tiết từng nến nếu cần
          formatter: function (params) {
              const data = params[0].data;
              if (data.length !== 5) return ''; // Đã bao gồm timestamp nên là 5 phần tử
              const timeStr = echarts.format.formatTime('yyyy-MM-dd', data[0]);
              return [
                  `**${symbol}**`,
                  `Time: ${timeStr}`,
                  `Open: ${data[1].toFixed(2)}`,
                  `Close: ${data[2].toFixed(2)}`,
                  `Low: ${data[3].toFixed(2)}`,
                  `High: ${data[4].toFixed(2)}`
              ].join('<br>');
          }
      },
      grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          top: '15%', 
          containLabel: true
      },
      // THAY ĐỔI 2: Đổi trục X sang type 'time'
      xAxis: {
          type: 'time', 
          // Bỏ data: ECharts sẽ tự lấy từ series
          axisLine: { lineStyle: { color: '#3a3b50' } },
          axisLabel: {
            // ⭐ Đảm bảo màu chữ là trắng sáng
            color: 'white', 
            padding: [0, 8, 0, 8],
            fformatter: function (value) {
                const date = new Date(value);
                const day = date.getDate();
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = monthNames[date.getMonth()];
                
                if (day === 1 || day === 15) {
                    return `${month} ${day}`;
                } else {
                    return day; 
                }
            }
          },
          boundaryGap: false, 
          splitLine: { show: false }
      },
      yAxis: {
          scale: true,
          axisLine: { lineStyle: { color: '#3a3b50' } },
          axisLabel: { color: 'white' },
          splitLine: { lineStyle: { color: '#3a3b50' } },
          min: minPrice.toFixed(2),
          max: maxPrice.toFixed(2)
      },
      series: [
          {
              name: symbol,
              type: 'candlestick',
              // THAY ĐỔI 3: Dùng dữ liệu nến đã có timestamp
              data: candlestickDataWithTime, 
              itemStyle: {
                  color: '#00b050', 
                  color0: '#e53935', 
                  borderColor: '#00b050',
                  borderColor0: '#e53935'
              },
              emphasis: {
                itemStyle: {
                    borderWidth: 1
                }
              }
          },
      ]
  }

  echartsInstance.setOption(option, true)
  
  if (!container.__resizeObserver) {
      container.__resizeObserver = new ResizeObserver(() => {
          echartsInstance.resize()
      });
      container.__resizeObserver.observe(container);
  }
  
  loading.chart = false 
}

const selectCandlestickChartTab = (symbol) => {
  if (selectedCandlestickChartTab.value === symbol) return
  selectedCandlestickChartTab.value = symbol
  loadEChart(symbol) 
}

const drawMiniChart = (element, isPositive) => {
  if (!element) return
  element.style.backgroundColor = 'transparent'
  element.innerHTML = `<div style="height: 100%; width: 100%; border-bottom: 2px solid ${isPositive ? '#00b050' : '#e53935'};"></div>`
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
    
    marketInsights.value = data.slice(0, 2).map(i => ({ 
      symbol: i.symbol, 
      price: Math.random() * 1000 + 10000, 
      changePercent: (Math.random() - 0.5) * 1.5 
    }))
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
// Thêm biến cho giá trị USD tính toán và nhãn nút nhấn
const usdEquivalent = computed(() => {
  const price = orderForm.type === 'MARKET' ? (orderBook.value.asks[0]?.price || orderBook.value.bids[0]?.price || 0) : Number.parseFloat(orderForm.price || 0);
  const qty = Number.parseFloat(orderForm.quantity || 0);
  
  if (price === 0 || isNaN(price) || isNaN(qty)) {
    return 'USD 0.00';
  }
  
  const total = price * qty;
  return `USD ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
});

const submitButtonLabel = computed(() => {
  const side = orderForm.side;
  const qty = Number.parseFloat(orderForm.quantity || 0).toFixed(2);
  const symbol = selectedInstrument.value?.symbol || '';
  const type = orderForm.type;
  
  let priceText;
  if (type === 'MARKET') {
    priceText = 'MKT';
  } else {
    priceText = orderForm.price ? `${orderForm.price} ${type.slice(0, 3)}` : 'Limit/Stop Price';
  }
  
  return `${side} ${qty} ${symbol} @ ${priceText}`;
});

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


// -------------------------------------------------------------------
// LIFECYCLE VÀ WATCHERS
// -------------------------------------------------------------------

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

  await nextTick()
  await loadEChart(selectedCandlestickChartTab.value) 
  updateMarketData()

  // THAY ĐỔI ĐÃ ÁP DỤNG: Cập nhật dữ liệu thị trường (top insight cards và nến cuối cùng) mỗi 1 giây
  setInterval(updateMarketData, 1000) 

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

<style >
/* Import Font Awesome */
@import url('https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css');

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

.search-bar .mdi {
  color: var(--text-color-faded);
}

.user-actions {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.user-actions .mdi {
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
  /* Chỉnh lại để fit cho 2 item */
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
  overflow: hidden; /* Cần thiết cho mini-chart */
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

/* Mini Chart */
.mini-chart {
  height: 30px;
  width: 100%;
}

/* Main Widgets Grid MỚI */
.widgets-grid-new {
  display: grid;
  grid-template-columns: 2.5fr 1fr; 
  gap: 20px;
  margin-bottom: 30px;
}

.widget {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  /* Đã THÊM: Dùng để định vị tuyệt đối các phần tử con */
  position: relative; 
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* Điều chỉnh margin-bottom để thanh info header nằm gần chart hơn */
  margin-bottom: 10px; 
}

.widget-header h2 {
  font-size: 18px;
  font-weight: 500;
}

/* Chart Widget - MỚI */
.candlestick-chart-widget .widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.candlestick-chart-widget .tabs {
  display: flex;
  gap: 10px;
}

.candlestick-chart-widget .tab {
  padding: 8px 16px;
  background-color: var(--dark-bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.candlestick-chart-widget .tab.active {
  background-color: var(--accent-color);
  color: white;
}

/* BỔ SUNG: Thanh thông tin giá chi tiết - Đã điều chỉnh để hiển thị bên trong khung chart */
.chart-info-header {
    /* THAY ĐỔI QUAN TRỌNG */
    position: absolute; 
    top: 85px; /* Điều chỉnh vị trí dưới Tabs (khoảng 20px padding + 45px tabs/header) */
    left: 20px;
    z-index: 10; /* Đảm bảo nó nằm trên biểu đồ */
    
    background-color: rgba(39, 41, 61, 0.85); /* Thêm độ trong suốt */
    padding: 8px 15px; /* Giảm padding cho gọn */
    margin: 0; /* Bỏ margin âm cũ */
    
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px; /* GIẢM gap để Label và Value dính vào nhau */
    /* THAY ĐỔI: Tăng font-size cơ bản */
    font-size: 16px; 
    flex-wrap: wrap; 
}

.chart-info-header .info-pair {
    font-weight: bold;
    color: var(--text-color-light);
    /* THAY ĐỔI: Tăng kích thước cặp giao dịch */
    font-size: 18px; 
}

.chart-info-header .info-time {
    color: var(--text-color-faded);
}

/* THAY ĐỔI TẠI ĐÂY: Nhãn (Label) luôn là màu trắng/light */
.chart-info-header .info-label {
    color: var(--text-color-light) !important; /* Đảm bảo nhãn luôn là màu light */
    font-weight: 500;
}

/* Điều chỉnh lại spacing cho volume label */
.chart-info-header .info-volume-label {
    margin-left: 10px; 
}


/* BỔ SUNG: Định nghĩa màu cho VALUE (Giá trị số) bên trong info-ohlc */
.chart-info-header .info-value.green-text {
    color: var(--green-color) !important;
}

.chart-info-header .info-value.red-text {
    color: var(--red-color) !important;
}


.chart-area-container-large {
  /* GIỮ NGUYÊN: Tăng chiều cao để có thêm không gian cho biểu đồ và info header */
  height: 480px; 
  width: 100%;
  margin-bottom: 15px;
}

/* Đảm bảo Lightweight Chart container lấp đầy chart-area-container-large */
#main-candlestick-chart-container {
    width: 100%;
    height: 100%;
}

.chart-footer {
  display: flex;
  justify-content: space-around;
  color: var(--text-color-faded);
  font-size: 12px;
}

/* Trading Summary Group MỚI */
.trading-summary-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Order Entry/Summary Card */
.trading-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.summary-card {
  /* Cho Order Entry card chiếm phần trên của cột phải */
  flex-grow: 1; 
}

/* Account Summary Widget (Phần còn lại) */
.account-summary-widget {
  /* Cho Account Summary card chiếm phần dưới của cột phải */
  flex-grow: 1; 
}


/* Account Summary Widget Styles (giữ nguyên) */
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

/* Trading Section (Deposit/Withdraw and Orders) - Đã thay đổi layout */
.trading-section {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Chia 2 cột cho Deposit/Withdraw và Orders */
  gap: 20px;
  margin-bottom: 30px;
}

/* Data Section Bottom (Order Book and Portfolio) - Đã thay đổi layout */
.data-section-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Chia 2 cột cho Order Book và Portfolio */
  gap: 20px;
  margin-bottom: 30px;
}

/* Order Entry Card Header (giữ nguyên) */
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

/* Form Styles (giữ nguyên) */
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

/* Balance Actions (giữ nguyên) */
.balance-card {
  /* Đã chuyển sang trading-section */
}

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
  background-color: var(--green-color);
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

/* Data/Orders/Portfolio Styles (giữ nguyên) */
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

/* Order Book (giữ nguyên) */
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

/* Màu sắc cho Order Book Price (giữ nguyên) */
.ask-row .price {
  color: var(--red-color);
}

.bid-row .price {
  color: var(--green-color);
}

/* BỔ SUNG: Định nghĩa màu cho text - Đảm bảo độ ưu tiên */
.green-text {
  color: var(--green-color) !important;
}

.red-text { 
  color: var(--red-color) !important;
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

/* Loading Spinner (giữ nguyên) */
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

/* Responsive Design (giữ nguyên) */
@media (max-width: 1200px) {
  .widgets-grid-new {
    grid-template-columns: 1fr; /* Stack cột trái (Chart) và cột phải (Summary/Order) */
  }

  .trading-section {
    grid-template-columns: 1fr;
  }

  .data-section-bottom {
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
s
  .top-insights-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
<<<<<<< HEAD:client/src/components/DashboardMain.vue
</style>






=======
</style>
>>>>>>> dev-giahieu:client/src/components/Dashboard.vue
