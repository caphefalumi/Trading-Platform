// server/routes/marketDataRoutes.js
import express from 'express';
import { getLatestQuotes, getCandleData, checkAPIStatus } from '../controllers/marketData.js';

const router = express.Router();

router.get('/quotes', getLatestQuotes);
router.get('/candles', getCandleData);
router.get('/api-status', checkAPIStatus);

export default router;
