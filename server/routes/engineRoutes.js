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

// Accept new order (protected - requires x-internal-key header)
// Note: This endpoint is for internal use only. Frontend should use POST /api/orders instead.
router.post('/order', checkInternalKey, async (req, res) => {
    try {
        const orderData = req.body;
        console.log('🔧 Internal engine processing order:', orderData)
        const trades = await engine.processOrder(orderData);
        res.json({ success: true, trades });
    } catch (err) {
        console.error('❌ Engine order processing failed:', {
            message: err.message,
            stack: err.stack,
            orderData: req.body
        })
        res.status(500).json({ success: false, error: err.message })
    }
});

router.get('/ping', (req, res) => {
    res.send('PONG');
});
export default router
