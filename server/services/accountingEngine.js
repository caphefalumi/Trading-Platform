import { randomUUID } from 'crypto'
import {
  ACTION_TYPES,
  ACTOR_TYPES,
  LEDGER_ENTRY_TYPES,
  OBJECT_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  getState,
  recordAuditLog,
} from './dataStore.js'

function findAccount(accountId) {
  return getState().accounts.find((account) => account.id === accountId)
}

function ensureBalance(accountId, currency) {
  const state = getState()
  let balance = state.balances.find(
    (entry) => entry.accountId === accountId && entry.currency === currency,
  )
  if (!balance) {
    balance = {
      id: randomUUID(),
      accountId,
      currency,
      available: 0,
      pending: 0,
      updatedAt: new Date().toISOString(),
    }
    state.balances.push(balance)
  }
  return balance
}

export function createAccount({ name, primaryCurrency = 'USD', metadata = {} }) {
  if (!name) {
    throw new Error('Name is required to create an account')
  }
  const state = getState()
  const account = {
    id: randomUUID(),
    name,
    primaryCurrency,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.accounts.push(account)
  ensureBalance(account.id, primaryCurrency)
  recordAuditLog({
    actorType: ACTOR_TYPES.USER,
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.ACCOUNT,
    description: `Account ${account.id} created`,
    metadata: account,
  })
  return account
}

export function listAccounts() {
  return [...getState().accounts]
}

export function getAccountById(id) {
  return findAccount(id)
}

export function listBalances(accountId) {
  const balances = getState().balances
  if (accountId) {
    return balances.filter((balance) => balance.accountId === accountId)
  }
  return [...balances]
}

function addLedgerEntry({
  accountId,
  currency,
  amount,
  type,
  description,
  referenceId,
}) {
  if (!findAccount(accountId)) {
    throw new Error('Account not found for ledger entry')
  }
  const state = getState()
  const entry = {
    id: randomUUID(),
    accountId,
    currency,
    amount,
    type,
    description,
    referenceId,
    createdAt: new Date().toISOString(),
  }
  state.ledgerEntries.push(entry)
  applyLedgerToBalance(entry)
  recordAuditLog({
    actorType: ACTOR_TYPES.SYSTEM,
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.LEDGER,
    description,
    metadata: entry,
  })
  return entry
}

function applyLedgerToBalance(entry) {
  const balance = ensureBalance(entry.accountId, entry.currency)
  balance.available += entry.amount
  balance.updatedAt = new Date().toISOString()
}

export function listLedgerEntries(accountId) {
  const entries = getState().ledgerEntries
  if (accountId) {
    return entries.filter((entry) => entry.accountId === accountId)
  }
  return [...entries]
}

export function createTransaction({
  accountId,
  type,
  amount,
  currency = 'USD',
}) {
  if (!findAccount(accountId)) {
    throw new Error('Account not found for transaction')
  }
  if (!Object.values(TRANSACTION_TYPES).includes(type)) {
    throw new Error('Unsupported transaction type')
  }
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new Error('Transaction amount must be positive')
  }

  const state = getState()
  const transaction = {
    id: randomUUID(),
    accountId,
    type,
    currency,
    amount,
    status: TRANSACTION_STATUSES.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.transactions.push(transaction)
  recordAuditLog({
    actorType: ACTOR_TYPES.USER,
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.TRANSACTION,
    description: `${type} transaction ${transaction.id} created`,
    metadata: transaction,
  })
  return processImmediateTransaction(transaction)
}

function processImmediateTransaction(transaction) {
  if (transaction.type === TRANSACTION_TYPES.DEPOSIT) {
    addLedgerEntry({
      accountId: transaction.accountId,
      currency: transaction.currency,
      amount: transaction.amount,
      type: LEDGER_ENTRY_TYPES.DEPOSIT,
      description: `Deposit ${transaction.amount} ${transaction.currency}`,
      referenceId: transaction.id,
    })
    transaction.status = TRANSACTION_STATUSES.COMPLETED
  } else if (transaction.type === TRANSACTION_TYPES.WITHDRAWAL) {
    const balance = ensureBalance(transaction.accountId, transaction.currency)
    if (balance.available < transaction.amount) {
      transaction.status = TRANSACTION_STATUSES.FAILED
    } else {
      addLedgerEntry({
        accountId: transaction.accountId,
        currency: transaction.currency,
        amount: -transaction.amount,
        type: LEDGER_ENTRY_TYPES.WITHDRAWAL,
        description: `Withdrawal ${transaction.amount} ${transaction.currency}`,
        referenceId: transaction.id,
      })
      transaction.status = TRANSACTION_STATUSES.COMPLETED
    }
  }
  transaction.updatedAt = new Date().toISOString()
  recordAuditLog({
    actorType: ACTOR_TYPES.SYSTEM,
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.TRANSACTION,
    description: `Transaction ${transaction.id} status ${transaction.status}`,
    metadata: transaction,
  })
  return transaction
}

export function listTransactions(accountId) {
  const transactions = getState().transactions
  if (accountId) {
    return transactions.filter((tx) => tx.accountId === accountId)
  }
  return [...transactions]
}

export function handleTradeSettlement({
  execution,
  buyOrder,
  sellOrder,
}) {
  const notional = execution.price * execution.quantity
  addLedgerEntry({
    accountId: buyOrder.accountId,
    currency: buyOrder.currency,
    amount: -notional,
    type: LEDGER_ENTRY_TYPES.TRADE_DEBIT,
    description: `Trade debit for order ${buyOrder.id}`,
    referenceId: execution.id,
  })
  addLedgerEntry({
    accountId: sellOrder.accountId,
    currency: sellOrder.currency,
    amount: notional,
    type: LEDGER_ENTRY_TYPES.TRADE_CREDIT,
    description: `Trade credit for order ${sellOrder.id}`,
    referenceId: execution.id,
  })
}

