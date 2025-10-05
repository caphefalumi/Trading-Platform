import express from 'express'
import {
  createAccount,
  createTransaction,
  getAccountById,
  listAccounts,
  listBalances,
  listLedgerEntries,
  listTransactions,
} from '../services/accountingEngine.js'
import { listAuditLogs } from '../services/dataStore.js'

const router = express.Router()

router.post('/accounts', (req, res) => {
  try {
    const account = createAccount(req.body)
    res.status(201).json(account)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/accounts', (req, res) => {
  res.json(listAccounts())
})

router.get('/accounts/:id', (req, res) => {
  const account = getAccountById(req.params.id)
  if (!account) {
    res.status(404).json({ message: 'Account not found' })
    return
  }
  res.json(account)
})

router.get('/balances', (req, res) => {
  res.json(listBalances(req.query.accountId))
})

router.get('/ledger', (req, res) => {
  res.json(listLedgerEntries(req.query.accountId))
})

router.post('/transactions', (req, res) => {
  try {
    const transaction = createTransaction(req.body)
    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/transactions', (req, res) => {
  res.json(listTransactions(req.query.accountId))
})

router.get('/audit-logs', (req, res) => {
  res.json(listAuditLogs())
})

export default router
