<template>
<div class="dashboard-container">
        <aside class="sidebar">
            <div class="branding">
                <img src="../assets/vue.svg" alt="Dev Team Logo" class="team-logo">
                <span class="team-name">Dev Team</span>
            </div>

            <nav class="menu">
                <h2>MENU</h2>
                <ul>
                    <li data-page="dashboard"><i class="fas fa-th-large"></i> Dashboard</li>
                    <li><i class="fas fa-dollar-sign"></i>Trade</li>
                    <li><i class="fas fa-chart-line"></i> Market update</li>
                    <li><i class="fas fa-calculator"></i> Income estimator</li>
                    <li><i class="fas fa-chart-area"></i> Interactive chart</li>
                    <li><i class="fas fa-hand-holding-usd"></i> Mutual funds</li>
                </ul>

                <h2>ACCOUNT</h2>
                <ul>
                    <li><i class="fas fa-cog"></i> Settings <span class="indicator red"></span></li>
                    <li><i class="fas fa-history"></i> History</li>
                </ul>

                <h2>EXTRA</h2>
                <ul>
                    <li id="news-item"><i class="fas fa-newspaper"></i> News <span class="tag new">new</span></li>
                    <li><i class="fas fa-comment-alt"></i> Feedback</li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            
            <header class="header">
                <h1>Dashboard</h1>
                <div class="search-bar">
                    <input type="text" placeholder="Search">
                    <i class="fas fa-search"></i>
                </div>
                <div class="user-actions">
                    <i class="fas fa-bell"></i>
                    <i class="fas fa-user-circle user-avatar"></i>
                </div>
            </header>

            <section class="top-insights-grid">
                <div class="insight-card red-change" data-stock="GOLD">
                    <div class="title">GOLD <span class="change-percent">-0.04%</span></div>
                    <div class="value">2,120.56</div>
                    <div class="mini-chart"></div>
                </div>

                <div class="insight-card green-change" data-stock="DOW">
                    <div class="title">DOW <span class="change-value">+143</span> <span class="change-percent">0.45%</span></div>
                    <div class="value">32,053.74</div>
                    <div class="mini-chart"></div>
                </div>

                <div class="insight-card green-change" data-stock="S&P500">
                    <div class="title">S&P 500 <span class="change-value">+203</span> <span class="change-percent">0.47%</span></div>
                    <div class="value">43,003.06</div>
                    <div class="mini-chart"></div>
                </div>

                <div class="insight-card green-change" data-stock="NASDAQ">
                    <div class="title">NASDAQ <span class="change-value">+230</span> <span class="change-percent">0.64%</span></div>
                    <div class="value">6,355.46</div>
                    <div class="mini-chart"></div>
                </div>
                
                <div class="insight-card green-change" data-stock="DOW2">
                    <div class="title">DOW <span class="change-value">+163</span> <span class="change-percent">0.49%</span></div>
                    <div class="value">32,053.74</div>
                    <div class="mini-chart"></div>
                </div>
                <div class="insight-card green-change" data-stock="DOW3">
                    <div class="title">DOW <span class="change-value">+143</span> <span class="change-percent">0.50%</span></div>
                    <div class="value">32,083.74</div>
                    <div class="mini-chart"></div>
                </div>
            </section>

            <section class="widgets-grid">
                
                <div class="widget main-chart-widget">
                    <div class="tabs">
                        <span class="tab active" data-index="DSEX">DSEX</span>
                        <span class="tab" data-index="DSES">DSES</span>
                        <span class="tab" data-index="DS30">DS30</span>
                    </div>
                    <div class="chart-area-container">
                        <canvas id="main-chart-canvas"></canvas>
                    </div>
                    <div class="chart-footer">
                        <p>Total trade</p><p>Total volume</p><p>Total value</p>
                    </div>
                </div>

                <div class="widget stock-exchange-widget">
                    <div class="widget-header">
                        <h2>Stock exchange</h2>
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="stock-value">
                        <span id="stock-exchange-price">6,148.77</span> <span class="change green" id="stock-exchange-change">+2.11 (+0.52%)</span>
                    </div>

                    <div class="key-metrics">
                        <div><p>Day open</p><p class="value green-text" id="day-open">6180.00</p></div>
                        <div><p>Day high</p><p class="value green-text" id="day-high">6191.14</p></div>
                        <div><p>Day low</p><p class="value red-text" id="day-low">6140.31</p></div>
                    </div>

                    <div class="range-slider">
                        <p>52 weeks range</p>
                        <div class="slider-track"><div class="slider-fill"></div></div>
                    </div>

                    <div class="returns">
                        <div><p>6 Month Return</p><p class="value red-text" id="6m-return">-12.88%</p></div>
                        <div><p>1 Year Return</p><p class="value green-text" id="1y-return">0.22%</p></div>
                    </div>
                </div>

            </section>

        </main>
    </div>
