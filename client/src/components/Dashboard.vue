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

          <!-- Time Period Selector -->
          <div class="time-period-selector">
            <button v-for="period in timePeriods" :key="period.value"
                    :class="['period-btn', { active: selectedTimePeriod === period.value }]"
                    @click="changeTimePeriod(period.value)">
              {{ period.label }}
            </button>
          </div>

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
          <!-- Loading Overlay -->
          <div v-if="loading.chart" class="chart-loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading chart data...</div>
          </div>
          <div ref="mainCandlestickChart" id="main-candlestick-chart-container"></div>
        </div>
        <div class="chart-footer">
          <p>Total trade</p><p>Total volume</p><p>Total value</p>
        </div>
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

    <section class="trading-section">
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
import { computed, onMounted, reactive, ref, watch, nextTick, onUnmounted } from 'vue'
import apiClient from '../utils/api'
import { sessionState } from '../stores/session'
import * as echarts from 'echarts'
import cmcClient from '../services/marketData'

const account = computed(() => sessionState.account)
const instruments = ref([])
const selectedInstrumentId = ref('')
const orderBook = ref({ bids: [], asks: [] })
const orders = ref([])
const accountCurrency = ref('USDT')
const depositAmount = ref('')
const withdrawAmount = ref('')
const accountSummary = ref(null)

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

// BIẾN QUAN TRỌNG: Biến lưu thông tin nến hiện tại (Đã được cập nhật real-time)
const currentCandleInfo = ref(null)

const selectedCandlestickChartTab = ref('BTC')
const candlestickChartTabs = reactive([
  // Cần thêm volume vào dữ liệu mock nếu muốn hiển thị Vol
  { symbol: 'BTC', data: null },
  { symbol: 'ETH', data: null }
])

// Time period selector
const selectedTimePeriod = ref('1d')
const timePeriods = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' }
]

const marketInsights = ref([])

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

