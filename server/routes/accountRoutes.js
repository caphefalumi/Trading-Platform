import express from 'express'
import {
  depositFunds,
  getAccountSummary,
  withdrawFunds,
  demoCreditFunds,
  getAccountBalance
} from '../controllers/accounts.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All account routes require authentication
// router.use(requireAuth)

router.get('/:accountId/summary', getAccountSummary)
router.get('/:accountId/balance', getAccountBalance)
router.post('/:accountId/deposit', depositFunds)
router.post('/:accountId/withdraw', withdrawFunds)
router.post('/:accountId/demo-credit', demoCreditFunds)

export default router
