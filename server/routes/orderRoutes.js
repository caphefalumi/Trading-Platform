import express from 'express'
import { getOrderBook, listAccountOrders, placeOrder, listAccountExecutions, cancelOrder } from '../controllers/orders.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Order book is public (but can show user's orders if authenticated)
router.get('/book/:instrumentId', optionalAuth, getOrderBook)

// These routes require authentication
router.post('/', requireAuth, placeOrder)
router.get('/account/:accountId', requireAuth, listAccountOrders)
router.delete('/:orderId', requireAuth, cancelOrder)

// Get recent executions (fills) for account
router.get('/executions/account/:accountId', requireAuth, listAccountExecutions)

export default router