</template>

<script>   
// Java/script.js

// Global variable to hold the main chart instance so we can destroy/update it
let tradingChart = null; 
// Global variable to track the currently active index for real-time updates
let activeIndex = 'DSEX'; 

// Simulated time labels for the main chart
const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

// --- SIMULATED DATA STORE ---
// Stores the current streaming data for each index.
const marketDataStore = {
    'DSEX': { data: [6000, 5820, 5950, 6020, 6190, 6150, 6210], color: 'var(--green-color)', type: 'bar' }, 
    'DSES': { data: [340, 440, 700, 630, 575, 610, 635], color: 'var(--blue-chart)', type: 'bar' },
    'DS30': { data: [2042, 1999, 1563, 1000, 3465, 2250, 2300], color: 'var(--accent-color)', type: 'bar' },
};


document.addEventListener('DOMContentLoaded', () => {
    
    // --- UTILITY FUNCTIONS ---
    // A utility function to format numbers with commas
    const formatNumber = (num) => num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Helper to get CSS variable color from the DOM
    const getCssVar = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

    // --- 1. CHART TAB SWITCHING LOGIC (Main Chart) ---
    const chartTabs = document.querySelectorAll('.main-chart-widget .tab');
    
    // Function to initialize and update the main chart using Chart.js
    function loadChart(indexName) {
        console.log(`Loading new chart for: ${indexName}`);
        
        // Set the global active index
        activeIndex = indexName;
        const indexConfig = marketDataStore[indexName];

        // 1. Destroy any existing chart instance
        if (tradingChart) {
            tradingChart.destroy();
        }

        // 2. Define data based on the selected index (Now pulled from marketDataStore)
        const chartData = indexConfig.data;
        const chartBarColor = getCssVar(indexConfig.color); 

        const ctx = document.getElementById('main-chart-canvas').getContext('2d');

        // 3. Create the new chart instance
        tradingChart = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: chartLabels, 
                datasets: [{
                    label: `${indexName} Price`,
                    data: chartData,
                    backgroundColor: chartBarColor, 
                    borderRadius: 4, 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                animation: false, // CRITICAL: Disable animation for real-time updates
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        grid: { display: false }, 
                        ticks: { color: getCssVar('--text-color-faded') } 
                    },
                    y: {
                        grid: { color: getCssVar('--sidebar-active') }, 
                        ticks: { color: getCssVar('--text-color-faded') } 
                    }
                }
            }
        });
    }

    // Tab click event listener (kept as is)
    chartTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove 'active' from all tabs
            chartTabs.forEach(t => t.classList.remove('active'));
            
            // Add 'active' to the clicked tab
            this.classList.add('active');
            
            // Load the corresponding chart
            const indexName = this.getAttribute('data-index');
            loadChart(indexName);
        });
    });

    // Load the default chart on page load
    loadChart('DSEX'); 
    
    // --- 2. DYNAMIC DATA SIMULATION & MINI-CHART GENERATION ---

    // Function to draw a small, subtle line chart inside the insight cards
    function drawMiniChart(cardElement, isPositive) {
        const chartContainer = cardElement.querySelector('.mini-chart');
        let canvas = chartContainer.querySelector('canvas');
        
        if (!canvas) {
            // Create canvas if it doesn't exist
            canvas = document.createElement('canvas');
            canvas.id = `mini-chart-${Math.random().toString(36).substring(2, 9)}`;
            chartContainer.appendChild(canvas);
        }
        
        const existingChart = Chart.getChart(canvas);
        
        // Simulated data (new data on every call)
        const data = Array.from({ length: 15 }, () => (Math.random() * 10) + 80);
        
        const chartColor = isPositive ? getCssVar('--green-color') : getCssVar('--red-color'); 
        
        if (existingChart) {
             // Update logic for mini chart
            existingChart.data.datasets[0].data = data;
            existingChart.data.datasets[0].borderColor = chartColor;
            existingChart.update();
        } else {
            // Create chart for the first time
            new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(15).fill(''),
                    datasets: [{
                        data: data,
                        borderColor: chartColor, 
                        borderWidth: 3,        
                        tension: 0.6,          
                        fill: false,           
                        backgroundColor: 'transparent', 
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // Disable animation for continuous updates
                    elements: { point: { radius: 0 } },
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } },
                    layout: { 
                        padding: { top: 5, bottom: 5, left: 0, right: 0 } 
                    }
                }
            });
        }
    }


    // This function handles data updates AND mini-chart drawing (runs on interval)
    function updateMarketData() {
        const insightCards = document.querySelectorAll('.insight-card');
        
        // --- A. Update Insight Cards (Individual Stocks) ---
        insightCards.forEach(card => {
            // Simulate random change 
            const changePercentValue = (Math.random() * 1.5) - 0.75; // +/- 0.75% max change
            const isPositive = changePercentValue >= 0;
            
            // Get elements
            const percentSpan = card.querySelector('.change-percent');
            const valueDiv = card.querySelector('.value');
            let currentValue = parseFloat(valueDiv.textContent.replace(/,/g, ''));
            
            // Calculate and format
            const newValue = currentValue * (1 + changePercentValue / 100);
            const formattedPercent = (isPositive ? '+' : '') + changePercentValue.toFixed(2) + '%';
            
            // Apply updates and colors to the text/card background
            card.classList.remove('red-change', 'green-change');
            card.classList.add(isPositive ? 'green-change' : 'red-change');
            
            valueDiv.textContent = formatNumber(newValue);
            percentSpan.textContent = formattedPercent;
            
            // Draw or update the mini-chart
            drawMiniChart(card, isPositive); 
        });

        // --- B. Update Main Stock Exchange Details ---
        const mainStockChange = document.getElementById('stock-exchange-change');
        
        const changeValue = (Math.random() * 5 - 2).toFixed(2); 
        const changePct = ((changeValue / 6100) * 100).toFixed(2);
        const isMainPositive = changeValue >= 0;
        
        mainStockChange.textContent = `${isMainPositive ? '+' : ''}${changeValue} (${changePct}%)`;
        
        mainStockChange.classList.remove('green', 'red');
        mainStockChange.classList.add(isMainPositive ? 'green' : 'red');

        // --- C. Update the Active Main Chart (Streaming Data) ---
        if (tradingChart && marketDataStore[activeIndex]) {
            // 1. Get current data for the active chart
            const currentDataSet = marketDataStore[activeIndex].data;
            
            // 2. Remove the oldest data point and add a new one (Streaming effect)
            currentDataSet.shift(); 
            
            // Generate a small, volatile price update for the new point
            const lastValue = currentDataSet[currentDataSet.length - 1] || 6000;
            const fluctuation = (Math.random() * 40) - 20; // +/- 20 points
            const newPoint = lastValue + fluctuation;

            currentDataSet.push(newPoint); // Add the new point
            
            // 3. Update Chart.js and redraw
            tradingChart.data.datasets[0].data = currentDataSet;
            tradingChart.update();
        }
    }

    // Initial load of market data (before the interval starts)
    updateMarketData();

    // --- 4. START THE REAL-TIME TIMER ---
    // This is the core real-time simulation logic. Updates every 2 seconds (2000 ms).
    setInterval(updateMarketData, 2000); 

    // --- 5. MENU INTERACTIVITY (For UI feedback) ---
    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active state from all items
            document.querySelectorAll('.menu li.active').forEach(i => i.classList.remove('active'));
            // Set active state on the clicked item
            this.classList.add('active');
            
            const page = this.getAttribute('data-page');
            console.log(`Navigating to: ${page}`);
        });
    });
});
</script>

