// server/routes/marketDataRoutes.js
import express from 'express';
import { getLatestQuotes, getCandleData, checkAPIStatus } from '../controllers/marketData.js';

const router = express.Router();

// GET /api/marketdata/quotes?symbols=BTC,ETH,USDT
router.get('/quotes', getLatestQuotes);

// GET /api/marketdata/candles?symbol=BTC&timePeriod=daily
router.get('/candles', getCandleData);

// GET /api/marketdata/api-status
router.get('/api-status', checkAPIStatus);

export default router;