// =======================================================
// ⭐ HÀM FETCH DỮ LIỆU BIỂU ĐỒ NẾN TỪ COINMARKETCAP API ⭐
// =======================================================
const fetchCandlestickData = async (symbol) => {
  try {
    loading.chart = true;
    console.log(`🎯 Fetching REAL candlestick data for: ${symbol} (${selectedTimePeriod.value})`);

    const candleData = await cmcClient.getCandleData(symbol, selectedTimePeriod.value);

    if (candleData && candleData.length > 0) {
      console.log(`✅ Successfully loaded ${candleData.length} REAL candles for ${symbol}`);
      return candleData;
    } else {
      console.warn(`⚠️ No candle data returned for ${symbol}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching candlestick data for ${symbol}:`, error);
    return [];
  } finally {
    loading.chart = false;
  }
};

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

// Thêm biến để theo dõi trạng thái API
const apiStatus = ref({ valid: true, message: 'Connecting to real market data...' });

// =======================================================
// ⭐ KIỂM TRA VÀ KHỞI TẠO API THẬT ⭐
// =======================================================
const initializeRealMarketData = async () => {
  try {
    // Kiểm tra trạng thái API key trước
    const status = await cmcClient.checkAPIStatus();
    apiStatus.value = status;

    if (!status.valid) {
      console.warn('⚠️ API Key may be invalid, using fallback data');
      // Vẫn tiếp tục nhưng với cảnh báo
    }

    console.log('🚀 Initializing REAL market data from CoinMarketCap...');

    // Load dữ liệu thật cho cả BTC và ETH với time period hiện tại
    const [btcData, ethData, latestQuotes] = await Promise.all([
      cmcClient.getCandleData('BTC', selectedTimePeriod.value),
      cmcClient.getCandleData('ETH', selectedTimePeriod.value),
      cmcClient.getLatestQuotes(['BTC', 'ETH'])
    ]);

    // Cập nhật chart tabs với dữ liệu thật
    candlestickChartTabs[0].data = btcData;
    candlestickChartTabs[1].data = ethData;

    // Cập nhật market insights với dữ liệu thật
    if (latestQuotes) {
      marketInsights.value = Object.keys(latestQuotes).map(symbol => {
        const quote = latestQuotes[symbol];
        return {
          symbol: symbol,
          price: quote.price || 0,
          changePercent: quote.changePercent || 0,
          // Thêm volume để hiển thị nếu cần
          volume24h: quote.volume24h || 0
        };
      });

      console.log('✅ Real market data loaded successfully');
    }

    // Load biểu đồ ban đầu với dữ liệu thật
    await loadEChart(selectedCandlestickChartTab.value);

  } catch (error) {
    console.error('❌ Error initializing REAL market data:', error);
    apiStatus.value = {
      valid: false,
      message: `Failed to load real data: ${error.message}`
    };
  }
};


// =======================================================
// ⭐ CẬP NHẬT DỮ LIỆU THỊ TRƯỜNG THỜI GIAN THỰC ⭐
// =======================================================
const updateRealMarketData = async () => {
  try {
    // Cập nhật giá hiện tại từ API thật
    const latestQuotes = await cmcClient.getLatestQuotes(['BTC', 'ETH']);

    if (latestQuotes && Object.keys(latestQuotes).length > 0) {
      // Cập nhật market insights với dữ liệu thật
      marketInsights.value = Object.keys(latestQuotes).map(symbol => {
        const quote = latestQuotes[symbol];
        return {
          symbol: symbol,
          price: quote.price || 0,
          changePercent: quote.changePercent || 0
        };
      });

      // Cập nhật current candle info với dữ liệu thật
      const currentSymbol = selectedCandlestickChartTab.value;
      if (latestQuotes[currentSymbol]) {
        const quote = latestQuotes[currentSymbol];
        const currentPrice = quote.price || 0;

        let tab = candlestickChartTabs.find(t => t.symbol === currentSymbol);
        if (tab && tab.data && tab.data.length > 0) {
          const lastCandle = tab.data[tab.data.length - 1];

          // Cập nhật thông tin nến hiện tại với dữ liệu thật
          currentCandleInfo.value = {
            symbol: currentSymbol,
            open: lastCandle.open,
            high: Math.max(lastCandle.high, currentPrice, quote.high24h || 0),
            low: Math.min(lastCandle.low, currentPrice, quote.low24h || 0),
            close: currentPrice,
            change: currentPrice - lastCandle.open,
            changePercent: quote.changePercent || 0,
            volume: quote.volume24h || lastCandle.volume || 0
          };
        }
      }
    }

    // Cập nhật Mini Charts
    nextTick(() => {
      marketInsights.value.forEach((insight) => {
        const element = document.querySelector(`[data-symbol="${insight.symbol}"] .mini-chart`)
        if (element) {
          drawMiniChart(element, insight.changePercent >= 0)
        }
      })
    })

  } catch (error) {
    console.error('❌ Error updating REAL market data:', error);
  }
};

// Cập nhật hàm onMounted
onMounted(async () => {
  await fetchInstruments();
  if (selectedInstrumentId.value) {
    await fetchOrderBook();
  }

  // ⭐ Khởi tạo dữ liệu thị trường THẬT từ CoinMarketCap
  await initializeRealMarketData();

  // ⭐ Cập nhật dữ liệu thị trường mỗi 15 giây
  const updateInterval = setInterval(updateRealMarketData, 15000);

  // Cleanup interval khi component unmount
  onUnmounted(() => {
    clearInterval(updateInterval);
  });

  initializeMenuInteractivity();
});



const loadEChart = async (symbol) => {
  const container = mainCandlestickChart.value
  if (!container) return

  loading.chart = true

  try {
    let tab = candlestickChartTabs.find(t => t.symbol === symbol)

    if (!tab.data) {
      tab.data = await fetchCandlestickData(symbol)
    }

    const fetchedData = tab.data;

    if (!fetchedData || fetchedData.length === 0) {
      console.warn('No data available for chart');
      loading.chart = false
      if (echartsInstance) echartsInstance.setOption({ series: [] });
      return
    }

    // Validate data structure
    const isValidData = fetchedData.every(item =>
      item &&
      typeof item.time === 'number' &&
      typeof item.open === 'number' &&
      typeof item.close === 'number' &&
      typeof item.high === 'number' &&
      typeof item.low === 'number'
    );

    if (!isValidData) {
      console.error('Invalid data structure received');
      loading.chart = false;
      return;
    }

    // Prepare data for area chart (closing prices)
    const lineData = fetchedData.map(item => [item.time * 1000, item.close]);

    // Calculate if overall trend is up or down
    const firstPrice = fetchedData[0].close;
    const lastPrice = fetchedData[fetchedData.length - 1].close;
    const isUpTrend = lastPrice >= firstPrice;

    // Volume Data
    const volumeData = fetchedData.map(item => [
        item.time * 1000,
        item.volume || 0,
        item.close >= item.open ? 1 : -1
    ]);

    // Calculate price range
    const allPrices = fetchedData.flatMap(d => [d.open, d.close, d.low, d.high]);
    const minPrice = Math.min(...allPrices) * 0.98;
    const maxPrice = Math.max(...allPrices) * 1.02;

    if (!echartsInstance) {
        echartsInstance = echarts.init(container)
    }

    // Update current candle info
    if (fetchedData.length > 0) {
        const lastCandle = fetchedData[fetchedData.length - 1];
        currentCandleInfo.value = {
            symbol: symbol,
            open: lastCandle.open,
            high: lastCandle.high,
            low: lastCandle.low,
            close: lastCandle.close,
            change: lastCandle.close - lastCandle.open,
            changePercent: ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100,
            volume: lastCandle.volume || 0
        };
    }

  // Enhanced chart options with area fill
  const option = {
      backgroundColor: '#1a1d29',
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      tooltip: {
          trigger: 'axis',
          axisPointer: {
              type: 'cross',
              crossStyle: { color: '#666' },
              lineStyle: {
                  type: 'dashed',
                  color: '#666',
                  width: 1
              }
          },
          backgroundColor: 'rgba(20, 23, 36, 0.95)',
          borderColor: '#2d3142',
          borderWidth: 1,
          textStyle: {
              color: '#e5e7eb',
              fontSize: 13
          },
          padding: [12, 16],
          formatter: function (params) {
              const dataPoint = params[0];
              if (!dataPoint) return '';

              const date = new Date(dataPoint.value[0]);
              const price = dataPoint.value[1];

              const dateStr = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              });

              // Find corresponding candle data for OHLCV
              const candle = fetchedData.find(d => d.time * 1000 === dataPoint.value[0]);

              if (candle) {
                  const change = candle.close - candle.open;
                  const changePercent = (change / candle.open * 100).toFixed(2);
                  const changeColor = change >= 0 ? '#10b981' : '#ef4444';

                  return `
                      <div style="font-weight: 600; margin-bottom: 8px;">${dateStr}</div>
                      <div style="display: flex; gap: 20px; margin-bottom: 4px;">
                          <span style="color: #9ca3af;">Price:</span>
                          <span style="color: ${changeColor}; font-weight: 600;">$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div style="display: flex; gap: 20px; margin-bottom: 4px;">
                          <span style="color: #9ca3af;">Change:</span>
                          <span style="color: ${changeColor};">${changePercent}%</span>
                      </div>
                      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2d3142;">
                          <div><span style="color: #9ca3af;">O:</span> $${candle.open.toFixed(2)}</div>
                          <div><span style="color: #9ca3af;">H:</span> $${candle.high.toFixed(2)}</div>
                          <div><span style="color: #9ca3af;">L:</span> $${candle.low.toFixed(2)}</div>
                          <div><span style="color: #9ca3af;">C:</span> $${candle.close.toFixed(2)}</div>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #2d3142;">
                          <span style="color: #9ca3af;">Vol 24h:</span> $${(candle.volume / 1000000).toFixed(2)}M
                      </div>
                  `;
              }

              return `
                  <div style="font-weight: 600;">${dateStr}</div>
                  <div style="margin-top: 4px;">Price: $${price.toFixed(2)}</div>
              `;
          }
      },
      grid: [
          {
              left: '3%',
              right: '3%',
              top: '8%',
              height: '68%',
              containLabel: true
          },
          {
              left: '3%',
              right: '3%',
              top: '80%',
              height: '15%',
              containLabel: true
          }
      ],
      xAxis: [
          {
              type: 'time',
              gridIndex: 0,
              axisLine: {
                  lineStyle: { color: '#2d3142' }
              },
              axisLabel: {
                  color: '#9ca3af',
                  fontSize: 11,
                  formatter: function (value, index) {
                      try {
                          const date = new Date(value);
                          const day = date.getDate();
                          const month = date.toLocaleDateString('en-US', { month: 'short' });

                          // Show month for first day or every 5 days
                          if (day === 1 || day % 5 === 0) {
                              return month + ' ' + day;
                          }
                          return String(day);
                      } catch (e) {
                          return '';
                      }
                  }
              },
              axisTick: { show: false },
              splitLine: { show: false },
              boundaryGap: false
          },
          {
              type: 'time',
              gridIndex: 1,
              axisLine: { lineStyle: { color: '#2d3142' } },
              axisLabel: { show: false },
              axisTick: { show: false },
              splitLine: { show: false }
          }
      ],
      yAxis: [
          {
              type: 'value',
              gridIndex: 0,
              scale: true,
              position: 'right',
              axisLine: { show: false },
              axisLabel: {
                  color: '#9ca3af',
                  fontSize: 11,
                  formatter: function (value) {
                      if (value >= 1000) {
                          return (value / 1000).toFixed(1) + 'K';
                      }
                      return value.toFixed(0);
                  }
              },
              axisTick: { show: false },
              splitLine: {
                  lineStyle: {
                      color: '#2d3142',
                      type: 'dashed'
                  }
              },
              min: minPrice,
              max: maxPrice
          },
          {
              type: 'value',
              gridIndex: 1,
              scale: true,
              position: 'right',
              axisLine: { show: false },
              axisLabel: { show: false },
              axisTick: { show: false },
              splitLine: { show: false }
          }
      ],
      dataZoom: [
          {
              type: 'inside',
              xAxisIndex: [0, 1],
              start: 0,
              end: 100,
              minValueSpan: 3600 * 24 * 1000 * 3  // Minimum 3 days
          }
      ],
      series: [
          // Area chart with gradient fill
          {
              name: 'Price',
              type: 'line',
              data: lineData,
              xAxisIndex: 0,
              yAxisIndex: 0,
              smooth: true,
              symbol: 'none',
              lineStyle: {
                  color: isUpTrend ? '#10b981' : '#ef4444',
                  width: 2,
                  shadowColor: isUpTrend ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  shadowBlur: 8,
                  shadowOffsetY: 2
              },
              areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                          offset: 0,
                          color: isUpTrend ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'
                      },
                      {
                          offset: 0.5,
                          color: isUpTrend ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                      },
                      {
                          offset: 1,
                          color: isUpTrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'
                      }
                  ])
              },
              emphasis: {
                  focus: 'series',
                  lineStyle: { width: 3 }
              }
          },
          // Volume bars
          {
              name: 'Volume',
              type: 'bar',
              data: volumeData.map(item => [item[0], item[1]]),
              xAxisIndex: 1,
              yAxisIndex: 1,
              itemStyle: {
                  color: function(params) {
                      const vol = volumeData[params.dataIndex];
                      return vol[2] > 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                  }
              },
              barMaxWidth: 3
          }
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
  } catch (error) {
    console.error('Error loading chart:', error);
    loading.chart = false;
  }
}

