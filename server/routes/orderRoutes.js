import express from 'express'
import { getOrderBook, listAccountOrders, placeOrder } from '../controllers/orders.js'

const router = express.Router()

router.post('/', placeOrder)
router.get('/account/:accountId', listAccountOrders)
router.get('/book/:instrumentId', getOrderBook)

export default router
