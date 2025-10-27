import express from 'express'
import MatchingEngine from '../controllers/engine.js'
import axios from 'axios'
const router = express.Router()
const engine = new MatchingEngine()

// Simple internal auth middleware: expects header x-internal-key matching env var
const checkInternalKey = (req, res, next) => {
  const key = req.header('x-internal-key') || req.header('x-api-key')
  if (!process.env.INTERNAL_API_KEY) return res.status(500).json({ error: 'Server not configured' })
  if (!key || key !== process.env.INTERNAL_API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// Accept new order (protected)
router.post('/order', checkInternalKey, async (req, res) => {
    try {
        const orderData = req.body;
        const trades = await engine.processOrder(orderData);
        res.json({ success: true, trades });
    } catch (err) {
        console.error('Failed to process order:', err)
        res.status(500).json({ success: false, error: err.message })
    }
});

router.get('/ping', (req, res) => {
    res.send('PONG');
});
export default router
