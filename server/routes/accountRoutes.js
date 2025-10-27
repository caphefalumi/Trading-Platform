import express from 'express'
import { depositFunds, getAccountSummary, withdrawFunds } from '../controllers/accounts.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All account routes require authentication
// router.use(requireAuth)

router.get('/:accountId/summary', getAccountSummary)
router.post('/:accountId/deposit', depositFunds)
router.post('/:accountId/withdraw', withdrawFunds)

export default router
