// client/src/services/predictions.js
import api from '@/utils/api'

/**
 * Get price predictions for a specific instrument
 * @param {string} instrumentId - The instrument ID
 * @param {number} periods - Number of periods to predict (default 24)
 * @returns {Promise<Object>} Prediction data
 */
export async function getPredictions(instrumentId, periods = 24) {
  try {
    const response = await api.get(`/api/predictions/${instrumentId}`, {
      params: { periods }
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch predictions:', error)
    throw error
  }
}

/**
 * Get predictions for multiple instruments
 * @param {string[]} instrumentIds - Array of instrument IDs
 * @param {number} periods - Number of periods to predict (default 24)
 * @returns {Promise<Object>} Batch prediction data
 */
export async function getBatchPredictions(instrumentIds, periods = 24) {
  try {
    const response = await api.post('/api/predictions/batch', {
      instrumentIds,
      periods
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch batch predictions:', error)
    throw error
  }
}
