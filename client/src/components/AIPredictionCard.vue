<template>
  <div class="ai-prediction-card" @click="goToPredictions">
    <div class="card-header">
      <span class="title">🤖 AI Predictions</span>
      <span class="subtitle">LSTM Model</span>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="mini-spinner"></div>
      <span>Loading...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
    </div>

    <div v-else-if="prediction" class="prediction-content">
      <div class="current-price">
        <span class="label">Current BTC</span>
        <span class="price">${{ formatPrice(prediction.currentPrice) }}</span>
        <span :class="['change', prediction.todayChange >= 0 ? 'positive' : 'negative']">
          {{ prediction.todayChange >= 0 ? '▲' : '▼' }} {{ Math.abs(prediction.todayChange).toFixed(2) }}%
        </span>
      </div>

      <div class="trend-info">
        <div class="trend-badge" :class="getTrendClass(prediction.analysis.trend)">
          {{ prediction.analysis.trend.replace('_', ' ') }}
        </div>
        <div class="recommendation">
          {{ prediction.analysis.recommendation }}
        </div>
      </div>

      <div class="forecast">
        <div class="forecast-item">
          <span class="forecast-label">5-Day Forecast</span>
          <span :class="['forecast-value', prediction.analysis.totalChange >= 0 ? 'positive' : 'negative']">
            {{ prediction.analysis.totalChange >= 0 ? '+' : '' }}{{ prediction.analysis.totalChange.toFixed(2) }}%
          </span>
        </div>
        <div class="forecast-item">
          <span class="forecast-label">Expected Price</span>
          <span class="forecast-value">${{ formatPrice(prediction.analysis.expectedFinalPrice) }}</span>
        </div>
      </div>

      <div class="view-more">
        Click for detailed analysis →
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

export default {
  name: 'AIPredictionCard',
  setup() {
    const router = useRouter()
    const prediction = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const BTC_INSTRUMENT_ID = '730ecbc1-c10d-11f0-930e-a68413f72443'

    const loadPrediction = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await api.get(`/api/predictions/${BTC_INSTRUMENT_ID}`)
        prediction.value = response.data
      } catch (err) {
        error.value = 'Failed to load'
        console.error('Error loading prediction:', err)
      } finally {
        loading.value = false
      }
    }

    const formatPrice = (price) => {
      return price ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'
    }

    const getTrendClass = (trend) => {
      if (trend.includes('BULLISH')) return 'bullish'
      if (trend.includes('BEARISH')) return 'bearish'
      return 'neutral'
    }

    const goToPredictions = () => {
      router.push({ name: 'predictions' })
    }

    onMounted(() => {
      loadPrediction()
    })

    return {
      prediction,
      loading,
      error,
      formatPrice,
      getTrendClass,
      goToPredictions
    }
  }
}
</script>

<style scoped>
.ai-prediction-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.ai-prediction-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header .title {
  font-size: 1.1rem;
  font-weight: bold;
}

.card-header .subtitle {
  font-size: 0.75rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.5rem;
}

.mini-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  opacity: 0.7;
}

.error-icon {
  font-size: 2rem;
}

.error-text {
  font-size: 0.875rem;
}

.prediction-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-price {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-price .label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.current-price .price {
  font-size: 1.75rem;
  font-weight: bold;
}

.current-price .change {
  font-size: 0.875rem;
  font-weight: 600;
}

.current-price .change.positive {
  color: #4ade80;
}

.current-price .change.negative {
  color: #f87171;
}

.trend-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.trend-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.trend-badge.bullish {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.trend-badge.bearish {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.recommendation {
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.9;
}

.forecast {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.forecast-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forecast-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.forecast-value {
  font-size: 0.875rem;
  font-weight: bold;
}

.forecast-value.positive {
  color: #4ade80;
}

.forecast-value.negative {
  color: #f87171;
}

.view-more {
  margin-top: auto;
  padding-top: 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.8;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .ai-prediction-card {
    padding: 1rem;
  }

  .current-price .price {
    font-size: 1.5rem;
  }
}
</style>
