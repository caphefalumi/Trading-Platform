import express from 'express'
import MatchingEngine from '../controllers/engine.js'
const router = express.Router()
const engine = new MatchingEngine()


router.post('/order', async (req, res) => {
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
