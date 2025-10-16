// Global variable to hold the main chart instance so we can destroy/update it
let tradingChart = null; 
// Global variable to track the currently active symbol for real-time updates
let activeIndex = 'BTC'; 

// Simulated time labels for the main chart (Can be updated to hours/minutes if needed)
const chartLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];

// --- REAL DATA STORE (Updated for Crypto Symbols - BTC, ETH, SOL) ---
// We initialize data as empty, ready to be filled by the API call.
const marketDataStore = {
    // BTC: Placeholder color (Yellow/Gold is common for Bitcoin)
    'BTC': { data: [], color: 'var(--accent-color)', type: 'bar' }, 
    // ETH: Placeholder color (Blue/Purple is common for Ethereum)
    'ETH': { data: [], color: 'var(--blue-chart)', type: 'bar' },
    // SOL: Placeholder color (A vibrant green/cyan for Solana)
    'SOL': { data: [], color: 'var(--green-color)', type: 'bar' },
};


document.addEventListener('DOMContentLoaded', () => {
    
    // --- UTILITY FUNCTIONS ---
    // A utility function to format numbers with commas and two decimal places
    const formatNumber = (num) => num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const getCssVar = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

    // --- 1. NEW FUNCTION: FETCH REAL DATA FROM API ---
    // This function will be called on chart load and periodically to stream updates.
    async function fetchRealData(indexName) {
        // NOTE: In a real app with your proxy-server.js, you would call:
        // const API_URL = `/api/data/${indexName}`; 
        // For now, we simulate the fetch process.

        try {
            // --- SIMULATED API RESPONSE STRUCTURE ---
            // In a live system, this would be the actual fetch() call to your proxy
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency

            let newHistoricalData = [...marketDataStore[indexName].data];
            let latestPrice;

            if (newHistoricalData.length === 0) {
                // Initial load: provide a realistic starting set for the crypto
                let basePrice = 0;
                if (indexName === 'BTC') basePrice = 65000;
                else if (indexName === 'ETH') basePrice = 3500;
                else if (indexName === 'SOL') basePrice = 150;
                
                // Generate 7 initial points around the base price
                newHistoricalData = Array.from({ length: 7 }, (_, i) => 
                    (basePrice + (Math.random() * basePrice * 0.005) * (i - 3))
                );
                latestPrice = newHistoricalData[newHistoricalData.length - 1];
            } else {
                // Streaming update: shift and add one new point
                newHistoricalData.shift(); 
                const lastValue = newHistoricalData[newHistoricalData.length - 1];
                const fluctuation = (Math.random() * 0.001 - 0.0005) * lastValue; // +/- 0.05% fluctuation
                latestPrice = lastValue + fluctuation;
                newHistoricalData.push(latestPrice); 
            }
            
            // 2. Update the Global Data Store
            marketDataStore[indexName].data = newHistoricalData;

            // 3. Update the Main Chart Instance (if it exists)
            if (tradingChart) {
                tradingChart.data.datasets[0].data = newHistoricalData;
                tradingChart.update();
            }

            // 4. Update the main stock exchange widget with the latest price
            document.getElementById('stock-exchange-price').textContent = formatNumber(latestPrice);
            
            // Also update main exchange metrics with simulated data
            const dayOpen = latestPrice * (1 + (Math.random() * 0.001 - 0.0005));
            document.getElementById('day-open').textContent = formatNumber(dayOpen);
            document.getElementById('day-high').textContent = formatNumber(latestPrice * 1.002);
            document.getElementById('day-low').textContent = formatNumber(latestPrice * 0.998);

        } catch (error) {
            console.error(`Could not fetch real data for ${indexName}:`, error);
        }
    }


    // --- 2. CHART TAB SWITCHING LOGIC (Main Chart) ---
    // Note: The tabs are now <span> tags, not <li>, matching your HTML structure.
    const chartTabs = document.querySelectorAll('.main-chart-widget .tab');
    
    // Function to initialize and update the main chart using Chart.js
    function loadChart(indexName) {
        console.log(`Loading new chart for: ${indexName}`);
        
        activeIndex = indexName;
        const indexConfig = marketDataStore[indexName];

        if (tradingChart) {
            tradingChart.destroy();
        }

        const chartData = indexConfig.data; 
        const chartBarColor = getCssVar(indexConfig.color); 

        const ctx = document.getElementById('main-chart-canvas').getContext('2d');

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
                animation: false, 
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
        
        // CRITICAL: Fetch real data immediately when a chart is loaded/switched
        fetchRealData(indexName);
    }

    // Tab click event listener
    chartTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            chartTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const indexName = this.getAttribute('data-index');
            loadChart(indexName);
        });
    });

    // --- 3. DYNAMIC DATA SIMULATION & MINI-CHART GENERATION ---
    
    // Initial Price Mapping for Insight Cards (More realistic starting crypto values)
    const initialPrices = {
        'BTC': 65000.00,
        'ETH': 3500.00,
        'SOL': 150.00,
        'BNB': 580.00,
        'ADA': 0.45,
        'XRP': 0.52
    };

    // Function to draw a small, subtle line chart inside the insight cards
    function drawMiniChart(cardElement, isPositive) {
        // ... (Mini-chart drawing logic remains the same)
        const chartContainer = cardElement.querySelector('.mini-chart');
        let canvas = chartContainer.querySelector('canvas');
        
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = `mini-chart-${Math.random().toString(36).substring(2, 9)}`;
            chartContainer.appendChild(canvas);
        }
        
        const existingChart = Chart.getChart(canvas);
        
        // Data simulation for the mini-chart
        const data = Array.from({ length: 15 }, () => (Math.random() * 10) + 80);
        
        const chartColor = isPositive ? getCssVar('--green-color') : getCssVar('--red-color'); 
        
        if (existingChart) {
            existingChart.data.datasets[0].data = data;
            existingChart.data.datasets[0].borderColor = chartColor;
            existingChart.update();
        } else {
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
                    animation: false, 
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


    // This function handles card data updates and triggers the main chart fetch
    function updateMarketData() {
        const insightCards = document.querySelectorAll('.insight-card');
        
        // --- A. Update Insight Cards (Individual Crypto) ---
        insightCards.forEach(card => {
            const symbol = card.getAttribute('data-symbol');
            const changePercentValue = (Math.random() * 3) - 1.5; // +/- 1.5% max change
            const isPositive = changePercentValue >= 0;
            
            const percentSpan = card.querySelector('.change-percent');
            const valueDiv = card.querySelector('.value');
            
            let currentValue = parseFloat(valueDiv.textContent.replace(/,/g, '').trim());
            
            // Use initial price map if value is not set yet
            if (isNaN(currentValue) || valueDiv.textContent.trim() === '-') {
                currentValue = initialPrices[symbol] || 100.00; // Fallback to 100
            }
            
            const newValue = currentValue * (1 + changePercentValue / 100);
            const formattedPercent = (isPositive ? '+' : '') + changePercentValue.toFixed(2) + '%';
            
            // Update UI styles
            card.classList.remove('red-change', 'green-change');
            card.classList.add(isPositive ? 'green-change' : 'red-change');
            
            // Format to appropriate decimal places (2 for most cryptos, maybe more for ADA/XRP)
            let formattedValue;
            if (['ADA', 'XRP'].includes(symbol)) {
                 formattedValue = newValue.toFixed(4); // Use 4 decimals for lower-value cryptos
            } else {
                 formattedValue = formatNumber(newValue); // Use 2 decimals for high-value cryptos
            }

            valueDiv.textContent = formattedValue;
            percentSpan.textContent = formattedPercent;
            
            drawMiniChart(card, isPositive); 
        });

        // --- B. Update Main Stock Exchange Details (Updates on main exchange widget) ---
        // This is primarily updated by fetchRealData, but we update the change indicators here
        const mainStockChange = document.getElementById('stock-exchange-change');
        
        const changeValue = (Math.random() * 50 - 20).toFixed(2); // +/- 50 change
        const currentPrice = parseFloat(document.getElementById('stock-exchange-price').textContent.replace(/,/g, ''));
        const changePct = ((changeValue / currentPrice) * 100).toFixed(2);
        const isMainPositive = changeValue >= 0;
        
        mainStockChange.textContent = `${isMainPositive ? '+' : ''}${changeValue} (${changePct}%)`;
        
        mainStockChange.classList.remove('green', 'red');
        mainStockChange.classList.add(isMainPositive ? 'green' : 'red');

        // --- C. Fetch the latest streaming data point for the active chart ---
        if (tradingChart) {
            // This is the periodic call to your (simulated) API
            fetchRealData(activeIndex);
        }
    }

    // Load the default chart on page load, which triggers the first fetchRealData('BTC')
    loadChart('BTC'); 

    // --- 4. START THE REAL-TIME TIMER ---
    // Responsible for updating the cards and calling the API for the main chart stream.
    setInterval(updateMarketData, 2000); 

    // --- 5. MENU INTERACTIVITY (For UI feedback) ---
    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu li.active').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const page = this.getAttribute('data-page');
            console.log(`Navigating to: ${page}`);
        });
    });
});
