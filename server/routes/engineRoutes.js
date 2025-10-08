import express from 'express'
import MatchingEngine from '../controllers/engine.js'
const router = express.Router()
const engine = new MatchingEngine()
router.post('/order', (req, res) => {
    const orderData = req.body;
    const trades = engine.processOrder(orderData);
    res.json({ trades });
});

router.get('/ping', (req, res) => {
    res.send('PONG');
});
export default router;
