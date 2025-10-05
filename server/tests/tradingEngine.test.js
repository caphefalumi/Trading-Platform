import { beforeEach, describe, expect, it } from 'bun:test'
import {
  ORDER_SIDES,
  ORDER_TYPES,
  TRANSACTION_TYPES,
  resetState,
} from '../services/dataStore.js'
import {
  listExecutions,
  listPositions,
  placeOrder,
} from '../services/tradingEngine.js'
import {
  createAccount,
  createTransaction,
} from '../services/accountingEngine.js'

const INSTRUMENT_ID = 'AAPL'

describe('Trading engine', () => {
  beforeEach(() => {
    resetState()
  })

  it('matches buy and sell orders and updates positions', () => {
    const buyer = createAccount({ name: 'Buyer' })
    const seller = createAccount({ name: 'Seller' })

    createTransaction({
      accountId: buyer.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 10000,
    })
    createTransaction({
      accountId: seller.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 10000,
    })

    placeOrder({
      accountId: seller.id,
      instrumentId: INSTRUMENT_ID,
      side: ORDER_SIDES.SELL,
      type: ORDER_TYPES.LIMIT,
      quantity: 10,
      price: 100,
    })

    const { order: buyOrder, executions } = placeOrder({
      accountId: buyer.id,
      instrumentId: INSTRUMENT_ID,
      side: ORDER_SIDES.BUY,
      type: ORDER_TYPES.LIMIT,
      quantity: 10,
      price: 105,
    })

    expect(executions).toHaveLength(1)
    expect(listExecutions()).toHaveLength(1)
    expect(buyOrder.remainingQuantity).toBe(0)

    const buyerPositions = listPositions(buyer.id)
    expect(buyerPositions).toHaveLength(1)
    expect(buyerPositions[0].quantity).toBe(10)

    const sellerPositions = listPositions(seller.id)
    expect(sellerPositions).toHaveLength(1)
    expect(sellerPositions[0].quantity).toBe(-10)
  })

  it('cancels remaining quantity for IOC orders', () => {
    const buyer = createAccount({ name: 'Buyer-IOC' })
    const seller = createAccount({ name: 'Seller-IOC' })

    createTransaction({
      accountId: buyer.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 10000,
    })
    createTransaction({
      accountId: seller.id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 10000,
    })

    placeOrder({
      accountId: seller.id,
      instrumentId: INSTRUMENT_ID,
      side: ORDER_SIDES.SELL,
      type: ORDER_TYPES.LIMIT,
      quantity: 5,
      price: 100,
    })

    const { order: buyOrder, executions } = placeOrder({
      accountId: buyer.id,
      instrumentId: INSTRUMENT_ID,
      side: ORDER_SIDES.BUY,
      type: ORDER_TYPES.LIMIT,
      quantity: 10,
      price: 100,
      timeInForce: 'IOC',
    })

    expect(executions).toHaveLength(1)
    expect(buyOrder.status).toBe('CANCELLED')
    expect(buyOrder.remainingQuantity).toBe(5)
  })
})
