<template>
  <aside class="sidebar">
    <nav class="menu">
      <h2>MENU</h2>
      <ul>
        <li :class="{ active: $route.name === 'dashboard' }" @click="navigate('dashboard')">
          <span class="mdi mdi-view-dashboard"></span> Dashboard
        </li>
        <li :class="{ active: $route.name === 'trade' }" @click="navigate('trade')">
          <span class="mdi mdi-currency-usd"></span> Trade
        </li>
        <li :class="{ active: $route.name === 'market-data' }" @click="navigate('market-data')">
          <span class="mdi mdi-chart-line"></span> Market Data
        </li>
        <li :class="{ active: $route.name === 'predictions' }" @click="navigate('predictions')">
          <span class="mdi mdi-robot"></span> AI Predictions
        </li>
      </ul>
      <h2>ACCOUNT</h2>
      <ul>
        <li :class="{ active: $route.name === 'portfolio' }" @click="navigate('portfolio')">
          <span class="mdi mdi-folder-open"></span> Portfolio
        </li>
        <li :class="{ active: $route.name === 'orders' }" @click="navigate('orders')">
          <span class="mdi mdi-format-list-bulleted"></span> Orders
        </li>
        <li><span class="mdi mdi-cog"></span> Settings</li>
        <li><span class="mdi mdi-history"></span> History</li>
      </ul>
    </nav>
  </aside>
</template>
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const $route = useRoute()

const navigate = (name) => {
  router.push({ name })
}
</script>
<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1a1d29 0%, #0f1117 100%);
  padding: 20px;
  overflow-y: auto;
  min-width: 280px;
  height: 100vh;
  color: #9ca3af;
  transition: all 0.3s ease;
  border-right: 1px solid #2d3142;
}
.user-avatar {
  font-size: 30px !important;
  color: #10b981 !important;
  margin-left: 2%;
}
.user-avatar:hover {
  cursor: pointer;
}
.menu h2 {
  margin-top: 24px;
  margin-bottom: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.menu ul {
  list-style: none;
  padding: 0;
  margin-bottom: 16px;
}
.menu li {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 4px;
}

.menu li:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #e5e7eb;
}

.menu li.active {
  font-weight: 600;
  color: #e5e7eb;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%);
  border-left: 3px solid #3b82f6;
  padding-left: 9px;
}
.menu .mdi {
  margin-right: 12px;
  font-size: 1.25rem;
}
.menu .tag.new {
  background: #10b981;
  color: #fff;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 0.75rem;
  margin-left: 8px;
  font-weight: 600;
}
.menu .indicator.red {
  background: #ef4444;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  display: inline-block;
  margin-left: 6px;
}
</style>
