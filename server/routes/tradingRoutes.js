import express from 'express'
import {
  cancelOrder,
  getOrderById,
  getQuote,
  listExecutions,
  listOrders,
  listPositions,
  listQuotes,
  placeOrder,
} from '../services/tradingEngine.js'

const router = express.Router()

router.post('/orders', (req, res) => {
  try {
    const { order, executions } = placeOrder(req.body)
    res.status(201).json({ order, executions })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/orders', (req, res) => {
  res.json(listOrders())
})

router.get('/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Order not found' })
    return
  }
  res.json(order)
})

router.delete('/orders/:id', (req, res) => {
  try {
    const order = cancelOrder(req.params.id)
    res.json(order)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/executions', (req, res) => {
  res.json(listExecutions())
})

router.get('/positions', (req, res) => {
  res.json(listPositions(req.query.accountId))
})

router.get('/quotes', (req, res) => {
  res.json(listQuotes())
})

router.get('/quotes/:instrumentId', (req, res) => {
  res.json(getQuote(req.params.instrumentId))
})

export default router
