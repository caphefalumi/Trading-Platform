<template>
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
</template>
<script setup>
// No script needed for static sidebar
</script>
<style scoped>
.sidebar {
  background-color: var(--card-bg);
  padding: 20px;
  overflow-y: auto;
  min-width: 280px;
  height: 100vh;
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
.menu h2 {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: bold;
}
.menu ul {
  list-style: none;
  padding: 0;
  margin-bottom: 16px;
}
.menu li {
  padding: 8px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.menu li.active {
  font-weight: bold;
  color: var(--accent-color);
}
.menu .mdi {
  margin-right: 8px;
}
.menu .tag.new {
  background: #2ecc40;
  color: #fff;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 0.75rem;
  margin-left: 8px;
}
.menu .indicator.red {
  background: #e74c3c;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  display: inline-block;
  margin-left: 6px;
}
</style>
