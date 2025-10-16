<template>
  <main class="main-content">
    <!-- Header -->
    <header class="header">
      <h1>Dashboard</h1>
      <div class="search-bar">
        <input type="text" placeholder="Search" />
        <span class="mdi mdi-magnify"></span>
      </div>
      <div class="user-actions">
        <span class="mdi mdi-bell-outline"></span>
        <span class="mdi mdi-account-circle user-avatar"></span>
      </div>
    </header>

    <!-- Alert Messages -->
    <div v-if="feedback.error || feedback.success" class="alert-container">
      <div
        :class="['alert', feedback.error ? 'alert-error' : 'alert-success']"
        @click="feedback.error = feedback.success = ''"
      >
        {{ feedback.error || feedback.success }}
        <span class="alert-close">&times;</span>
      </div>
    </div>

    <!-- Market Insights Grid -->
    <section class="top-insights-grid">
      <div
        v-for="insight in marketInsights"
        :key="insight.symbol"
        :class="[
          'insight-card',
          insight.changePercent >= 0 ? 'green-change' : 'red-change',
        ]"
        :data-symbol="insight.symbol"
      >
        <div class="title">
          {{ insight.symbol }}
          <span class="change-percent">
            {{ formatChangePercent(insight.changePercent) }}
          </span>
        </div>
        <div class="value">{{ formatNumber(insight.price, 2) }}</div>
        <div class="mini-chart"></div>
      </div>
    </section>

    <!-- Main Widgets Grid -->
    <section class="widgets-grid">
      <!-- Main Chart Widget -->
      <div class="widget main-chart-widget">
        <div class="tabs">
          <span
            v-for="tab in chartTabs"
            :key="tab"
            :class="['tab', { active: selectedChartTab === tab }]"
            @click="selectChartTab(tab)"
          >
            {{ tab }}
          </span>
        </div>
        <div class="chart-area-container">
          <canvas ref="mainChart" id="main-chart-canvas"></canvas>
        </div>
        <div class="chart-footer">
          <p>Total trade</p>
          <p>Total volume</p>
          <p>Total value</p>
        </div>
      </div>

      <!-- Account Summary Widget -->
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
            {{ formatNumber(accountSummary.account.balance.available, 2) }}
            {{ accountCurrency }}
          </div>
        </div>

        <div v-if="accountSummary" class="key-metrics">
          <div class="metric">
            <p>Portfolio Value</p>
            <p class="value">
              {{ formatNumber(accountSummary.totals.portfolioValue, 2) }}
              {{ accountCurrency }}
            </p>
          </div>
          <div class="metric">
            <p>Equity</p>
            <p class="value">
              {{ formatNumber(accountSummary.totals.equity, 2) }}
              {{ accountCurrency }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trading + Portfolio -->
    <!-- (phần còn lại giữ nguyên như bản gốc của bạn, không thay đổi) -->
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch, nextTick } from "vue";
import apiClient from "../utils/api";
import { sessionState } from "../stores/session";
import { getCryptoPrices } from "@/utils/crypto"; // 🟢 thêm dòng này

// ========== EXISTING CODE ==========
const account = computed(() => sessionState.account);
const accountSummary = ref(null);
const instruments = ref([]);
const selectedInstrumentId = ref("");
const orderBook = ref({ bids: [], asks: [] });
const orders = ref([]);
const depositAmount = ref("");
const withdrawAmount = ref("");
const feedback = reactive({ success: "", error: "" });
const loading = reactive({ deposit: false, withdraw: false, order: false });

const orderForm = reactive({
  side: "BUY",
  type: "LIMIT",
  quantity: "",
  price: "",
  timeInForce: "GTC",
});

// Chart settings
const mainChart = ref(null);
const selectedChartTab = ref("DSEX");
const chartTabs = ["DSEX", "DSES", "DS30"];
let tradingChart = null;

// 🟢 Market insights: now using API data
const marketInsights = ref([]);

const fetchMarketInsights = async () => {
  try {
    const data = await getCryptoPrices(["BTC", "ETH"]);
    const cryptos = Object.entries(data).map(([symbol, val]) => ({
      symbol,
      price: val.quote.USD.price,
      changePercent: val.quote.USD.percent_change_24h,
    }));

    // Add optional mock ones (for now)
    marketInsights.value = [
      { symbol: "GOLD", price: 2120.56, changePercent: -0.04 },
      { symbol: "DOW", price: 32053.74, changePercent: 0.45 },
      { symbol: "S&P500", price: 43003.06, changePercent: 0.47 },
      { symbol: "NASDAQ", price: 6355.46, changePercent: 0.64 },
      ...cryptos,
    ];
  } catch (error) {
    console.error("Error fetching real market data:", error);
  }
};

// ========== UTILITIES ==========
const accountCurrency = computed(
  () => accountSummary.value?.account?.currency ?? "USDT"
);
const formatNumber = (value, fractionDigits = 2) => {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "0.00";
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};
const formatChangePercent = (value) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// ========== CHART + UI LOGIC ==========
const loadChart = async (indexName) => {
  await nextTick();
  if (!mainChart.value) return;
  if (tradingChart) tradingChart.destroy();

  const { Chart, registerables } = await import("chart.js");
  Chart.register(...registerables);

  let chartData, chartBarColor;
  if (indexName === "DSEX") {
    chartData = [6000, 6100, 6050, 6150, 6120, 6200, 6148];
    chartBarColor = "#00b050";
  } else if (indexName === "DSES") {
    chartData = [550, 580, 560, 590, 575, 610, 595];
    chartBarColor = "#4a90e2";
  } else {
    chartData = [2100, 2150, 2080, 2200, 2180, 2250, 2210];
    chartBarColor = "#ff9900";
  }

  const ctx = mainChart.value.getContext("2d");
  tradingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
      datasets: [
        {
          label: `${indexName} Price`,
          data: chartData,
          backgroundColor: chartBarColor,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: "index" } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#fff" } },
        y: { grid: { color: "#27293d" }, ticks: { color: "#fff" } },
      },
    },
  });
};

const selectChartTab = (tab) => {
  selectedChartTab.value = tab;
  loadChart(tab);
};

// ========== LIFECYCLE ==========
onMounted(async () => {
  await fetchMarketInsights(); // 🟢 Fetch real data here
  await nextTick();
  await loadChart(selectedChartTab.value);

  setInterval(async () => { // 🟢 Refresh market insights every 1.5 minutes
    await fetchMarketInsights()
  }, 1500)
});
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
