<template>
  <div class="predictions-container">
    <div class="predictions-header">
      <h2>🤖 AI Price Predictions</h2>
      <p class="subtitle">LSTM Neural Network Model - 5 Day Forecast</p>
      <button @click="loadPredictions" :disabled="loading" class="refresh-btn">
        {{ loading ? '⏳ Loading...' : '🔄 Refresh' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <div v-if="loading && !predictions" class="loading">
      <div class="spinner"></div>
      <p>Running AI model...</p>
    </div>

    <div v-if="predictions" class="predictions-content">
      <!-- Current Price Info -->
      <div class="current-info">
        <div class="info-card">
          <span class="label">Yesterday</span>
          <span class="value">${{ formatPrice(predictions.yesterdayPrice) }}</span>
        </div>
        <div class="info-card current">
          <span class="label">Current Price</span>
          <span class="value">${{ formatPrice(predictions.currentPrice) }}</span>
          <span :class="['change', predictions.todayChange >= 0 ? 'positive' : 'negative']">
            {{ predictions.todayChange >= 0 ? '▲' : '▼' }} {{ Math.abs(predictions.todayChange).toFixed(2) }}%
          </span>
        </div>
        <div class="info-card">
          <span class="label">Last Updated</span>
          <span class="value small">{{ formatDate(predictions.latestDataDate) }}</span>
        </div>
      </div>

      <!-- Trend Analysis -->
      <div class="analysis-section">
        <div class="trend-card" :class="getTrendClass(predictions.analysis.trend)">
          <div class="trend-header">
            <h3>{{ getTrendEmoji(predictions.analysis.trend) }} {{ predictions.analysis.trend.replace('_', ' ') }}</h3>
            <span class="recommendation">{{ predictions.analysis.recommendation }}</span>
          </div>
          <p class="description">{{ predictions.analysis.description }}</p>
          <div class="metrics">
            <div class="metric">
              <span class="metric-label">5-Day Change</span>
              <span :class="['metric-value', predictions.analysis.totalChange >= 0 ? 'positive' : 'negative']">
                {{ predictions.analysis.totalChange >= 0 ? '+' : '' }}{{ predictions.analysis.totalChange.toFixed(2) }}%
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Expected Price</span>
              <span class="metric-value">${{ formatPrice(predictions.analysis.expectedFinalPrice) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Trend Days</span>
              <span class="metric-value">
                {{ predictions.analysis.upwardDays }}↑ / {{ predictions.analysis.downwardDays }}↓
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Predictions Chart -->
      <div class="chart-section">
        <h3>Price Forecast</h3>
        <div class="chart-container">
          <canvas ref="predictionChart"></canvas>
        </div>
      </div>

      <!-- Predictions Table -->
      <div class="table-section">
        <h3>Daily Predictions</h3>
        <table class="predictions-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Predicted Price</th>
              <th>vs Current</th>
              <th>Day Change</th>
              <th>Signal</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pred in predictions.predictions" :key="pred.day">
              <td>Day {{ pred.day }}</td>
              <td>{{ formatDate(pred.date) }}</td>
              <td class="price">${{ formatPrice(pred.predictedPrice) }}</td>
              <td :class="pred.changeVsCurrent >= 0 ? 'positive' : 'negative'">
                {{ pred.changeVsCurrent >= 0 ? '+' : '' }}{{ pred.changeVsCurrent.toFixed(2) }}%
              </td>
              <td :class="pred.changeDayToDay >= 0 ? 'positive' : 'negative'">
                {{ pred.changeDayToDay >= 0 ? '+' : '' }}{{ pred.changeDayToDay.toFixed(2) }}%
              </td>
              <td>
                <span :class="['signal-badge', pred.signal.toLowerCase()]">
                  {{ pred.signal }}
                </span>
              </td>
              <td>
                <div class="confidence-bar">
                  <div class="confidence-fill" :style="{ width: pred.confidence + '%' }"></div>
                  <span class="confidence-text">{{ pred.confidence.toFixed(0) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Model Info -->
      <div class="model-info">
        <p>
          <strong>Model:</strong> LSTM Neural Network |
          <strong>Device:</strong> {{ predictions.modelInfo.device }} |
          <strong>Sequence:</strong> {{ predictions.modelInfo.sequenceLength }} days |
          <strong>Forecast:</strong> {{ predictions.modelInfo.predictionSteps }} days
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import api from '../utils/api'

Chart.register(...registerables)

export default {
  name: 'PredictionsView',
  setup() {
    const predictions = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const predictionChart = ref(null)
    let chartInstance = null

    const BTC_INSTRUMENT_ID = '8211e04d-ace8-4e12-8338-dfdf16b6c8e0'

    const loadPredictions = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await api.get(`/api/predictions/${BTC_INSTRUMENT_ID}`)
        predictions.value = response.data

        // Render chart after data is loaded
        await nextTick()
        renderChart()
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'Failed to load predictions'
        console.error('Error loading predictions:', err)
      } finally {
        loading.value = false
      }
    }

    const renderChart = () => {
      if (!predictionChart.value || !predictions.value) return

      // Destroy existing chart
      if (chartInstance) {
        chartInstance.destroy()
      }

      const ctx = predictionChart.value.getContext('2d')

      const labels = predictions.value.predictions.map(p => p.date)
      const prices = predictions.value.predictions.map(p => p.predictedPrice)
      const currentPrice = predictions.value.currentPrice

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Predicted Price',
              data: prices,
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 6,
              pointHoverRadius: 8
            },
            {
              label: 'Current Price',
              data: Array(labels.length).fill(currentPrice),
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': $' + context.parsed.y.toLocaleString()
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString()
                }
              }
            }
          }
        }
      })
    }

    const formatPrice = (price) => {
      return price ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
    }

    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getTrendClass = (trend) => {
      if (trend.includes('BULLISH')) return 'bullish'
      if (trend.includes('BEARISH')) return 'bearish'
      return 'neutral'
    }

    const getTrendEmoji = (trend) => {
      if (trend === 'STRONG_BULLISH') return '🚀'
      if (trend === 'BULLISH') return '📈'
      if (trend === 'BEARISH') return '📉'
      if (trend === 'STRONG_BEARISH') return '💥'
      return '➡️'
    }

    onMounted(() => {
      loadPredictions()
    })

    return {
      predictions,
      loading,
      error,
      predictionChart,
      loadPredictions,
      formatPrice,
      formatDate,
      getTrendClass,
      getTrendEmoji
    }
  }
}
</script>

