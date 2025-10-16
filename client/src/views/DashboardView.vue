<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <nav class="menu">
        <h2>MENU</h2>
        <ul>
          <li class="active" data-page="dashboard"><span class="mdi mdi-view-dashboard"></span> Dashboard</li>
          <li><span class="mdi mdi-currency-usd"></span> Trade</li>
          <li><span class="mdi mdi-chart-line"></span> Market update</li>
          <li><span class="mdi mdi-calculator"></span> Income estimator</li>
          <li><span class="mdi mdi-chart-bar"></span> Interactive chart</li>
          <li><span class="mdi mdi-hand-coin"></span> Mutual funds</li>
          <li><span class="mdi mdi-robot"></span> Vocer</li>
        </ul>

        <h2>ACCOUNT</h2>
        <ul>
          <li><span class="mdi mdi-folder-open"></span> Portfolio</li>
          <li><span class="mdi mdi-cog"></span> Settings <span class="indicator red"></span></li>
          <li><span class="mdi mdi-history"></span> History</li>
        </ul>

        <h2>EXTRA</h2>
        <ul>
          <li id="news-item"><span class="mdi mdi-newspaper"></span> News <span class="tag new">new</span></li>
          <li><span class="mdi mdi-comment"></span> Feedback</li>
        </ul>
      </nav>
    </aside>
    <div class="dashboard-main-wrapper">
      <DashboardMain />
    </div>
  </div>
</template>
<script setup>
import DashboardMain from '@/components/DashboardMain.vue'
</script>

<style scoped>
.dashboard-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
}
.sidebar {
  grid-column: 1;
}
.dashboard-main-wrapper {
  grid-column: 2;
  height: 100vh;
  overflow-y: auto;
}

.sidebar {
  background-color: var(--card-bg);
  padding: 20px;
  overflow-y: auto;
}

.branding {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sidebar-active);
}

.team-logo {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.team-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
}

.menu h2 {
  font-size: 12px;
  color: var(--text-color-faded);
  margin: 25px 0 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu ul {
  list-style: none;
  margin-bottom: 20px;
}

.menu li {
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
}

.menu li:hover {
  background-color: var(--sidebar-active);
}

.menu li.active {
  background-color: var(--sidebar-active);
  color: var(--accent-color);
}

.menu li i {
  margin-right: 12px;
  width: 16px;
  text-align: center;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}

.indicator.red {
  background-color: var(--red-color);
}

.tag {
  background-color: var(--blue-tag);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  margin-left: auto;
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

.search-bar i {
  color: var(--text-color-faded);
}

.search-bar:hover {
  border: #a0a0b0 1px solid;
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