const selectCandlestickChartTab = (symbol) => {
  if (selectedCandlestickChartTab.value === symbol) return
  selectedCandlestickChartTab.value = symbol
  loadEChart(symbol)
}

// Change time period for candle chart
const changeTimePeriod = async (period) => {
  if (selectedTimePeriod.value === period) return

  selectedTimePeriod.value = period
  loading.chart = true

  try {
    console.log(`📊 Loading ${period} data for ${selectedCandlestickChartTab.value}...`)

    // Reload data for both BTC and ETH with new time period
    const [btcData, ethData] = await Promise.all([
      cmcClient.getCandleData('BTC', period),
      cmcClient.getCandleData('ETH', period)
    ])

    // Update chart tabs
    candlestickChartTabs[0].data = btcData
    candlestickChartTabs[1].data = ethData

    // Reload current chart
    await loadEChart(selectedCandlestickChartTab.value)

    console.log(`✅ ${period} data loaded successfully`)
  } catch (error) {
    console.error(`❌ Error loading ${period} data:`, error)
  } finally {
    loading.chart = false
  }
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

/* Chart Widget - Enhanced Dark Theme */
.candlestick-chart-widget {
  background: linear-gradient(135deg, #1e2139 0%, #1a1d29 100%);
  border: 1px solid #2d3142;
}

.candlestick-chart-widget .widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 16px 20px;
  background: rgba(26, 29, 41, 0.6);
  border-bottom: 1px solid #2d3142;
}

.candlestick-chart-widget .tabs {
  display: flex;
  gap: 8px;
}

.candlestick-chart-widget .tab {
  padding: 8px 20px;
  background-color: transparent;
  border: 1px solid #2d3142;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #9ca3af;
  font-weight: 500;
  font-size: 14px;
}

.candlestick-chart-widget .tab:hover {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #e5e7eb;
}

.candlestick-chart-widget .tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* BỔ SUNG: Thanh thông tin giá chi tiết */
.chart-info-header {
    position: absolute;
    top: 85px;
    left: 20px;
    z-index: 10;

    background: linear-gradient(135deg, rgba(26, 29, 41, 0.95) 0%, rgba(30, 33, 57, 0.95) 100%);
    backdrop-filter: blur(12px);
    border: 1px solid #2d3142;
    padding: 12px 18px;
    margin: 0;

    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    flex-wrap: wrap;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.chart-info-header .info-pair {
    font-weight: 700;
    color: #e5e7eb;
    font-size: 16px;
    letter-spacing: 0.5px;
}

/* Time Period Selector Styles */
.time-period-selector {
    display: flex;
    gap: 4px;
    margin: 0 16px;
    background: rgba(20, 23, 36, 0.6);
    border: 1px solid #2d3142;
    border-radius: 8px;
    padding: 3px;
}

.time-period-selector .period-btn {
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    background: transparent;
    color: var(--text-color-faded, #6b7280);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.time-period-selector .period-btn:hover {
    background: var(--hover-bg, #252a3a);
    color: var(--text-color-light, #e5e7eb);
}

.time-period-selector .period-btn.active {
    background: var(--primary-color, #3b82f6);
    color: white;
    font-weight: 600;
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
    background: #1a1d29;
    border-radius: 8px;
}

.chart-area-container-large {
    background: #1a1d29;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    min-height: 400px;
}

/* Loading Overlay */
.chart-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 29, 41, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #2d3142;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    margin-top: 16px;
    color: #9ca3af;
    font-size: 14px;
    font-weight: 500;
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

  .top-insights-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
