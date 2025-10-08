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
          <li><span class="mdi mdi-chart-area"></span> Interactive chart</li>
          <li><span class="mdi mdi-hand-coin"></span> Mutual funds</li>
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
</style>