<style scoped>
/* Css/style.css */

@import url('variables.css');
@import url('layout.css');
@import url('sidebar.css');
@import url('widgets.css');


.user-actions .user-avatar {
    /* Set a transition for smooth effect */
    transition: box-shadow 0.3s ease-in-out, transform 0.2s;
    cursor: pointer;
}

.user-actions .user-avatar:hover {
    /* Creates a crisp, solid white ring (4px thickness) around the avatar */
    box-shadow: 0 0 0 4px white; 
    
    /* Ensures the ring is perfectly circular */
    border-radius: 50%; 
}

/* Css/_layout.css */

/* Global Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: var(--font-stack); 
}

body {
    background-color: var(--dark-bg);
    color: var(--text-color-light);
    font-size: var(--base-font-size);
}

/* Main Layout: CSS Grid for Sidebar and Content */
.dashboard-container {
    display: grid;
    /* Sidebar width + Main content column */
    grid-template-columns: 280px 1fr; 
    height: 100vh;
}

/* Main Content Area */
.main-content {
    padding: 20px 30px;
    overflow-y: auto;
}

/* Header/Top Bar */
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

/* Search Bar Styling */
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

/* User Actions */
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
}

.user-avatar {
    font-size: 30px !important;
    color: var(--green-color) !important; 
}