<style scoped>
.predictions-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.predictions-header {
  text-align: center;
  margin-bottom: 2rem;
}

.predictions-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 5px solid #e5e7eb;
  border-top: 5px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.current-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.info-card.current {
  border: 2px solid #6366f1;
}

.info-card .label {
  display: block;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.info-card .value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.info-card .value.small {
  font-size: 1rem;
}

.info-card .change {
  font-size: 0.875rem;
  font-weight: 600;
}

.analysis-section {
  margin-bottom: 2rem;
}

.trend-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.trend-card.bullish {
  border-left: 5px solid #22c55e;
}

.trend-card.bearish {
  border-left: 5px solid #ef4444;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.trend-header h3 {
  font-size: 1.5rem;
  margin: 0;
}

.recommendation {
  background: #6366f1;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: bold;
}

.description {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.metric {
  text-align: center;
}

.metric-label {
  display: block;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.chart-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.chart-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.chart-container {
  height: 400px;
  position: relative;
}

.table-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow-x: auto;
}

.table-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.predictions-table {
  width: 100%;
  border-collapse: collapse;
}

.predictions-table th {
  background: #f3f4f6;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.predictions-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.predictions-table .price {
  font-weight: 600;
  color: #1f2937;
}

.positive {
  color: #22c55e;
  font-weight: 600;
}

.negative {
  color: #ef4444;
  font-weight: 600;
}

.signal-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.signal-badge.buy {
  background: #dcfce7;
  color: #166534;
}

.signal-badge.sell {
  background: #fee2e2;
  color: #991b1b;
}

.confidence-bar {
  position: relative;
  background: #e5e7eb;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s;
}

.confidence-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: bold;
  color: #1f2937;
  z-index: 1;
}

.model-info {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .predictions-container {
    padding: 1rem;
  }

  .predictions-header h2 {
    font-size: 1.75rem;
  }

  .chart-container {
    height: 300px;
  }

  .predictions-table {
    font-size: 0.875rem;
  }
}
</style>
