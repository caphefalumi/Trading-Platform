import { beforeEach, describe, expect, it } from 'bun:test'
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  resetState,
} from '../services/dataStore.js'
import {
  createAccount,
  createTransaction,
  listBalances,
  listLedgerEntries,
  listTransactions,
} from '../services/accountingEngine.js'
import { listAuditLogs } from '../services/dataStore.js'

describe('Accounting engine', () => {
  beforeEach(() => {
    resetState()
  })

  it('creates accounts and maintains balances via ledger entries', () => {
    const account = createAccount({ name: 'Alice' })

    const deposit = createTransaction({
      accountId: account.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 500,
    })

    expect(deposit.status).toBe(TRANSACTION_STATUSES.COMPLETED)
    expect(listBalances(account.id)[0].available).toBeCloseTo(500)
    expect(listLedgerEntries(account.id)).toHaveLength(1)

    const withdrawal = createTransaction({
      accountId: account.id,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      amount: 200,
    })

    expect(withdrawal.status).toBe(TRANSACTION_STATUSES.COMPLETED)
    expect(listBalances(account.id)[0].available).toBeCloseTo(300)
    expect(listLedgerEntries(account.id)).toHaveLength(2)

    const failedWithdrawal = createTransaction({
      accountId: account.id,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      amount: 1000,
    })

    expect(failedWithdrawal.status).toBe(TRANSACTION_STATUSES.FAILED)
    expect(listLedgerEntries(account.id)).toHaveLength(2)

    expect(listTransactions(account.id)).toHaveLength(3)
    expect(listAuditLogs().length).toBeGreaterThan(0)
  })
})