/* Css/_sidebar.css - Sidebar and Menu Styling */

.sidebar {
    background-color: var(--card-bg);
    padding: 20px 0; /* Padding mostly vertical now */
    overflow-y: auto;
}

/* 1. BRANDING (Logo and Text) - Centered at the top */
.branding {
    display: flex; /* Use flexbox for layout control */
    flex-direction: column; /* Stack logo above the text */
    align-items: center; /* Center items horizontally (left-to-right axis) */
    padding: 0 20px 30px; /* Space below the branding section */
    margin-bottom: 10px; /* Space between branding and menu header */
}

.team-logo {
    width: 60px; /* Size of the logo image */
    height: 60px; 
    margin-bottom: 10px; /* Space between logo and text */
    border-radius: 50%; /* Makes the logo circular if desired */
    object-fit: cover; /* Ensures image fills the container */
    /* Add a subtle ring for style, matching the theme */
    border: 2px solid var(--accent-color); 
}

.team-name {
    font-size: 24px; 
    font-weight: bold;
    color: var(--text-color-light); 
}


/* 2. MENU SECTIONS */
.menu h2 {
    color: var(--text-color-faded);
    font-size: 10px;
    text-transform: uppercase;
    padding: 15px 20px 5px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: 10px;
}

/* Remove the border from the first menu header (MENU) so it's clean below the logo */
.menu h2:first-of-type {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
}

.menu ul {
    list-style: none;
}

.menu li {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
}

.menu li:hover,
.menu li.active {
    background-color: var(--sidebar-active);
    color: var(--text-color-light);
}

.menu li i {
    margin-right: 15px;
    font-size: 16px;
    width: 20px; 
    text-align: center;
}

/* 3. Indicators and Tags */
.indicator {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    position: absolute;
    right: 20px;
}
.indicator.red { background-color: var(--red-color); }

.tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: auto;
    font-weight: bold;
}
.tag.new {
    background-color: var(--blue-tag); 
    color: var(--dark-bg);
}

/* Css/_variables.css */

