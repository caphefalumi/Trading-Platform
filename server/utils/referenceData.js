import { Prisma } from '@prisma/client'
import prisma from './prisma.js'

const ORDER_SIDE_DATA = [
  { code: 'BUY', description: 'Buy orders' },
  { code: 'SELL', description: 'Sell orders' },
]

const ORDER_STATUS_DATA = [
  { code: 'OPEN', description: 'Open order' },
  { code: 'PARTIALLY_FILLED', description: 'Order partially filled' },
  { code: 'FILLED', description: 'Order filled' },
  { code: 'CANCELLED', description: 'Order cancelled' },
]

const ORDER_TYPE_DATA = [
  { code: 'LIMIT', description: 'Limit order' },
  { code: 'MARKET', description: 'Market order' },
]

const TIF_DATA = [
  { code: 'GTC', description: 'Good till cancelled' },
  { code: 'IOC', description: 'Immediate or cancel' },
]

const LEDGER_ENTRY_TYPES = [
  { code: 'DEPOSIT', description: 'Cash deposit', category: 'CASH' },
  { code: 'WITHDRAWAL', description: 'Cash withdrawal', category: 'CASH' },
  { code: 'TRADE_FILL', description: 'Trade execution', category: 'TRADE' },
]

const TX_TYPES = [
  { code: 'DEPOSIT', description: 'Deposit', category: 'CASH' },
  { code: 'WITHDRAWAL', description: 'Withdrawal', category: 'CASH' },
]

const TX_STATUSES = [
  { code: 'PENDING', description: 'Pending' },
  { code: 'COMPLETED', description: 'Completed' },
]

const ensureRecord = async (model, data, identifier = 'code') => {
  await prisma[model].upsert({
    where: { [identifier]: data[identifier] },
    update: data,
    create: data,
  })
}

export const ensureReferenceData = async () => {
  await Promise.all(ORDER_SIDE_DATA.map((item) => ensureRecord('orderSide', item)))
  await Promise.all(ORDER_STATUS_DATA.map((item) => ensureRecord('orderStatus', item)))
  await Promise.all(ORDER_TYPE_DATA.map((item) => ensureRecord('orderType', item)))
  await Promise.all(TIF_DATA.map((item) => ensureRecord('timeInForceType', item)))
  await Promise.all(LEDGER_ENTRY_TYPES.map((item) => ensureRecord('ledgerEntryType', item)))
  await Promise.all(TX_TYPES.map((item) => ensureRecord('transactionType', item)))
  await Promise.all(TX_STATUSES.map((item) => ensureRecord('transactionStatus', item)))

  const currency = await prisma.currency.upsert({
    where: { code: 'USDT' },
    update: { name: 'Tether USD', symbol: '$' },
    create: { code: 'USDT', name: 'Tether USD', symbol: '$' },
  })

  const assetClass = await prisma.assetClass.upsert({
    where: { name: 'CRYPTO' },
    update: {},
    create: { name: 'CRYPTO', description: 'Crypto assets' },
  })

  await prisma.instrument.upsert({
    where: { symbol: 'BTCUSDT' },
    update: {},
    create: {
      symbol: 'BTCUSDT',
      name: 'Bitcoin / Tether',
      assetClassId: assetClass.id,
      lotSize: new Prisma.Decimal(0.0001),
      tickSize: new Prisma.Decimal(0.01),
      currencyId: currency.id,
    },
  })
}
