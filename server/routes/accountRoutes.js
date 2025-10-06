import express from 'express'
import { depositFunds, getAccountSummary, listUserAccounts, withdrawFunds } from '../controllers/accounts.js'

const router = express.Router()

router.get('/user/:userId', listUserAccounts)
router.get('/:accountId/summary', getAccountSummary)
router.post('/:accountId/deposit', depositFunds)
router.post('/:accountId/withdraw', withdrawFunds)

export default router
