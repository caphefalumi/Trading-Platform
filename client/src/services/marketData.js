// client/src/services/marketData.js (Sử dụng CoinMarketCap PRO API - DỮ LIỆU THẬT)

// Refactored to use backend Express endpoints
import apiClient from '../utils/api';
const API_BASE_URL = '/api/marketdata';

const marketDataService = {
  /**
   * Get latest quotes for symbols from backend
   * @param {string[]} symbols
   */
  async getLatestQuotes(symbols) {
    try {
      const { data } = await apiClient.get(`${API_BASE_URL}/quotes`, {
        params: { symbols: symbols.join(',') }
      });
      return data;
    } catch (error) {
      console.error('❌ Error fetching quotes from backend:', error);
      return {};
    }
  },

  /**
   * Get OHLC candle data for a symbol from backend
   * @param {string} symbol
   * @param {string} timePeriod - '1d', '1w', '1m', '1y', 'all'
   */
  async getCandleData(symbol, timePeriod = '1d') {
    try {
      const { data } = await apiClient.get(`${API_BASE_URL}/candles`, {
        params: { symbol, timePeriod }
      });
      return data;
    } catch (error) {
      console.error('❌ Error fetching candle data from backend:', error);
      return [];
    }
  },

  /**
   * Check API key status from backend
   */
  async checkAPIStatus() {
    try {
      const { data } = await apiClient.get(`${API_BASE_URL}/api-status`);
      return data;
    } catch (error) {
      console.error('❌ Error checking API status from backend:', error);
      return { valid: false, error: error.message };
    }
  }
};

export default marketDataService;
