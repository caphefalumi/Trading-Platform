import { randomUUID } from 'crypto'

export const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
}

export const ORDER_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL',
}

export const ORDER_STATUSES = {
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
}

export const TIME_IN_FORCE_TYPES = {
  GTC: 'GTC',
  IOC: 'IOC',
}

export const LEDGER_ENTRY_TYPES = {
  TRADE_DEBIT: 'TRADE_DEBIT',
  TRADE_CREDIT: 'TRADE_CREDIT',
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  ADJUSTMENT: 'ADJUSTMENT',
}

export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
}

export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
}

export const ACTOR_TYPES = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
}

export const ACTION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CANCEL: 'CANCEL',
  EXECUTE: 'EXECUTE',
}

export const OBJECT_TYPES = {
  ORDER: 'ORDER',
  EXECUTION: 'EXECUTION',
  POSITION: 'POSITION',
  ACCOUNT: 'ACCOUNT',
  LEDGER: 'LEDGER',
  TRANSACTION: 'TRANSACTION',
}

const initialState = () => ({
  orders: [],
  orderBooks: new Map(),
  executions: [],
  positions: new Map(),
  quotes: new Map(),
  accounts: [],
  balances: [],
  ledgerEntries: [],
  transactions: [],
  auditLogs: [],
})

const state = initialState()

export function getState() {
  return state
}

export function resetState() {
  const fresh = initialState()
  state.orders = fresh.orders
  state.orderBooks = fresh.orderBooks
  state.executions = fresh.executions
  state.positions = fresh.positions
  state.quotes = fresh.quotes
  state.accounts = fresh.accounts
  state.balances = fresh.balances
  state.ledgerEntries = fresh.ledgerEntries
  state.transactions = fresh.transactions
  state.auditLogs = fresh.auditLogs
}

export function recordAuditLog({
  actorType = ACTOR_TYPES.SYSTEM,
  actionType,
  objectType,
  description = '',
  metadata = {},
}) {
  const log = {
    id: randomUUID(),
    actorType,
    actionType,
    objectType,
    description,
    metadata,
    createdAt: new Date().toISOString(),
  }
  state.auditLogs.push(log)
  return log
}

export function listAuditLogs() {
  return [...state.auditLogs]
}