:root {
    /* Base Colors */
    --dark-bg: #1e1e2d;         /* Main background */
    --card-bg: #27293d;         /* Card and sidebar background */
    --sidebar-active: #3a3b50;  /* Active menu item background */
    --text-color-light: #f0f0f0;/* Main text color */
    --text-color-faded: #a0a0b0;/* Faded text (titles, menus) */

    /* Accent & Status Colors */
    --accent-color: #ff9900;    /* Orange logo highlight */
    --green-color: #00b050;     /* Positive change/Up */
    --red-color: #e53935;       /* Negative change/Down */
    --blue-tag: #00b0ff;        /* Blue 'new' tag */
    --blue-chart: #4a90e2;      /* Placeholder chart color */
    
    /* Font Settings */
    --font-stack: Arial, sans-serif;
    --base-font-size: 14px;
}

/* Css/_widgets.css - Styling for Cards, Charts, and Metrics */

/* Helper Classes */
.green-text { color: var(--green-color); }
.red-text { color: var(--red-color); }

/* Top Insight Cards Grid */
.top-insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
    gap: 15px;
    margin-bottom: 25px;
}

.insight-card {
    background-color: var(--card-bg);
    padding: 15px;
    border-radius: 8px;
    overflow: hidden;
}

.insight-card .title {
    color: var(--text-color-faded);
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.insight-card .change-percent {
    font-weight: bold;
}

.insight-card.red-change .change-percent { color: var(--red-color); }
.insight-card.green-change .change-percent,
.insight-card.green-change .change-value { color: var(--green-color); }


.insight-card .value {
    font-size: 24px;
    font-weight: bold;
    margin: 5px 0 10px;
}

/* ⬅️ MINI CHART FIX: Set container for canvas and remove placeholder gradients */
.mini-chart {
    height: 40px; /* Gives Chart.js canvas space to render */
    opacity: 1;
    position: relative; 
    /* Remove old background styles */
    background-image: none !important;
}


/* Main Widgets Grid */
.widgets-grid {
    display: grid;
    grid-template-columns: 2fr 1fr; 
    gap: 25px;
}

.widget {
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
}

/* Left Chart Widget Styling */
.main-chart-widget {
    display: flex;
    flex-direction: column;
}

.tabs {
    display: flex;
    margin-bottom: 10px;
}

.tab {
    padding: 5px 15px;
    margin-right: 5px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    border: 1px solid transparent;
}

.tab.active {
    background-color: var(--green-color);
    color: var(--dark-bg);
    font-weight: bold;
}

/* ⬅️ MAIN CHART CONTAINER: Ready for Canvas */
.chart-area-container {
    flex-grow: 1; /* Makes the chart area fill the remaining space */
    border-radius: 4px;
    margin-bottom: 15px;
    position: relative; 
    min-height: 250px; 
}

#main-chart-canvas {
    width: 100% !important; 
    height: 100% !important; 
}


.chart-footer {
    display: flex;
    justify-content: space-around;
    color: var(--text-color-faded);
    font-size: 12px;
}

/* Right Widget Styles (Stock Exchange) */
.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.widget-header h2 {
    font-size: 16px;
    font-weight: 500;
}

.stock-value {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 20px;
}

.stock-value .change {
    font-size: 16px;
    font-weight: normal;
    margin-left: 10px;
}

.key-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    text-align: center;
    background-color: var(--dark-bg);
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.key-metrics p:first-child {
    color: var(--text-color-faded);
    font-size: 11px;
    margin-bottom: 5px;
}

.key-metrics .value {
    font-size: 16px;
    font-weight: bold;
}

.range-slider {
    margin-bottom: 25px;
}
.range-slider p {
    font-size: 12px;
    color: var(--text-color-faded);
    margin-bottom: 5px;
}
.slider-track {
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    position: relative;
}
.slider-fill {
    width: 65%; 
    height: 100%;
    background-color: var(--accent-color);
    border-radius: 3px;
}

.returns {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.returns p:first-child {
    color: var(--text-color-faded);
    font-size: 12px;
    margin-bottom: 5px;
}
.returns .value {
    font-size: 20px;
    font-weight: bold;
}
</style>
